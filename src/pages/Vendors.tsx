import React, { useState, useEffect, useRef } from 'react';
import { useData, Vendor } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Star, 
  SlidersHorizontal,
  Mail,
  Phone,
  FileSpreadsheet,
  Map,
  List
} from 'lucide-react';

interface ParsedVendorRow {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  category: string[];
  status: 'active' | 'inactive';
  errors: string[];
  isValid: boolean;
}

export const Vendors: React.FC = () => {
  const { vendors, addVendor, bulkAddVendors, updateVendor } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Tab control: list vs map
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  // CSV Import States
  const [previewRows, setPreviewRows] = useState<ParsedVendorRow[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const availableCategories = ['Electrical', 'Raw Materials', 'Logistics', 'Office Supplies', 'Machinery', 'Services'];

  // Leaflet map initialization and updates moved below filteredVendors to resolve initialization TDZ

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(window as any).Papa) {
      alert("CSV parsing library is not loaded. Please try again in a few seconds.");
      return;
    }

    (window as any).Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows: ParsedVendorRow[] = results.data.map((row: any) => {
          const name = (row.name || row.Company || row.CompanyName || row['Company Name'] || '').trim();
          const contactName = (row.contactName || row.Contact || row.ContactName || row['Contact Person'] || '').trim();
          const email = (row.email || row.Email || row.EmailAddress || '').trim();
          const phone = (row.phone || row.Phone || row.PhoneNumber || '').trim();
          const gstNumber = (row.gstNumber || row.GST || row.GSTIN || row['GST Number'] || '').trim().toUpperCase();
          const panNumber = (row.panNumber || row.PAN || row['PAN Number'] || '').trim().toUpperCase();
          const statusVal = (row.status || row.Status || 'active').trim().toLowerCase();
          const status: 'active' | 'inactive' = (statusVal === 'inactive' || statusVal === 'false') ? 'inactive' : 'active';
          
          const rawCategory = row.category || row.categories || row.Category || row.Categories || '';
          const categoryList = rawCategory
            ? rawCategory.split(/[;,]/).map((c: string) => c.trim()).filter((c: string) => c.length > 0)
            : [];
          
          const category = categoryList.filter((c: string) => availableCategories.includes(c));
          
          const errors: string[] = [];
          if (!name) errors.push('Missing Company Name');
          if (!contactName) errors.push('Missing Contact Person');
          
          if (!email) {
            errors.push('Missing Email');
          } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.push('Invalid Email Format');
          }

          if (!phone) errors.push('Missing Phone Number');

          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
          if (!gstNumber) {
            errors.push('Missing GSTIN');
          } else if (!gstRegex.test(gstNumber)) {
            errors.push('Invalid GSTIN Format (e.g. 27ABCDE1234F1Z2)');
          }

          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
          if (!panNumber) {
            errors.push('Missing PAN');
          } else if (!panRegex.test(panNumber)) {
            errors.push('Invalid PAN Format (e.g. ABCDE1234F)');
          }

          if (category.length === 0) {
            errors.push('Must specify at least one valid Trade Category');
          }

          return {
            name,
            contactName,
            email,
            phone,
            gstNumber,
            panNumber,
            category: category.length > 0 ? category : ['Services'],
            status,
            errors,
            isValid: errors.length === 0
          };
        });

        setPreviewRows(rows);
        setIsPreviewOpen(true);
        e.target.value = '';
      },
      error: (error: any) => {
        alert("Error parsing CSV: " + error.message);
      }
    });
  };

  const handleConfirmImport = async () => {
    const validRows = previewRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    try {
      await bulkAddVendors(
        validRows.map(row => ({
          name: row.name,
          contactName: row.contactName,
          email: row.email,
          phone: row.phone,
          gstNumber: row.gstNumber,
          panNumber: row.panNumber,
          category: row.category,
          status: row.status
        }))
      );
      setIsPreviewOpen(false);
      alert(`Successfully imported ${validRows.length} vendors.`);
    } catch (err: any) {
      alert(err.message || "Failed to import vendors.");
    }
  };

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingVendor(null);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setGstNumber('');
    setPanNumber('');
    setCategories([]);
    setStatus('active');
    setFormError('');
    setIsOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name);
    setContactName(vendor.contactName);
    setEmail(vendor.email);
    setPhone(vendor.phone);
    setGstNumber(vendor.gstNumber);
    setPanNumber(vendor.panNumber);
    setCategories(vendor.category);
    setStatus(vendor.status);
    setFormError('');
    setIsOpen(true);
  };

  const handleCategoryToggle = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  // Form submit handler with PAN + GST validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Basic required validation
    if (!name || !contactName || !email || !phone || !gstNumber || !panNumber) {
      setFormError('All fields are required.');
      return;
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // PAN validation: 5 letters, 4 digits, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(panNumber)) {
      setFormError('Invalid PAN Format. Must be 10 characters (e.g., ABCDE1234F).');
      return;
    }

    // GST validation: 15 characters, standard formatting
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstRegex.test(gstNumber)) {
      setFormError('Invalid GST Number Format. Must be 15 characters (e.g., 27ABCDE1234F1Z2).');
      return;
    }

    if (categories.length === 0) {
      setFormError('Please select at least one category.');
      return;
    }

    try {
      if (editingVendor) {
        await updateVendor({
          ...editingVendor,
          name,
          contactName,
          email,
          phone,
          gstNumber: gstNumber.toUpperCase(),
          panNumber: panNumber.toUpperCase(),
          category: categories,
          status
        });
      } else {
        await addVendor({
          name,
          contactName,
          email,
          phone,
          gstNumber: gstNumber.toUpperCase(),
          panNumber: panNumber.toUpperCase(),
          category: categories,
          status
        });
      }
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save vendor.');
    }
  };

  // Status Toggle switch in table
  const handleToggleStatus = async (vendor: Vendor) => {
    const nextStatus = vendor.status === 'active' ? 'inactive' : 'active';
    await updateVendor({
      ...vendor,
      status: nextStatus
    });
  };

  // Search and filter operations
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone.includes(searchTerm);

    const matchesCategory = categoryFilter === '' || vendor.category.includes(categoryFilter);
    const matchesStatus = statusFilter === '' || vendor.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Leaflet map initialization and updates
  useEffect(() => {
    // Only initialize map if tab is 'map' and Leaflet is available
    if (activeTab !== 'map' || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Initialize map instance if not already initialized
    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapInstance.current = map;
    } else {
      // If already initialized, force invalidateSize to handle transitions correctly
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
    }

    const map = mapInstance.current;

    // Clear existing layers/markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Helper to map categories to colors
    const getCategoryColor = (categories: string[]) => {
      const cats = categories.map(c => c.toLowerCase());
      if (cats.some(c => c.includes('logistics'))) return '#10b981'; // green
      if (cats.some(c => c.includes('it') || c.includes('service') || c.includes('office') || c.includes('supplies'))) return '#a855f7'; // purple
      return '#3b82f6'; // blue
    };

    // Plot each vendor
    filteredVendors.forEach((vendor) => {
      if (vendor.latitude && vendor.longitude) {
        const color = getCategoryColor(vendor.category);
        const marker = L.circleMarker([vendor.latitude, vendor.longitude], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        // Build popup content DOM element dynamically to bind click handler cleanly
        const popupContent = document.createElement('div');
        popupContent.className = 'p-1.5 space-y-1.5 text-slate-800 font-sans';
        
        // Vendor Name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'font-bold text-xs text-slate-900 leading-tight';
        nameDiv.innerText = vendor.name;
        popupContent.appendChild(nameDiv);

        // GST Number
        const gstDiv = document.createElement('div');
        gstDiv.className = 'text-[10px] text-slate-500 font-mono';
        gstDiv.innerHTML = `<span class="font-semibold text-slate-400">GST:</span> ${vendor.gstNumber}`;
        popupContent.appendChild(gstDiv);

        // Rating Stars
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'flex items-center space-x-1 mt-0.5';
        
        const starsSpan = document.createElement('span');
        starsSpan.className = 'text-amber-500 flex items-center';
        
        let starsHtml = '';
        const roundedRating = Math.round(vendor.rating);
        for (let i = 1; i <= 5; i++) {
          if (i <= roundedRating) {
            starsHtml += '★';
          } else {
            starsHtml += '☆';
          }
        }
        starsSpan.innerHTML = `<span class="text-sm font-bold leading-none mr-1.5">${starsHtml}</span> <span class="text-[9px] font-bold text-slate-700 bg-amber-50 border border-amber-100 rounded px-1">${vendor.rating.toFixed(1)}</span>`;
        ratingDiv.appendChild(starsSpan);
        popupContent.appendChild(ratingDiv);

        // View Profile Button
        const button = document.createElement('button');
        button.className = 'w-full mt-1.5 rounded bg-primary text-white text-[9px] font-bold py-1 px-2.5 hover:bg-primary-hover shadow-sm transition-all focus:outline-none';
        button.innerText = 'View Profile';
        button.addEventListener('click', () => {
          openEditModal(vendor);
          marker.closePopup();
        });
        popupContent.appendChild(button);

        marker.bindPopup(popupContent);
      }
    });
  }, [activeTab, filteredVendors]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-slate-900">Vendor Directory</h2>
          <p className="text-xs text-slate-500">Manage supply chain partners, tax registers, and performance ratings</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('csv-file-input')?.click()}
            className="flex items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Vendor</span>
          </button>
        </div>
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
              placeholder="Search by vendor name, contact person, email or phone..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center space-x-2 py-3 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <List className="h-4 w-4" />
          <span>List View</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center space-x-2 py-3 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'map'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Map className="h-4 w-4" />
          <span>Map View</span>
        </button>
      </div>

      {activeTab === 'list' ? (
        /* Data Table */
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4">Vendor Details</th>
                <th className="p-4">Category & Tagging</th>
                <th className="p-4">Tax Registration</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm">{vendor.name}</div>
                    <div className="text-slate-500 mt-0.5 font-medium">{vendor.contactName}</div>
                    <div className="flex items-center space-x-3 mt-1.5 text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{vendor.email}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{vendor.phone}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {vendor.category.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-[10px] space-y-1">
                    <div><span className="font-semibold text-slate-400 mr-1.5">GST:</span>{vendor.gstNumber}</div>
                    <div><span className="font-semibold text-slate-400 mr-1.5">PAN:</span>{vendor.panNumber}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1 text-amber-500 font-bold bg-amber-50 border border-amber-100 rounded px-2 py-0.5 w-fit">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      <span>{vendor.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(vendor)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${vendor.status === 'active' ? 'bg-success' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${vendor.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`ml-2 font-bold ${vendor.status === 'active' ? 'text-success' : 'text-slate-400'}`}>
                      {vendor.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                      title="Edit profile"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No suppliers found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Map View */
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium">
          <div 
            ref={mapRef} 
            className="w-full h-[550px] rounded-lg border border-slate-200 relative z-0" 
            style={{ minHeight: '500px' }}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="font-outfit text-base font-bold text-slate-900">
                {editingVendor ? 'Edit Supplier Profile' : 'Register New Supplier'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs font-semibold text-danger bg-danger/10 border border-danger/20 rounded-lg flex items-center space-x-2">
                  <X className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter legal trade name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Representative name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99999 99999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">GSTIN Registration</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="27ABCDE1234F1Z2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">PAN Number</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Trade Categories (Select all that apply)</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  {availableCategories.map(cat => {
                    const isChecked = categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`flex items-center justify-between px-2.5 py-1.5 border rounded-md text-[10px] font-bold transition-all ${
                          isChecked 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span>{cat}</span>
                        {isChecked && <Check className="h-3 w-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="status-check"
                  checked={status === 'active'}
                  onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="status-check" className="text-xs font-semibold text-slate-700">
                  Mark supplier as Active for RFQ assignment
                </label>
              </div>

              <div className="flex justify-end space-x-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                >
                  {editingVendor ? 'Save Changes' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="font-outfit text-base font-bold text-slate-900">
                  Bulk CSV Import Preview
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Review the parsed records and validation statuses below. Only valid records will be imported.
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Total Rows Parsed</div>
                  <div className="text-xl font-black text-slate-800 mt-1">{previewRows.length}</div>
                </div>
                <div className="bg-success-light/20 border border-success/15 rounded-xl p-3 text-center">
                  <div className="text-xs font-bold text-success/80 uppercase">Valid (Ready)</div>
                  <div className="text-xl font-black text-success mt-1">
                    {previewRows.filter(r => r.isValid).length}
                  </div>
                </div>
                <div className="bg-danger-light/20 border border-danger/15 rounded-xl p-3 text-center">
                  <div className="text-xs font-bold text-danger/80 uppercase">Invalid (Skipped)</div>
                  <div className="text-xl font-black text-danger mt-1">
                    {previewRows.filter(r => !r.isValid).length}
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[40vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                      <th className="p-3">Status</th>
                      <th className="p-3">Company Name</th>
                      <th className="p-3">Contact Person</th>
                      <th className="p-3">Email & Phone</th>
                      <th className="p-3">GST & PAN</th>
                      <th className="p-3">Categories</th>
                      <th className="p-3">Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {previewRows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          row.isValid ? 'bg-success-light/5' : 'bg-danger-light/5'
                        }`}
                      >
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-success-light text-success">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-danger-light text-danger">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{row.name || <span className="text-slate-400 italic">None</span>}</td>
                        <td className="p-3 text-slate-600">{row.contactName || <span className="text-slate-400 italic">None</span>}</td>
                        <td className="p-3 space-y-0.5">
                          <div className="text-slate-700 font-medium">{row.email || <span className="text-slate-400 italic">None</span>}</div>
                          <div className="text-[10px] text-slate-400">{row.phone}</div>
                        </td>
                        <td className="p-3 font-mono text-[10px] space-y-0.5">
                          <div>GST: {row.gstNumber || <span className="text-slate-400 italic">None</span>}</div>
                          <div>PAN: {row.panNumber || <span className="text-slate-400 italic">None</span>}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {row.category.map((cat) => (
                              <span key={cat} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="text-success font-bold text-[10px] uppercase tracking-wider">Passed</span>
                          ) : (
                            <div className="text-danger text-[10px] font-semibold space-y-0.5 max-w-[200px]">
                              {row.errors.map((err, eidx) => (
                                <div key={eidx} className="flex items-start space-x-1">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger mt-1 shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warning panel if there are errors */}
              {previewRows.some(r => !r.isValid) && (
                <div className="p-3.5 text-xs font-semibold text-warning bg-warning-light/30 border border-warning/10 rounded-lg flex items-start space-x-2.5">
                  <span className="inline-block text-base leading-none">⚠️</span>
                  <div>
                    <span className="font-bold text-slate-800">Validation Warnings Detected</span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Some rows contain incomplete or incorrectly formatted information. These rows will be excluded from the import. You can proceed with importing the valid rows.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={previewRows.filter(r => r.isValid).length === 0}
                className="rounded-lg bg-success px-4 py-2 text-xs font-bold text-white shadow-lg shadow-success/10 hover:bg-success-hover transition-all disabled:opacity-50"
              >
                Confirm Import ({previewRows.filter(r => r.isValid).length} Vendors)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
