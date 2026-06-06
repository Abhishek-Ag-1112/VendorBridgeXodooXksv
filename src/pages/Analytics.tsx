import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  IndianRupee, 
  FileSpreadsheet,
  Users,
  CheckCircle
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { purchaseOrders, vendors, rfqs } = useData();

  // Date filters
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  // Filter POs within range
  const approvedPOs = purchaseOrders.filter(p => {
    if (p.status !== 'approved') return false;
    const poDate = new Date(p.createdAt);
    return poDate >= new Date(startDate) && poDate <= new Date(endDate);
  });

  // KPI Calculations
  const totalSpend = approvedPOs.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalOrders = approvedPOs.length;
  const avgPOValue = totalOrders > 0 ? Math.round(totalSpend / totalOrders) : 0;
  const activeVendorsCount = vendors.filter(v => v.status === 'active').length;

  // Monthly Spend aggregation (mock historical seeding + current approved POs)
  const monthlyData = [
    { month: 'Jan', spend: 120000, orders: 4 },
    { month: 'Feb', spend: 280000, orders: 8 },
    { month: 'Mar', spend: 190000, orders: 5 },
    { month: 'Apr', spend: 410000, orders: 11 },
    { month: 'May', spend: 320000, orders: 9 },
    // Jun aggregates currently approved POs
    { month: 'Jun', spend: totalSpend || 708000, orders: totalOrders || 1 }
  ];

  // Vendor performance analytics
  const vendorPerformance = vendors.map(v => {
    // Find POs issued to this vendor
    const vPOs = approvedPOs.filter(p => p.vendorId === v.id);
    const revenue = vPOs.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOrdersWon = vPOs.length;
    
    // Delivery timelines (defaults if no POs)
    const avgDelivery = v.id === 'vendor-1' ? 7 : v.id === 'vendor-2' ? 15 : 5;

    return {
      name: v.name,
      rating: v.rating,
      revenue,
      orders: totalOrdersWon,
      deliveryDays: avgDelivery,
      status: v.status
    };
  });

  // CSV Export Action
  const handleExportCSV = () => {
    // Construct CSV Header
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Supplier Name,Rating Index,Contracts Won,Annual Billing Volume (INR),Avg Delivery Days,Status\n';

    // Populate rows
    vendorPerformance.forEach(v => {
      csvContent += `"${v.name}",${v.rating},${v.orders},${v.revenue},${v.deliveryDays},"${v.status}"\n`;
    });

    // Download Trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vendor_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-slate-900">Procurement & Spend Analytics</h2>
          <p className="text-xs text-slate-500">Monitor expenditure trends, contract volumes, and vendor logistics scores</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border-0 bg-transparent text-slate-600 focus:outline-none"
            />
            <span className="text-slate-300 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border-0 bg-transparent text-slate-600 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">YTD Expenditure</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-outfit text-2xl font-extrabold text-slate-900">{formatCurrency(totalSpend)}</span>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Approved PO Totals</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contracts Settled</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-success">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-outfit text-2xl font-extrabold text-slate-900">{totalOrders} Orders</span>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Total Contracts Awarded</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Order Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-outfit text-2xl font-extrabold text-slate-900">{formatCurrency(avgPOValue)}</span>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">AOV across contracts</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partner Suppliers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-outfit text-2xl font-extrabold text-slate-900">{activeVendorsCount} Vendors</span>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Active registered partners</p>
          </div>
        </div>
      </div>

      {/* Recharts Spend Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-outfit text-base font-bold text-slate-900">Monthly Expenditure Breakdown</h3>
            <p className="text-xs text-slate-500">Cumulative billing amounts and orders issued per month</p>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(value, name) => [name === 'spend' ? formatCurrency(Number(value)) : `${value} contracts`, name === 'spend' ? 'Spend Volume' : 'Orders Issued']}
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="spend" fill="#2563EB" name="Spend Volume" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Logistics Performance table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-premium space-y-4">
        <div>
          <h3 className="font-outfit text-base font-bold text-slate-900">Partner Supplier Analytics</h3>
          <p className="text-xs text-slate-500">Vendor commercial billing volumes, quality scores, and delivery speed records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Rating Index</th>
                <th className="p-3 text-center">Contracts Awarded</th>
                <th className="p-3 text-right">Avg Shipment Delivery</th>
                <th className="p-3 text-right">Billing Volume (YTD)</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {vendorPerformance.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{v.name}</td>
                  <td className="p-3 font-bold text-amber-500">{v.rating.toFixed(1)} / 5.0</td>
                  <td className="p-3 text-center font-bold text-slate-900">{v.orders} orders</td>
                  <td className="p-3 text-right text-slate-600">{v.deliveryDays} Days</td>
                  <td className="p-3 text-right font-mono text-slate-800 font-bold">{formatCurrency(v.revenue)}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${v.status === 'active' ? 'bg-success-light text-success border-success/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {v.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
