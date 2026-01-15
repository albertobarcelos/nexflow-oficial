import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ViewMode } from "../types";

interface BoardViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function BoardViewTabs({ viewMode, onViewModeChange }: BoardViewTabsProps) {
  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
      <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
        <TabsTrigger 
          value="kanban"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === "kanban"
              ? "bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          )}
        >
          Kanban
        </TabsTrigger>
        <TabsTrigger 
          value="list"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === "list"
              ? "bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          )}
        >
          Lista
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

