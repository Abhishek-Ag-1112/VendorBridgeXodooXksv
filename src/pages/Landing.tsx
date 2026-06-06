import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Cpu, 
  Columns, 
  Zap 
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary selection:text-white overflow-hidden relative">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 h-[600px] w-[600px] translate-x-1/2 translate-y-1/2 rounded-full bg-slate-200/30 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-indigo-50/40 blur-[100px] pointer-events-none"></div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <ClipboardList className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="font-outfit text-lg font-black tracking-tight text-slate-900">
                VendorBridge
              </span>
              <span className="text-[10px] font-bold text-primary tracking-widest block uppercase -mt-1">
                ERP Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#solution" className="hover:text-slate-900 transition-colors">Our Solution</a>
            <a href="#dashboard" className="hover:text-slate-900 transition-colors">Platform Tour</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-all px-4 py-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center space-x-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Next-Gen Enterprise Procurement</span>
            </div>
            <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              The Smart Hub for <br />
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Enterprise Bidding
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Automate vendor evaluations, comparison matrices, purchase order sign-offs, and compliance logs in a single unified cockpit. Powered by live AI co-pilots and secure audit trails.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/25 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Launch ERP Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <a 
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">99.8%</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Audit Compliance</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">14 Mins</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Avg RFQ Setup</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">35%</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Spend Saved</div>
              </div>
            </div>
          </div>

          {/* Interactive UI Mockup Showcase */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0">
            <div className="relative mx-auto max-w-[450px] rounded-2xl border border-slate-200 bg-white p-3 shadow-premium backdrop-blur-md overflow-hidden group">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                  comparison_matrix_v2.json
                </span>
              </div>

              {/* Simulated side-by-side comparison table */}
              <div className="space-y-3 font-sans">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900 mb-2">
                    <span>Office Upgrades</span>
                    <span className="text-[10px] font-normal text-slate-500">RFQ-2026-04</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-2.5 rounded border border-emerald-100 shadow-sm space-y-1">
                      <div className="font-semibold text-slate-500">Rajesh Traders</div>
                      <div className="text-xs font-bold text-emerald-600">₹6,80,000</div>
                      <div className="text-[9px] text-slate-500">Delivery: 5 Days</div>
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded w-fit">Lowest Quote</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1 opacity-70">
                      <div className="font-semibold text-slate-500">Amit Supplies</div>
                      <div className="text-xs font-bold text-slate-900">₹7,20,000</div>
                      <div className="text-[9px] text-slate-500">Delivery: 10 Days</div>
                      <div className="bg-slate-100 text-slate-600 border border-slate-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded w-fit">Standard</div>
                    </div>
                  </div>
                </div>

                {/* Simulated AI suggestion bubble */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start space-x-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px]">
                    <Cpu className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">AI Co-pilot Insight</div>
                    <p className="text-[11px] text-slate-700 leading-normal">
                      "Rajesh Traders offers the lowest commercial contract value (₹6.8L) and the fastest delivery timeline. I recommend awarding them the contract."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid Section */}
      <section id="features" className="py-20 px-4 sm:px-8 border-t border-slate-200 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="font-outfit text-3xl font-black text-slate-900 sm:text-4xl">
              Engineered for Professional Procurement Teams
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
              Ditch manual spreadsheets and emails. VendorBridge streamlines your bidding process through smart automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-premium transition-all hover:-translate-y-1 duration-300 group">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-all">
                <Columns className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Live RFQ Kanban Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag-and-drop RFQs through lifecycles: from draft to sent, quotes comparison, approvals, and invoiced status. Restricted by roles to enforce policy controls.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-premium transition-all hover:-translate-y-1 duration-300 group">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Auto-Comparison Matrix</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compute side-by-side quotations instantly. Automatically flags the lowest pricing on individual line-items and overall totals in green, cutting review time by 80%.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-premium transition-all hover:-translate-y-1 duration-300 group">
              <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Persistent AI Co-pilot</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A right-aligned collapsible assistant. Injects the entire live database context (invoices, spend analytics, logs) to assist in drafting negotiations or advising actions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-premium transition-all hover:-translate-y-1 duration-300 group">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Client-Side QR Code Verifier</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically renders a scannable QR Code containing structured JSON data on every generated invoice. Enables direct mobile audit verification for auditors.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-premium transition-all hover:-translate-y-1 duration-300 group">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Role-Based Approvals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-level approval pathways. Procurement Officers launch bids, Vendors submit prices, and Managers approve purchase orders with mandatory audit remarks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-premium transition-all hover:-translate-y-1 duration-300 group">
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">CSV Importer & Validator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Import 100+ suppliers instantly. Parses client-side with PapaParse and presents an interactive red/green error validation list before saving records to the database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / How it Works section */}
      <section id="solution" className="py-20 px-4 sm:px-8 border-t border-slate-200 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-outfit text-3xl font-black text-slate-900 sm:text-4xl">
              Eliminate Procurement Bottlenecks Once and For All
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Traditional ERP setups take months to configure. VendorBridge mounts immediately on top of Firebase or LocalStorage, offering zero-latency synchronization, real-time analytics, and instant invoice downloads.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-xs text-slate-700">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span><strong>Firebase & Firestore Native</strong>: Production ready with full authentication rules and real-time synchronization.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-700">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span><strong>LocalStorage Fallback</strong>: Operates out-of-the-box in sandbox environments without any config requirements.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-700">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span><strong>HTML2PDF and Printing Styles</strong>: Built-in support to print purchase orders and download tax invoices client-side.</span>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2 rounded-xl bg-primary hover:bg-primary-hover px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                <span>Launch Free Sandbox Instance</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interactive Audit Log Preview</div>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="border border-emerald-100 bg-emerald-50 text-emerald-700 p-2.5 rounded flex justify-between items-center">
                <span>🟢 SUCCESS: Bulk imported 2 suppliers from CSV</span>
                <span className="text-[9px] opacity-65">11:45 AM</span>
              </div>
              <div className="border border-blue-100 bg-blue-50 text-blue-700 p-2.5 rounded flex justify-between items-center">
                <span>🔵 INFO: Quotation Comparison requested for RFQ-03</span>
                <span className="text-[9px] opacity-65">11:32 AM</span>
              </div>
              <div className="border border-purple-100 bg-purple-50 text-purple-700 p-2.5 rounded flex justify-between items-center">
                <span>🟣 ACTION: PO-2026-004 approved by Manish Manager</span>
                <span className="text-[9px] opacity-65">11:15 AM</span>
              </div>
              <div className="border border-amber-100 bg-amber-50 text-amber-700 p-2.5 rounded flex justify-between items-center">
                <span>🟡 WARNING: Amit Supplies quoted 34% above avg on Bearings</span>
                <span className="text-[9px] opacity-65">11:02 AM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq" className="py-20 px-4 sm:px-8 border-t border-slate-200 bg-white relative">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="font-outfit text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-sm">Everything you need to know about the VendorBridge ERP solution.</p>
          </div>
          
          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-800">How does the Firebase and LocalStorage adapter work?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The application automatically inspects environment variables (`.env` file). If a Firebase Project configuration is detected, it connects to Firebase Auth and Firestore. If variables are missing, it fallbacks gracefully to LocalStorage with pre-seeded test data, allowing direct testing without setups.
              </p>
            </div>
            <div className="pt-6 space-y-2">
              <h4 className="text-sm font-bold text-slate-800">Can I define custom user access controls?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes, VendorBridge features four roles: `Admin`, `Procurement Officer`, `Manager/Approver`, and `Vendor`. Pages like RFQ Compare or Approvals automatically block unauthorized roles and disable drag-and-drop on the Kanban pipeline.
              </p>
            </div>
            <div className="pt-6 space-y-2">
              <h4 className="text-sm font-bold text-slate-800">What models are used by the AI assistant?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We use the `llama-3.1-8b-instant` model on Groq's high-speed API. The assistant consumes serialized JSON contexts of your actual active vendors, purchase orders, and logs to provide precise recommendations on quotes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-4 sm:px-8 bg-slate-50 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-outfit font-black text-slate-800">VendorBridge ERP</span>
          </div>
          <p>© 2026 VendorBridge ERP Platform. Created for modern procurement workflows. Production Ready.</p>
          <div className="flex justify-center space-x-6 text-[10px] font-semibold text-slate-400">
            <a href="#features" className="hover:text-slate-700">Features</a>
            <a href="#solution" className="hover:text-slate-700">Solutions</a>
            <a href="#faq" className="hover:text-slate-700">FAQ</a>
            <button onClick={() => navigate('/login')} className="hover:text-slate-700 focus:outline-none">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
