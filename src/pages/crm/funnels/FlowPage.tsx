import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockFlow } from "@/components/crm/flows/flow_mockup_data";
import {
  Plus,
  Search,
  RefreshCcw,
  Download,
  Upload,
  Filter,
  MoreVertical,
  Building2,
  User,
  Calendar,
  DollarSign,
  Users2,
  Settings,
  Phone,
  Mail
} from "lucide-react";
import { useState } from "react";
import { AddDealDialog } from "@/components/crm/flows/AddDealDialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { DealTags, TagSelect } from "@/components/crm/deals/TagSelect";
import { DealCard } from "@/components/crm/deals/DealCard";

// Tipos auxiliares para o mock
interface MockDeal {
  id: string;
  title: string;
  value?: number;
  company_id?: string;
  person_id?: string;
  stage_id: string;
  position: number;
  created_at: string;
  tags?: string[];
}

interface Filter {
  searchTerm: string;
}

export default function FlowPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [deals, setDeals] = useState(mockFlow.deals);

  // MOCK DATA
  const flow = mockFlow;
  const stages = flow.stages;
  const isLoading = false;
  const isError = false;
  const moveDeal = (dealId: string, destinationStageId: string, newPosition: number) => {
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId
          ? { ...deal, stage_id: destinationStageId, position: newPosition }
          : deal
      )
    );
  };
  const createDeal = (data: Partial<MockDeal>) => {
    const firstStageId = stages[0]?.id || "";
    const newDeal: MockDeal = {
      id: `deal-mock-${Date.now()}`,
      title: data.title || "Novo negócio",
      value: data.value || 0,
      company_id: data.company_id,
      person_id: data.person_id,
      stage_id: data.stage_id || firstStageId,
      position: 1000,
      created_at: new Date().toISOString(),
      tags: [],
    };
    setDeals((prev) => [newDeal, ...prev]);
  };

  // Filtrar e ordenar negócios baseado no termo de busca e posição
  const filteredDeals = deals
    .filter((deal) => deal.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.position - b.position);

  // Calcular valor total do funil
  const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  const handleAddDeal = async (data: {
    title: string;
    company_id?: string;
    person_id?: string;
    value?: number;
  }) => {
    // Adicionar ao primeiro estágio do funil
    const firstStage = stages[0];
    if (!firstStage) return;

    await createDeal({
      ...data,
      stage_id: firstStage.id,
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageId = result.source.droppableId;
    const destinationStageId = result.destination.droppableId;
    const dealId = result.draggableId;

    // Calcular nova posição
    const dealsInDestination = deals
      .filter(deal => deal.stage_id === destinationStageId)
      .sort((a, b) => a.position - b.position);

    // Remover o card que está sendo movido se estiver no mesmo estágio
    const dealsWithoutCurrent = sourceStageId === destinationStageId
      ? dealsInDestination.filter(deal => deal.id !== dealId)
      : dealsInDestination;

    let newPosition: number;

    if (dealsWithoutCurrent.length === 0) {
      // Se não há outros deals no destino, usar posição 1000
      newPosition = 1000;
    } else if (result.destination.index === 0) {
      // Se moveu para o topo, usar posição anterior - 1000
      newPosition = Math.max(0, dealsWithoutCurrent[0].position - 1000);
    } else if (result.destination.index >= dealsWithoutCurrent.length) {
      // Se moveu para o final, usar posição posterior + 1000
      newPosition = dealsWithoutCurrent[dealsWithoutCurrent.length - 1].position + 1000;
    } else {
      // Se moveu para o meio, calcular média entre as posições
      const beforeCard = dealsWithoutCurrent[result.destination.index - 1];
      const afterCard = dealsWithoutCurrent[result.destination.index];
      newPosition = Math.floor((beforeCard.position + afterCard.position) / 2);

      // Se as posições estiverem muito próximas
      if (newPosition === beforeCard.position) {
        newPosition = beforeCard.position + 500;
      }
    }

    // Mover o card para a nova posição
    moveDeal(dealId, destinationStageId, newPosition);
  };

  const handleFilterChange = (filters: Filter) => {
    setSearchTerm(filters.searchTerm);
    // Adicione mais lógica de filtro conforme necessário
  };

  // Função para cor de tag mock
  const tagColor = (tag: string) => {
    if (tag.toLowerCase().includes("whatsapp")) return "bg-green-200 text-green-800";
    if (tag.toLowerCase().includes("instagram")) return "bg-orange-200 text-orange-800";
    if (tag.toLowerCase().includes("live")) return "bg-purple-200 text-purple-800";
    if (tag.toLowerCase().includes("clp")) return "bg-blue-100 text-blue-700";
    return "bg-slate-200 text-slate-700";
  };

  // Estado de carregamento com skeleton melhorado
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b p-6">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
              <div className="flex gap-4 mb-4">
                <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
                <div className="h-10 w-32 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 bg-gray-50">
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-24 bg-gray-200 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (isError) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado.</h2>
            <p className="text-gray-600 mb-4">Não foi possível carregar o funil de vendas.</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-cols-[auto_auto_1fr]">
      <div className="flex flex-col overflow-hidden">
        {/* Header mais compacto e organizado */}
        <header className="bg-white border-b h-[50px] flex items-center px-4">
          <div className="flex-1 flex items-center gap-4">
            {/* Título e Busca na mesma linha */}
            <h1 className="text- font-semibold">{flow?.name || "Flow"}</h1>
            <div className="flex items-center gap-2 max-w-xs">
              <Input
                type="search"
                placeholder="Buscar negócios..."
                className="h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Stats em linha com ícones */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users2 className="h-4 w-4" />
                {filteredDeals.length} negócios
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalValue)}
              </span>
            </div>
          </div>
          {/* Ações alinhadas à direita */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddDealOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setIsAddDealOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar negócio
            </Button>
            {/* Botão de configurações do flow */}
            <div className="ml-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      onClick={() => window.location.href = "/crm/settings/pipeline"}
                    >
                      <Settings className="h-5 w-5 text-slate-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="select-none">
                    <p>Personalizar flows</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <main className="flex-1 overflow-hidden bg-gray-50">
            <div className="h-full flex gap-3 p-3 pb-[12px] overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent text-sm">
              {stages.map((stage) => {
                const stageDeals = filteredDeals.filter((deal) => deal.stage_id === stage.id);
                const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                return (
                  <div key={stage.id} className="flex-shrink-0 bg-[#f0f3fd] rounded-2xl w-60 flex flex-col min-h-0 inline-block align-top">
                    <div className="  px-4 pt-3 pb-2 mb-2 relative">
                      <div className="flex flex-col gap-0.5">
                        <div className="font-semibold text-base text-blue-900">{stage.name}</div>
                        <div className="text-xs text-gray-500">R$ {valorTotalEtapa.toLocaleString("pt-BR")}</div>
                      </div>
                      <span className="absolute top-2 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white text-blue-700 font-bold text-xs shadow-sm border border-blue-100">
                        {stageDeals.length}
                      </span>
                    </div>
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`bg-[#f0f3fd] rounded-2xl p-2 min-h-[120px] transition-colors duration-200 ease-in-out ${snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-200/50' : ''}`}
                        >
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-xl p-2 mb-2 flex flex-col gap-1 transition-all duration-200 ease-in-out transform ${snapshot.isDragging ? 'scale-[1.02] rotate-1 shadow-xl z-50' : ''}`}
                                  style={{ ...provided.draggableProps.style, willChange: 'transform' }}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    {/* Tags */}
                                    {deal.tags?.map(tag => (
                                      <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded font-medium mr-1 ${tagColor(tag)}`}>{tag}</span>
                                    ))}
                                    <div className="ml-auto">
                                      {/* Avatar fake */}
                                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`} className="w-6 h-6 rounded-full object-cover" alt="avatar" />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="font-semibold text-blue-900 text-xs truncate max-w-[90px]">{deal.title}</div>
                                    <div className="font-bold text-blue-700 text-xs">R$ {deal.value?.toLocaleString("pt-BR")}</div>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <User className="w-3 h-3" />
                                    <Phone className="w-3 h-3" />
                                    <Mail className="w-3 h-3" />
                                    <span className="ml-auto">1/12</span>
                                    <span>1h</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {/* Empty State */}
                          {stageDeals.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ">
                                <Plus className="h-5 w-5 text-gray-300" />
                              </div>
                              <p className="text-xs mt-2">Arraste um negócio para esta coluna</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddDealOpen(true)}
                              >
                                ou adicione um novo
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </main>
        </DragDropContext>
      </div>

      <AddDealDialog
        open={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        onAdd={handleAddDeal}
        allowedEntities={flow?.allowed_entities || ["companies", "people", "partners"]}
      />
    </div>
  );
} 
