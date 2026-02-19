import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import { DeviceProfileProvider } from './hooks/useDeviceProfile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './components/Login.jsx'

// OLD public components (kept for fallback)
import Home from './components/Home.jsx'
import Contact from './components/Contact.jsx'
import Customer from './components/Customer.jsx'
import SalesService from './components/SalesService.jsx'
import AboutUs from './components/AboutUs.jsx'
import Blog from './components/Blog.jsx'
import ServicePage from './components/ServicePage.jsx'

// NEW mobile-first public pages
import HomePage from './pages/public/HomePage.jsx'
import ProductListPage from './pages/public/ProductListPage.jsx'
import ProductDetailPage from './pages/public/ProductDetailPage.jsx'
import ServicePageNew from './pages/public/ServicePage.jsx'
import TrackPage from './pages/public/TrackPage.jsx'
import AboutPage from './pages/public/AboutPage.jsx'
import ContactPage from './pages/public/ContactPage.jsx'

// New Components
import ProductListing from './components/ProductListing.jsx'
import ProductDetail from './components/ProductDetail.jsx'
import EnquiryForm from './components/EnquiryForm.jsx'
import EnquiryDetail from './components/EnquiryDetail.jsx'
import ReceptionDashboardNew from './components/ReceptionDashboardNew.jsx'

// NEW Salesman Module - Clean Architecture (Rebuilt from scratch)
import SalesmanLayout from './salesman/layout/SalesmanLayout.jsx'
import SalesmanAttendance from './salesman/pages/Attendance.jsx'
import VerifiedAttendance from './components/attendance/VerifiedAttendance.jsx'
import SalesmanDashboard from './salesman/pages/Dashboard.jsx'
import SalesmanEnquiries from './salesman/pages/Enquiries.jsx'
import SalesmanCalls from './salesman/pages/Calls.jsx'
import SalesmanFollowUps from './salesman/pages/FollowUps.jsx'
import SalesmanOrders from './salesman/pages/Orders.jsx'
import SalesmanCreateOrderPage from './salesman/pages/CreateOrderPage.jsx'
import SalesmanDailyReport from './salesman/pages/DailyReport.jsx'
import SalesmanCompliance from './salesman/pages/Compliance.jsx'
import SalesmanSettingsPage from './salesman/pages/SettingsPage.jsx'
import LocationSharing from './salesman/pages/LocationSharing.jsx'
import SalesmanVisitOverview from './salesman/pages/VisitOverview.jsx'
import ServiceEngineerLayout from './components/service-engineer/ServiceEngineerLayout.jsx'
import EngineerDashboard from './components/service-engineer/EngineerDashboard.jsx'
import DailyStart from './components/service-engineer/DailyStart.jsx'
import AssignedJobs from './components/service-engineer/AssignedJobs.jsx'
import ServiceHistory from './components/service-engineer/ServiceHistory.jsx'
import SLATracker from './components/service-engineer/SLATracker.jsx'
import CustomerFeedback from './components/service-engineer/CustomerFeedback.jsx'
import DailyUpdate from './components/service-engineer/DailyUpdate.jsx'
import ServiceEngineerSettingsPage from './components/service-engineer/ServiceEngineerSettingsPage.jsx'
import EngineerMyStockUsage from './service-engineer/MyStockUsage.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import AdminSalesPerformance from './components/AdminSalesPerformance.jsx'
import AddProduct from './components/AddProduct.jsx'
import FeedbackPage from './components/FeedbackPage.jsx'
import ProfilePage from './components/common/ProfilePage.jsx'

// Reception Menu Pages
import ReceptionLayout from './components/reception/ReceptionLayout.jsx'
import ReceptionSettingsPage from './components/reception/ReceptionSettingsPage.jsx'
import EnquiryBoard from './components/reception/EnquiryBoard.jsx'
import CallsHistoryProfessional from './components/reception/CallsHistoryProfessional.jsx'  // Professional CRM
import ServiceComplaints from './components/reception/ServiceComplaints.jsx'
import RepeatComplaints from './components/reception/RepeatComplaints.jsx'
import DeliveryLog from './components/reception/DeliveryLog.jsx'
import OutstandingSummary from './components/reception/OutstandingSummary.jsx'
import MissingReports from './components/reception/MissingReports.jsx'
import VisitorLog from './components/reception/VisitorLog.jsx'
import CallManagement from './reception/pages/CallManagement.jsx'

