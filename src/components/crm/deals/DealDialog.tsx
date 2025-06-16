import { memo, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock,
  Building2,
  UserCircle2,
  HandshakeIcon,
  FileText,
  History
} from "lucide-react";
import { Deal, Partner } from "@/types/deals";
import { DealPartnerTab } from "./DealPartnerTab";
import { DealPeopleTab } from "./DealPeopleTab";
import { DealHistoryTab } from "./DealHistoryTab";
import { DealTasksTab } from "./DealTasksTab";
import { DealCompanyTab } from "./DealCompanyTab";
import { useDealDetails } from "@/hooks/useDealDetails";
import { cn } from "@/lib/utils";

interface DealDialogProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
}

interface Tab {
  id: string;
  label: string;
  icon: any;
  count?: number;
}

export const DealDialog = memo(function DealDialog({ 
  deal: initialDeal, 
  isOpen, 
  onClose
}: DealDialogProps) {
  const [activeTab, setActiveTab] = useState("tasks");
  const { data: dealDetails, isLoading } = useDealDetails(isOpen ? initialDeal.id : undefined);

  const deal = dealDetails || initialDeal;
  const pendingTasks = useMemo(() => 
    deal.tasks?.filter(task => !task.completed) || [], 
    [deal.tasks]
  );

  const tabs = useMemo<Tab[]>(() => [
    { id: "tasks", label: "Tarefas", icon: Clock, count: pendingTasks.length },
    { id: "company", label: "Empresa", icon: Building2 },
    { id: "people", label: "Pessoas", icon: UserCircle2 },
    { id: "partner", label: "Parceiro", icon: HandshakeIcon },
    { id: "details", label: "Detalhes", icon: FileText },
    { id: "history", label: "Histórico", icon: History }
  ], [pendingTasks.length]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header Fixo */}
        <DialogHeader className="px-6 py-4 border-b bg-white flex-none">
          <DialogTitle className="flex items-center justify-between gap-4">
            <span className="text-xl font-semibold truncate">{deal.title}</span>
            <Badge variant="outline" className="text-lg px-3 py-1 bg-green-50/20 text-green-700 border-green-200 whitespace-nowrap">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(deal.value)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-gray-500">Carregando informações...</p>
            </div>
          </div>
        ) : (
          <Tabs 
            defaultValue="tasks" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Lista de Tabs */}
            <div className="border-b bg-white flex-none">
              <TabsList className="p-0 h-12 w-full justify-start gap-2 rounded-none border-b bg-white px-6">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary",
                      activeTab === tab.id ? "text-primary" : "text-gray-500"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <Badge variant="secondary" className="ml-1">
                        {tab.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Conteúdo das Tabs */}
            <TabsContent value="tasks" className="flex-1 min-h-0">
              <DealTasksTab deal={deal} />
            </TabsContent>

            <TabsContent value="company" className="flex-1 min-h-0">
              <DealCompanyTab deal={deal} />
            </TabsContent>

            <TabsContent value="people" className="flex-1 min-h-0">
              <DealPeopleTab deal={deal} />
            </TabsContent>

            <TabsContent value="partner" className="flex-1 min-h-0">
              <DealPartnerTab deal={deal} />
            </TabsContent>

            <TabsContent value="history" className="flex-1 min-h-0">
              <DealHistoryTab deal={deal} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
});
