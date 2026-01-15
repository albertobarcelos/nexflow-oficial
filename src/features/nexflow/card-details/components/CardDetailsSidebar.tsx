import { Info, History, FileEdit, Paperclip, MessageSquare, Calendar, ShoppingCart } from "lucide-react";
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
    <div className="w-80 bg-slate-50/50 dark:bg-slate-900/20 border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
      {/* Navegação existente */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                activeSection === "overview"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Info className="text-xl" />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("history");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                activeSection === "history"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <History className="text-xl" />
              <div className="flex flex-col">
                <span>Histórico</span>
                {lastHistoryUpdate && (
                  <span className="text-[10px] font-normal">
                    {lastHistoryUpdate}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("fields");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                activeSection === "fields"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <FileEdit className="text-xl" />
              <span>Campos da Etapa</span>
            </button>

            {card.cardType === 'finance' && (
              <button
                onClick={() => {
                  setActiveTab("informacoes");
                  setActiveSection("products");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                  activeSection === "products"
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <ShoppingCart className="text-xl" />
                <span>Produtos</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("attachments");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                activeSection === "attachments"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Paperclip className="text-xl" />
              <span>Anexos</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("comments");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                activeSection === "comments"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <MessageSquare className="text-xl" />
              <span>Comentários</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("informacoes");
                setActiveSection("activities");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                activeSection === "activities"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Calendar className="text-xl" />
              <span>Atividades</span>
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
      </div>

      <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Progresso
          </span>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

