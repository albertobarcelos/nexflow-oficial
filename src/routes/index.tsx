import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from './ProtectedRoute';
import { SettingsLayout } from "@/layouts/SettingsLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ResellerLayout from "@/layouts/ResellerLayout";
import { FlowBuilderProvider } from "@/contexts/FlowBuilderContext";
import { SelectPortal } from "@/pages/SelectPortal";
import { LoginPage as CRMLoginPage } from "@/pages/auth/crm/LoginPage";
import { ResetPasswordPage } from "@/pages/auth/crm/ResetPasswordPage";
import { LoginPage as AdminLoginPage } from "@/pages/auth/admin/LoginPage";
import { LoginPage as ResellerLoginPage } from "@/pages/auth/reseller/LoginPage";
import { Dashboard } from "@/pages/crm/Dashboard";
import FlowPage from "@/pages/crm/funnels/FlowPage";
import { FlowBuilderPage } from "@/pages/crm/flows/FlowBuilderPage";
import { FlowViewsPage } from "@/pages/crm/flows/FlowViewsPage";
import OpportunityDetails from "@/pages/crm/OpportunityDetails";
import { CompaniesPage } from "@/pages/crm/companies/CompaniesPage";
import { CompanyDetailsPage } from "@/features/companies/pages/CompanyDetailsPage";
import { PeoplePage } from "@/pages/crm/people/PeoplePage";
import { EditPersonPage } from "@/pages/crm/people/EditPersonPage";
// AIDEV-NOTE: Removido EntitiesSettings - sistema simplificado para focar apenas em deals
import { GeneralSettings } from "@/components/crm/settings/general/GeneralSettings";
import { TeamSettings } from "@/components/crm/settings/TeamSettings";
import { AutomationSettings } from "@/components/crm/settings/AutomationSettings";
import { CustomizationSettings } from "@/components/crm/settings/CustomizationSettings";
import { NotificationSettings } from "@/components/crm/settings/NotificationSettings";
import { PipelineSettings } from "@/components/crm/settings/PipelineSettings";
import { CustomFieldsSettings } from "@/components/crm/settings/CustomFieldsSettings";
import Tasks from "@/pages/crm/tasks/Tasks";
import { Home } from "@/pages/crm/home/Home";
import NewFlowSettings from "@/components/crm/flows/NewFlowSettings";
import AccountProfilePage from "@/pages/crm/account/AccountProfile.tsx";
import { Overview } from "@/pages/crm/overview/Overview";

// Páginas temporárias
// const DealsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Negócios</h1><p>Página de negócios em desenvolvimento</p></div>;

// Páginas de Admin - Usando placeholders temporários
const AdminDashboard = () => <div>Admin Dashboard - Em desenvolvimento</div>;
const AdminClients = () => <div>Admin Clients - Em desenvolvimento</div>;
const AdminResellers = () => <div>Admin Resellers - Em desenvolvimento</div>;
const AdminSettings = () => <div>Admin Settings - Em desenvolvimento</div>;

// Páginas de Revendedor - Usando placeholders temporários  
const ResellerDashboard = () => <div>Reseller Dashboard - Em desenvolvimento</div>;
const ResellerClients = () => <div>Reseller Clients - Em desenvolvimento</div>;
const ResellerClientNew = () => <div>Reseller Client New - Em desenvolvimento</div>;
const ResellerCommissions = () => <div>Reseller Commissions - Em desenvolvimento</div>;
const ResellerReports = () => <div>Reseller Reports - Em desenvolvimento</div>;
const ResellerSettings = () => <div>Reseller Settings - Em desenvolvimento</div>;
const ResellerProfile = () => <div>Reseller Profile - Em desenvolvimento</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SelectPortal />,
  },
  {
    path: "/crm/login",
    element: <CRMLoginPage />,
  },
  {
    path: "/crm/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/reseller/login",
    element: <ResellerLoginPage />,
  },
  {
    path: "/crm",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "dashboard",
        element: <Home />,
      },
      {
        path: "overview",
        element: <Overview />,
      },
      {
        path: "tasks",
        element: <Tasks />,
      },
      {
        path: "flow/:id",
        element: <FlowPage />,
      },
      {
        path: "flows/builder",
        element: <FlowBuilderPage />,
      },
      {
        path: "flows/views",
        element: <FlowViewsPage />,
      },
      {
        path: "flow/:flowId/opportunities/:id",
        element: <OpportunityDetails />,
      },
      {
        path: "companies",
        element: <CompaniesPage />,
      },
      {
        path: "companies/:id",
        element: <CompanyDetailsPage />,
      },
      {
        path: "people",
        element: <PeoplePage />,
      },
      {
        path: "people/:id",
        element: <EditPersonPage />,
      },
      // AIDEV-NOTE: Rota de deals removida - funcionalidade desnecessária
      {
        path: "account/profile",
        element: <AccountProfilePage />,
      },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <GeneralSettings />,
          },
          {
            path: "team",
            element: <TeamSettings />,
          },
          {
            path: "automation",
            element: <AutomationSettings />,
          },
          {
            path: "customization",
            element: <CustomizationSettings />,
          },
          {
            path: "notifications",
            element: <NotificationSettings />,
          },
          {
            path: "pipeline",
            element: <PipelineSettings />,
          },
          {
            path: "custom-fields",
            element: <CustomFieldsSettings />,
          },
          // AIDEV-NOTE: Removido rota de EntitiesSettings - sistema simplificado para focar apenas em deals
        ],
      },
      {
        path: "flow/settings",
        element: <PipelineSettings />,
      },
      {
        path: "flow/new/settings",
        element: <NewFlowSettings />
      },

    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "clients",
        element: <AdminClients />,
      },
      {
        path: "resellers",
        element: <AdminResellers />,
      },
      {
        path: "settings",
        element: <AdminSettings />,
      },
    ],
  },
  {
    path: "/reseller",
    element: <ResellerLayout />,
    children: [
      {
        index: true,
        element: <ResellerDashboard />,
      },
      {
        path: "dashboard",
        element: <ResellerDashboard />,
      },
      {
        path: "clients",
        element: <ResellerClients />,
      },
      {
        path: "clients/new",
        element: <ResellerClientNew />,
      },
      {
        path: "commissions",
        element: <ResellerCommissions />,
      },
      {
        path: "reports",
        element: <ResellerReports />,
      },
      {
        path: "settings",
        element: <ResellerSettings />,
      },
      {
        path: "profile",
        element: <ResellerProfile />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});
