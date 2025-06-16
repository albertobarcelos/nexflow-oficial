import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFlow } from "@/hooks/useFlow";
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
  Users2
} from "lucide-react";
import { useState } from "react";
import { AddDealDialog } from "@/components/crm/funnels/AddDealDialog";
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
import { FlowSidebar } from "@/components/crm/funnels/FlowSidebar";
import { FlowFilters } from "@/components/crm/funnels/FlowFilters";

export default function FlowPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const { flow, stages = [], deals = [], moveDeal, createDeal, isLoading, isError } = useFlow();

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

  const handleFilterChange = (filters: any) => {
    setSearchTerm(filters.searchTerm);
    // Adicione mais lógica de filtro conforme necessário
  };

  // Estado de carregamento com skeleton melhorado
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <FlowSidebar />
        <FlowFilters onFilterChange={handleFilterChange} />
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
        <FlowSidebar />
        <FlowFilters onFilterChange={handleFilterChange} />
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
      <FlowSidebar />
      <FlowFilters onFilterChange={handleFilterChange} />
      
      <div className="flex flex-col overflow-hidden">
        {/* Header mais compacto e organizado */}
        <header className="bg-white border-b h-[60px] flex items-center px-4">
          <div className="flex-1 flex items-center gap-4">
            {/* Título e Busca na mesma linha */}
            <h1 className="text-xl font-semibold">{flow?.name || "Flow"}</h1>
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
          </div>
        </header>

        {/* Main Content */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <main className="flex-1 overflow-hidden bg-gray-50">
            <div className="h-full flex gap-2 p-4 pb-[25px]">
              {stages.map((stage) => (
                <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col min-h-0">
                  {/* Stage Header com borda mais definida */}
                  <div className="h-[45px] mb-2 bg-white rounded-md border border-[#DCDFE5] shadow-sm flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-700">{stage.name}</h3>
                      <span className="text-sm text-gray-500">
                        {filteredDeals.filter((deal) => deal.stage_id === stage.id).length} negócios
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(
                          filteredDeals
                            .filter((deal) => deal.stage_id === stage.id)
                            .reduce((sum, deal) => sum + (deal.value || 0), 0)
                        )}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Editar estágio</DropdownMenuItem>
                        <DropdownMenuItem>Mover para esquerda</DropdownMenuItem>
                        <DropdownMenuItem>Mover para direita</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stage Content com borda mais definida */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          flex-1 min-h-0 overflow-y-auto
                          space-y-3 p-3 rounded-lg
                          border border-[#DCDFE5]
                          transition-colors duration-200 ease-in-out
                          ${snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-200/50' : 'bg-gray-100'}
                        `}
                      >
                        {filteredDeals
                          .filter((deal) => deal.stage_id === stage.id)
                          .map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`
                                    transition-all duration-200 ease-in-out transform
                                    ${snapshot.isDragging ? 'scale-[1.02] rotate-1 shadow-xl z-50' : ''}
                                  `}
                                  style={{
                                    ...provided.draggableProps.style,
                                    willChange: 'transform'
                                  }}
                                >
                                  <DealCard deal={deal} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        
                        {/* Empty State */}
                        {filteredDeals.filter((deal) => deal.stage_id === stage.id).length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                              <Plus className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm">Arraste um negócio para esta coluna</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
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
              ))}
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
