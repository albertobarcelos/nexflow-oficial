import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Feed } from "@/components/ui/feed";
import { 
  CheckCircle2,
  Clock,
  Building2,
  UserCircle2,
  HandshakeIcon,
  FileText,
  History,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePeopleAndPartners } from "@/hooks/usePeopleAndPartners";
import { DealPartnerTab } from "@/components/crm/deals/DealPartnerTab";
import { DealPeopleTab } from "@/components/crm/deals/DealPeopleTab";
import { DealHistoryTab } from "@/components/crm/deals/DealHistoryTab";
import { DealTasksTab } from "@/components/crm/deals/DealTasksTab";
import { DealCompanyTab } from "@/components/crm/deals/DealCompanyTab";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFunnel } from "@/hooks/useFunnel";

interface DealDialogProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
}

export function DealDialog({ deal, isOpen, onClose, mode }: DealDialogProps) {
  const [activeTab, setActiveTab] = useState("tasks");
  const { tasks, history, isLoadingTasks, isLoadingHistory } = usePeopleAndPartners(deal.id);
  const { updateDealPartner } = useFunnel();
  const pendingTasks = tasks?.filter(task => !task.completed) || [];
  const [selectedPartner, setSelectedPartner] = useState(deal.partner || null);

  // Função para atualizar o parceiro
  const handlePartnerChange = async (partner: any) => {
    try {
      setSelectedPartner(partner);
      await updateDealPartner.mutateAsync({
        dealId: deal.id,
        partnerId: partner?.id || null
      });
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error);
      setSelectedPartner(deal.partner || null); // Reverter em caso de erro
    }
  };

  // Determinar quais abas mostrar baseado no tipo de entidade
  const getTabs = () => {
    const baseTabs = [
      { id: "tasks", label: "Tarefas", icon: Clock, count: pendingTasks.length },
      { id: "company", label: "Empresa", icon: Building2 },
      { id: "people", label: "Pessoas", icon: UserCircle2 },
      { id: "partner", label: "Parceiro", icon: HandshakeIcon },
      { id: "details", label: "Detalhes", icon: FileText },
      { id: "history", label: "Histórico", icon: History }
    ];

    return baseTabs;
  };

  const tabs = getTabs();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold">{deal.title}</span>
              <Badge variant="outline" className="text-primary border-primary">
                R$ {new Intl.NumberFormat('pt-BR').format(deal.value)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tasks" className="h-full" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b">
            <ScrollArea className="w-full" orientation="horizontal">
              <TabsList className="h-12 px-6">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="h-11 px-4 flex items-center gap-2"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {tab.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          <ScrollArea className="h-[calc(90vh-8rem)]">
            <TabsContent value="tasks">
              <DealTasksTab dealId={deal.id} mode={mode} />
            </TabsContent>

            <TabsContent value="company">
              <DealCompanyTab dealId={deal.id} mode={mode} />
            </TabsContent>

            <TabsContent value="people">
              <DealPeopleTab dealId={deal.id} mode={mode} />
            </TabsContent>

            <TabsContent value="partner">
              <DealPartnerTab 
                selectedPartner={selectedPartner} 
                onSelectPartner={handlePartnerChange} 
              />
            </TabsContent>

            <TabsContent value="details" className="p-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os detalhes desta oportunidade..."
                    value={deal.description || ""}
                    readOnly={mode === "view"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {deal.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="history">
              <div className="p-6">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <Feed
                    items={(history || []).map((event: any) => ({
                      id: event.id,
                      title: event.description,
                      timestamp: format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
                      icon: event.type === "task_completed" ? CheckCircle2 : 
                            event.type === "task_overdue" ? AlertCircle :
                            event.type === "task_created" ? Clock :
                            History,
                      iconColor: event.type === "task_completed" ? "text-green-500" :
                                event.type === "task_overdue" ? "text-red-500" :
                                event.type === "task_created" ? "text-blue-500" :
                                "text-gray-500",
                      description: event.details ? JSON.stringify(event.details, null, 2) : undefined,
                      user: {
                        name: event.user?.name || "Sistema",
                        avatar: event.user?.avatar_url
                      }
                    }))}
                  />
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
