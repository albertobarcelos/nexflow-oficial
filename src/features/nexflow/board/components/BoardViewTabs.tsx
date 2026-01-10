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
      <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <TabsTrigger 
          value="kanban"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === "kanban"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          Kanban
        </TabsTrigger>
        <TabsTrigger 
          value="list"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === "list"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          Lista
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

