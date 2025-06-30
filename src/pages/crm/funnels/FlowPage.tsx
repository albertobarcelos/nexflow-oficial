import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  RefreshCcw,
  Download,
  Settings,
  Menu,
  LayoutGrid,
  List,
  TrendingUp,
  Target
} from "lucide-react";
import { useState, useEffect } from "react";
import { AddDealDialog } from "@/components/crm/flows/AddDealDialog";
import { DropResult } from "@hello-pangea/dnd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { DealViewDialog } from "@/components/crm/deals/DealViewDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ListView } from "@/components/crm/flows/ListView";
import { KanbanView } from "@/components/crm/flows/KanbanView";
import { MockDeal } from "@/components/crm/flows/types";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, WebDeal, WebDealInsert } from "@/lib/supabase";

interface Filter {
  searchTerm: string;
}

type ViewMode = 'kanban' | 'list';

// Tipos para os dados do BD
type FlowData = {
  id: string;
  name: string;
};

type StageData = {
  id: string;
  name: string;
  order_index: number;
};

// Função para buscar os detalhes de um Flow
const getFlowDetails = async (flowId: string): Promise<FlowData> => {
  console.log('🔍 Buscando detalhes do flow:', flowId);
  
  // Primeiro busca o client_id do usuário
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: clientUser, error: clientUserError } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .maybeSingle();

  if (clientUserError) throw new Error('Erro ao verificar permissões');
  if (!clientUser) throw new Error('Usuário sem permissões');

  // Busca o flow garantindo que pertence ao cliente do usuário
  const { data, error } = await supabase
    .from('web_flows')
    .select('id, name, client_id')
    .eq('id', flowId)
    .eq('client_id', clientUser.client_id)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar flow:', error);
    throw new Error(error.message);
  }

  if (!data) {
    console.error('❌ Flow não encontrado ou sem permissão');
    throw new Error('Flow não encontrado ou sem permissão');
  }

  console.log('✅ Flow encontrado:', data);
  return data;
};

// Função para buscar as etapas de um Flow
const getFlowStages = async (flowId: string): Promise<StageData[]> => {
  console.log('🔍 Buscando etapas do flow:', flowId);
  const { data, error } = await supabase
    .from('web_flow_stages')
    .select('id, name, order_index')
    .eq('flow_id', flowId)
    .order('order_index');
  if (error) {
    console.error('❌ Erro ao buscar etapas:', error);
    throw new Error(error.message);
  }
  console.log('✅ Etapas encontradas:', data);
  return data;
};

// Função para buscar os deals de um Flow (SIMPLIFICADA)
const getDealsByFlow = async (flowId: string): Promise<WebDeal[]> => {
  console.log('🔍 Buscando deals do flow (simplificado):', flowId);
  const { data, error } = await supabase
    .from('web_deals')
    .select('*') // Apenas os dados da própria tabela
    .eq('flow_id', flowId);
  if (error) {
    console.error('❌ Erro ao buscar deals:', error);
    throw new Error(error.message);
  }
  console.log('✅ Deals base encontrados:', data);
  return data || [];
};

