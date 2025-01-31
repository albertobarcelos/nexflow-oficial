import { createBrowserRouter, RouterProvider, Route, Navigate } from "react-router-dom";
import { SelectPortal } from "@/pages/SelectPortal";
import CRMLayout from "@/layouts/CRMLayout";
import { Dashboard } from "@/pages/crm/Dashboard";
import { CompaniesPage } from "@/features/companies/pages/CompaniesPage";
import { PeoplePage } from "@/pages/crm/people/PeoplePage";
import { AddPersonPage } from "@/pages/crm/people/AddPersonPage";
import { EditPersonPage } from "@/pages/crm/people/EditPersonPage";
import { PartnersPage } from "@/pages/crm/partners/PartnersPage";
import { AddPartnerPage } from "@/pages/crm/partners/AddPartnerPage";
import PartnerDetailsPage from "@/pages/crm/partners/PartnerDetailsPage";
import { Settings } from "@/pages/crm/settings/Settings";
import { CustomFieldsSettings } from "@/pages/crm/settings/CustomFieldsSettings";
import { PipelineSettings } from "@/components/crm/settings/pipeline/PipelineSettings";
import Tasks from "@/pages/crm/Tasks";
import TasksList from "@/pages/crm/TasksList";
import FunnelPage from "@/pages/crm/funnels/FunnelPage";

// Auth Pages
import { LoginPage as CRMLoginPage } from "@/pages/auth/crm/LoginPage";
import { LoginPage as AdminLoginPage } from "@/pages/auth/admin/LoginPage";
import { LoginPage as PartnerLoginPage } from "@/pages/auth/partner/LoginPage";

const routes = [
  // Portal Selection
  {
    path: "/",
    element: <SelectPortal />,
  },

  // Auth Routes
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/crm/login",
    element: <CRMLoginPage />,
  },
  {
    path: "/partner/login",
    element: <PartnerLoginPage />,
  },

  // CRM Routes
  {
    path: "/crm",
    element: <CRMLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Navigate to="/crm" replace />,
      },

      // Settings
      {
        path: "settings",
        element: <Settings />,
        children: [
          {
            index: true,
            element: <div>Selecione uma configuração</div>,
          },
          {
            path: "custom-fields",
            element: <CustomFieldsSettings />,
          },
          {
            path: "pipeline",
            element: <PipelineSettings />,
          },
        ],
      },

      // Companies
      {
        path: "companies",
        element: <CompaniesPage />,
      },

      // People
      {
        path: "people",
        element: <PeoplePage />,
      },
      {
        path: "people/add",
        element: <AddPersonPage />,
      },
      {
        path: "people/:id/edit",
        element: <EditPersonPage />,
      },

      // Partners
      {
        path: "partners",
        element: <PartnersPage />,
      },
      {
        path: "partners/add",
        element: <AddPartnerPage />,
      },
      {
        path: "partners/:id",
        element: <PartnerDetailsPage />,
      },

      // Tasks
      {
        path: "tasks",
        element: <Tasks />,
      },
      {
        path: "tasks/list",
        element: <TasksList />,
      },

      // Funnels
      {
        path: "funnels/default",
        element: <FunnelPage />,
      },
      {
        path: "funnels/:id",
        element: <FunnelPage />,
      },
    ],
  },
];

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
  },
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
