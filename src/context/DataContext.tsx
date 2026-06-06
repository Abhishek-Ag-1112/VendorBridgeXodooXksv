import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseActive, db } from '../firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// Entity Interface definitions
export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  category: string[];
  status: 'active' | 'inactive';
  rating: number;
  latitude?: number;
  longitude?: number;
}

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  description?: string;
}

export interface RFQ {
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedVendorIds: string[];
  items: LineItem[];
  status: 'draft' | 'pending_responses' | 'comparison' | 'approved' | 'rejected' | 'po_created' | 'under_review' | 'invoiced';
  createdAt: string;
}

export interface QuoteItem {
  itemId: string;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  items: QuoteItem[];
  deliveryTimelineDays: number;
  notes: string;
  submittedAt: string;
}

export interface ApprovalStep {
  stepName: string;
  status: 'pending' | 'approved' | 'rejected';
  actor: string;
  timestamp: string;
}

export interface ApprovalWorkflow {
  id: string;
  entityType: 'RFQ' | 'PO';
  entityId: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks: string;
  steps: ApprovalStep[];
}

export interface POItem {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  rfqId: string;
  vendorId: string;
  poNumber: string;
  items: POItem[];
  taxRate: number; // e.g. 18 for 18% GST
  totalAmount: number; // Gross amount including tax
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  remarks?: string;
}

