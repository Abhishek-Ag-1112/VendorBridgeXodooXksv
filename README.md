# 🌐 VendorBridge ERP — Enterprise Procurement & Supplier Management Platform

VendorBridge is a high-fidelity, production-ready React Single Page Application (SPA) designed to automate, streamline, and audit enterprise procurement workflows. It operates either as a fully integrated client connecting to **Firebase (Auth & Firestore)** or in an offline sandbox mode utilizing **LocalStorage** fallbacks with pre-seeded demo records.

---

## ⚡ Core Platform Capabilities

The system covers 10 fully realized screens divided into cohesive modules for Admins, Procurement Officers, Managers, and Vendors:

1. **Dashboard (Control Center)**: Dynamic KPI cards (Spend, active RFQs, Pending Approvals), a sparkline spend chart utilizing Recharts, and cost anomaly alerts flagging unexpected supplier pricing splits.
2. **Interactive Map Registry**: A full Leaflet.js map tracking supplier locations across India, colored by trade category (IT, Logistics, Manufacturing) with click-to-edit profile overlays.
3. **Bulk CSV Importer**: Integrated parser using PapaParse that performs client-side syntax and formatting validation (verifying GSTIN, PAN, and email structure) with red/green line reviews before database insertion.
4. **Smart RFQ Builder**: Launch Request for Quotations with detailed material breakdowns, deadlines, and invites. Features **AI Smart Fill** to auto-populate forms from raw procurement descriptions.
5. **Quotation Submission Portal**: Restricted Vendor cockpit to inspect invitation packages, calculate live bidding subtotals, specify delivery timelines, and submit bids.
6. **Side-by-Side Comparison Matrix**: Parallel comparison grid highlighting the lowest unit prices per line item and the cheapest overall contract bid in green.
7. **RFQ Kanban Board**: Drag-and-drop workflow pipeline built with `@dnd-kit/core` to track RFQ progression from drafts through responses, approvals, and invoices.
8. **Multi-Role Approvals Portal**: Sequential audit trail checkpoint enforcing managerial sign-offs and mandatory remarks before generating purchase orders.
9. **PO & Invoice Detailer**: Automated CGST/SGST tax calculators, client-side PDF export (using `html2pdf.js`), print layouts, and a scannable verification QR Code encoding invoice metadata in secure JSON formats.
10. **Persistent AI Co-pilot**: A collapsible sidebar panel carrying a procurement advisor that injects the serialized application state into Claude/LLaMA prompts, delivering contextual contract guidance.

---

## 🛠️ Technology Stack

* **Core**: React 18, TypeScript, Vite
* **Styling**: TailwindCSS, Vanilla CSS, Lucide React Icons
* **State & Sync**: Firebase SDK v10 (Auth, Firestore DB), React Context
* **Libraries**: Leaflet.js (Mapping), Recharts (Spend trends), PapaParse (CSV processing), `@dnd-kit` (Kanban grid), `html2pdf.js` (Document rendering)

---

## 🚀 Installation & Quick Start

Follow these steps to run the application locally on your machine:

### 1. Clone & Install Dependencies
Navigate to the root workspace directory and run:
```bash
# Install package dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root of the workspace directory. You can copy the template variables from `.env.example`:
```bash
# Windows command
copy .env.example .env
```
Ensure your `.env` contains the required keys for Firebase and Groq AI:
```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(Note: If these keys are left empty, the application will automatically fall back to **LocalStorage Offline Sandbox Mode** so you can still run and evaluate all screens.)*

### 3. Run Vite Development Server
```bash
# Start local server
npm run dev
```
The application will launch on `http://localhost:3000/`.

### 4. Build Production Bundle
```bash
# Compile and build application
npm run build
```

---

## 🔥 Firebase Console Configuration

