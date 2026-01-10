import { Info, History, FileEdit, Paperclip, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProcessesSidebar } from "./ProcessesSidebar";
import type { ActiveSection } from "../types";
import type { NexflowCard } from "@/types/nexflow";

interface CardDetailsSidebarProps {
  activeTab: "informacoes" | "processos";
  activeSection: ActiveSection;
  setActiveTab: (tab: "informacoes" | "processos") => void;
  setActiveSection: (section: ActiveSection) => void;
  card: NexflowCard;
  selectedProcessId: string | null;
  setSelectedProcessId: (id: string) => void;
  lastHistoryUpdate: string | null;
  progressPercentage: number;
}

export function CardDetailsSidebar({
  activeTab,
  activeSection,
  setActiveTab,
  setActiveSection,
  card,
  selectedProcessId,
  setSelectedProcessId,
  lastHistoryUpdate,
  progressPercentage,
}: CardDetailsSidebarProps) {
  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          const newTab = value as "informacoes" | "processos";
          setActiveTab(newTab);
          if (newTab === "processos") {
            setActiveSection("processes");
          } else {
            if (activeSection === "processes") {
              setActiveSection("fields");
            }
          }
        }}
        className="flex flex-col h-full"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger 
              value="informacoes"
              className="text-xs font-medium"
            >
              Informações
            </TabsTrigger>
            <TabsTrigger 
              value="processos"
              className="text-xs font-medium"
            >
              Processos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="informacoes" className="flex-1 overflow-y-auto mt-0 p-4 space-y-1">
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("overview");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                activeSection === "overview"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {activeSection === "overview" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
              )}
              <Info
                className={cn(
                  "h-5 w-5",
                  activeSection === "overview"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                )}
              />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("history");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                activeSection === "history"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {activeSection === "history" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
              )}
              <History
                className={cn(
                  "h-5 w-5",
                  activeSection === "history"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                )}
              />
              <div className="flex flex-col">
                <span>Histórico</span>
                {lastHistoryUpdate && (
                  <span className="text-[10px] text-gray-400 font-normal">
                    Última atualização: {lastHistoryUpdate}
                  </span>
                )}
              </div>
            </button>

            <div className="relative">
              {activeSection === "fields" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
              )}
              <button
                onClick={() => {
                  setActiveTab("informacoes");
                  setActiveSection("fields");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium shadow-sm border border-gray-200 dark:border-gray-600 text-left",
                  activeSection === "fields"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                )}
              >
                <FileEdit
                  className={cn(
                    "h-5 w-5",
                    activeSection === "fields"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400"
                  )}
                />
                <span>Campos da Etapa</span>
              </button>
            </div>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("attachments");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                activeSection === "attachments"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {activeSection === "attachments" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
              )}
              <Paperclip
                className={cn(
                  "h-5 w-5",
                  activeSection === "attachments"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                )}
              />
              <span>Anexos</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("comments");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                activeSection === "comments"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {activeSection === "comments" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
              )}
              <MessageSquare
                className={cn(
                  "h-5 w-5",
                  activeSection === "comments"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                )}
              />
              <span>Comentários</span>
            </button>
          </nav>
        </TabsContent>

        <TabsContent value="processos" className="flex-1 overflow-y-auto mt-0 p-4">
          <ProcessesSidebar 
            card={card} 
            selectedProcessId={selectedProcessId}
            onSelectProcess={setSelectedProcessId}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2 uppercase">
          Progresso do Fluxo
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          {Math.round(progressPercentage)}%
        </div>
      </div>
    </div>
  );
}

