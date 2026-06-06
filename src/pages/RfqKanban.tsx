import React, { useState } from 'react';
import { useData, RFQ } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Search,
  SlidersHorizontal,
  Lock,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Kanban column definition
interface KanbanColumnConfig {
  id: RFQ['status'];
  title: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: 'draft', title: 'Draft', colorClass: 'text-slate-700 bg-slate-100', bgClass: 'bg-slate-50/50', borderClass: 'border-slate-200' },
  { id: 'pending_responses', title: 'RFQ Sent', colorClass: 'text-blue-700 bg-blue-100', bgClass: 'bg-blue-50/25', borderClass: 'border-blue-200/60' },
  { id: 'comparison', title: 'Quotes Received', colorClass: 'text-amber-700 bg-amber-100', bgClass: 'bg-amber-50/25', borderClass: 'border-amber-200/60' },
  { id: 'under_review', title: 'Under Review', colorClass: 'text-purple-700 bg-purple-100', bgClass: 'bg-purple-50/25', borderClass: 'border-purple-200/60' },
  { id: 'approved', title: 'Approved', colorClass: 'text-emerald-700 bg-emerald-100', bgClass: 'bg-emerald-50/25', borderClass: 'border-emerald-200/60' },
  { id: 'po_created', title: 'PO Raised', colorClass: 'text-indigo-700 bg-indigo-100', bgClass: 'bg-indigo-50/25', borderClass: 'border-indigo-200/60' },
  { id: 'invoiced', title: 'Invoiced', colorClass: 'text-teal-700 bg-teal-100', bgClass: 'bg-teal-50/25', borderClass: 'border-teal-200/60' }
];

