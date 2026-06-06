<div align="center">

<img src="https://img.shields.io/badge/VendorBridge-ERP-2563EB?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zIDloNHYxMUgzem03LTVoNHYxNmgtNHptNyA4aDR2OGgtNHoiLz48L3N2Zz4=" alt="VendorBridge" />

# VendorBridge — Procurement & Vendor Management ERP

**A full-featured, AI-powered Procurement ERP built in 8 hours at the KSV Hackathon × Odoo track.**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-vendor--bridge--xodoo--xksv.vercel.app-2563EB?style=flat-square)](https://vendor-bridge-xodoo-xksv.vercel.app/)
[![Built With React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com/)
[![Powered by Claude](https://img.shields.io/badge/AI-Claude%20API-D97706?style=flat-square)](https://anthropic.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

> **Simplifying procurement. Digitizing vendor relationships. Intelligently.**  
> VendorBridge is a centralized ERP platform managing the full procurement lifecycle — from RFQ creation to invoice generation — enhanced with AI-powered vendor analysis and a real-time co-pilot.

[🔗 Live Demo](https://vendor-bridge-xodoo-xksv.vercel.app/) · [📋 Problem Statement](#problem-statement) · [✨ Features](#features) · [🖥️ Screens](#screens) · [🛠️ Tech Stack](#tech-stack) · [🚀 Getting Started](#getting-started)

</div>

---

## 📊 Project Stats

| Metric | Value |
|---|---|
| ⏱️ Built in | **8 hours** (Hackathon sprint) |
| 🖥️ Total Screens | **10 screens** |
| 👤 User Roles | **4 roles** (Admin, Procurement Officer, Manager, Vendor) |
| 🤖 AI Features | **3** (Co-pilot, Smart RFQ fill, Quotation advisor) |
| 📦 Components | **40+** reusable React components |
| 📄 Invoice PDF | ✅ Download + Print + Email |
| 📍 Vendor Map | ✅ India geo-map with Leaflet.js |
| 📊 Charts | ✅ recharts (spend trends, vendor performance) |
| 📱 PWA Ready | ✅ Installable on mobile |
| 🌙 Dark Mode | ✅ Full dark/light theme toggle |

---

## 🎯 Problem Statement

Organizations managing procurement through spreadsheets and email threads face:
- ❌ No centralized vendor database
- ❌ Manual, error-prone RFQ and quotation processes
- ❌ No structured approval workflows
- ❌ Time-consuming invoice generation and tracking
- ❌ Zero procurement visibility and analytics

**VendorBridge solves all of this** through a structured digital workflow with role-based access, real-time tracking, and AI intelligence layered on top.

---

## ✨ Features

### 🔐 Authentication & Role Management
- Email & password login with session persistence
- **4 role-based dashboards**: Admin, Procurement Officer, Manager/Approver, Vendor
- Role-based route guards — each user only sees what they're permitted to access
- Secure session handling via localStorage

### 📊 Smart Dashboard
- Live KPI cards: pending approvals, active RFQs, recent POs, total spend
- Real-time spend anomaly alerts (e.g. "Vendor quoted 34% above 3-month average")
- Quick action buttons for most common tasks
- Mini procurement trend sparkline chart

### 🏢 Vendor Management
- Full vendor registry with search, filter by category and status
- Vendor registration with GST details, PAN, contact info, bank details
- **Vendor scorecard**: auto-calculated rating from delivery speed, quote accuracy, and order history
- **SLA tracker**: flags vendors who respond late to RFQs
- **Vendor geo-map**: interactive India map (Leaflet.js) showing all vendors by city, colored by category
- Bulk vendor import via CSV upload (PapaParse)
- Active / Inactive / Pending status management

### 📋 RFQ Creation
- Multi-line item procurement requests
- Deadline management with visual urgency indicators
- Multi-vendor assignment in one click
- **AI Smart Fill**: describe your procurement need in plain English — Claude auto-fills the entire form
- Attachment placeholder support
- RFQ status tracking from draft to closed

### 💬 Vendor Quotation Submission
- Vendor-facing quotation portal for each assigned RFQ
- Per-item pricing with delivery timeline
- Notes and terms fields
- Edit before final submission
- Quotation status: Draft / Submitted / Under Review

### ⚖️ Quotation Comparison Engine
- Side-by-side comparison table for all vendor quotes
- Lowest price highlighted in green automatically
- Best delivery timeline indicator
- Vendor rating shown inline
- **AI Quotation Advisor**: click "Ask AI" — type any question ("which vendor should I pick?") and get a data-driven recommendation from Claude with full reasoning
- Select vendor CTA that initiates the approval workflow

### ✅ Multi-Level Approval Workflow
- **Auto-escalation by PO value**: under ₹50K → Manager, ₹50K–₹5L → Director, above ₹5L → CFO
- Approve / Reject with mandatory remarks
- Visual approval timeline with timestamps
- Status transitions: Draft → Pending → Approved / Rejected
- Email notification simulation on status change

### 🧾 Purchase Order & Invoice Generation
- Auto-generated PO number (format: `VB-PO-YYYYMMDD-XXX`)
- Line items with quantity, unit price, GST (18%) and total calculations
- **Animated procurement status stepper**: RFQ → Quotes → Approved → PO → Invoiced
- **Download invoice as PDF** (html2pdf.js)
- **Print invoice** directly from browser
- **Send invoice via email** (EmailJS integration)
- **QR code on every invoice** — scan to verify PO details on mobile (qrcode.js)

### 📋 Procurement Kanban Board
- Visual board showing all RFQs across pipeline columns: Draft → RFQ Sent → Quotes Received → Under Review → Approved → PO Raised → Invoiced
- Drag-and-drop cards between columns (dnd-kit)
- Cards display: vendor count, total value, deadline, overdue alert
- Moving a card auto-updates RFQ status and logs the activity

### 📜 Activity Logs & Audit Trail
- Chronological timeline of every procurement event
- Filter by entity type (RFQ / PO / Vendor / Invoice / Approval)
- User name and timestamp on every action
- Color-coded event types for quick scanning
- Full audit trail for compliance

### 📈 Reports & Analytics
- Monthly procurement spend bar chart (recharts)
- Vendor performance table: on-time %, avg quote accuracy, total orders
- **Predictive budget forecast**: projects next quarter's spend from historical trends with AI-generated commentary
- **One-page executive summary PDF**: total spend, top vendors, savings, pending approvals — generated on demand
- CSV export of all procurement data
- Date range filter

### 🤖 AI Procurement Co-Pilot (Global Sidebar)
- Persistent AI sidebar accessible from every page in the app
- Knows the full live state: all vendors, RFQs, POs, invoices, activity logs
- Powered by Claude API — ask anything: "Which vendor has the best track record?", "Summarize pending approvals", "What's our total spend this month?"
- Streamed token-by-token responses for a natural conversation feel

### 🌟 Bonus Features
- 🌙 **Dark mode** — full theme toggle with one click
- 📱 **PWA** — installable on Android/iOS from the browser
- 🗺️ **Interactive vendor map** — Leaflet.js India map with category-colored pins
- 🎯 **Guided demo tour** — step-by-step onboarding for judges and new users (driver.js)

---

## 🖥️ Screens

| # | Screen | Role |
|---|---|---|
| 1 | Login / Signup | All |
| 2 | Dashboard | All (role-filtered) |
| 3 | Vendor Management + Map | Admin, Procurement Officer |
| 4 | RFQ Creation | Procurement Officer |
| 5 | Quotation Submission | Vendor |
| 6 | Quotation Comparison | Procurement Officer |
| 7 | Approval Workflow | Manager / Admin |
| 8 | Purchase Order & Invoice | Procurement Officer |
| 9 | Procurement Kanban Board | All |
| 10 | Activity Logs | Admin, Procurement Officer |
| 11 | Reports & Analytics | Admin, Manager |

---

## 👤 User Roles

```
Admin               → Full system access: users, vendors, analytics, all modules
Procurement Officer → Create RFQs, compare quotes, generate POs and invoices
Manager / Approver  → Approve or reject procurement requests, monitor spend
Vendor              → View assigned RFQs, submit quotations, track PO status
```

**Demo credentials** (pre-seeded on the live app):

| Role | Email | Password |
|---|---|---|
| Admin | admin@vendorbridge.com | admin123 |
| Procurement Officer | officer@vendorbridge.com | officer123 |
| Manager | manager@vendorbridge.com | manager123 |
| Vendor | vendor@rajeshtraders.com | vendor123 |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 18 + Vite | Core UI, hot reload |
| Styling | TailwindCSS + shadcn/ui | Component system |
| Routing | React Router v6 | Role-based navigation |
| State | React Context + useReducer | Global procurement state |
| AI | Anthropic Claude API | Co-pilot, smart fill, quotation advisor |
| Charts | recharts | Spend trends, performance analytics |
| PDF | html2pdf.js | Invoice + executive report download |
| Email | EmailJS | In-browser invoice email |
| Maps | Leaflet.js | Vendor geo-map |
| QR Code | qrcode.js | Invoice QR verification |
| Drag & Drop | @dnd-kit/core | Kanban board |
| CSV | PapaParse | Bulk vendor import |
| Tour | driver.js | Guided onboarding |
| Icons | lucide-react | UI icons |
| Notifications | react-hot-toast | Action confirmations |
| Deployment | Vercel | CI/CD from GitHub |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Abhishek-Ag-1112/VendorBridgeXodooXksv.git
cd VendorBridgeXodooXksv

# Install dependencies
npm install

# Start development server
npm run dev
```

App runs at `http://localhost:5173`

### Build for production

```bash
npm run build
npm run preview
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_ANTHROPIC_API_KEY=your_claude_api_key_here
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

---

## 🔄 Procurement Workflow

```
1. Procurement Officer creates an RFQ
         ↓
2. Vendors receive invitations and submit quotations
         ↓
3. Procurement team compares quotations side-by-side
         ↓
4. AI advisor recommends the best vendor
         ↓
5. Approval workflow initiated (auto-routed by PO value)
         ↓
6. Manager approves → Purchase Order generated
         ↓
7. Invoice generated from PO (PDF / Print / Email)
         ↓
8. All activities logged in audit trail & analytics
```

---

## 📁 Project Structure

```
VendorBridgeXodooXksv/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
├── src/
│   ├── components/
│   │   ├── layout/            # Sidebar, Navbar, Layout
│   │   ├── ui/                # Reusable UI components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── vendors/           # Vendor management
│   │   ├── rfq/               # RFQ creation & list
│   │   ├── quotations/        # Quotation submission & comparison
│   │   ├── approvals/         # Approval workflow
│   │   ├── purchase-orders/   # PO & invoice generation
│   │   ├── kanban/            # Procurement kanban board
│   │   ├── activity/          # Logs & audit trail
│   │   ├── reports/           # Analytics & charts
│   │   └── ai/                # AI co-pilot sidebar
│   ├── context/
│   │   ├── AuthContext.jsx    # Role-based auth
│   │   └── AppContext.jsx     # Global procurement state
│   ├── data/
│   │   └── seed.js            # Demo data (vendors, RFQs, POs)
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # PDF generation, helpers
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🏆 Hackathon Context

This project was built for the **KSV Hackathon × Odoo track** in an **8-hour sprint** using AI-assisted vibe coding via Antigravity.

**What we built beyond the spec:**
- 🤖 AI procurement co-pilot with full app state awareness
- 🗺️ Vendor geo-map across India
- 📋 Drag-and-drop procurement kanban
- 📊 Predictive budget forecasting
- 🎯 Guided demo tour for judges
- 📱 PWA with mobile install support
- 🔐 Multi-level approval chain by PO value
- ⚠️ Spend anomaly detection alerts
- 📄 Executive summary PDF export

---

## 👨‍💻 Author

**Abhishek Agrawal**  
ML Engineer & Full-Stack Developer

[![GitHub](https://img.shields.io/badge/GitHub-Abhishek--Ag--1112-181717?style=flat-square&logo=github)](https://github.com/Abhishek-Ag-1112)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-abhishekkkagarwal-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/abhishekkkagarwal)
[![Portfolio](https://img.shields.io/badge/Portfolio-abhishekagrawal.framer.website-000?style=flat-square)](https://abhishekagrawal.framer.website)
[![Instagram](https://img.shields.io/badge/Instagram-@abhishek__ag.1108-E4405F?style=flat-square&logo=instagram)](https://instagram.com/abhishek_ag.1108)

---

## 📄 License

MIT © 2024 Abhishek Agrawal

---

<div align="center">

**Built with ❤️ at KSV Hackathon × Odoo · 8 hours · Rajasthan, India**

⭐ Star this repo if VendorBridge impressed you!

</div>