export interface Invoice {
  id: string;
  poId: string;
  invoiceNumber: string;
  amount: number; // Base amount
  taxAmount: number; // Tax amount
  totalAmount: number; // Invoice total
  status: 'unpaid' | 'paid';
  dueDate: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  entityType: 'User' | 'Vendor' | 'RFQ' | 'Quotation' | 'Approval' | 'PO' | 'Invoice';
  entityId: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

interface DataContextType {
  vendors: Vendor[];
  rfqs: RFQ[];
  quotations: Quotation[];
  approvalWorkflows: ApprovalWorkflow[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  activityLogs: ActivityLog[];
  loading: boolean;
  
  // Data actions
  addVendor: (vendor: Omit<Vendor, 'id' | 'rating'>) => Promise<void>;
  bulkAddVendors: (vendors: Omit<Vendor, 'id' | 'rating'>[]) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  createRfq: (rfq: Omit<RFQ, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  updateRfqStatus: (rfqId: string, status: RFQ['status']) => Promise<void>;
  submitQuotation: (quotation: Omit<Quotation, 'id' | 'submittedAt'>) => Promise<void>;
  submitApprovalDecision: (workflowId: string, decision: 'approved' | 'rejected', remarks: string) => Promise<void>;
  createPOFromQuotation: (rfqId: string, quoteId: string) => Promise<string>;
  payInvoice: (invoiceId: string) => Promise<void>;
  addCustomActivityLog: (entityType: ActivityLog['entityType'], entityId: string, action: string, status: ActivityLog['status']) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// =================== DEMO SEED DATA ===================
const DEMO_VENDORS: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'Rajesh Traders',
    contactName: 'Rajesh Kumar',
    email: 'rajesh@vendorbridge.com',
    phone: '+91 98765 43210',
    gstNumber: '27AAAAA1111A1Z1',
    panNumber: 'AAAAA1111A',
    category: ['Electrical', 'Raw Materials'],
    status: 'active',
    rating: 4.8,
    latitude: 19.07,
    longitude: 72.87
  },
  {
    id: 'vendor-2',
    name: 'Amit Supplies',
    contactName: 'Amit Shah',
    email: 'amit@vendorbridge.com',
    phone: '+91 98123 45678',
    gstNumber: '27BBBBB2222B2Z2',
    panNumber: 'BBBBB2222B',
    category: ['Logistics', 'Office Supplies'],
    status: 'active',
    rating: 4.2,
    latitude: 28.70,
    longitude: 77.10
  },
  {
    id: 'vendor-3',
    name: 'Global Corp',
    contactName: 'Sarah Jenkins',
    email: 'global@vendorbridge.com',
    phone: '+1 555 019 2834',
    gstNumber: '27CCCCC3333C3Z3',
    panNumber: 'CCCCC3333C',
    category: ['Machinery', 'Services'],
    status: 'active',
    rating: 4.5,
    latitude: 12.97,
    longitude: 77.59
  }
];

const DEMO_RFQS: RFQ[] = [
  {
    id: 'rfq-1',
    title: 'Industrial Cable Procurement',
    description: 'Procurement of copper wiring and ethernet cables for manufacturing plant installation.',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    assignedVendorIds: ['vendor-1', 'vendor-2', 'vendor-3'],
    items: [
      { id: 'item-1', name: 'Heavy Duty Copper Cable (m)', qty: 500, description: '16 sq mm copper armored cable' },
      { id: 'item-2', name: 'Shielded CAT6 Cable (m)', qty: 1000, description: 'UTP shielded network cables' },
      { id: 'item-5', name: 'Industrial Ball Bearings', qty: 200, description: 'Double-shielded deep groove ball bearings' }
    ],
    status: 'pending_responses',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: 'rfq-2',
    title: 'Office IT Infrastructure Upgrade',
    description: 'Procuring ergonomic chairs and desktop monitors for corporate headquarters layout.',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // yesterday
    assignedVendorIds: ['vendor-2', 'vendor-3'],
    items: [
      { id: 'item-3', name: 'Ergonomic Desk Chairs', qty: 25, description: 'High back mesh layout with lumbar support' },
      { id: 'item-4', name: 'Dell 24" Monitors', qty: 20, description: 'IPS Full HD thin bezel monitors' }
    ],
    status: 'po_created',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

const DEMO_QUOTATIONS: Quotation[] = [
  // Quote submitted on RFQ-1 (active)
  {
    id: 'quote-1',
    rfqId: 'rfq-1',
    vendorId: 'vendor-1',
    vendorName: 'Rajesh Traders',
    items: [
      { itemId: 'item-1', unitPrice: 320 },
      { itemId: 'item-2', unitPrice: 45 },
      { itemId: 'item-5', unitPrice: 134 }
    ],
    deliveryTimelineDays: 7,
    notes: 'Premium high conductivity grade copper. In stock and ready to ship.',
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'quote-4',
    rfqId: 'rfq-1',
    vendorId: 'vendor-2',
    vendorName: 'Amit Supplies',
    items: [
      { itemId: 'item-1', unitPrice: 350 },
      { itemId: 'item-2', unitPrice: 40 },
      { itemId: 'item-5', unitPrice: 110 }
    ],
    deliveryTimelineDays: 12,
    notes: 'Standard certified copper wire. Freight charges included in pricing.',
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'quote-5',
    rfqId: 'rfq-1',
    vendorId: 'vendor-3',
    vendorName: 'Global Corp',
    items: [
      { itemId: 'item-1', unitPrice: 300 },
      { itemId: 'item-2', unitPrice: 50 },
      { itemId: 'item-5', unitPrice: 105 }
    ],
    deliveryTimelineDays: 15,
    notes: 'Imported high grade cables. Bulk discount active.',
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  // Quotes submitted on RFQ-2 (completed)
  {
    id: 'quote-2',
    rfqId: 'rfq-2',
    vendorId: 'vendor-2',
    vendorName: 'Amit Supplies',
    items: [
      { itemId: 'item-3', unitPrice: 13500 },
      { itemId: 'item-4', unitPrice: 15500 }
    ],
    deliveryTimelineDays: 15,
    notes: 'Include 1 year warranty. Delivery might take longer due to customs.',
    submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'quote-3',
    rfqId: 'rfq-2',
    vendorId: 'vendor-3',
    vendorName: 'Global Corp',
    items: [
      { itemId: 'item-3', unitPrice: 12000 },
      { itemId: 'item-4', unitPrice: 15000 }
    ],
    deliveryTimelineDays: 5,
    notes: 'Direct from manufacturer. Extra discount applied for bulk purchasing.',
    submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEMO_POS: PurchaseOrder[] = [
  {
    id: 'po-1',
    rfqId: 'rfq-2',
    vendorId: 'vendor-3',
    poNumber: 'PO-2026-0001',
    items: [
      { name: 'Ergonomic Desk Chairs', qty: 25, unitPrice: 12000 },
      { name: 'Dell 24" Monitors', qty: 20, unitPrice: 15000 }
    ],
    taxRate: 18,
    totalAmount: 708000, // (25*12000 + 20*15000) * 1.18
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: 'Approved by Manish Manager. Proceed with logistics arrangement.'
  }
];

const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    poId: 'po-1',
    invoiceNumber: 'INV-2026-0001',
    amount: 600000,
    taxAmount: 108000,
    totalAmount: 708000,
    status: 'unpaid',
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

const DEMO_WORKFLOWS: ApprovalWorkflow[] = [
  {
    id: 'flow-1',
    entityType: 'PO',
    entityId: 'po-1',
    status: 'approved',
    remarks: 'Approved by Manish Manager. Proceed with logistics arrangement.',
    steps: [
      { stepName: 'Draft Created', status: 'approved', actor: 'Pradeep Officer', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleString() },
      { stepName: 'Manager Review', status: 'approved', actor: 'Manish Manager', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString() }
    ]
  }
];

const DEMO_LOGS: ActivityLog[] = [
  { id: 'log-1', entityType: 'User', entityId: 'u-officer', action: 'Log In successful', user: 'pradeep@vendorbridge.com', role: 'Procurement Officer', timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'info' },
  { id: 'log-2', entityType: 'RFQ', entityId: 'rfq-1', action: 'Created RFQ: "Industrial Cable Procurement"', user: 'pradeep@vendorbridge.com', role: 'Procurement Officer', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'success' },
  { id: 'log-3', entityType: 'Quotation', entityId: 'quote-1', action: 'Submitted Bid for RFQ: "Industrial Cable Procurement"', user: 'rajesh@vendorbridge.com', role: 'Vendor', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString(), status: 'success' },
  { id: 'log-4', entityType: 'RFQ', entityId: 'rfq-2', action: 'Created RFQ: "Office IT Infrastructure Upgrade"', user: 'pradeep@vendorbridge.com', role: 'Procurement Officer', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'success' },
  { id: 'log-5', entityType: 'Quotation', entityId: 'quote-2', action: 'Submitted Bid for RFQ: "Office IT Infrastructure Upgrade"', user: 'amit@vendorbridge.com', role: 'Vendor', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'success' },
  { id: 'log-6', entityType: 'Quotation', entityId: 'quote-3', action: 'Submitted Bid for RFQ: "Office IT Infrastructure Upgrade"', user: 'global@vendorbridge.com', role: 'Vendor', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'success' },
  { id: 'log-7', entityType: 'PO', entityId: 'po-1', action: 'Generated PO-2026-0001 (Pending Manager Approval)', user: 'pradeep@vendorbridge.com', role: 'Procurement Officer', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'info' },
  { id: 'log-8', entityType: 'Approval', entityId: 'flow-1', action: 'Approved PO-2026-0001 with remarks: "Approved by Manish Manager"', user: 'manager@vendorbridge.com', role: 'Manager/Approver', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'success' },
  { id: 'log-9', entityType: 'Invoice', entityId: 'inv-1', action: 'Generated Invoice INV-2026-0001 for PO-2026-0001', user: 'pradeep@vendorbridge.com', role: 'Procurement Officer', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'info' }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Application collections
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Syncing state loader
  useEffect(() => {
    if (isFirebaseActive && db) {
      // Setup Firebase real-time listeners
      const unsubVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
        const list: Vendor[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Vendor));
        // Auto-seed Firestore if empty
        if (list.length === 0) {
          seedFirestore();
        } else {
          // Backfill missing coordinates dynamically
          const backfilled = list.map(v => {
            const seed = DEMO_VENDORS.find(sv => sv.id === v.id);
            if (seed && (!v.latitude || !v.longitude)) {
              return { ...v, latitude: seed.latitude, longitude: seed.longitude };
            }
            if (!v.latitude || !v.longitude) {
              return {
                ...v,
                latitude: Number((10 + Math.random() * 20).toFixed(4)),
                longitude: Number((72 + Math.random() * 16).toFixed(4))
              };
            }
            return v;
          });
          setVendors(backfilled);
        }
      });

      const unsubRfqs = onSnapshot(collection(db, 'rfqs'), (snap) => {
        const list: RFQ[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as RFQ));
        setRfqs(list);
      });

      const unsubQuotes = onSnapshot(collection(db, 'quotations'), (snap) => {
        const list: Quotation[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Quotation));
        setQuotations(list);
      });

      const unsubFlows = onSnapshot(collection(db, 'approvalWorkflows'), (snap) => {
        const list: ApprovalWorkflow[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ApprovalWorkflow));
        setApprovalWorkflows(list);
      });

      const unsubPos = onSnapshot(collection(db, 'purchaseOrders'), (snap) => {
        const list: PurchaseOrder[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PurchaseOrder));
        setPurchaseOrders(list);
      });

      const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
        const list: Invoice[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Invoice));
        setInvoices(list);
      });

