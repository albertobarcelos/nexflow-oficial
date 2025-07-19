import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useSidebarData } from "@/hooks/useSidebarData";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { MainMenuItems } from "./sidebar/MainMenuItems";
import { useState } from "react";

export function CRMSidebar() {
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const { pipelines } = useSidebarData();
  const [showPipelineSelector, setShowPipelineSelector] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-border bg-background transition-transform ${
        isOpen ? "translate-x-0" : ""
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <SidebarHeader />

        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* AIDEV-NOTE: Menu principal com bases fixas integradas */}
          <MainMenuItems 
            showPipelineSelector={showPipelineSelector}
            setShowPipelineSelector={setShowPipelineSelector}
            pipelines={pipelines}
          />
        </div>

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/auth/logout")}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}