// Draggable Card Wrapper
interface DraggableCardProps {
  id: string;
  rfq: RFQ;
  disabled: boolean;
  children: React.ReactNode;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ id, disabled, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    disabled: disabled
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`relative group ${disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {children}
    </div>
  );
};

// Droppable Column Wrapper
interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id
  });

  const className = `flex-1 overflow-y-auto p-3 space-y-3 min-h-[450px] transition-colors rounded-b-xl ${
    isOver ? 'bg-slate-100/80 border-2 border-dashed border-primary/20' : ''
  }`;

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};

export const RfqKanban: React.FC = () => {
  const { rfqs, quotations, updateRfqStatus } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const isProcurement = user?.role === 'Procurement Officer' || user?.role === 'Admin';

  // Dynamic estimate calculation
  const getEstimatedValue = (rfq: RFQ) => {
    const rfqQuotes = quotations.filter(q => q.rfqId === rfq.id);
    if (rfqQuotes.length > 0) {
      // Find the lowest quotation total
      const totals = rfqQuotes.map(q => {
        return q.items.reduce((sum, item) => {
          const qty = rfq.items.find(i => i.id === item.itemId)?.qty || 0;
          return sum + (qty * item.unitPrice);
        }, 0);
      });
      return Math.min(...totals) * 1.18; // 18% tax
    }
    // Fallback: estimate based on quantities (2500 INR/unit)
    const totalQty = rfq.items.reduce((sum, item) => sum + item.qty, 0);
    return totalQty * 2500 * 1.18;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const rfqId = active.id as string;
      const nextStatus = over.id as RFQ['status'];
      
      // Prevent vendors or managers from dragging cards
      if (!isProcurement) {
        alert("Permission Denied: Only Procurement Officers and Admins can transition RFQ statuses.");
        return;
      }
      
      try {
        await updateRfqStatus(rfqId, nextStatus);
      } catch (err: any) {
        console.error("Failed to transition status:", err);
      }
    }
  };

  // Filter logic
  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rfq.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isOverdue = new Date(rfq.deadline) < new Date() && rfq.status !== 'invoiced' && rfq.status !== 'po_created';
    const matchesOverdue = !showOverdueOnly || isOverdue;

    return matchesSearch && matchesOverdue;
  });

  const getOverdueStatus = (rfq: RFQ) => {
    const isOverdue = new Date(rfq.deadline) < new Date() && rfq.status !== 'invoiced' && rfq.status !== 'po_created';
    return isOverdue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-slate-900">RFQ Kanban Board</h2>
          <p className="text-xs text-slate-500">
            Drag and drop Request for Quotation (RFQ) cards to manage procurement pipelines and trigger operations
          </p>
        </div>
        {!isProcurement && (
          <div className="flex items-center space-x-2 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg w-fit">
            <Lock className="h-3.5 w-3.5" />
            <span>Read-Only Access for {user?.role}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Filter RFQs by title or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Status Filters:</span>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
              <AlertCircle className="h-3.5 w-3.5 text-danger shrink-0" />
              <span>Show Overdue Only</span>
            </span>
          </label>
        </div>
      </div>

      {/* Board Container */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 h-[calc(100vh-220px)] min-h-[500px]">
          {KANBAN_COLUMNS.map((column) => {
            const columnRfqs = filteredRfqs.filter(r => r.status === column.id);
            const totalValue = columnRfqs.reduce((sum, rfq) => sum + getEstimatedValue(rfq), 0);

            return (
              <div 
                key={column.id}
                className={`flex flex-col w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-50 shadow-sm ${column.borderClass}`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200 bg-white rounded-t-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-outfit font-black text-xs text-slate-800 tracking-wide uppercase">
                      {column.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${column.colorClass}`}>
                      {columnRfqs.length}
                    </span>
                  </div>
                  <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <DollarSign className="h-3 w-3 shrink-0 mr-0.5 text-slate-400" />
                    <span>Est: {formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {/* Column Cards Dropzone */}
                <DroppableColumn id={column.id}>
                  {columnRfqs.map((rfq) => {
                    const estimatedVal = getEstimatedValue(rfq);
                    const overdue = getOverdueStatus(rfq);

                    return (
                      <DraggableCard 
                        key={rfq.id} 
                        id={rfq.id}
                        rfq={rfq}
                        disabled={!isProcurement}
                      >
                        <div className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all space-y-3 border-slate-200 hover:border-slate-300 relative overflow-hidden`}>
                          {overdue && (
                            <div className="absolute top-0 right-0 w-2 h-full bg-danger" title="Overdue RFQ" />
                          )}
                          
                          <div className="space-y-1 pr-1">
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                              {rfq.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                              {rfq.description}
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-2.5 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{rfq.assignedVendorIds.length} Invited</span>
                            </div>
                            <div className="flex items-center space-x-1 font-semibold text-slate-900 font-mono">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{formatCurrency(estimatedVal)}</span>
                            </div>
                            <div className={`col-span-2 flex items-center space-x-1 ${overdue ? 'text-danger font-bold bg-danger/10 border border-danger/15 px-1.5 py-0.5 rounded w-fit' : ''}`}>
                              <Calendar className={`h-3.5 w-3.5 shrink-0 ${overdue ? 'text-danger' : 'text-slate-400'}`} />
                              <span>By: {rfq.deadline}</span>
                            </div>
                          </div>

                          {/* Quick Action buttons */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (rfq.status === 'comparison' || rfq.status === 'under_review') {
                                  navigate('/quotations');
                                } else {
                                  navigate('/rfqs');
                                }
                              }}
                              className="text-[9px] font-bold text-primary hover:text-primary-hover flex items-center space-x-0.5"
                            >
                              <Eye className="h-3 w-3 shrink-0" />
                              <span>Review Details</span>
                            </button>
                            
                            {rfq.status === 'comparison' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/quotations');
                                }}
                                className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded hover:bg-primary/15 transition-all"
                              >
                                Compare Bids
                              </button>
                            )}
                            {rfq.status === 'approved' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/purchase-orders');
                                }}
                                className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold rounded hover:bg-indigo-100/50 transition-all"
                              >
                                Raise PO
                              </button>
                            )}
                          </div>
                        </div>
                      </DraggableCard>
                    );
                  })}
                  {columnRfqs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <FileText className="h-7 w-7 text-slate-200 mb-1" />
                      <span className="text-[10px] font-semibold">Column is empty</span>
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};

export default RfqKanban;
