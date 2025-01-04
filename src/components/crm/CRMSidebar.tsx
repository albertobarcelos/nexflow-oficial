import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { useEntityNames } from "@/hooks/useEntityNames";
import { useSidebarData } from "@/hooks/useSidebarData";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { MainMenuItems } from "./sidebar/MainMenuItems";
import { CustomEntitiesMenu } from "./sidebar/CustomEntitiesMenu";
import { SidebarLogoutButton } from "./sidebar/SidebarLogoutButton";

export function CRMSidebar() {
  const { state, setOpen, isMobile } = useSidebar();
  const [showPipelineSelector, setShowPipelineSelector] = useState(false);
  const { leadSingular, leadPlural } = useEntityNames();
  const { pipelines = [], customEntities = [] } = useSidebarData();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-20 bg-black/80 lg:hidden",
          state === "expanded" ? "block" : "hidden"
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex h-screen w-64 flex-col bg-white transition-transform duration-300 lg:static lg:translate-x-0 dark:bg-gray-900",
          state === "expanded" ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarHeader onClose={() => setOpen(false)} />

        <div className="flex-1 overflow-auto">
          <nav className="flex-1 space-y-1 p-2">
            <MainMenuItems 
              showPipelineSelector={showPipelineSelector}
              setShowPipelineSelector={setShowPipelineSelector}
              pipelines={pipelines}
            />

            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

            <CustomEntitiesMenu entities={customEntities} />
          </nav>
        </div>

        <SidebarLogoutButton />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-4 z-30 lg:hidden"
        onClick={() => setOpen(state !== "expanded")}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  );
}