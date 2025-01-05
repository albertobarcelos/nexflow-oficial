import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EntitiesCustomization } from "./customization/EntitiesCustomization";
import { PipelinesCustomization } from "./customization/PipelinesCustomization";
import { cn } from "@/lib/utils";

export function CustomizationSettings() {
  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
          <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 p-6">
            <h3 className="text-lg font-semibold">Personalização</h3>
            <div className="space-y-4">
              <button
                className={cn(
                  "w-full rounded-lg p-3 text-left text-sm transition-colors hover:bg-muted",
                  "bg-muted font-medium"
                )}
              >
                Entidades
              </button>
              <button
                className={cn(
                  "w-full rounded-lg p-3 text-left text-sm transition-colors hover:bg-muted",
                  "text-muted-foreground"
                )}
              >
                Pipelines
              </button>
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={45} minSize={30} maxSize={60}>
          <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 p-6">
            <EntitiesCustomization />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
          <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 p-6">
            <PipelinesCustomization />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}