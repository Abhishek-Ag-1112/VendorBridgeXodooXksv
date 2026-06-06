import React, { useState, useEffect } from 'react';
import { useData, PurchaseOrder, Invoice } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  CreditCard, 
  ChevronRight, 
  CheckCircle,
  Building,
  MapPin,
  Clock,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const { purchaseOrders, invoices, payInvoice, vendors } = useData();
  const { user } = useAuth();

  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'po' | 'invoice'>('po');

  // Filter based on roles
  const isVendor = user?.role === 'Vendor';
  const vendorId = user?.associatedVendorId;

  const filteredPOs = isVendor
    ? purchaseOrders.filter(p => p.vendorId === vendorId)
    : purchaseOrders;

  const activePO = selectedPOId 
    ? purchaseOrders.find(p => p.id === selectedPOId)
    : null;

  const activeInvoice = activePO
    ? invoices.find(inv => inv.poId === activePO.id)
    : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Dynamic QR Code generation hook using qrcode.js
  useEffect(() => {
    if (activeTab === 'invoice' && activeInvoice && activePO) {
      // Small timeout to ensure DOM element is mounted and rendered
      const timer = setTimeout(() => {
        const container = document.getElementById('invoice-qrcode-container');
        if (container) {
          container.innerHTML = ''; // Clear previous canvas

          const qrData = {
            invoice: activeInvoice.invoiceNumber,
            po: activePO.poNumber,
            supplier: vendors.find(v => v.id === activePO.vendorId)?.name || 'Supplier',
            total: `INR ${activeInvoice.totalAmount}`,
            issued: activeInvoice.createdAt
          };

          if ((window as any).QRCode) {
            try {
              new (window as any).QRCode(container, {
                text: JSON.stringify(qrData),
                width: 80,
                height: 80,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: (window as any).QRCode.CorrectLevel.L
              });
            } catch (err) {
              console.error("QR Code rendering failed:", err);
            }
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [activeTab, activeInvoice, activePO, vendors]);

  // PDF Download Action using html2pdf.js
  const handleDownloadPDF = (type: 'PO' | 'Invoice') => {
    if (!activePO) return;
    const elementId = type === 'PO' ? 'po-document-view' : 'invoice-document-view';
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
      margin:       15,
      filename:     `${type}-${type === 'PO' ? activePO.poNumber : activeInvoice?.invoiceNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Safely load html2pdf.js dynamically to prevent SSR/TypeScript build warnings
    import('html2pdf.js').then((html2pdfLib) => {
      html2pdfLib.default().from(element).set(opt).save();
    }).catch((err) => {
      console.error("html2pdf failed to load:", err);
      alert("Failed to download PDF. Please try again or use the Print option.");
    });
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Mail Action
  const handleSendEmail = (type: 'PO' | 'Invoice') => {
    if (!activePO) return;
    const vendorDetails = vendors.find(v => v.id === activePO.vendorId);
    const recipient = vendorDetails?.email || 'vendor@company.com';
    const docNumber = type === 'PO' ? activePO.poNumber : activeInvoice?.invoiceNumber;
    
    const subject = encodeURIComponent(`[VendorBridge ERP] ${type} Documents Issued - ${docNumber}`);
    const body = encodeURIComponent(
      `Hello team,\n\nPlease find attached the ${type} document for your review.\n\nDocument Reference: ${docNumber}\nTotal Amount: ${formatCurrency(activePO.totalAmount)}\nStatus: ${type === 'PO' ? activePO.status : activeInvoice?.status}\n\nGenerated via VendorBridge ERP.\nBest regards,\nProcurement Team`
    );

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  // Settle Payment Action
  const handlePayment = async (invId: string) => {
    if (window.confirm("Confirm payment settlement of this invoice?")) {
      await payInvoice(invId);
    }
  };

  const statusColors = {
    'draft': 'bg-slate-100 text-slate-700 border-slate-200',
    'pending_approval': 'bg-warning-light text-warning border-warning/20',
    'approved': 'bg-success-light text-success border-success/20',
    'rejected': 'bg-danger-light text-danger border-danger/20'
  };

  return (
    <div className="space-y-6">
      {/* Back button when inside details */}
      {selectedPOId && (
        <button
          onClick={() => setSelectedPOId(null)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2 no-print"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Procurement Queue</span>
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 no-print">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-slate-900">
            {selectedPOId ? 'Commercial Documents Viewer' : 'Purchase Orders & Invoices'}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedPOId 
              ? 'View invoice tax breakdowns, download contract PDFs, or settle vendor payments'
              : 'Audit active purchase contracts, generate billing documentation, and trigger shipping invoices'}
          </p>
        </div>
      </div>

      {selectedPOId && activePO ? (
        // Detailed View: PO / Invoice Layout
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Document Type Switcher & Action Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium space-y-4 no-print">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Documents Available</span>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('po')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                  activeTab === 'po' 
                    ? 'bg-primary/5 border-primary text-primary' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Purchase Order</span>
                </div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{activePO.poNumber}</span>
              </button>
              
              {activeInvoice && (
                <button
                  onClick={() => setActiveTab('invoice')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                    activeTab === 'invoice' 
                      ? 'bg-primary/5 border-primary text-primary' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4" />
                    <span>Supplier Invoice</span>
                  </div>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{activeInvoice.invoiceNumber}</span>
                </button>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Print & Distribution</span>
              <button
                onClick={() => handleDownloadPDF(activeTab === 'po' ? 'PO' : 'Invoice')}
                className="w-full flex items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => handleSendEmail(activeTab === 'po' ? 'PO' : 'Invoice')}
                className="w-full flex items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email Document</span>
              </button>

              {/* Invoice payment CTA for Procurement Officer */}
              {activeTab === 'invoice' && activeInvoice && activeInvoice.status === 'unpaid' && (
                <button
                  onClick={() => handlePayment(activeInvoice.id)}
                  disabled={user.role === 'Vendor'}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-success px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-success/15 hover:bg-success-hover transition-all disabled:opacity-50 mt-4"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Settle Payment</span>
                </button>
              )}
            </div>
          </div>

          {/* Document Sheet Display area */}
          <div className="lg:col-span-3">
            {activeTab === 'po' ? (
              // PURCHASE ORDER FORMAL DESIGN
              <div 
                id="po-document-view" 
                className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-premium print-card"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-8 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building className="h-6 w-6 text-primary" />
                      <span className="font-outfit text-xl font-black text-slate-900 tracking-wider">VENDORBRIDGE</span>
                    </div>
                    <span className="text-[10px] block font-bold text-slate-400">CORPORATE PROCUREMENT HEADQUARTERS</span>
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed max-w-xs">
                      101 Procurement Towers, Sector 62, Noida, Uttar Pradesh, 201301. <br />
                      GSTIN: 09AAAAA1111A1Z1 | PAN: AAAAA1111A
                    </p>
                  </div>
                  <div className="text-left sm:text-right space-y-1">
                    <h3 className="font-outfit text-lg font-black text-slate-900 uppercase tracking-widest text-primary">Purchase Order</h3>
                    <div className="text-xs text-slate-500 font-medium">
                      <div><span className="font-semibold text-slate-400">PO Number:</span> <span className="font-bold text-slate-800 font-mono">{activePO.poNumber}</span></div>
                      <div><span className="font-semibold text-slate-400">Date Issued:</span> {activePO.createdAt}</div>
                      <div>
                        <span className="font-semibold text-slate-400">Status:</span> 
                        <span className="ml-1 font-bold text-primary">{activePO.status.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-100 text-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Address (VendorBridge)</span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      Accounts Payable Team<br />
                      VendorBridge Ltd.<br />
                      101 Corporate Towers, Noida, UP.<br />
                      Email: accounts@vendorbridge.com
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor/Supplier Address</span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {vendors.find(v => v.id === activePO.vendorId)?.name || 'Rajesh Traders'}<br />
                      Authorized Sales Representative<br />
                      GSTIN: {vendors.find(v => v.id === activePO.vendorId)?.gstNumber || '27AAAAA1111A1Z1'}<br />
                      Email: {vendors.find(v => v.id === activePO.vendorId)?.email}
                    </p>
                  </div>
                </div>

                {/* Items details table */}
                <div className="py-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase pb-2">
                        <th className="py-2">Itemized Materials</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2 text-right">Unit Price</th>
                        <th className="py-2 text-right">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-100">
                      {activePO.items.map((item, idx) => (
                        <tr key={idx} className="text-slate-700 py-3">
                          <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="py-3 text-right">{item.qty} units</td>
                          <td className="py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 text-right font-bold text-slate-900 font-mono">{formatCurrency(item.qty * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations summary panel */}
                <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="text-[10px] text-slate-400 max-w-sm leading-relaxed space-y-1.5">
                    <span className="font-bold block uppercase text-slate-500">Terms & Conditions</span>
                    <p>1. Delivery must be fulfilled within the committed days timeline.</p>
                    <p>2. Quality audit inspection will occur upon material receipt at factory gates.</p>
                    <p>3. Payments are settled Net 30 days after invoice audit confirmation.</p>
                  </div>
                  
                  <div className="w-full md:w-80 text-xs space-y-2 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Commercial Subtotal:</span>
                      <span className="text-slate-800 font-mono">
                        {formatCurrency(Math.round(activePO.totalAmount / (1 + activePO.taxRate / 100)))}
                      </span>
                    </div>
                    {/* CGST + SGST splitting (9% each for standard 18% GST) */}
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>CGST @ 9%:</span>
                      <span className="font-mono">
                        {formatCurrency(Math.round((activePO.totalAmount - Math.round(activePO.totalAmount / (1 + activePO.taxRate / 100))) / 2))}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px] border-b border-slate-100 pb-2">
                      <span>SGST @ 9%:</span>
                      <span className="font-mono">
                        {formatCurrency(Math.round((activePO.totalAmount - Math.round(activePO.totalAmount / (1 + activePO.taxRate / 100))) / 2))}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold pt-1 text-slate-900">
                      <span>Grand Total (Inc. Tax):</span>
                      <span className="text-primary font-mono">{formatCurrency(activePO.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // INVOICE FORMAL DESIGN
              activeInvoice && (
                <div 
                  id="invoice-document-view" 
                  className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-premium print-card"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-8 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 text-success">
                        <Building className="h-6 w-6" />
                        <span className="font-outfit text-xl font-black text-slate-900 tracking-wider">
                          {vendors.find(v => v.id === activePO.vendorId)?.name.toUpperCase() || 'SUPPLIER'}
                        </span>
                      </div>
                      <span className="text-[10px] block font-bold text-slate-400">SUPPLIER COMMERCIAL INVOICE</span>
                      <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed max-w-xs">
                        Authorized logistics depot, Industrial Zone.<br />
                        GSTIN: {vendors.find(v => v.id === activePO.vendorId)?.gstNumber || '27AAAAA1111A1Z1'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right space-y-1">
                      <h3 className="font-outfit text-lg font-black text-slate-900 uppercase tracking-widest text-success">Tax Invoice</h3>
                      <div className="text-xs text-slate-500 font-medium">
                        <div><span className="font-semibold text-slate-400">Invoice Ref:</span> <span className="font-bold text-slate-800 font-mono">{activeInvoice.invoiceNumber}</span></div>
                        <div><span className="font-semibold text-slate-400">PO Linked:</span> <span className="font-mono">{activePO.poNumber}</span></div>
                        <div><span className="font-semibold text-slate-400">Due Date:</span> <span className="font-bold text-slate-700">{activeInvoice.dueDate}</span></div>
                        <div>
                          <span className="font-semibold text-slate-400">Status:</span> 
                          <span className={`ml-1 font-bold ${activeInvoice.status === 'paid' ? 'text-success' : 'text-danger'}`}>
                            {activeInvoice.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-b border-slate-100 text-xs">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Billing Address</span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        VendorBridge Ltd.<br />
                        Accounts Payable Department<br />
                        101 Corporate Towers, Noida, UP.<br />
                        GSTIN: 09AAAAA1111A1Z1
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Banking Settlement Codes</span>
                      <div className="text-slate-800 font-medium leading-relaxed font-mono text-[11px] space-y-1">
                        <div><span className="font-semibold font-sans text-slate-400">Bank:</span> STATE BANK OF INDIA</div>
                        <div><span className="font-semibold font-sans text-slate-400">A/C Name:</span> {vendors.find(v => v.id === activePO.vendorId)?.name || 'Supplier'} AP</div>
                        <div><span className="font-semibold font-sans text-slate-400">A/C No:</span> 987654321098</div>
                        <div><span className="font-semibold font-sans text-slate-400">IFSC Code:</span> SBIN0001234</div>
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col items-start sm:items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:text-right w-full">Invoice Verification</span>
                      <div id="invoice-qrcode-container" className="p-1 border border-slate-200 bg-white rounded shadow-sm mt-1 shrink-0"></div>
                      <span className="text-[8px] text-slate-400 block mt-1 font-semibold sm:text-right w-full uppercase">Scan to audit invoice JSON</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="py-8">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase pb-2">
                          <th className="py-2">Item Description</th>
                          <th className="py-2 text-right">Qty</th>
                          <th className="py-2 text-right">Rate</th>
                          <th className="py-2 text-right">Taxable Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {activePO.items.map((item, idx) => (
                          <tr key={idx} className="text-slate-700 py-3">
                            <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                            <td className="py-3 text-right">{item.qty} units</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 text-right font-bold text-slate-900 font-mono">{formatCurrency(item.qty * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Summary */}
                  <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
                      <span className="font-bold block uppercase text-slate-500 mb-1.5">Declaration</span>
                      <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                    </div>
                    
                    <div className="w-full md:w-80 text-xs space-y-2 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taxable Value:</span>
                        <span className="text-slate-800 font-mono">{formatCurrency(activeInvoice.amount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>CGST @ 9%:</span>
                        <span className="font-mono">{formatCurrency(Math.round(activeInvoice.taxAmount / 2))}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px] border-b border-slate-100 pb-2">
                        <span>SGST @ 9%:</span>
                        <span className="font-mono">{formatCurrency(Math.round(activeInvoice.taxAmount / 2))}</span>
                      </div>
                      <div className="flex justify-between text-base font-extrabold pt-1 text-slate-900">
                        <span>Invoice Total:</span>
                        <span className="text-success font-mono">{formatCurrency(activeInvoice.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        // Listing Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPOs.map((po) => {
            const linkedInvoice = invoices.find(inv => inv.poId === po.id);
            return (
              <div 
                key={po.id} 
                onClick={() => { setSelectedPOId(po.id); setActiveTab('po'); }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium hover:shadow-premium-hover cursor-pointer hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[po.status]}`}>
                      {po.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">{po.poNumber}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>

                <div className="text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between"><span className="text-slate-400">Supplier Company:</span><span className="text-slate-800 font-bold">Rajesh Traders</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Total Valuation (Inc. GST):</span><span className="text-primary font-bold">{formatCurrency(po.totalAmount)}</span></div>
                  {linkedInvoice && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invoice Status:</span>
                      <span className={`font-bold ${linkedInvoice.status === 'paid' ? 'text-success' : 'text-danger'}`}>
                        {linkedInvoice.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredPOs.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200 shadow-premium">
              <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400 font-semibold">No Purchase Orders or invoices issued.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PurchaseOrders;