To connect the application to a live Firebase backend, set up the following services in your [Firebase Console](https://console.firebase.google.com/):

### 1. Enable Email/Password Auth
1. Select your Firebase project.
2. Go to **Build** ➡️ **Authentication** in the left sidebar.
3. Click **Get Started**, choose **Email/Password** under native providers, enable the toggle, and click **Save**.

### 2. Initialize Firestore Database
1. Go to **Build** ➡️ **Firestore Database** in the left sidebar.
2. Click **Create Database** and choose your preferred regional hosting location.
3. Select **Start in test mode** to allow immediate client connections.
4. Copy the secure database rule setup from your project's `firestore.rules` file:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /vendors/{vendorId} {
      allow read, write: if request.auth != null;
    }
    match /rfqs/{rfqId} {
      allow read, write: if request.auth != null;
    }
    match /quotations/{quotationId} {
      allow read, write: if request.auth != null;
    }
    match /approvalWorkflows/{workflowId} {
      allow read, write: if request.auth != null;
    }
    match /purchaseOrders/{poId} {
      allow read, write: if request.auth != null;
    }
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }
    match /activityLogs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🔑 Demo Account Profiles

To test role-restricted workflows, we have embedded pre-seeded profiles. You can autofill these directly from the sign-in screen:

| Role | autofill Profile Email | Action Permissions |
| :--- | :--- | :--- |
| **Admin** | `admin@vendorbridge.com` | Full platform settings, bulk CSV import, vendor registry management. |
| **Procurement Officer** | `procurement@vendorbridge.com` | Create RFQs, AI Smart Fill, Compare Quotations, Settle Invoices. |
| **Manager/Approver** | `manager@vendorbridge.com` | Timeline check, Sign off POs, Input mandatory approval remarks. |
| **Vendor (Rajesh Traders)** | `rajesh@vendorbridge.com` | Bidding cockpit, unit pricing entry, invoice downloads. |

---

## 📂 Project Directory Structure

```text
├── .env                  # Excluded from git; contains your secrets
├── .env.example          # Template for local environment configs
├── firestore.rules       # Security definitions for cloud database sync
├── package.json          # Dependency listings and workspace scripts
├── tailwind.config.js    # Tailwind color extension configuration
├── index.html            # Main entry point mounting React script
├── src/
│   ├── firebase.ts       # Config initialization & offline switch adapters
│   ├── main.tsx          # DOM root mounter
│   ├── App.tsx           # Route mapping for public landing and ERP cockpits
│   ├── context/
│   │   ├── AuthContext.tsx   # Access roles, auth states, and demo accounts
│   │   └── DataContext.tsx   # Global database operations & seed state
│   ├── components/
│   │   ├── Layout.tsx        # Shell layout, sidebar controls, and role swappers
│   │   ├── ProtectedRoute.tsx# Role-gate router middleware
│   │   └── AiCopilot.tsx     # Context-injecting chatbot assistant
│   └── pages/
│       ├── Landing.tsx       # Marketing landing page (light-themed dashboard style)
│       ├── Login.tsx         # Sign-in portal with quick-login profiles
│       ├── Dashboard.tsx     # KPI cards, charts, cost anomaly warnings
│       ├── Vendors.tsx       # Search registry, Leaflet map tabs, CSV validator
│       ├── RfqCreate.tsx     # RFQ launcher with AI Smart Fill
│       ├── QuotationSubmit.tsx# Vendor bidding form
│       ├── QuotationCompare.tsx# Side-by-side bidding matrices
│       ├── ApprovalWorkflow.tsx# PO review & timeline logs
│       ├── PurchaseOrders.tsx# Invoices, tax splits, PDF exports, verification QR
│       ├── ActivityLogs.tsx  # Searchable audit trail logs
│       └── Analytics.tsx     # Expansions report graphs, CSV exporting
```

---

## 🌟 Security & Compliance
* **Local Storage Protection**: Environment variables are excluded from version control systems.
* **Role Verification Check**: All core router paths check session roles before mounting components.
* **Audit Reliability**: Every data-modifying action (e.g. bulk CSV imports, PO approvals, user signups) automatically registers a telemetry audit record inside `ActivityLogs`.
