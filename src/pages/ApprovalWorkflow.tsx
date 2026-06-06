import React, { useState } from 'react';
import { useData, ApprovalWorkflow, PurchaseOrder } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  AlertCircle,
  FileText,
  User,
  Send,
  MailWarning
} from 'lucide-react';

export const ApprovalWorkflowView: React.FC = () => {
  const { approvalWorkflows, purchaseOrders, submitApprovalDecision } = useData();
  const { user } = useAuth();

  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find active selected workflow
  const activeFlow = approvalWorkflows.find(w => w.id === selectedFlowId);
  const activePO = activeFlow && activeFlow.entityType === 'PO'
    ? purchaseOrders.find(p => p.id === activeFlow.entityId)
    : null;

  // Form Submission
  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedFlowId) return;
    setError('');
    
    if (!remarks) {
      setError('Please add mandatory remarks explaining your approval or rejection decision.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitApprovalDecision(selectedFlowId, decision, remarks);
      setRemarks('');
      setSelectedFlowId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit approval decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Status Styles
  const statusColors: Record<ApprovalWorkflow['status'], string> = {
    'pending': 'bg-warning-light text-warning border-warning/20',
    'approved': 'bg-success-light text-success border-success/20',
    'rejected': 'bg-danger-light text-danger border-danger/20'
  };

  const statusIcons = {
    'pending': <Clock className="h-4 w-4 text-warning" />,
    'approved': <CheckCircle className="h-4 w-4 text-success" />,
    'rejected': <XCircle className="h-4 w-4 text-danger" />
  };

  const isApprover = user?.role === 'Manager/Approver' || user?.role === 'Admin';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Workflow Queue List */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-slate-900">Procurement Workflow Queue</h2>
          <p className="text-xs text-slate-500">Approve or reject purchase contracts and monitor approval lifecycles</p>
        </div>

        <div className="space-y-3">
          {approvalWorkflows.map((flow) => {
            const linkedPO = flow.entityType === 'PO' 
              ? purchaseOrders.find(p => p.id === flow.entityId) 
              : null;
            const isSelected = selectedFlowId === flow.id;

            return (
              <div
                key={flow.id}
                onClick={() => { setSelectedFlowId(flow.id); setError(''); }}
                className={`rounded-xl border p-5 bg-white cursor-pointer transition-all shadow-premium hover:shadow-premium-hover ${
                  isSelected ? 'border-primary ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[flow.status]}`}>
                      {flow.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {flow.entityType} Request: {linkedPO?.poNumber || flow.entityId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {statusIcons[flow.status]}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                  <div>
                    <span className="text-slate-400">Total Value: </span>
                    <span className="text-slate-800 font-bold">{linkedPO ? formatCurrency(linkedPO.totalAmount) : '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Step: </span>
                    <span className="text-primary font-bold">
                      {flow.steps[flow.steps.length - 1]?.stepName || 'Review'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {approvalWorkflows.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-premium">
              <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400 font-semibold">Workflow queue is currently empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Detail Sidepanel */}
      <div className="space-y-4">
        <div>
          <h3 className="font-outfit text-base font-bold text-slate-900">Workflow Inspector</h3>
          <p className="text-[10px] text-slate-500">Inspect material lists and review auditing history</p>
        </div>

        {activeFlow && activePO ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium space-y-6 animate-fade-in">
            {/* Header summary */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase">PO Number</span>
              <h4 className="font-outfit text-base font-extrabold text-slate-900 mt-0.5">{activePO.poNumber}</h4>
              <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                <div><span className="font-semibold text-slate-400">Supplier:</span> Rajesh Traders</div>
                <div><span className="font-semibold text-slate-400">Gross Value:</span> {formatCurrency(activePO.totalAmount)}</div>
              </div>
            </div>

            {/* Line Items checklist */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Itemized Materials</span>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {activePO.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-800 font-semibold truncate max-w-[150px]">{item.name}</span>
                    <span className="text-slate-500">{item.qty} x {formatCurrency(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit History Timeline */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-3.5">Approval Lifecycle</span>
              <div className="flow-root">
                <ul className="-mb-8">
                  {activeFlow.steps.map((step, idx) => (
                    <li key={idx}>
                      <div className="relative pb-8">
                        {idx !== activeFlow.steps.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              step.status === 'approved' ? 'bg-success-light text-success' :
                              step.status === 'rejected' ? 'bg-danger-light text-danger' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <User className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-xs text-slate-900 font-bold">{step.stepName}</p>
                            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                              <span>Actor: {step.actor}</span>
                              <span>{step.timestamp.split(',')[1] || step.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Manager Remarks Panel */}
            {activeFlow.status === 'pending' && (
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center space-x-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Manager Remarks (Mandatory)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval criteria, budget constraints, or rejection reasons..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 text-[10px] font-semibold text-danger bg-danger/10 border border-danger/20 rounded-lg flex items-center space-x-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {isApprover ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDecision('rejected')}
                      disabled={isSubmitting}
                      className="rounded-lg bg-danger px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-danger/10 hover:bg-danger-hover transition-all"
                    >
                      Reject Contract
                    </button>
                    <button
                      onClick={() => handleDecision('approved')}
                      disabled={isSubmitting}
                      className="rounded-lg bg-success px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-success/10 hover:bg-success-hover transition-all"
                    >
                      Approve Contract
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center">
                    You do not have approval permissions. Managers/Approvers can execute actions on this request.
                  </p>
                )}

                {/* Email notification simulator info box */}
                <div className="flex items-center space-x-2 text-[9px] text-slate-400 bg-slate-50 border border-slate-100 p-2 rounded">
                  <MailWarning className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Submitting a decision automatically triggers email hooks.</span>
                </div>
              </div>
            )}

            {/* Read-only remarks details if already decided */}
            {activeFlow.status !== 'pending' && activeFlow.remarks && (
              <div className="border-t border-slate-100 pt-5 space-y-2 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Decision Remarks</span>
                <p className="bg-slate-50 border border-slate-100 rounded-lg p-3 italic text-slate-600 leading-relaxed">
                  "{activeFlow.remarks}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-xs">
            Select a workflow item from the queue list to inspect details and sign off contracts.
          </div>
        )}
      </div>
    </div>
  );
};
export default ApprovalWorkflowView;
