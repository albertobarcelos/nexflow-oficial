import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlowBuilderProvider } from "@/contexts/FlowBuilderContext";
import { EntityBuilderProvider } from "@/contexts/EntityBuilderContext";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FlowBuilderProvider>
        <EntityBuilderProvider>
          <RouterProvider router={router} />
          <Toaster />
        </EntityBuilderProvider>
      </FlowBuilderProvider>
    </QueryClientProvider>
  </StrictMode>
);
