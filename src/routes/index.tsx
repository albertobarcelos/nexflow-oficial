import { createBrowserRouter, Navigate } from "react-router-dom";
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
import { FlowBuilderPage } from "@/pages/crm/flows/FlowBuilderPage";
import { NewNexflowPage } from "@/pages/crm/flows/NewNexflowPage";
import { NexflowBuilderPage } from "@/pages/crm/flows/NexflowBuilderPage";
import { NexflowBoardPage } from "@/pages/crm/flows/NexflowBoardPage";
import { FlowViewsPage } from "@/pages/crm/flows/FlowViewsPage";
import { FlowsPage } from "@/pages/crm/flows/FlowsPage";
import { ProcessBuilderPage } from "@/pages/crm/flows/ProcessBuilderPage";
import CalendarPage from "@/pages/crm/calendar/CalendarPage";
import ContactDetails from "@/pages/crm/ContactDetails";



// AIDEV-NOTE: Removido EntitiesSettings - sistema simplificado para focar apenas em deals
import { GeneralSettings } from "@/components/crm/settings/general/GeneralSettings";
import { TeamSettings } from "@/components/crm/settings/TeamSettings";
import { NotificationSettings } from "@/components/crm/settings/NotificationSettings";
import { ProfileSettings } from "@/components/crm/settings/ProfileSettings";
import { PipelineSettings } from "@/components/crm/settings/PipelineSettings";
import { Home } from "@/pages/crm/home/Home";
import NewFlowSettings from "@/components/crm/flows/NewFlowSettings";
import AccountProfilePage from "@/pages/crm/account/AccountProfile.tsx";
import { ContactsPage } from "@/pages/crm/contacts/ContactsPage";
import ContactsList from "@/pages/crm/ContactsList";
import { ContactFormPage } from "@/pages/public/ContactForm";
import { FormsManagementPage } from "@/pages/crm/forms/FormsManagementPage";
import { CRMConfigurationsLayout } from "@/layouts/CRMConfigurationsLayout";
import { UsersPage } from "@/pages/crm/configurations/UsersPage";
import { TeamsPage } from "@/pages/crm/configurations/TeamsPage";
import { UnitsPage } from "@/pages/crm/configurations/UnitsPage";
import { ItemsPage } from "@/pages/crm/configurations/ItemsPage";
import { ActivityTypesPage } from "../pages/crm/configurations/ActivityTypesPage";
import { CompanyRelationsPage } from "@/pages/crm/companies/CompanyRelationsPage";

// Páginas temporárias
// const DealsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Negócios</h1><p>Página de negócios em desenvolvimento</p></div>;

// Páginas de Admin
import Management from "@/pages/admin/Management";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminClients } from "@/pages/admin/AdminClients";
import { AdminSettings } from "@/pages/admin/AdminSettings";
const AdminResellers = () => <div>Admin Resellers - Em desenvolvimento</div>;

// Páginas de Revendedor - Usando placeholders temporários  
const ResellerDashboard = () => <div>Reseller Dashboard - Em desenvolvimento</div>;
const ResellerClients = () => <div>Reseller Clients - Em desenvolvimento</div>;
const ResellerClientNew = () => <div>Reseller Client New - Em desenvolvimento</div>;
const ResellerCommissions = () => <div>Reseller Commissions - Em desenvolvimento</div>;
const ResellerReports = () => <div>Reseller Reports - Em desenvolvimento</div>;
const ResellerSettings = () => <div>Reseller Settings - Em desenvolvimento</div>;
const ResellerProfile = () => <div>Reseller Profile - Em desenvolvimento</div>;

export const router = createBrowserRouter(
  [
  {
    path: "/",
    element: <SelectPortal />,
  },
  {
    path: "/form/:slug",
    element: <ContactFormPage />,
  },
  {
    path: "/form/internal/:slug",
    element: <ContactFormPage />,
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
        path: "flows",
        element: <FlowsPage />,
      },
      {
        path: "flows/new",
        element: <NewNexflowPage />,
      },
      {
        path: "flows/:id/builder",
        element: <NexflowBuilderPage />,
      },
      {
        path: "flows/:id/board",
        element: <NexflowBoardPage />,
      },
      {
        path: "flows/:id/processes",
        element: <ProcessBuilderPage />,
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
        path: "calendar",
        element: <CalendarPage />,
      },
      {
        path: "flow/:flowId/contacts/:id",
        element: <ContactDetails />,
      },
      {
        path: "contacts",
        element: <ContactsPage />,
      },
      {
        path: "contacts/list",
        element: <ContactsList />,
      },
      {
        path: "forms",
        element: <FormsManagementPage />,
      },
      {
        path: "people",
        element: <Navigate to="/crm/contacts" replace />,
      },
      {
        path: "companies",
        element: <Navigate to="/crm/companies/relations" replace />,
      },
      {
        path: "companies/relations",
        element: <CompanyRelationsPage />,
      },
      // AIDEV-NOTE: Rota de deals removida - funcionalidade desnecessária
      {
        path: "account/profile",
        element: <AccountProfilePage />,
      },
      {
        path: "configurations",
        element: <CRMConfigurationsLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/crm/configurations/users" replace />,
          },
          {
            path: "users",
            element: <UsersPage />,
          },
          {
            path: "teams",
            element: <TeamsPage />,
          },
          {
            path: "units",
            element: <UnitsPage />,
          },
          {
            path: "items",
            element: <ItemsPage />,
          },
          {
            path: "activity-types",
            element: <ActivityTypesPage />,
          },
        ],
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
            path: "notifications",
            element: <NotificationSettings />,
          },
          {
            path: "team",
            element: <TeamSettings />,
          },
          {
            path: "profile",
            element: <ProfileSettings />,
          },
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
        path: "management",
        element: <Management />,
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
],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);


