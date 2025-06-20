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
  Mail,
  Menu
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
import { DealDetailsDialog } from "@/components/crm/deals/DealDetailsDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const [selectedDeal, setSelectedDeal] = useState<MockDeal | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
    if (selectedDeal && selectedDeal.id === dealId) {
      setSelectedDeal((prev) => prev ? { ...prev, stage_id: destinationStageId, position: newPosition } : prev);
    }
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

  const handleStageChange = (stageId: string) => {
    if (!selectedDeal) return;
    // Atualiza a etapa do deal selecionado
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === selectedDeal.id ? { ...deal, stage_id: stageId } : deal
      )
    );
    setSelectedDeal((prev) => prev ? { ...prev, stage_id: stageId } : prev);
  };

  // Estado de carregamento com skeleton melhorado
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 md:h-8 w-32 md:w-48 bg-gray-200 rounded mb-4 md:mb-6" />
              <div className="flex gap-4 mb-4">
                <div className="h-8 md:h-10 w-full max-w-md bg-gray-200 rounded" />
                <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 md:w-24 bg-gray-200 rounded" />
                <div className="h-6 w-24 md:w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-gray-50">
            <div className={`${isMobile ? 'space-y-4' : 'flex gap-4'}`}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`${isMobile ? 'w-full' : 'flex-shrink-0 w-80'}`}>
                  <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-20 md:h-24 bg-gray-200 rounded" />
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
          <div className="text-center p-4">
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

  const MobileMenu = () => (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="py-4">
          <h2 className="font-semibold mb-4">Menu</h2>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setIsAddDealOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar negócio
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.href = "/crm/settings/pipeline"}>
              <Settings className="mr-2 h-4 w-4" />
              Personalizar flows
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header responsivo */}
      <header className="bg-white border-b px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <MobileMenu />

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold truncate">{flow?.name || "Flow"}</h1>
          </div>

          {/* Busca sempre visível mas menor em mobile */}
          <div className="flex-shrink-0 w-32 md:w-64">
            <Input
              type="search"
              placeholder="Buscar..."
              className="h-8 md:h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Estatísticas ocultas em mobile */}
          {!isMobile && (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users2 className="h-4 w-4" />
                {filteredDeals.length}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalValue)}
              </span>
            </div>
          )}

          {/* Ações desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddDealOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={() => setIsAddDealOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9"
                      onClick={() => window.location.href = "/crm/settings/pipeline"}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Personalizar flows</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Estatísticas mobile */}
        {isMobile && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-gray-500">
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
        )}
      </header>

      {/* Main Content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <main className="flex-1 overflow-hidden bg-gray-50">
          {isMobile ? (
            // Layout mobile: vertical scroll
            <div className="h-full overflow-y-auto p-3 space-y-4">
              {stages.map((stage) => {
                const stageDeals = filteredDeals.filter((deal) => deal.stage_id === stage.id);
                const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

                return (
                  <div key={stage.id} className="bg-[#f0f3fd] rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base text-blue-900">{stage.name}</h3>
                        <p className="text-xs text-gray-500">R$ {valorTotalEtapa.toLocaleString("pt-BR")}</p>
                      </div>
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-blue-700 font-bold text-xs">
                        {stageDeals.length}
                      </span>
                    </div>

                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-[60px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                        >
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-xl p-3 transition-all duration-200 ${snapshot.isDragging ? 'scale-[1.02] shadow-xl z-50' : ''}`}
                                  style={{ ...provided.draggableProps.style }}
                                  onClick={() => setSelectedDeal(deal)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-blue-900 text-sm truncate">{deal.title}</h4>
                                      <p className="font-bold text-blue-700 text-xs">R$ {deal.value?.toLocaleString("pt-BR")}</p>
                                    </div>
                                    <img
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`}
                                      className="w-6 h-6 rounded-full object-cover ml-2"
                                      alt="avatar"
                                    />
                                  </div>

                                  {/* Tags mobile */}
                                  {deal.tags && deal.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {deal.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColor(tag)}`}>
                                          {tag}
                                        </span>
                                      ))}
                                      {deal.tags.length > 2 && (
                                        <span className="text-xs text-gray-400">+{deal.tags.length - 2}</span>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <User className="w-3 h-3" />
                                    <Phone className="w-3 h-3" />
                                    <Mail className="w-3 h-3" />
                                    <span className="ml-auto">1h</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {/* Empty State */}
                          {stageDeals.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                <Plus className="h-4 w-4 text-gray-300" />
                              </div>
                              <p className="text-xs">Nenhum negócio</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          ) : (
            // Layout desktop: horizontal tradicional
            <div className="h-full flex gap-3 p-3 overflow-x-auto">
              {stages.map((stage) => {
                const stageDeals = filteredDeals.filter((deal) => deal.stage_id === stage.id);
                const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

                return (
                  <div key={stage.id} className="flex-shrink-0 bg-[#f0f3fd] rounded-2xl w-60 flex flex-col">
                    <div className="px-4 pt-3 pb-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-base text-blue-900">{stage.name}</h3>
                          <p className="text-xs text-gray-500">R$ {valorTotalEtapa.toLocaleString("pt-BR")}</p>
                        </div>
                        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-blue-700 font-bold text-xs">
                          {stageDeals.length}
                        </span>
                      </div>
                    </div>

                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-2 min-h-[120px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                        >
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-xl p-2 mb-2 transition-all duration-200 ${snapshot.isDragging ? 'scale-[1.02] rotate-1 shadow-xl z-50' : ''}`}
                                  style={{ ...provided.draggableProps.style }}
                                  onClick={() => setSelectedDeal(deal)}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    {deal.tags?.map(tag => (
                                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tagColor(tag)}`}>
                                        {tag}
                                      </span>
                                    ))}
                                    <div className="ml-auto">
                                      <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`}
                                        className="w-6 h-6 rounded-full object-cover"
                                        alt="avatar"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-blue-900 text-xs truncate">{deal.title}</h4>
                                    <p className="font-bold text-blue-700 text-xs">R$ {deal.value?.toLocaleString("pt-BR")}</p>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <User className="w-3 h-3" />
                                    <Phone className="w-3 h-3" />
                                    <Mail className="w-3 h-3" />
                                    <span className="ml-auto">1h</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {/* Empty State */}
                          {stageDeals.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-gray-300" />
                              </div>
                              <p className="text-xs mt-2 text-center">Arraste um negócio para esta coluna</p>
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
          )}
        </main>
      </DragDropContext>

      {/* Botão flutuante mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={() => setIsAddDealOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}

      <AddDealDialog
        open={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        onAdd={handleAddDeal}
        allowedEntities={flow?.allowed_entities || ["companies", "people", "partners"]}
      />

      <DealDetailsDialog
        open={!!selectedDeal}
        deal={selectedDeal}
        stages={stages}
        onClose={() => setSelectedDeal(null)}
        onStageChange={handleStageChange}
      />
    </div>
  );
} 