// Admin Module - Clean single-source architecture
import AdminLayout from './admin/layout/AdminLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'
import PublicLayoutNew from './layouts/PublicLayoutNew.jsx'
import AdminDashboardPage from './admin/pages/Dashboard.jsx'
import UserManagement from './admin/pages/UserManagement.jsx'
import AdminStockManagement from './admin/pages/StockManagement.jsx'
import AdminStockAnalytics from './admin/pages/StockAnalytics.jsx'
import AdminSLAMonitoring from './admin/pages/service/SLAMonitoring.jsx'
import AdminMIF from './admin/pages/service/MIF.jsx'
import AdminAttendance from './admin/pages/Attendance.jsx'
import AdminAnalytics from './admin/pages/Analytics.jsx'
import AdminAuditLogs from './admin/pages/AuditLogs.jsx'
import AdminWhatsAppLogs from './admin/pages/WhatsAppLogs.jsx'
import AdminSettings from './admin/pages/Settings.jsx'
import EmployeeList from './admin/pages/EmployeeList.jsx'
import EmployeeDashboardView from './admin/pages/EmployeeDashboardView.jsx'
import NewEmployee from './admin/pages/NewEmployee.jsx'
import EmployeeDetail from './admin/pages/EmployeeDetail.jsx'
import AllEmployees from './admin/pages/employees/AllEmployees.jsx'
import ChatbotControl from './admin/pages/ChatbotControl.jsx'
import Reports from './admin/pages/Reports.jsx'
import LiveMap from './admin/pages/LiveMap.jsx'
import DeviceStatusMonitor from './admin/pages/DeviceStatusMonitor.jsx'
import GeofenceManagement from './admin/pages/GeofenceManagement.jsx'
import SmartWorkflows from './admin/pages/SmartWorkflows.jsx'
import ServiceRequestDetail from './admin/pages/ServiceRequestDetail.jsx'


// Invoices component (if exists)
import Invoices from './components/Invoices.jsx'
import Orders from './components/Orders.jsx'

