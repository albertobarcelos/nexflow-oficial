import { Routes, Route, Navigate } from "react-router-dom";
import CRMLayout from "@/layouts/CRMLayout";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/pages/crm/Dashboard";
import Leads from "@/pages/crm/Leads";
import OpportunitiesKanban from "@/pages/crm/OpportunitiesKanban";
import OpportunitiesList from "@/pages/crm/OpportunitiesList";
import OpportunityDetails from "@/pages/crm/OpportunityDetails";
import Tasks from "@/pages/crm/Tasks";
import Settings from "@/pages/crm/Settings";
import CRMLogin from "@/pages/crm/CRMLogin";

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/crm/login" replace />} />
      
      {/* CRM Routes */}
      <Route path="/crm/login" element={<CRMLogin />} />
      <Route path="/crm" element={<CRMLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="opportunities" element={<OpportunitiesKanban />} />
        <Route path="opportunities/:pipelineId" element={<OpportunitiesKanban />} />
        <Route path="opportunities/list" element={<OpportunitiesList />} />
        <Route path="opportunities/:id" element={<OpportunityDetails />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="settings/*" element={<Settings />} />
      </Route>
    </Routes>
  );
}