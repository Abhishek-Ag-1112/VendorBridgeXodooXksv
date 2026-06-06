import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ClipboardList, AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  const { vendors } = useData();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Procurement Officer');
  const [vendorId, setVendorId] = useState('vendor-1'); // default to Rajesh Traders
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Validation
  const validateForm = () => {
    if (!email) {
      setError('Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (!isLogin && !name) {
      setError('Full Name is required for registration.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, role);
        navigate('/');
      } else {
        await signup(email, name, role, role === 'Vendor' ? vendorId : undefined);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to autofill credentials for testing
  const autofillDemo = (demoType: 'admin' | 'officer' | 'manager' | 'vendor') => {
    const credentials = {
      admin: { email: 'admin@vendorbridge.com', role: 'Admin' as UserRole },
      officer: { email: 'procurement@vendorbridge.com', role: 'Procurement Officer' as UserRole },
      manager: { email: 'manager@vendorbridge.com', role: 'Manager/Approver' as UserRole },
      vendor: { email: 'rajesh@vendorbridge.com', role: 'Vendor' as UserRole }
    };
    
    const selected = credentials[demoType];
    setEmail(selected.email);
    setPassword('password123');
    setRole(selected.role);
    setIsLogin(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-600/5 blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-outfit text-3xl font-extrabold tracking-tight text-white">
            VendorBridge ERP
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Procurement & Vendor Management Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/80 border border-slate-700/50 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex rounded-lg bg-slate-900 p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${isLogin ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${!isLogin ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-xs font-medium text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                System Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Procurement Officer">Procurement Officer (RFQs/POs)</option>
                <option value="Manager/Approver">Manager/Approver (PO Approvals)</option>
                <option value="Vendor">Vendor (Bids & Shipping)</option>
              </select>
            </div>

            {/* Vendor Company link (for Vendor Signup only) */}
            {!isLogin && role === 'Vendor' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Link Supplier Account
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20 transition-all disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
              ) : isLogin ? (
                'Sign In to Dashboard'
              ) : (
                'Create ERP Account'
              )}
            </button>
          </form>

          {/* Quick Demo Login Triggers */}
          <div className="pt-4 border-t border-slate-700/50">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center mb-2.5">
              Quick Demo Login Profile
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className="bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white px-2 py-1.5 text-xs font-medium border border-slate-700 rounded text-center truncate transition-all"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('officer')}
                className="bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white px-2 py-1.5 text-xs font-medium border border-slate-700 rounded text-center truncate transition-all"
              >
                💼 Procurement
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('manager')}
                className="bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white px-2 py-1.5 text-xs font-medium border border-slate-700 rounded text-center truncate transition-all"
              >
                🛡️ Manager
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('vendor')}
                className="bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white px-2 py-1.5 text-xs font-medium border border-slate-700 rounded text-center truncate transition-all"
              >
                🚚 Rajesh Traders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
