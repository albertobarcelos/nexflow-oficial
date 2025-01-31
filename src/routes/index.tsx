import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { CrmLayout } from "@/layouts/CrmLayout";
import { SettingsLayout } from "@/layouts/SettingsLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/crm/DashboardPage";
import { OpportunitiesPage } from "@/pages/crm/OpportunitiesPage";
import { OpportunityDetailsPage } from "@/pages/crm/OpportunityDetailsPage";
import CompaniesPage from "@/features/companies/pages/CompaniesPage";
import { CompanyDetailsPage } from "@/features/companies/pages/CompanyDetailsPage";
import ContactsPage from "@/pages/crm/contacts/ContactsPage";
import { ContactDetailsPage } from "@/pages/crm/contacts/ContactDetailsPage";
import PartnersPage from "@/pages/crm/partners/PartnersPage";
import { PartnerDetailsPage } from "@/pages/crm/partners/PartnerDetailsPage";
import { EntitiesSettings } from "@/components/crm/settings/entities/EntitiesSettings";
import { GeneralSettings } from "@/components/crm/settings/general/GeneralSettings";
import { TeamSettings } from "@/components/crm/settings/team/TeamSettings";
import { AutomationSettings } from "@/components/crm/settings/automation/AutomationSettings";
import { CustomizationSettings } from "@/components/crm/settings/customization/CustomizationSettings";
import { NotificationSettings } from "@/components/crm/settings/notifications/NotificationSettings";
import { PipelineSettings } from "@/components/crm/settings/pipeline/PipelineSettings";
import { CustomFieldsSettings } from "@/components/crm/settings/custom-fields/CustomFieldsSettings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: "/crm",
    element: <CrmLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "tasks",
        element: <DashboardPage />,
      },
      {
        path: "funnels/:id",
        element: <OpportunitiesPage />,
      },
      {
        path: "funnels/:funnelId/opportunities/:id",
        element: <OpportunityDetailsPage />,
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
        element: <ContactsPage />,
      },
      {
        path: "people/:id",
        element: <ContactDetailsPage />,
      },
      {
        path: "partners",
        element: <PartnersPage />,
      },
      {
        path: "partners/:id",
        element: <PartnerDetailsPage />,
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
          {
            path: "entities",
            element: <EntitiesSettings />,
          },
        ],
      },
    ],
  },
]); 
