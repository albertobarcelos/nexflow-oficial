import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminLayout from "./layouts/AdminLayout";
import Settings from "./pages/crm/Settings";

// Lazy load components
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin"));
const CRMLogin = React.lazy(() => import("./pages/crm/CRMLogin"));
const PartnerLogin = React.lazy(() => import("./pages/partner/PartnerLogin"));
const SetPassword = React.lazy(() => import("./pages/collaborator/SetPassword"));
const Dashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const CRMDashboard = React.lazy(() => import("./pages/crm/Dashboard"));
const Clients = React.lazy(() => import("./pages/admin/Clients"));
const ClientForm = React.lazy(() => import("./pages/admin/ClientForm"));
const Licenses = React.lazy(() => import("./pages/admin/Licenses"));
const Reports = React.lazy(() => import("./pages/admin/Reports"));
const Analytics = React.lazy(() => import("./pages/admin/Analytics"));
const Users = React.lazy(() => import("./pages/admin/Users"));
const CRMLayout = React.lazy(() => import("./layouts/CRMLayout"));
const OpportunitiesKanban = React.lazy(() => import("./pages/crm/OpportunitiesKanban"));
const OpportunitiesList = React.lazy(() => import("./pages/crm/OpportunitiesList"));
const OpportunityDetails = React.lazy(() => import("./pages/crm/OpportunityDetails"));
const Leads = React.lazy(() => import("./pages/crm/Leads"));
const Tasks = React.lazy(() => import("./pages/crm/Tasks"));
const TasksList = React.lazy(() => import("./pages/crm/TasksList"));

const LoadingPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/crm/login" element={<CRMLogin />} />
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/collaborator/set-password" element={<SetPassword />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={
                <Suspense fallback={<LoadingPage />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="clients" element={
                <Suspense fallback={<LoadingPage />}>
                  <Clients />
                </Suspense>
              } />
              <Route path="clients/new" element={
                <Suspense fallback={<LoadingPage />}>
                  <ClientForm />
                </Suspense>
              } />
              <Route path="clients/:id" element={
                <Suspense fallback={<LoadingPage />}>
                  <ClientForm />
                </Suspense>
              } />
              <Route path="licenses" element={
                <Suspense fallback={<LoadingPage />}>
                  <Licenses />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<LoadingPage />}>
                  <Reports />
                </Suspense>
              } />
              <Route path="users" element={
                <Suspense fallback={<LoadingPage />}>
                  <Users />
                </Suspense>
              } />
              <Route path="analytics" element={
                <Suspense fallback={<LoadingPage />}>
                  <Analytics />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<LoadingPage />}>
                  <Settings />
                </Suspense>
              } />
            </Route>

            {/* CRM routes */}
            <Route path="/crm" element={<CRMLayout />}>
              <Route path="dashboard" element={
                <Suspense fallback={<LoadingPage />}>
                  <CRMDashboard />
                </Suspense>
              } />
              <Route path="opportunities" element={
                <Suspense fallback={<LoadingPage />}>
                  <OpportunitiesKanban />
                </Suspense>
              } />
              <Route path="opportunities/list" element={
                <Suspense fallback={<LoadingPage />}>
                  <OpportunitiesList />
                </Suspense>
              } />
              <Route path="opportunities/:id" element={
                <Suspense fallback={<LoadingPage />}>
                  <OpportunityDetails />
                </Suspense>
              } />
              <Route path="leads" element={
                <Suspense fallback={<LoadingPage />}>
                  <Leads />
                </Suspense>
              } />
              <Route path="tasks" element={
                <Suspense fallback={<LoadingPage />}>
                  <Tasks />
                </Suspense>
              } />
              <Route path="tasks/list" element={
                <Suspense fallback={<LoadingPage />}>
                  <TasksList />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<LoadingPage />}>
                  <Settings />
                </Suspense>
              } />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;