function App() {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  
  return (
    <div className="app">
      <Routes>
              {/* ========================================
                  PUBLIC ROUTES - Mobile-First Layout
                  ======================================== */}
              <Route element={<PublicLayoutNew />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/track" element={<TrackPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/login" element={<Login />} />
                
                {/* Product Catalog */}
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/enquiry/:productId" element={<EnquiryForm />} />
                
                {/* Public Feedback Route */}
                <Route path="/feedback/:id" element={<FeedbackPage />} />
                
                {/* Service Request */}
                <Route path="/services" element={<ServicePageNew />} />
              </Route>
              
              {/* ========================================
                  PROTECTED PUBLIC ROUTES
                  ======================================== */}
              <Route 
                path="/customer" 
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                    <Customer />
                  </ProtectedRoute>
                } 
              />
              
              {/* Reception Menu Pages - Nested Routes with Sidebar */}
              <Route 
                path="/reception" 
                element={
                  <ProtectedRoute allowedRoles={['RECEPTION', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ReceptionDashboardNew />} />
                <Route path="dashboard" element={<ReceptionDashboardNew />} />
                <Route path="enquiries" element={<EnquiryBoard />} />
                <Route path="calls" element={<CallsHistoryProfessional />} />  {/* Professional CRM - No Duplicates */}
                <Route path="calls-old" element={<CallManagement />} />  {/* Old version (backup) */}
                <Route path="service-complaints" element={<ServiceComplaints />} />
                <Route path="repeat-complaints" element={<RepeatComplaints />} />
                <Route path="delivery-log" element={<DeliveryLog />} />
                <Route path="outstanding" element={<OutstandingSummary />} />
                <Route path="missing-reports" element={<MissingReports />} />
                <Route path="visitors" element={<VisitorLog />} />
                <Route path="whatsapp-logs" element={<AdminWhatsAppLogs />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ReceptionSettingsPage />} />
              </Route>
              
              {/* Enquiry routes - redirect to reception dashboard */}
              <Route 
                path="/enquiries/:enquiryId" 
                element={
                  <ProtectedRoute allowedRoles={['RECEPTION', 'ADMIN', 'SALESMAN']}>
                    <EnquiryDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* NEW SALESMAN MODULE - Clean Architecture with Attendance Gate */}
              
              {/* Attendance Page - Always accessible (no gate) */}
              <Route 
                path="/salesman/attendance" 
                element={
                  <ProtectedRoute allowedRoles={['SALESMAN', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<VerifiedAttendance />} />
              </Route>
              
              {/* Salesman pages - No attendance blocking */}
              <Route 
                path="/salesman" 
                element={
                  <ProtectedRoute allowedRoles={['SALESMAN', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<SalesmanDashboard />} />
                <Route path="enquiries" element={<SalesmanEnquiries />} />
                <Route path="calls" element={<SalesmanCalls />} />
                <Route path="followups" element={<SalesmanFollowUps />} />
                <Route path="orders" element={<SalesmanOrders />} />
                <Route path="create-order" element={<SalesmanCreateOrderPage />} />
                <Route path="daily-report" element={<SalesmanDailyReport />} />
                <Route path="compliance" element={<SalesmanCompliance />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SalesmanSettingsPage />} />
                <Route path="location" element={<LocationSharing />} />
                <Route path="visit-overview" element={<SalesmanVisitOverview />} />
              </Route>
              
              {/* Backward compatibility - redirect old routes */}
              <Route 
                path="/employee/salesman" 
                element={
                  <ProtectedRoute allowedRoles={['SALESMAN', 'ADMIN']}>
                    <SalesService />
                  </ProtectedRoute>
                } 
              />
              
              {/* Service Engineer Menu Pages - Nested Routes with Sidebar */}
              <Route 
                path="/service-engineer" 
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_ENGINEER', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EngineerDashboard />} />
                <Route path="dashboard" element={<EngineerDashboard />} />
                <Route path="attendance" element={<VerifiedAttendance />} />
                <Route path="jobs" element={<AssignedJobs />} />
                <Route path="history" element={<ServiceHistory />} />
                <Route path="sla-tracker" element={<SLATracker />} />
                <Route path="feedback" element={<CustomerFeedback />} />
                <Route path="daily-report" element={<DailyUpdate />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ServiceEngineerSettingsPage />} />
                <Route path="stock-usage" element={<EngineerMyStockUsage />} />
              </Route>
              
              {/* Backward compatibility routes */}
              <Route 
                path="/employee/service-engineer" 
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_ENGINEER', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EngineerDashboard />} />
              </Route>
              
              <Route 
                path="/engineer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_ENGINEER', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EngineerDashboard />} />
              </Route>
              
              {/* Engineer routes with /engineer prefix */}
              <Route 
                path="/engineer" 
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_ENGINEER', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EngineerDashboard />} />
                <Route path="dashboard" element={<EngineerDashboard />} />
                <Route path="service" element={<AssignedJobs />} />
                <Route path="attendance" element={<VerifiedAttendance />} />
                <Route path="jobs" element={<AssignedJobs />} />
                <Route path="history" element={<ServiceHistory />} />
                <Route path="sla-tracker" element={<SLATracker />} />
                <Route path="feedback" element={<CustomerFeedback />} />
                <Route path="daily-report" element={<DailyUpdate />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ServiceEngineerSettingsPage />} />
              </Route>
              
              <Route 
                path="/products/add" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AddProduct />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/products/edit/:productId" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AddProduct />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                } 
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                
                {/* Employees - List and Dashboard View */}
                <Route path="employees" element={<Navigate to="/admin/employees/salesmen" replace />} />
                <Route path="employees/all" element={<AllEmployees />} />
                <Route path="employees/:role" element={<EmployeeList />} />
                <Route path="employees/:role/:userId/dashboard" element={<EmployeeDashboardView />} />
                <Route path="employees/:role/:userId" element={<EmployeeDetail />} />
                <Route path="employees/admins" element={<UserManagement role="ADMIN" />} />
                
                {/* Inventory - REUSE existing pages ✅ */}
                <Route path="products" element={<ProductListing mode="admin" />} />
                <Route path="stock" element={<AdminStockManagement />} />
                <Route path="stock-analytics" element={<AdminStockAnalytics />} />
                
                {/* Sales - REUSE existing pages with admin mode ✅ */}
                <Route path="enquiries" element={<EnquiryBoard mode="admin" />} />
                <Route path="enquiries/:enquiryId" element={<EnquiryDetail />} />
                <Route path="sales/overview" element={<EnquiryBoard mode="admin" />} />
                <Route path="orders" element={<Orders mode="admin" />} />
                
                {/* Finance - REUSE existing pages ✅ */}
                <Route path="invoices" element={<Invoices mode="admin" />} />
                <Route path="outstanding" element={<OutstandingSummary mode="admin" />} />
                
                {/* Service - REUSE existing components ✅ */}
                <Route path="service/requests" element={<ServiceComplaints mode="admin" />} />
                <Route path="service/requests/:requestId" element={<ServiceRequestDetail />} />
                <Route path="service/overview" element={<ServiceComplaints mode="admin" />} />
                <Route path="service/sla" element={<AdminSLAMonitoring />} />
                <Route path="service/mif" element={<AdminMIF />} />
                <Route path="mif" element={<AdminMIF />} />
                
                {/* Operations - Reuse existing */}
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="live-map" element={<LiveMap />} />
                <Route path="device-status" element={<DeviceStatusMonitor />} />
                <Route path="geofences" element={<GeofenceManagement />} />
                <Route path="workflows" element={<SmartWorkflows />} />
                
                {/* Insights */}
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="reports" element={<Reports />} />
                
                {/* System */}
                <Route path="audit" element={<AdminAuditLogs />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="whatsapp-logs" element={<AdminWhatsAppLogs />} />
                <Route path="employees/new" element={<NewEmployee />} />
                <Route path="new-employee" element={<NewEmployee />} />
                <Route path="chatbot" element={<ChatbotControl />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              
              {/* Legacy admin routes - redirect to new admin module */}
              <Route 
                path="/admin/sales-performance" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                    <AdminSalesPerformance />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
  )
}

// Wrapper component to provide context and router
function AppWithProviders() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DeviceProfileProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <App />
          </BrowserRouter>
        </DeviceProfileProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default AppWithProviders
