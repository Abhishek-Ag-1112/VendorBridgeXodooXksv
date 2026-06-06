import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useData, RFQ } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Send,
  Eye
} from 'lucide-react';

export const QuotationSubmit: React.FC = () => {
  const { rfqs, submitQuotation, quotations } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfqId');

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [notes, setNotes] = useState('');
  
  // Workflow states
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rfqId) {
      const foundRfq = rfqs.find(r => r.id === rfqId);
      if (foundRfq) {
        setRfq(foundRfq);
        // Pre-initialize pricing state
        const initialPrices: Record<string, number> = {};
        foundRfq.items.forEach(item => {
          initialPrices[item.id] = 0;
        });
        setPrices(initialPrices);

        // Check if vendor has already submitted a quote for this RFQ
        const vId = user?.associatedVendorId || 'vendor-1';
        if (vId) {
          const existing = quotations.find(q => q.rfqId === rfqId && q.vendorId === vId);
          if (existing) {
            // Pre-populate with existing bid for editing
            const editPrices: Record<string, number> = {};
            existing.items.forEach(item => {
              editPrices[item.itemId] = item.unitPrice;
            });
            setPrices(editPrices);
            setDeliveryDays(existing.deliveryTimelineDays);
            setNotes(existing.notes);
          }
        }
      }
    }
  }, [rfqId, rfqs, user, quotations]);

  if (!user || user.role !== 'Vendor') {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-center shadow-premium">
        <AlertCircle className="h-10 w-10 mx-auto text-danger mb-3" />
        <h3 className="text-base font-bold text-danger">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-1">Only active Vendor Accounts are permitted to submit commercial bidding quotes.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-premium">
        <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-400 font-semibold">RFQ Record not found or link has expired.</p>
        <Link to="/rfqs" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">Back to RFQ List</Link>
      </div>
    );
  }

  const handlePriceChange = (itemId: string, val: string) => {
    const numeric = parseFloat(val) || 0;
    setPrices({
      ...prices,
      [itemId]: numeric
    });
  };

  // Compute Subtotal
  const subtotal = rfq.items.reduce((sum, item) => {
    const uPrice = prices[item.id] || 0;
    return sum + (item.qty * uPrice);
  }, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleReviewToggle = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check pricing validations
    const zeroPrices = rfq.items.some(item => !prices[item.id] || prices[item.id] <= 0);
    if (zeroPrices) {
      setError('Please provide a unit price greater than 0 for all requested items.');
      return;
    }

    if (deliveryDays <= 0) {
      setError('Delivery timeline must be 1 day or more.');
      return;
    }

    setIsReviewing(true);
  };

  const handleCommitSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Structure the quote items
      const quoteItems = rfq.items.map(item => ({
        itemId: item.id,
        unitPrice: prices[item.id]
      }));

      await submitQuotation({
        rfqId: rfq.id,
        vendorId: user.associatedVendorId || 'vendor-1',
        vendorName: user.name.replace(' Sales', '').replace(' Manager', ''),
        items: quoteItems,
        deliveryTimelineDays: deliveryDays,
        notes: notes
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit bid quotation.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-premium animate-scale-up space-y-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success mx-auto">
          <CheckCircle className="h-8 w-8" />
        </div>
        <div>
          <h3 className="font-outfit text-lg font-extrabold text-slate-900">Bid Submitted Successfully</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your quotation proposal has been received by the Procurement Office. You will be notified in the dashboard if this bid is selected for a Purchase Order.
          </p>
        </div>
        <div className="border border-slate-100 bg-slate-50 rounded-lg p-3 text-left space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-slate-400">RFQ:</span><span className="font-bold text-slate-800 truncate max-w-[200px]">{rfq.title}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Total Quote:</span><span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Delivery:</span><span className="font-bold text-slate-800">{deliveryDays} Days</span></div>
        </div>
        <div className="pt-2">
          <button
            onClick={() => navigate('/rfqs')}
            className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-lg transition-all"
          >
            Return to RFQ Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Header */}
      <div>
        <Link 
          to="/rfqs" 
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to RFQs</span>
        </Link>
        <h2 className="font-outfit text-xl font-extrabold text-slate-900">
          {isReviewing ? 'Review Quotation Proposal' : 'Configure Quotation Bid'}
        </h2>
        <p className="text-xs text-slate-500">
          {isReviewing 
            ? 'Review pricing summaries and commercial conditions before submission' 
            : 'Fill in material unit prices and logistical timelines for RFQ approval'}
        </p>
      </div>

      {/* RFQ Reference Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium space-y-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-primary border border-blue-200">
            RFQ Details
          </span>
          <span className="text-[10px] text-slate-400 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Deadline: {rfq.deadline}
          </span>
        </div>
        <h3 className="font-outfit text-base font-bold text-slate-900">{rfq.title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{rfq.description}</p>
      </div>

      {error && (
        <div className="p-4 text-xs font-semibold text-danger bg-danger-light border border-danger/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isReviewing ? (
        // Bidding Review View
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium space-y-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2">
                <th className="py-2">Item name</th>
                <th className="py-2 text-right">Quantity</th>
                <th className="py-2 text-right">Quoted Unit Price</th>
                <th className="py-2 text-right">Total Line Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rfq.items.map((item) => {
                const uPrice = prices[item.id] || 0;
                return (
                  <tr key={item.id} className="text-slate-700 py-3">
                    <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 text-right">{item.qty}</td>
                    <td className="py-3 text-right">{formatCurrency(uPrice)}</td>
                    <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(item.qty * uPrice)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="py-3 px-3 text-right text-slate-500 uppercase tracking-wider text-[10px]">Commercial Subtotal</td>
                <td className="py-3 px-3 text-right text-primary text-sm font-extrabold">{formatCurrency(subtotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Logistical Delivery Timeline</span>
              <p className="text-xs text-slate-800 font-semibold">{deliveryDays} Calendar Days from PO Issuance</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Commercial Remarks / Notes</span>
              <p className="text-xs text-slate-800 italic leading-relaxed whitespace-pre-wrap">{notes || 'No remarks provided.'}</p>
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-5 mt-6">
            <button
              onClick={() => setIsReviewing(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
            >
              Edit Bid Details
            </button>
            <button
              onClick={handleCommitSubmit}
              disabled={loading}
              className="flex items-center space-x-2 rounded-lg bg-success px-5 py-2 text-xs font-bold text-white shadow-lg shadow-success/20 hover:bg-success-hover transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Confirm & Submit Quote</span>
            </button>
          </div>
        </div>
      ) : (
        // Bidding Form Entry View
        <form onSubmit={handleReviewToggle} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-4">Commercial Pricing Bids</label>
            <div className="space-y-4">
              {rfq.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="col-span-12 sm:col-span-6">
                    <span className="block text-xs font-bold text-slate-900">{item.name}</span>
                    {item.description && <span className="block text-[10px] text-slate-400 mt-0.5">{item.description}</span>}
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Quantity</span>
                    <span className="block text-xs font-bold text-slate-700 mt-1">{item.qty} units</span>
                  </div>

                  <div className="col-span-8 sm:col-span-4">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price (INR)</span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <IndianRupee className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="0.00"
                        value={prices[item.id] || ''}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal tracker bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase">Quote Subtotal Estimate:</span>
              <span className="text-base font-extrabold text-primary">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          {/* Delivery days & notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Delivery Timeline</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Clock className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Days"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Calendar days to complete shipment.</span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Notes & Remarks</label>
              <textarea
                rows={3}
                placeholder="Declare warranties, logistics terms, freight charges inclusions, or material certifications here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to="/rfqs"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
            >
              <Eye className="h-4 w-4" />
              <span>Review Quotation</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
