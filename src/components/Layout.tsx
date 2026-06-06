import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FilePlus, 
  Scale, 
  ShieldCheck, 
  Receipt, 
  History, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  User, 
  ClipboardList,
  Columns,
  Sparkles
} from 'lucide-react';

import { AiCopilot } from './AiCopilot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, switchRoleTesting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('vendorbridge_ai_sidebar') === 'open';
  });

  const toggleAiSidebar = () => {
    setIsAiSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('vendorbridge_ai_sidebar', next ? 'open' : 'closed');
      return next;
    });
  };

  if (!user) return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar items and their allowed roles
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['Admin', 'Procurement Officer', 'Manager/Approver', 'Vendor'] 
    },
    { 
      path: '/vendors', 
      label: 'Vendors', 
      icon: Users, 
      roles: ['Admin', 'Procurement Officer'] 
    },
    { 
      path: '/rfqs', 
      label: 'RFQs & Bidding', 
      icon: FilePlus, 
      roles: ['Procurement Officer', 'Vendor'] 
    },
    { 
      path: '/rfq-kanban', 
      label: 'RFQ Kanban', 
      icon: Columns, 
      roles: ['Admin', 'Procurement Officer', 'Manager/Approver', 'Vendor'] 
    },
    { 
      path: '/compare', 
      label: 'Quote Comparison', 
      icon: Scale, 
      roles: ['Procurement Officer'] 
    },
    { 
      path: '/approvals', 
      label: 'Approvals Workflow', 
      icon: ShieldCheck, 
      roles: ['Manager/Approver', 'Admin'] 
    },
    { 
      path: '/purchase-orders', 
      label: 'POs & Invoices', 
      icon: Receipt, 
      roles: ['Admin', 'Procurement Officer', 'Manager/Approver', 'Vendor'] 
    },
    { 
      path: '/activity-logs', 
      label: 'Activity Logs', 
      icon: History, 
      roles: ['Admin', 'Procurement Officer'] 
    },
    { 
      path: '/analytics', 
      label: 'Reports & Analytics', 
      icon: BarChart3, 
      roles: ['Admin', 'Manager/Approver'] 
    },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const roleColors: Record<UserRole, string> = {
    'Admin': 'bg-danger-light text-danger border-danger/20',
    'Procurement Officer': 'bg-primary-light text-primary border-primary/20',
    'Manager/Approver': 'bg-warning-light text-warning border-warning/20',
    'Vendor': 'bg-success-light text-success border-success/20'
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-md">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="font-outfit text-lg font-bold tracking-tight text-slate-900">VendorBridge</span>
            <span className="text-[10px] block -mt-1 font-semibold text-primary font-sans">ERP PLATFORM</span>
          </div>
        </div>
        
        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="relative flex w-full max-w-xs flex-col bg-white py-4 shadow-xl">
            <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <span className="font-outfit text-lg font-bold text-slate-900">VendorBridge</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1 px-3">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-md font-bold text-slate-900 md:text-lg">
                {filteredNavItems.find((item) => item.path === location.pathname)?.label || 'VendorBridge'}
              </h1>
            </div>
          </div>

          {/* Quick Role Testing Switcher Widget */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 shadow-sm">
              <span className="hidden lg:inline text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2">
                Simulate Role:
              </span>
              <select
                value={user.role}
                onChange={(e) => {
                  switchRoleTesting(e.target.value as UserRole);
                  navigate('/'); // redirect to home to refresh views
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Manager/Approver">Manager/Approver</option>
                <option value="Vendor">Vendor (Rajesh Corp)</option>
              </select>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleColors[user.role]}`}>
                {user.role}
              </span>
            </div>

            {/* AI Sidebar Toggle Button */}
            <button
              onClick={toggleAiSidebar}
              className={`p-2 rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                isAiSidebarOpen 
                  ? 'bg-primary/10 border-primary text-primary shadow-inner shadow-primary/5' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
              }`}
              title="Toggle AI Co-pilot"
            >
              <Sparkles className={`h-4 w-4 ${isAiSidebarOpen ? 'text-primary animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-xs font-bold">AI Co-pilot</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>

          <AiCopilot isOpen={isAiSidebarOpen} onClose={toggleAiSidebar} />
        </div>
      </div>
    </div>
  );
};
