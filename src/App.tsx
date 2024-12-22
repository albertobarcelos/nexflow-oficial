import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/admin/AdminLogin";
import CRMLogin from "./pages/crm/CRMLogin";
import PartnerLogin from "./pages/partner/PartnerLogin";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import ClientForm from "./pages/admin/ClientForm";
import Licenses from "./pages/admin/Licenses";
import Reports from "./pages/admin/Reports";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import Users from "./pages/admin/Users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/crm/login" element={<CRMLogin />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/:id" element={<ClientForm />} />
            <Route path="licenses" element={<Licenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;