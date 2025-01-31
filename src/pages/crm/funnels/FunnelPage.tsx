import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFunnel } from "@/hooks/useFunnel";
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
  DollarSign
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
import { FunnelSidebar } from "@/components/crm/funnels/FunnelSidebar";
import { FunnelFilters } from "@/components/crm/funnels/FunnelFilters";

export default function FunnelPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const { funnel, stages = [], deals = [], moveDeal, createDeal, isLoading, isError } = useFunnel();

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

    // Remover o card que está sendo movido da lista de destino
    // para calcular corretamente a nova posição
    const dealsWithoutCurrent = dealsInDestination.filter(deal => deal.id !== dealId);

    let newPosition: number;

    if (dealsWithoutCurrent.length === 0) {
      // Se não há outros deals no destino, começar com posição 10000
      newPosition = 10000;
    } else if (result.destination.index === 0) {
      // Se moveu para o topo, posição = menor posição atual - 10000
      newPosition = dealsWithoutCurrent[0].position - 10000;
    } else if (result.destination.index >= dealsWithoutCurrent.length) {
      // Se moveu para o final, posição = maior posição atual + 10000
      newPosition = dealsWithoutCurrent[dealsWithoutCurrent.length - 1].position + 10000;
    } else {
      // Se moveu para o meio, pegar os cards antes e depois
      const beforeCard = dealsWithoutCurrent[result.destination.index - 1];
      const afterCard = dealsWithoutCurrent[result.destination.index];
      
      // Calcular posição como ponto médio, arredondando para inteiro
      newPosition = Math.floor(beforeCard.position + (afterCard.position - beforeCard.position) / 2);
      
      // Se as posições estiverem muito próximas, reordenar todos os cards
      if (newPosition === beforeCard.position) {
        // Reordenar cards com intervalos de 10000
        dealsWithoutCurrent.forEach((deal, index) => {
          const position = (index + 1) * 10000;
          if (deal.position !== position) {
            moveDeal(deal.id, destinationStageId, position);
          }
        });
        // Definir nova posição após reordenação
        newPosition = (result.destination.index + 1) * 10000;
      }
    }

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
        <FunnelSidebar />
        <FunnelFilters onFilterChange={handleFilterChange} />
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
        <FunnelSidebar />
        <FunnelFilters onFilterChange={handleFilterChange} />
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
    <div className="flex h-screen">
      <FunnelSidebar />
      <FunnelFilters onFilterChange={handleFilterChange} />
      <div className="flex-1 flex flex-col">
        {/* Header com mais informações e ações */}
        <header className="bg-white border-b p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-1">{funnel?.name || "Funil de Vendas"}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{filteredDeals.length} negócios</span>
                <span>•</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalValue)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setIsAddDealOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar negócio
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content com design melhorado */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <main className="flex-1 overflow-x-auto p-6 bg-gray-50">
            <div className="flex gap-6 h-full">
              {stages.map((stage) => (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  {/* Stage Header com mais informações */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">{stage.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{filteredDeals.filter((deal) => deal.stage_id === stage.id).length} negócios</span>
                        <span>•</span>
                        <span>
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
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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

                  {/* Stage Content com cards melhorados */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] p-3 rounded-lg bg-gray-100 transition-colors ${
                          snapshot.isDraggingOver ? "bg-blue-50 ring-2 ring-blue-200" : ""
                        }`}
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
                                  className={`${
                                    snapshot.isDragging
                                      ? "shadow-lg ring-2 ring-blue-500 bg-white rotate-3 scale-105"
                                      : ""
                                  }`}
                                >
                                  <DealCard deal={deal} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        
                        {/* Empty State mais atraente */}
                        {filteredDeals.filter((deal) => deal.stage_id === stage.id).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
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
        allowedEntities={funnel?.allowed_entities || ["companies", "people", "partners"]}
      />
    </div>
  );
} 
