import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, RFQ, LineItem } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  FilePlus, 
  Trash2, 
  Calendar, 
  UserCheck, 
  Paperclip, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Search,
  CheckCircle,
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';

export const RfqCreate: React.FC = () => {
  const { rfqs, vendors, createRfq } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<Omit<LineItem, 'id'>[]>([
    { name: '', qty: 1, description: '' }
  ]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // AI Smart Fill states
  const [smartFillText, setSmartFillText] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  // AI Smart Fill Handler using Groq Llama 3.1
  const handleSmartFill = async () => {
    if (!smartFillText.trim() || isSmartFilling) return;
    setIsSmartFilling(true);
    setFormError('');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Extract procurement details from the user text. Return a JSON object ONLY. Do not write any conversational text or explanations. The JSON must match this structure exactly: { "title": "string", "items": [{"name": "string", "qty": number, "unit": "string"}], "deadline": "YYYY-MM-DD", "assignedVendors": ["string"] }'
            },
            {
              role: 'user',
              content: smartFillText
            }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI extraction service.');
      }

      const resData = await response.json();
      const content = resData.choices[0]?.message?.content || '';
      
      // Clean up JSON response markup blocks
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json/, '').replace(/```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```/, '').replace(/```$/, '');
      }
      cleanedContent = cleanedContent.trim();

      const parsed = JSON.parse(cleanedContent);

      // Populate form fields
      if (parsed.title) setTitle(parsed.title);
      
      // Seed description with original user text
      setDescription(smartFillText);

      if (parsed.deadline) {
        const dateObj = new Date(parsed.deadline);
        if (!isNaN(dateObj.getTime())) {
          setDeadline(dateObj.toISOString().split('T')[0]);
        }
      }

      if (parsed.items && Array.isArray(parsed.items)) {
        const mappedItems = parsed.items.map((it: any) => ({
          name: it.name || '',
          qty: it.qty || 1,
          description: it.unit || ''
        }));
        if (mappedItems.length > 0) {
          setLineItems(mappedItems);
        }
      }

      if (parsed.assignedVendors && Array.isArray(parsed.assignedVendors)) {
        const matchedIds: string[] = [];
        parsed.assignedVendors.forEach((vName: string) => {
          const matched = vendors.find(v => 
            v.name.toLowerCase().includes(vName.toLowerCase()) || 
            vName.toLowerCase().includes(v.name.toLowerCase())
          );
          if (matched && !matchedIds.includes(matched.id)) {
            matchedIds.push(matched.id);
          }
        });
        setAssignedVendors(matchedIds);
      }

      setSmartFillText('');

    } catch (err: any) {
      console.error(err);
      setFormError('AI Smart Fill failed. Please verify the description format or enter data manually.');
    } finally {
      setIsSmartFilling(false);
    }
  };

  if (!user) return null;

  const isVendor = user.role === 'Vendor';
  const vendorId = user.associatedVendorId || 'vendor-1';

  // Filter RFQs: Vendors see only RFQs assigned to them. Officers see all.
  const filteredRfqs = rfqs.filter(rfq => {
    const matchesRole = !isVendor || rfq.assignedVendorIds.includes(vendorId || '');
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rfq.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Dynamic Line Item actions
  const addLineItem = () => {
    setLineItems([...lineItems, { name: '', qty: 1, description: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const updateLineItem = (index: number, field: keyof Omit<LineItem, 'id'>, value: any) => {
    const updated = lineItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setLineItems(updated);
  };

  const handleVendorToggle = (vId: string) => {
    if (assignedVendors.includes(vId)) {
      setAssignedVendors(assignedVendors.filter(id => id !== vId));
    } else {
      setAssignedVendors([...assignedVendors, vId]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    // Form validations
    if (!title || !description || !deadline) {
      setFormError('Title, description, and bid deadline are required.');
      return;
    }

    if (new Date(deadline).getTime() < Date.now()) {
      setFormError('Deadline must be a future date.');
      return;
    }

    if (assignedVendors.length === 0) {
      setFormError('Please assign at least one supplier vendor to receive this RFQ.');
      return;
    }

    // Line items validation
    const invalidItems = lineItems.some(item => !item.name || item.qty <= 0);
    if (invalidItems) {
      setFormError('Please ensure all line items have names and quantities greater than 0.');
      return;
    }

    try {
      // Map line items with IDs
      const itemsWithIds: LineItem[] = lineItems.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        ...item
      }));

      await createRfq({
        title,
        description,
        deadline,
        assignedVendorIds: assignedVendors,
        items: itemsWithIds
      });

      // Clear Form
      setTitle('');
      setDescription('');
      setDeadline('');
      setAssignedVendors([]);
      setLineItems([{ name: '', qty: 1, description: '' }]);
      setFormSuccess(true);
      
      // Auto close form after delay
      setTimeout(() => {
        setIsCreating(false);
        setFormSuccess(false);
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Error occurred while creating RFQ.');
    }
  };

  // Status Badge styles
  const statusBadges: Record<RFQ['status'], string> = {
    'draft': 'bg-slate-100 text-slate-700 border-slate-200',
    'pending_responses': 'bg-blue-50 text-primary border-blue-200',
    'comparison': 'bg-warning-light text-warning border-warning/20',
    'approved': 'bg-success-light text-success border-success/20',
    'rejected': 'bg-danger-light text-danger border-danger/20',
    'po_created': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'under_review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'invoiced': 'bg-teal-50 text-teal-700 border-teal-200'
  };

  const statusLabels: Record<RFQ['status'], string> = {
    'draft': 'Draft',
    'pending_responses': 'Awaiting Bids',
    'comparison': 'Quotation Comparison',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'po_created': 'PO Issued',
    'under_review': 'Under Review',
    'invoiced': 'Invoiced'
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-slate-900">
            {isCreating ? 'Create Request for Quotation' : 'Procurement RFQs'}
          </h2>
          <p className="text-xs text-slate-500">
            {isCreating 
              ? 'Draft line items and invite supplier vendors to submit their pricing bids' 
              : 'Monitor bidding processes, incoming quotation files, and lifecycle milestones'}
          </p>
        </div>
        
        {/* Only Procurement Officer can create RFQ */}
        {user.role === 'Procurement Officer' && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            {isCreating ? 'View Active RFQs' : (
              <>
                <FilePlus className="h-4 w-4 text-primary" />
                <span>Create New RFQ</span>
              </>
            )}
          </button>
        )}
      </div>

      {isCreating ? (
        // RFQ Creation Form View
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium max-w-4xl mx-auto">
          {/* Smart Fill Panel */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 no-print">
            <div className="flex items-center space-x-1.5 text-primary">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-bold font-outfit uppercase tracking-wider">AI Smart Fill Form</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">
              Type or paste raw procurement details. Llama AI will automatically extract the title, required line items, deadlines, and match registered suppliers to auto-populate this form.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={smartFillText}
                onChange={(e) => setSmartFillText(e.target.value)}
                disabled={isSmartFilling}
                placeholder="e.g. Settle a contract for 500 Heavy Duty Copper Cables and 25 Desk Chairs by 2026-06-25. Please invite Rajesh Traders and Amit Supplies."
                rows={2}
                className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary disabled:opacity-50 font-medium"
              />
              <button
                type="button"
                onClick={handleSmartFill}
                disabled={isSmartFilling || !smartFillText.trim()}
                className="bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-white disabled:text-slate-400 px-4.5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all sm:self-end h-9 flex items-center justify-center space-x-1 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Smart Fill</span>
              </button>
            </div>
          </div>

          {formSuccess && (
            <div className="mb-4 p-4 text-xs font-semibold text-success bg-success-light border border-success/20 rounded-lg flex items-center space-x-2 animate-fade-in">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>RFQ Created successfully! Distributing bidding invitations...</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-4 text-xs font-semibold text-danger bg-danger-light border border-danger/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {isSmartFilling ? (
            // Filling Form... Skeleton State
            <div className="space-y-6 animate-pulse p-4">
              <div className="text-center py-6 border border-slate-100 rounded-xl bg-slate-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filling form...</p>
                <p className="text-[10px] text-slate-400 mt-1">Llama 3.1 is extracting items, deadlines, and suppliers...</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    <div className="h-9 bg-slate-100 rounded-lg w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-slate-200 rounded"></div>
                    <div className="h-24 bg-slate-100 rounded-lg w-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    <div className="h-9 bg-slate-100 rounded-lg w-full"></div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="h-3 w-28 bg-slate-200 rounded"></div>
                <div className="h-16 bg-slate-100 rounded-lg w-full animate-pulse"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Title & Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">RFQ Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Copper armored wire procurement FY26"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Description & Scope</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed material requirements, specifications, packaging preferences, and transportation logistics rules..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Deadline & Attachments */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Bidding Deadline</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Specifications Document</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                    <Paperclip className="h-5 w-5 mx-auto text-slate-400 mb-1.5" />
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Attach PDF / Sheet</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Max limit 5MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items builder */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-slate-600 uppercase">Material Line Items</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center space-x-1 text-primary hover:text-primary-hover text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="col-span-5">
                      <input
                        type="text"
                        required
                        placeholder="Item Name (e.g. 10m Armored Cable)"
                        value={item.name}
                        onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Specifications / Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-slate-400 hover:text-danger p-1 hover:bg-white rounded transition-colors"
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor distribution multi-select */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-3">Distribute to Vendors</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {vendors.filter(v => v.status === 'active').map((v) => {
                  const isChecked = assignedVendors.includes(v.id);
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleVendorToggle(v.id)}
                      className={`flex items-start space-x-3 p-3 border rounded-xl text-left transition-all ${
                        isChecked 
                          ? 'bg-primary/5 border-primary/50 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <UserCheck className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800">{v.name}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 truncate">{v.category.join(', ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
              >
                Launch RFQ & Invite Suppliers
              </button>
            </div>
          </form>
          )}
        </div>
      ) : (
        // RFQ Listing View
        <div className="space-y-4">
          {/* Search bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search RFQ by title or description scope..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Cards list */}
          <div className="grid grid-cols-1 gap-4">
            {filteredRfqs.map((rfq) => (
              <div 
                key={rfq.id} 
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium hover:shadow-premium-hover hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadges[rfq.status]}`}>
                        {statusLabels[rfq.status]}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Created: {rfq.createdAt}
                      </span>
                    </div>
                    <h3 className="font-outfit text-base font-bold text-slate-900">{rfq.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">{rfq.description}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 self-start md:self-auto">
                    <div className="text-left md:text-right font-medium">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Bids Deadline</div>
                      <div className="text-xs text-slate-800 font-bold flex items-center mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500 mr-1.5" />
                        {rfq.deadline}
                      </div>
                    </div>

                    {/* CTA Actions */}
                    {isVendor && rfq.status === 'pending_responses' && (
                      <button
                        onClick={() => navigate(`/rfqs/submit-bid?rfqId=${rfq.id}`)}
                        className="flex items-center space-x-1 bg-success hover:bg-success-hover text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all"
                      >
                        <span>Submit Pricing Bid</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {user.role === 'Procurement Officer' && rfq.status === 'pending_responses' && (
                      <button
                        onClick={() => navigate(`/compare?rfqId=${rfq.id}`)}
                        className="flex items-center space-x-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all"
                      >
                        <span>Compare Bids</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Items dropdown summary */}
                <div className="mt-5 border-t border-slate-100 pt-4 bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Required Line Items</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {rfq.items.map((item) => (
                      <div key={item.id} className="bg-white p-2.5 rounded border border-slate-200 flex items-start space-x-2.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
                          {item.qty}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-700 truncate">{item.name}</span>
                          {item.description && <span className="block text-[9px] text-slate-400 truncate">{item.description}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filteredRfqs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-premium">
                <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No Requests for Quotation found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