      const unsubLogs = onSnapshot(collection(db, 'activityLogs'), (snap) => {
        const list: ActivityLog[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ActivityLog));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityLogs(list);
        setLoading(false);
      });

      return () => {
        unsubVendors();
        unsubRfqs();
        unsubQuotes();
        unsubFlows();
        unsubPos();
        unsubInvoices();
        unsubLogs();
      };
    } else {
      // LocalStorage Loading
      const getOrInit = (key: string, seed: any) => {
        const data = localStorage.getItem(`vendorbridge_${key}`);
        if (data) return JSON.parse(data);
        localStorage.setItem(`vendorbridge_${key}`, JSON.stringify(seed));
        return seed;
      };

      const loadedVendors = getOrInit('vendors', DEMO_VENDORS);
      const backfilledVendors = loadedVendors.map((v: any) => {
        const seed = DEMO_VENDORS.find(sv => sv.id === v.id);
        if (seed && (!v.latitude || !v.longitude)) {
          return { ...v, latitude: seed.latitude, longitude: seed.longitude };
        }
        if (!v.latitude || !v.longitude) {
          return {
            ...v,
            latitude: Number((10 + Math.random() * 20).toFixed(4)),
            longitude: Number((72 + Math.random() * 16).toFixed(4))
          };
        }
        return v;
      });
      localStorage.setItem('vendorbridge_vendors', JSON.stringify(backfilledVendors));
      setVendors(backfilledVendors);
      setRfqs(getOrInit('rfqs', DEMO_RFQS));
      setQuotations(getOrInit('quotations', DEMO_QUOTATIONS));
      setApprovalWorkflows(getOrInit('approvalWorkflows', DEMO_WORKFLOWS));
      setPurchaseOrders(getOrInit('purchaseOrders', DEMO_POS));
      setInvoices(getOrInit('invoices', DEMO_INVOICES));
      
      const logs = getOrInit('activityLogs', DEMO_LOGS);
      logs.sort((a: ActivityLog, b: ActivityLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(logs);
      
      setLoading(false);
    }
  }, []);

  // Firestore seeder helper
  const seedFirestore = async () => {
    if (!db) return;
    console.log("Seeding Firestore with demo databases...");
    const batch = writeBatch(db);
    
    DEMO_VENDORS.forEach((v) => batch.set(doc(db, 'vendors', v.id), v));
    DEMO_RFQS.forEach((r) => batch.set(doc(db, 'rfqs', r.id), r));
    DEMO_QUOTATIONS.forEach((q) => batch.set(doc(db, 'quotations', q.id), q));
    DEMO_WORKFLOWS.forEach((w) => batch.set(doc(db, 'approvalWorkflows', w.id), w));
    DEMO_POS.forEach((po) => batch.set(doc(db, 'purchaseOrders', po.id), po));
    DEMO_INVOICES.forEach((i) => batch.set(doc(db, 'invoices', i.id), i));
    DEMO_LOGS.forEach((l) => batch.set(doc(db, 'activityLogs', l.id), l));
    
    await batch.commit();
    console.log("Firestore seeding completed.");
  };

  // Log activity helper
  const addCustomActivityLog = async (
    entityType: ActivityLog['entityType'], 
    entityId: string, 
    action: string, 
    status: ActivityLog['status'] = 'info'
  ) => {
    const actor = user ? user.name : 'System';
    const actorRole = user ? user.role : 'System';
    const newLog: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      entityType,
      entityId,
      action,
      user: actor,
      role: actorRole,
      timestamp: new Date().toLocaleString(),
      status
    };

    if (isFirebaseActive && db) {
      await setDoc(doc(db, 'activityLogs', newLog.id), newLog);
    } else {
      setActivityLogs(prev => {
        const updated = [newLog, ...prev];
        localStorage.setItem('vendorbridge_activityLogs', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Vendor actions
  const addVendor = async (vendorData: Omit<Vendor, 'id' | 'rating'>) => {
    const newId = 'vendor-' + Math.random().toString(36).substr(2, 9);
    const newVendor: Vendor = {
      ...vendorData,
      id: newId,
      rating: 5.0, // start with full rating
      latitude: vendorData.latitude || Number((10 + Math.random() * 20).toFixed(4)),
      longitude: vendorData.longitude || Number((72 + Math.random() * 16).toFixed(4))
    };

    if (isFirebaseActive && db) {
      await setDoc(doc(db, 'vendors', newId), newVendor);
    } else {
      setVendors(prev => {
        const updated = [...prev, newVendor];
        localStorage.setItem('vendorbridge_vendors', JSON.stringify(updated));
        return updated;
      });
    }

    await addCustomActivityLog('Vendor', newId, `Added new vendor "${newVendor.name}"`, 'success');
  };

  const bulkAddVendors = async (vendorsData: Omit<Vendor, 'id' | 'rating'>[]) => {
    const newVendors = vendorsData.map(data => ({
      ...data,
      id: 'vendor-' + Math.random().toString(36).substr(2, 9),
      rating: 5.0,
      latitude: data.latitude || Number((10 + Math.random() * 20).toFixed(4)),
      longitude: data.longitude || Number((72 + Math.random() * 16).toFixed(4))
    }));

    const newLogs = newVendors.map(v => ({
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      entityType: 'Vendor' as const,
      entityId: v.id,
      action: `Bulk imported vendor "${v.name}"`,
      user: user ? user.name : 'System',
      role: user ? user.role : 'System',
      timestamp: new Date().toLocaleString(),
      status: 'success' as const
    }));

    if (isFirebaseActive && db) {
      const batch = writeBatch(db);
      for (let i = 0; i < newVendors.length; i++) {
        batch.set(doc(db, 'vendors', newVendors[i].id), newVendors[i]);
        batch.set(doc(db, 'activityLogs', newLogs[i].id), newLogs[i]);
      }
      await batch.commit();
    } else {
      setVendors(prev => {
        const updated = [...prev, ...newVendors];
        localStorage.setItem('vendorbridge_vendors', JSON.stringify(updated));
        return updated;
      });
      setActivityLogs(prev => {
        const updated = [...newLogs, ...prev];
        localStorage.setItem('vendorbridge_activityLogs', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    if (isFirebaseActive && db) {
      await updateDoc(doc(db, 'vendors', updatedVendor.id), updatedVendor as any);
    } else {
      const updated = vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v);
      localStorage.setItem('vendorbridge_vendors', JSON.stringify(updated));
      setVendors(updated);
    }
    await addCustomActivityLog('Vendor', updatedVendor.id, `Updated vendor profile details for "${updatedVendor.name}"`, 'info');
  };

  // RFQ actions
  const createRfq = async (rfqData: Omit<RFQ, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    const newId = 'rfq-' + Math.random().toString(36).substr(2, 9);
    const newRfq: RFQ = {
      ...rfqData,
      id: newId,
      status: 'pending_responses',
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (isFirebaseActive && db) {
      await setDoc(doc(db, 'rfqs', newId), newRfq);
    } else {
      const updated = [...rfqs, newRfq];
      localStorage.setItem('vendorbridge_rfqs', JSON.stringify(updated));
      setRfqs(updated);
    }

    await addCustomActivityLog('RFQ', newId, `Created RFQ: "${newRfq.title}"`, 'success');
    return newId;
  };

  const updateRfqStatus = async (rfqId: string, status: RFQ['status']) => {
    if (isFirebaseActive && db) {
      await updateDoc(doc(db, 'rfqs', rfqId), { status });
    } else {
      const updated = rfqs.map(r => r.id === rfqId ? { ...r, status } : r);
      localStorage.setItem('vendorbridge_rfqs', JSON.stringify(updated));
      setRfqs(updated);
    }
    await addCustomActivityLog('RFQ', rfqId, `Updated RFQ status to: ${status}`, 'info');
  };

  // Quotation action
  const submitQuotation = async (quoteData: Omit<Quotation, 'id' | 'submittedAt'>) => {
    const newId = 'quote-' + Math.random().toString(36).substr(2, 9);
    const newQuote: Quotation = {
      ...quoteData,
      id: newId,
      submittedAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      await setDoc(doc(db, 'quotations', newId), newQuote);
    } else {
      const updated = [...quotations, newQuote];
      localStorage.setItem('vendorbridge_quotations', JSON.stringify(updated));
      setQuotations(updated);
    }

    // Check if RFQ has bids and switch status if it was draft
    const rfqObj = rfqs.find(r => r.id === quoteData.rfqId);
    if (rfqObj && rfqObj.status === 'draft') {
      await updateRfqStatus(quoteData.rfqId, 'pending_responses');
    }

    await addCustomActivityLog('Quotation', newId, `Submitted bid for RFQ "${rfqObj?.title || 'RFQ'}"`, 'success');
  };

  // Approvals workflow
  const submitApprovalDecision = async (workflowId: string, decision: 'approved' | 'rejected', remarks: string) => {
    let targetFlow: ApprovalWorkflow | undefined;
    let newSteps: ApprovalStep[] = [];
    
    if (isFirebaseActive && db) {
      const docRef = doc(db, 'approvalWorkflows', workflowId);
      const snap = await getDocs(query(collection(db, 'approvalWorkflows'), where('id', '==', workflowId)));
      
      snap.forEach(d => {
        const data = d.data() as ApprovalWorkflow;
        targetFlow = data;
        newSteps = [
          ...data.steps,
          {
            stepName: `${user?.role} Decision`,
            status: decision,
            actor: user?.name || 'Manager',
            timestamp: new Date().toLocaleString()
          }
        ];
      });

      if (targetFlow) {
        await updateDoc(doc(db, 'approvalWorkflows', workflowId), {
          status: decision,
          remarks,
          steps: newSteps
        });
        
        // Sync entity statuses
        if (targetFlow.entityType === 'PO') {
          await updateDoc(doc(db, 'purchaseOrders', targetFlow.entityId), { 
            status: decision,
            remarks 
          });

          // Generate invoice automatically if PO is approved
          if (decision === 'approved') {
            const poSnap = await getDocs(query(collection(db, 'purchaseOrders'), where('id', '==', targetFlow.entityId)));
            let poDetails: PurchaseOrder | null = null;
            poSnap.forEach(poDoc => poDetails = poDoc.data() as PurchaseOrder);

            if (poDetails) {
              const newInvId = 'inv-' + Math.random().toString(36).substr(2, 9);
              // Base and tax calculations
              const total = (poDetails as PurchaseOrder).totalAmount;
              const taxRateVal = (poDetails as PurchaseOrder).taxRate;
              const baseAmt = Math.round(total / (1 + taxRateVal / 100));
              const taxAmt = total - baseAmt;

              const invoice: Invoice = {
                id: newInvId,
                poId: (poDetails as PurchaseOrder).id,
                invoiceNumber: 'INV-' + (poDetails as PurchaseOrder).poNumber.split('-')[1] + '-' + (poDetails as PurchaseOrder).poNumber.split('-')[2],
                amount: baseAmt,
                taxAmount: taxAmt,
                totalAmount: total,
                status: 'unpaid',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString().split('T')[0]
              };
              await setDoc(doc(db, 'invoices', newInvId), invoice);
              await addCustomActivityLog('Invoice', newInvId, `Generated Invoice ${invoice.invoiceNumber} (Payment Pending)`, 'info');
            }
          }
        }
      }
    } else {
      // LocalStorage workflow decisions
      const updatedFlows = approvalWorkflows.map(w => {
        if (w.id === workflowId) {
          targetFlow = w;
          newSteps = [
            ...w.steps,
            {
              stepName: `${user?.role} Decision`,
              status: decision,
              actor: user?.name || 'Manager',
              timestamp: new Date().toLocaleString()
            }
          ];
          return {
            ...w,
            status: decision,
            remarks,
            steps: newSteps
          };
        }
        return w;
      });

      localStorage.setItem('vendorbridge_approvalWorkflows', JSON.stringify(updatedFlows));
      setApprovalWorkflows(updatedFlows);

      if (targetFlow) {
        if (targetFlow.entityType === 'PO') {
          const updatedPOs = purchaseOrders.map(po => {
            if (po.id === targetFlow?.entityId) {
              return { ...po, status: decision, remarks };
            }
            return po;
          });
          localStorage.setItem('vendorbridge_purchaseOrders', JSON.stringify(updatedPOs));
          setPurchaseOrders(updatedPOs);

          // Auto Invoice creation
          if (decision === 'approved') {
            const poDetails = purchaseOrders.find(p => p.id === targetFlow?.entityId);
            if (poDetails) {
              const newInvId = 'inv-' + Math.random().toString(36).substr(2, 9);
              const total = poDetails.totalAmount;
              const taxRateVal = poDetails.taxRate;
              const baseAmt = Math.round(total / (1 + taxRateVal / 100));
              const taxAmt = total - baseAmt;

              const invoice: Invoice = {
                id: newInvId,
                poId: poDetails.id,
                invoiceNumber: 'INV-' + poDetails.poNumber.split('-')[1] + '-' + poDetails.poNumber.split('-')[2],
                amount: baseAmt,
                taxAmount: taxAmt,
                totalAmount: total,
                status: 'unpaid',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString().split('T')[0]
              };
              const updatedInvoices = [...invoices, invoice];
              localStorage.setItem('vendorbridge_invoices', JSON.stringify(updatedInvoices));
              setInvoices(updatedInvoices);
              await addCustomActivityLog('Invoice', newInvId, `Generated Invoice ${invoice.invoiceNumber} (Payment Pending)`, 'info');
            }
          }
        }
      }
    }

    await addCustomActivityLog('Approval', workflowId, `${user?.role} ${decision} purchase request: "${remarks}"`, decision === 'approved' ? 'success' : 'error');
  };

  // Convert approved Quotation to a PO (Procurement Officer decision)
  const createPOFromQuotation = async (rfqId: string, quoteId: string): Promise<string> => {
    const rfqObj = rfqs.find(r => r.id === rfqId);
    const quoteObj = quotations.find(q => q.id === quoteId);
    
    if (!rfqObj || !quoteObj) throw new Error("RFQ or Quotation not found");

    const newPOId = 'po-' + Math.random().toString(36).substr(2, 9);
    const poSerial = Math.floor(1000 + Math.random() * 9000); // 4 digit serial
    const poNumber = `PO-${new Date().getFullYear()}-${poSerial}`;

    // Map items to calculate pricing
    const poItems: POItem[] = rfqObj.items.map(item => {
      const quotePrice = quoteObj.items.find(qi => qi.itemId === item.id)?.unitPrice || 0;
      return {
        name: item.name,
        qty: item.qty,
        unitPrice: quotePrice
      };
    });

    // Subtotal
    const subtotal = poItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const gstRate = 18; // standard GST
    const totalAmount = Math.round(subtotal * (1 + gstRate / 100));

    const newPO: PurchaseOrder = {
      id: newPOId,
      rfqId,
      vendorId: quoteObj.vendorId,
      poNumber,
      items: poItems,
      taxRate: gstRate,
      totalAmount,
      status: 'pending_approval',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Create Approval Workflow
    const newWorkflowId = 'flow-' + Math.random().toString(36).substr(2, 9);
    const newWorkflow: ApprovalWorkflow = {
      id: newWorkflowId,
      entityType: 'PO',
      entityId: newPOId,
      status: 'pending',
      remarks: '',
      steps: [
        {
          stepName: 'Draft PO Generated',
          status: 'approved',
          actor: user?.name || 'Officer',
          timestamp: new Date().toLocaleString()
        },
        {
          stepName: 'Manager Review Required',
          status: 'pending',
          actor: 'Manager/Approver',
          timestamp: new Date().toLocaleString()
        }
      ]
    };

    if (isFirebaseActive && db) {
      await setDoc(doc(db, 'purchaseOrders', newPOId), newPO);
      await setDoc(doc(db, 'approvalWorkflows', newWorkflowId), newWorkflow);
      await updateDoc(doc(db, 'rfqs', rfqId), { status: 'po_created' });
    } else {
      const updatedPOs = [...purchaseOrders, newPO];
      localStorage.setItem('vendorbridge_purchaseOrders', JSON.stringify(updatedPOs));
      setPurchaseOrders(updatedPOs);

      const updatedFlows = [...approvalWorkflows, newWorkflow];
      localStorage.setItem('vendorbridge_approvalWorkflows', JSON.stringify(updatedFlows));
      setApprovalWorkflows(updatedFlows);

      const updatedRfqs = rfqs.map(r => r.id === rfqId ? { ...r, status: 'po_created' as const } : r);
      localStorage.setItem('vendorbridge_rfqs', JSON.stringify(updatedRfqs));
      setRfqs(updatedRfqs);
    }

    await addCustomActivityLog('PO', newPOId, `Generated Purchase Order ${poNumber} for review`, 'info');
    return newPOId;
  };

  // Pay invoice
  const payInvoice = async (invoiceId: string) => {
    if (isFirebaseActive && db) {
      await updateDoc(doc(db, 'invoices', invoiceId), { status: 'paid' });
    } else {
      const updated = invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv);
      localStorage.setItem('vendorbridge_invoices', JSON.stringify(updated));
      setInvoices(updated);
    }
    await addCustomActivityLog('Invoice', invoiceId, `Invoice payment settled`, 'success');
  };

  // Dynamic Vendor Rating Calculator
  const calculateVendorRating = (vendorId: string) => {
    const vendorQuotes = quotations.filter(q => q.vendorId === vendorId);
    const vendorPOs = purchaseOrders.filter(p => p.vendorId === vendorId && p.status === 'approved');
    
    // 1. Base Score depending on vendor
    let baseScore = 3.8;
    if (vendorId === 'vendor-1') baseScore = 4.2; // Rajesh
    if (vendorId === 'vendor-2') baseScore = 3.8; // Amit
    if (vendorId === 'vendor-3') baseScore = 3.9; // Global
    
    // 2. Quote Accuracy: Check if PO base totals matches corresponding Quote totals
    let accuracyBonus = 0;
    if (vendorPOs.length > 0) {
      let matches = 0;
      vendorPOs.forEach(po => {
        const correspondingQuote = quotations.find(q => q.rfqId === po.rfqId && q.vendorId === vendorId);
        if (correspondingQuote) {
          const rfqObj = rfqs.find(r => r.id === po.rfqId);
          const quoteTotal = correspondingQuote.items.reduce((sum, qi) => {
            const rfqItem = rfqObj?.items.find(ri => ri.id === qi.itemId);
            return sum + ((rfqItem?.qty || 0) * qi.unitPrice);
          }, 0);
          const poBaseTotal = po.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
          if (Math.abs(quoteTotal - poBaseTotal) < 1) {
            matches += 1;
          }
        }
      });
      accuracyBonus = (matches / vendorPOs.length) * 0.4;
    } else {
      accuracyBonus = 0.3; // baseline for no POs yet
    }
    
    // 3. Delivery Speed Bonus
    let deliveryBonus = 0;
    if (vendorQuotes.length > 0) {
      const avgDays = vendorQuotes.reduce((sum, q) => sum + q.deliveryTimelineDays, 0) / vendorQuotes.length;
      if (avgDays <= 6) deliveryBonus = 0.4;
      else if (avgDays <= 8) deliveryBonus = 0.3;
      else if (avgDays <= 14) deliveryBonus = 0.1;
    } else {
      deliveryBonus = 0.2;
    }
    
    // 4. Volume Bonus (completed PO count)
    const volumeBonus = Math.min(5, vendorPOs.length) * 0.1;
    
    return parseFloat(Math.max(1.0, Math.min(5.0, baseScore + accuracyBonus + deliveryBonus + volumeBonus)).toFixed(1));
  };

  const computedVendors = React.useMemo(() => {
    return vendors.map(v => ({
      ...v,
      rating: calculateVendorRating(v.id)
    }));
  }, [vendors, quotations, purchaseOrders, rfqs]);

  return (
    <DataContext.Provider value={{
      vendors: computedVendors,
      rfqs,
      quotations,
      approvalWorkflows,
      purchaseOrders,
      invoices,
      activityLogs,
      loading,
      addVendor,
      bulkAddVendors,
      updateVendor,
      createRfq,
      updateRfqStatus,
      submitQuotation,
      submitApprovalDecision,
      createPOFromQuotation,
      payInvoice,
      addCustomActivityLog
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
