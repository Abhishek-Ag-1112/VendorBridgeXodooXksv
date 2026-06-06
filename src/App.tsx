import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vendors } from './pages/Vendors';
import { RfqCreate } from './pages/RfqCreate';
import { QuotationSubmit } from './pages/QuotationSubmit';
import { QuotationCompare } from './pages/QuotationCompare';
import { ApprovalWorkflowView } from './pages/ApprovalWorkflow';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { ActivityLogs } from './pages/ActivityLogs';
import { Analytics } from './pages/Analytics';
import { RfqKanban } from './pages/RfqKanban';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public Login Page */}
            <Route path="/login" element={<Login />} />

            {/* Protected ERP Application Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendors" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer']}>
                  <Layout>
                    <Vendors />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rfq-kanban" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <RfqKanban />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rfqs" 
              element={
                <ProtectedRoute allowedRoles={['Procurement Officer', 'Vendor']}>
                  <Layout>
                    <RfqCreate />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rfqs/submit-bid" 
              element={
                <ProtectedRoute allowedRoles={['Vendor']}>
                  <Layout>
                    <QuotationSubmit />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/compare" 
              element={
                <ProtectedRoute allowedRoles={['Procurement Officer']}>
                  <Layout>
                    <QuotationCompare />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute allowedRoles={['Manager/Approver', 'Admin']}>
                  <Layout>
                    <ApprovalWorkflowView />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/purchase-orders" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrders />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/activity-logs" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer']}>
                  <Layout>
                    <ActivityLogs />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager/Approver']}>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
