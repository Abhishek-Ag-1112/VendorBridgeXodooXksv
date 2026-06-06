import React, { useState } from 'react';
import { useData, ActivityLog } from '../context/DataContext';
import { 
  History, 
  Search, 
  SlidersHorizontal,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Shield,
  FileText,
  Tags
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const { activityLogs } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const entityTypes: ActivityLog['entityType'][] = [
    'User', 'Vendor', 'RFQ', 'Quotation', 'Approval', 'PO', 'Invoice'
  ];

  // Search and Filter logic
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntity = entityFilter === '' || log.entityType === entityFilter;
    const matchesStatus = statusFilter === '' || log.status === statusFilter;

    return matchesSearch && matchesEntity && matchesStatus;
  });

  // Color mappings
  const statusColors: Record<ActivityLog['status'], string> = {
    'info': 'bg-blue-50 text-primary border-blue-200',
    'success': 'bg-success-light text-success border-success/20',
    'warning': 'bg-warning-light text-warning border-warning/20',
    'error': 'bg-danger-light text-danger border-danger/20'
  };

  const statusIcons = {
    'info': <Info className="h-4 w-4 text-primary" />,
    'success': <CheckCircle className="h-4 w-4 text-success" />,
    'warning': <AlertTriangle className="h-4 w-4 text-warning" />,
    'error': <AlertTriangle className="h-4 w-4 text-danger" />
  };

  const entityIcons: Record<ActivityLog['entityType'], React.ReactNode> = {
    'User': <User className="h-3.5 w-3.5" />,
    'Vendor': <Shield className="h-3.5 w-3.5" />,
    'RFQ': <FileText className="h-3.5 w-3.5" />,
    'Quotation': <Tags className="h-3.5 w-3.5" />,
    'Approval': <CheckCircle className="h-3.5 w-3.5" />,
    'PO': <FileText className="h-3.5 w-3.5" />,
    'Invoice': <History className="h-3.5 w-3.5" />
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="font-outfit text-xl font-extrabold text-slate-900">System Audit Trails</h2>
        <p className="text-xs text-slate-500">Real-time chronological timeline monitoring all ERP activity and access controls</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search logs by action detail, actor name or system role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Filters:</span>
            </div>
            
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Entities</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs list */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flow-root">
          <ul className="-mb-8">
            {filteredLogs.map((log, logIdx) => (
              <li key={log.id}>
                <div className="relative pb-8 animate-fade-in">
                  {logIdx !== filteredLogs.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex items-start space-x-4">
                    {/* Status indicator circle */}
                    <div className="shrink-0 mt-0.5">
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        statusColors[log.status]
                      }`}>
                        {statusIcons[log.status]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-slate-800 font-bold">
                          {log.action}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {log.timestamp}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-2 items-center text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{log.user} ({log.role})</span>
                        </span>
                        
                        <span className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                          {entityIcons[log.entityType]}
                          <span>Type: {log.entityType}</span>
                        </span>

                        <span className="font-mono text-slate-300">
                          Ref: {log.entityId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No audit logs found matching criteria.</p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default ActivityLogs;
