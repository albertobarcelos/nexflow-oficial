import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import CRMLayout from "@/layouts/CRMLayout";
import Dashboard from "@/pages/crm/Dashboard";
import Leads from "@/pages/crm/Leads";
import OpportunitiesKanban from "@/pages/crm/OpportunitiesKanban";
import OpportunitiesList from "@/pages/crm/OpportunitiesList";
import Tasks from "@/pages/crm/Tasks";
import Settings from "@/pages/crm/Settings";
import CRMLogin from "@/pages/crm/CRMLogin";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminClients from "@/pages/admin/Clients";
import ClientForm from "@/pages/admin/ClientForm";
import AdminReports from "@/pages/admin/Reports";
import AdminUsers from "@/pages/admin/Users";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminSettings from "@/pages/admin/Settings";
import Index from "@/pages/Index";
import SetPassword from "@/pages/collaborator/SetPassword";
import EntityView from "@/pages/crm/EntityView";

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientForm />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      {/* CRM Routes */}
      <Route path="/crm/login" element={<CRMLogin />} />
      <Route path="/crm" element={<CRMLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="opportunities/kanban" element={<OpportunitiesKanban />} />
        <Route path="opportunities/list" element={<OpportunitiesList />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="entities/:id" element={<EntityView />} />
      </Route>

      {/* Collaborator Routes */}
      <Route path="/collaborator/set-password" element={<SetPassword />} />
    </Routes>
  );
}