export default function FlowPage() {
  const { id: flowId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<WebDeal | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Verificação de acesso do usuário
  useEffect(() => {
    const checkUserAccess = async () => {
      console.log('🔐 Verificando acesso do usuário...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        return;
      }
      console.log('👤 Usuário autenticado:', user.id);
      
      // Primeiro verifica se o usuário tem associação direta
      const { data: clientUser, error: clientUserError } = await supabase
        .from('core_client_users')
        .select('client_id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (clientUserError) {
        console.error('❌ Erro ao verificar associação do usuário:', clientUserError);
        return;
      }

      if (!clientUser) {
        console.log('⚠️ Usuário sem associação direta, verificando outras permissões...');
        
        // Aqui você pode adicionar outras verificações de permissão se necessário
        // Por exemplo, verificar se o usuário é admin, etc.
        
        return;
      }

      console.log('✅ Associação do usuário encontrada:', {
        clientId: clientUser.client_id,
        role: clientUser.role
      });
    };
    
    checkUserAccess();
  }, []);

  // Verificação do flow
  useEffect(() => {
    if (!flowId) return;
    
    const checkFlow = async () => {
      console.log('🔍 Verificando existência do flow:', flowId);
      
      const { data, error } = await supabase
        .from('web_flows')
        .select('id, client_id, name')
        .eq('id', flowId)
        .single();
        
      if (error) {
        console.error('❌ Erro ao verificar flow:', error);
      } else {
        console.log('✅ Flow verificado:', data);
      }
    };
    
    checkFlow();
  }, [flowId]);

  // Buscar detalhes do Flow
  const { data: flow, isLoading: isLoadingFlow, isError: isErrorFlow } = useQuery<FlowData>({
    queryKey: ['flow', flowId],
    queryFn: () => getFlowDetails(flowId!),
    enabled: !!flowId,
  });

  // Buscar etapas do Flow
  const { data: stages, isLoading: isLoadingStages, isError: isErrorStages } = useQuery<StageData[]>({
    queryKey: ['flowStages', flowId],
    queryFn: () => getFlowStages(flowId!),
    enabled: !!flowId,
  });

  const { data: deals, isLoading: isLoadingDeals, isError: isErrorDeals } = useQuery<WebDeal[]>({
    queryKey: ['deals', flowId],
    queryFn: async () => {
      if (!flowId) return [];

      // 1. Busca os deals
      const baseDeals = await getDealsByFlow(flowId);

      // 2. Coleta os IDs para enriquecimento
      const companyIds = [...new Set(baseDeals.map(d => d.company_id).filter(Boolean))];
      const personIds = [...new Set(baseDeals.map(d => d.person_id).filter(Boolean))];

      if (companyIds.length === 0 && personIds.length === 0) {
        return baseDeals;
      }
      
      // 3. Busca os dados de enriquecimento em paralelo
      const [companiesRes, peopleRes] = await Promise.all([
        companyIds.length > 0 ? supabase.from('web_companies').select('id, name').in('id', companyIds) : Promise.resolve({ data: [], error: null }),
        personIds.length > 0 ? supabase.from('web_people').select('id, name').in('id', personIds) : Promise.resolve({ data: [], error: null })
      ]);

      if (companiesRes.error) console.error("Erro ao buscar empresas:", companiesRes.error);
      if (peopleRes.error) console.error("Erro ao buscar pessoas:", peopleRes.error);

      const companiesMap = new Map(companiesRes.data?.map(c => [c.id, c.name]));
      const peopleMap = new Map(peopleRes.data?.map(p => [p.id, p.name]));
      
      // 4. Mapeia os dados de volta para os deals
      const enrichedDeals = baseDeals.map(deal => ({
        ...deal,
        // Adiciona os objetos aninhados que o resto do componente espera
        companies: deal.company_id ? { name: companiesMap.get(deal.company_id) || 'N/A' } : null,
        people: deal.person_id ? { name: peopleMap.get(deal.person_id) || 'N/A' } : null,
      }));

      console.log('✅ Deals enriquecidos:', enrichedDeals);
      return enrichedDeals;
    },
    enabled: !!flowId,
  });

  const createDealMutation = useMutation({
    mutationFn: (newDeal: WebDealInsert) => supabase.from('web_deals').insert(newDeal).select().single(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', flowId] });
      setIsAddDealOpen(false);
    },
  });

  const updateDealStageMutation = useMutation({
    mutationFn: ({ dealId, stageId, position }: { dealId: string; stageId: string; position: number }) =>
      supabase.from('web_deals').update({ stage_id: stageId, position }).eq('id', dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', flowId] });
    },
  });

  const isLoading = isLoadingFlow || isLoadingStages || isLoadingDeals;
  const isError = isErrorFlow || isErrorStages || isErrorDeals;

  const filteredDeals = (deals || [])
    .filter((deal) => deal.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  const handleAddDeal = (data: Partial<WebDealInsert>) => {
    const firstStage = stages?.[0];
    if (!firstStage || !flowId) return;

    createDealMutation.mutate({
      ...data,
      flow_id: flowId,
      stage_id: firstStage.id,
    });
  };

  const handleAddDealToStage = (stageId: string) => {
    console.log(`Abrindo modal para adicionar deal no estágio: ${stageId}`);
    setIsAddDealOpen(true);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !deals) return;

    const { source, destination, draggableId } = result;
    const destinationStageId = destination.droppableId;
    
    // Lógica para calcular a nova posição
    const dealsInDestination = deals
      .filter(deal => deal.stage_id === destinationStageId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
      
    const dealsWithoutCurrent = source.droppableId === destinationStageId
      ? dealsInDestination.filter(d => d.id !== draggableId)
      : dealsInDestination;
      
    let newPosition: number;
    if (dealsWithoutCurrent.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = (dealsWithoutCurrent[0].position || 1000) - 500;
    } else if (destination.index >= dealsWithoutCurrent.length) {
      newPosition = (dealsWithoutCurrent[dealsWithoutCurrent.length - 1].position || 0) + 1000;
    } else {
      const before = dealsWithoutCurrent[destination.index - 1];
      const after = dealsWithoutCurrent[destination.index];
      newPosition = Math.floor(((before.position || 0) + (after.position || 0)) / 2);
    }

    updateDealStageMutation.mutate({ dealId: draggableId, stageId: destinationStageId, position: newPosition });
  };
  
  const handleStageChange = (stageId: string) => {
    if (!selectedDeal) return;
    updateDealStageMutation.mutate(
      { dealId: selectedDeal.id, stageId, position: selectedDeal.position || 999999 },
      {
        onSuccess: () => setSelectedDeal(prev => prev ? { ...prev, stage_id: stageId } : null)
      }
    );
  };

  // Função para cor de tag melhorada
  const tagColor = (tag: string) => {
    if (tag.toLowerCase().includes("whatsapp")) return "bg-emerald-100 text-emerald-800";
    if (tag.toLowerCase().includes("instagram")) return "bg-pink-100 text-pink-800";
    if (tag.toLowerCase().includes("live")) return "bg-violet-100 text-violet-800";
    if (tag.toLowerCase().includes("clp")) return "bg-blue-100 text-blue-800";
    if (tag.toLowerCase().includes("urgente")) return "bg-red-100 text-red-800";
    if (tag.toLowerCase().includes("vip")) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
  };

  // Função para tags de temperatura/status
  const getTemperatureTag = (temperature?: string) => {
    switch (temperature) {
      case 'hot': return { label: 'Quente', color: 'bg-red-100 text-red-700 ' };
      case 'warm': return { label: 'Morno', color: 'bg-orange-100 text-orange-700 ' };
      case 'cold': return { label: 'Frio', color: 'bg-blue-100 text-blue-700 border border-blue-20' };
      default: return { label: 'Novo', color: 'bg-gray-100 text-gray-700 ' };
    }
  };

  // Função para cores dos stages
  const getStageColors = (index: number) => {
    const colors = [
      { bg: 'from-blue-50/80 to-blue-100/60', border: 'border-blue-200/50', accent: 'from-blue-500 to-blue-600' },
      { bg: 'from-emerald-50/80 to-emerald-100/60', border: 'border-emerald-200/50', accent: 'from-emerald-500 to-emerald-600' },
      { bg: 'from-amber-50/80 to-amber-100/60', border: 'border-amber-200/50', accent: 'from-amber-500 to-amber-600' },
      { bg: 'from-purple-50/80 to-purple-100/60', border: 'border-purple-200/50', accent: 'from-purple-500 to-purple-600' },
      { bg: 'from-pink-50/80 to-pink-100/60', border: 'border-pink-200/50', accent: 'from-pink-500 to-pink-600' },
      { bg: 'from-indigo-50/80 to-indigo-100/60', border: 'border-indigo-200/50', accent: 'from-indigo-500 to-indigo-600' },
      { bg: 'from-teal-50/80 to-teal-100/60', border: 'border-teal-200/50', accent: 'from-teal-500 to-teal-600' },
      { bg: 'from-rose-50/80 to-rose-100/60', border: 'border-rose-200/50', accent: 'from-rose-500 to-rose-600' },
    ];
    return colors[index % colors.length];
  };

  // Estado de carregamento com skeleton melhorado
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b p-3 md:p-4">
            <div className="animate-pulse">
              <div className="h-5 md:h-6 w-32 md:w-48 bg-gray-200 rounded mb-3 md:mb-4" />
              <div className="flex gap-3 mb-3">
                <div className="h-7 md:h-8 w-full max-w-md bg-gray-200 rounded" />
                <div className="h-7 md:h-8 w-20 md:w-24 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 md:w-20 bg-gray-200 rounded" />
                <div className="h-5 w-20 md:w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-4 bg-gray-50">
            <div className={`${isMobile ? 'space-y-3' : 'flex gap-3'}`}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`${isMobile ? 'w-full' : 'flex-shrink-0 w-80'}`}>
                  <div className="h-5 w-28 bg-gray-200 rounded mb-2" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-16 md:h-18 bg-gray-200 rounded" />
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
            <h2 className="text-lg font-semibold mb-2">Ops! Algo deu errado.</h2>
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
        <Button variant="ghost" size="icon" className="md:hidden h-7 w-7">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="py-4">
          <h2 className="font-semibold mb-4 text-sm">Menu</h2>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => { setIsAddDealOpen(true); setIsMenuOpen(false); }}>
              <Plus className="mr-2 h-3 w-3" />
              Adicionar negócio
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm h-8">
              <Download className="mr-2 h-3 w-3" />
              Exportar
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => { window.location.href = "/crm/settings/pipeline"; setIsMenuOpen(false); }}>
              <Settings className="mr-2 h-3 w-3" />
              Personalizar flows
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header ultra compacto */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-3 py-1.5 md:px-4 md:py-2 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <MobileMenu />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-800 truncate">{flow?.name || "Pipeline"}</h1>
              <div className={`w-1 h-1 rounded-full ${totalValue > 100000 ? 'bg-emerald-500' : totalValue > 50000 ? 'bg-amber-500' : 'bg-slate-400'} animate-pulse`} />
            </div>
          </div>

          {/* Seletor de visualização ultra compacto */}
          <div className="flex items-center bg-slate-100 rounded p-0.5">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-1.5 text-xs ${viewMode === 'kanban' ? 'bg-blue-900 shadow-sm' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-3 w-3 mr-0.5" />
              {!isMobile && 'Board'}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-1.5 text-xs ${viewMode === 'list' ? 'bg-blue-900 shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3 w-3 mr-0.5" />
              {!isMobile && 'Lista'}
            </Button>
          </div>

          {/* Busca ultra compacta */}
          <div className="flex-shrink-0 w-24 md:w-48">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="h-6 text-xs pl-6 bg-white/60 border-slate-200 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Estatísticas ultra compactas - ocultas em mobile */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <div className="bg-white/60 rounded px-2 py-0.5 border border-slate-200/60">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="flex items-center gap-0.5 text-slate-600">
                    <Target className="h-2.5 w-2.5 text-blue-500" />
                    <span className="font-medium">{filteredDeals.length}</span>
                  </div>
                  <div className="text-slate-300">|</div>
                  <div className="flex items-center gap-0.5 text-slate-600">
                    <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                    <span className="font-bold text-emerald-700 text-xs">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações desktop ultra compactas */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 px-1.5 text-xs bg-white/60 border-slate-200 hover:bg-white">
                <Download className="h-2.5 w-2.5 mr-0.5" />
                Export
              </Button>
              <Button size="sm" className="h-6 px-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm" onClick={() => setIsAddDealOpen(true)}>
                <Plus className="h-2.5 w-2.5 mr-0.5" />
                Novo
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 hover:bg-white/60"
                      onClick={() => window.location.href = "/crm/settings/pipeline"}
                    >
                      <Settings className="h-2.5 w-2.5 text-slate-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Configurar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Estatísticas mobile ultra compactas */}
        {isMobile && (
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-xs text-slate-600">
                <Target className="h-2.5 w-2.5 text-blue-500" />
                <span className="font-medium">{filteredDeals.length}</span>
              </div>
              <div className="flex items-center gap-0.5 text-xs text-slate-600">
                <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                <span className="font-bold text-emerald-700">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(totalValue)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="h-5 px-1"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-5 px-1"
                onClick={() => setViewMode('list')}
              >
                <List className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Visualização Lista */}
        {viewMode === 'list' && (
          <ListView
            deals={filteredDeals}
            stages={stages || []}
            onDealClick={setSelectedDeal}
            onAddDeal={() => setIsAddDealOpen(true)}
            getTemperatureTag={getTemperatureTag}
          />
        )}

        {/* Visualização Kanban */}
        {viewMode === 'kanban' && (
          <KanbanView
            deals={filteredDeals}
            stages={stages || []}
            isMobile={isMobile}
            onDragEnd={handleDragEnd}
            onDealClick={setSelectedDeal}
            onAddDeal={() => setIsAddDealOpen(true)}
            onAddDealToStage={handleAddDealToStage}
            getTemperatureTag={getTemperatureTag}
            getStageColors={getStageColors}
            tagColor={tagColor}
          />
        )}
      </main>

      {/* Botão flutuante mobile */}
      {isMobile && (
        <div className="fixed bottom-3 right-3 z-50">
          <Button
            size="sm"
            className="rounded-full shadow-lg h-8 w-8 p-0"
            onClick={() => setIsAddDealOpen(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      <AddDealDialog
        open={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        onAdd={handleAddDeal}
        allowedEntities={stages?.map(stage => stage.name) || []}
      />

      <DealViewDialog
        open={!!selectedDeal}
        deal={selectedDeal}
        stages={stages || []}
        onClose={() => setSelectedDeal(null)}
        onStageChange={handleStageChange}
      />
    </div>
  );
} 
