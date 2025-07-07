import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  RefreshCcw,
  Settings,
  Menu,
  LayoutGrid,
  List,
  TrendingUp,
  Target,
  Filter,
  Calendar,
  X
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AddDealDialog } from "@/components/crm/flows/AddDealDialog";
import { DealViewDialog } from "@/components/crm/deals/DealViewDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ListView } from "@/components/crm/flows/ListView";
import { KanbanView } from "@/components/crm/flows/KanbanView";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, WebDeal, WebDealInsert } from "@/lib/supabase";
import { useVirtualPagination } from "@/hooks/useVirtualPagination";
import { DragEndEvent } from "@dnd-kit/core";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPortal } from "react-dom";
import { FormBuilderModal } from "@/components/crm/flows/FormBuilderModal";

interface Filter {
  searchTerm: string;
  dateFilter: DateFilter;
}

// 🚀 NOVOS TIPOS: Filtros de data para vendas
interface DateFilter {
  type: 'created_at' | 'updated_at' | 'last_activity' | 'expected_close_date' | 'closed_at';
  range: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'last_90_days';
  startDate?: Date;
  endDate?: Date;
}

// 🚀 FUNÇÃO PARA ADICIONAR ESTILOS CSS GLOBAIS PARA Z-INDEX DOS DROPDOWNS
const addGlobalSelectStyles = () => {
  if (typeof document === 'undefined') return;
  
  const existingStyle = document.getElementById('select-dropdown-zindex');
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = 'select-dropdown-zindex';
  style.innerHTML = `
    /* Força z-index alto para dropdowns do Radix UI */
    [data-radix-portal] {
      z-index: 999999 !important;
    }
    
    [data-radix-popper-content-wrapper] {
      z-index: 999999 !important;
    }
    
    .select-dropdown-content {
      z-index: 999999 !important;
    }
    
    /* Força z-index para todos os portals do Radix */
    [data-radix-select-content] {
      z-index: 999999 !important;
    }
  `;
  
  document.head.appendChild(style);
};

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
  if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Buscando detalhes do flow:', flowId);
  }
  
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

  if (process.env.NODE_ENV === 'development') {
  console.log('✅ Flow encontrado:', data);
  }
  return data;
};

// Função para buscar as etapas de um Flow
const getFlowStages = async (flowId: string): Promise<StageData[]> => {
  if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Buscando etapas do flow:', flowId);
  }
  const { data, error } = await supabase
    .from('web_flow_stages')
    .select('id, name, order_index')
    .eq('flow_id', flowId)
    .order('order_index');
  if (error) {
    console.error('❌ Erro ao buscar etapas:', error);
    throw new Error(error.message);
  }
  if (process.env.NODE_ENV === 'development') {
  console.log('✅ Etapas encontradas:', data);
  }
  return data;
};

// Função para contar deals por stage no banco
const getDealsCountByStage = async (flowId: string, stageId: string): Promise<number> => {
  console.log('🔢 Contando deals por stage:', { flowId, stageId });
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Usuário não autenticado para contagem por stage');
    return 0;
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    console.error('❌ Usuário sem cliente associado para contagem por stage');
    return 0;
  }

  // Consulta para contar deals por stage
  const { count, error } = await supabase
    .from('web_deals')
    .select('*', { count: 'exact', head: true })
    .eq('flow_id', flowId)
    .eq('stage_id', stageId)
    .eq('client_id', clientUser.client_id); // 🔐 FILTRO EXPLÍCITO DE SEGURANÇA

  if (error) {
    console.error('❌ Erro ao contar deals por stage:', error);
    return 0;
  }

  console.log(`✅ Total de deals no stage ${stageId}: ${count}`);
  return count || 0;
};

// Função para contar o total real de deals no banco
const getTotalDealsCount = async (flowId: string): Promise<number> => {
  console.log('🔢 Contando total de deals no banco para flow:', flowId);
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Usuário não autenticado para contagem');
    return 0;
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    console.error('❌ Usuário sem cliente associado para contagem');
    return 0;
  }

  // Consulta para contar o total real de deals no banco
  const { count, error } = await supabase
    .from('web_deals')
    .select('*', { count: 'exact', head: true })
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id); // 🔐 FILTRO EXPLÍCITO DE SEGURANÇA

  if (error) {
    console.error('❌ Erro ao contar deals:', error);
    return 0;
  }

  console.log(`✅ Total de deals no banco: ${count}`);
  return count || 0;
};

// 🚀 FUNÇÃO SIMPLIFICADA: Buscar deals com paginação simples
const getDealsByFlow = async (
  flowId: string, 
  { page, limit }: { page: number; limit: number }
): Promise<WebDeal[]> => {
  if (process.env.NODE_ENV === 'development') {
  console.log(`🔍 Buscando deals simples (página ${page}, limite ${limit})`);
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  const offset = page * limit;
  
  // 🚀 QUERY SIMPLES: Apenas os campos essenciais
  const { data: deals, error } = await supabase
    .from('web_deals')
    .select(`
      id,
      title,
      value,
      stage_id,
      position,
      temperature,
      tags,
      created_at,
      last_activity,
      probability,
      responsible_id,
      responsible_name,
      flow_id,
      client_id,
      companies:company_id(id, name),
      people:person_id(id, name)
    `)
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Erro ao buscar deals:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
  console.log(`✅ ${deals?.length || 0} deals carregados`);
  }
  return deals || [];
};

// NOVA FUNÇÃO: Buscar deals de um stage específico
const getDealsByStage = async (
  flowId: string,
  stageId: string,
  { page, limit }: { page: number; limit: number }
): Promise<WebDeal[]> => {
  return getDealsByFlow(flowId, { page, limit });
};

// 🚀 NOVA FUNÇÃO OTIMIZADA: Buscar contagem real de deals por etapa (SEMPRE DO BANCO)
const getStageDealsCount = async (
  flowId: string, 
  dateFilter?: DateFilter
): Promise<Record<string, number>> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔢 Buscando contagem REAL de deals por etapa (sempre do banco):', flowId);
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  // 🚀 PRIMEIRA QUERY: Buscar todas as etapas do flow
  const { data: stages, error: stagesError } = await supabase
    .from('web_flow_stages')
    .select('id, name, order_index')
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id)
    .order('order_index');

  if (stagesError) {
    console.error('❌ Erro ao buscar etapas:', stagesError);
    throw stagesError;
  }

  // 🚀 CONTAR DEALS POR ETAPA USANDO SUBQUERIES (EVITA LEFT JOIN)
  const stageCount: Record<string, number> = {};
  
  if (stages && stages.length > 0) {
    await Promise.all(
      stages.map(async (stage) => {
        let query = supabase
          .from('web_deals')
          .select('*', { count: 'exact', head: true })
          .eq('stage_id', stage.id)
          .eq('client_id', clientUser.client_id)
          .eq('flow_id', flowId);

        // 🚀 APLICAR FILTRO DE DATA se fornecido
        if (dateFilter && dateFilter.range !== 'all') {
          const now = new Date();
          let startDate: Date | null = null;

          switch (dateFilter.range) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'quarter':
              startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
              break;
            case 'year':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
            case 'last_90_days':
              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            case 'custom':
              if (dateFilter.startDate) {
                startDate = dateFilter.startDate;
              }
              break;
          }

          if (startDate) {
            query = query.gte(dateFilter.type, startDate.toISOString());
          }

          if (dateFilter.range === 'custom' && dateFilter.endDate) {
            query = query.lte(dateFilter.type, dateFilter.endDate.toISOString());
          }
        }

        const { count, error } = await query;

        if (error) {
          console.error(`❌ Erro ao contar deals da etapa ${stage.name}:`, error);
          stageCount[stage.id] = 0;
        } else {
          stageCount[stage.id] = count || 0;
        }
      })
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Contagem de deals por etapa:', stageCount);
  }

  return stageCount;
};

// 🚀 NOVA FUNÇÃO: Calcular intervalo de datas baseado no filtro
const getDateRange = (dateFilter: DateFilter): { startDate: Date; endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (dateFilter.range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'quarter':
      startDate = subMonths(now, 3);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'last_90_days':
      startDate = subDays(now, 90);
      console.log('📅 Filtro últimos 90 dias:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      break;
    case 'custom':
      startDate = dateFilter.startDate || subDays(now, 30);
      endDate = dateFilter.endDate || now;
      break;
    default:
      startDate = subDays(now, 30);
  }

  return { startDate, endDate };
};

// 🚀 NOVA FUNÇÃO OTIMIZADA: Buscar deals específicos de uma etapa com paginação
const getDealsByStageWithPagination = async (
  flowId: string,
  stageId: string,
  { page, limit }: { page: number; limit: number }
): Promise<WebDeal[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Buscando deals da etapa ${stageId} (página ${page}, limite ${limit})`);
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  const offset = page * limit;
  
  // 🚀 QUERY OTIMIZADA: Buscar apenas deals de uma etapa específica
  const { data: deals, error } = await supabase
    .from('web_deals')
    .select(`
      id,
      title,
      value,
      stage_id,
      position,
      temperature,
      tags,
      created_at,
      last_activity,
      probability,
      responsible_id,
      responsible_name,
      flow_id,
      client_id,
      companies:company_id(id, name),
      people:person_id(id, name),
      responsible:responsible_id(id, first_name, last_name, avatar_url)
    `)
    .eq('flow_id', flowId)
    .eq('stage_id', stageId)
    .eq('client_id', clientUser.client_id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Erro ao buscar deals da etapa:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${deals?.length || 0} deals carregados da etapa ${stageId}`);
  }

  return deals || [];
};

// 🚀 NOVA FUNÇÃO OTIMIZADA: Buscar resumo completo do flow (contagens + amostra de deals)
const getFlowSummary = async (flowId: string): Promise<{
  stageDealsCount: Record<string, number>;
  totalDealsCount: number;
  recentDeals: WebDeal[]; // Últimos 20 deals para exibição inicial
}> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Buscando resumo completo do flow:', flowId);
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  // 🚀 QUERY PARALELA: Buscar contagem e deals recentes em paralelo
  const [countResult, recentDealsResult] = await Promise.all([
    // Contagem por etapa
    supabase
      .from('web_deals')
      .select('stage_id')
      .eq('flow_id', flowId)
      .eq('client_id', clientUser.client_id),
    
    // Deals recentes para exibição inicial
    supabase
    .from('web_deals')
    .select(`
      id,
      title,
      value,
      stage_id,
      position,
      temperature,
      tags,
      created_at,
      last_activity,
      probability,
      responsible_id,
      responsible_name,
      flow_id,
      client_id,
        companies:company_id(id, name),
        people:person_id(id, name),
        responsible:responsible_id(id, first_name, last_name, avatar_url)
    `)
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  if (countResult.error) {
    console.error('❌ Erro ao buscar contagem:', countResult.error);
    throw countResult.error;
  }

  if (recentDealsResult.error) {
    console.error('❌ Erro ao buscar deals recentes:', recentDealsResult.error);
    throw recentDealsResult.error;
  }

  // 🚀 PROCESSAMENTO EM MEMÓRIA: Contar deals por etapa
  const stageDealsCount: Record<string, number> = {};
  if (countResult.data) {
    countResult.data.forEach(deal => {
    stageDealsCount[deal.stage_id] = (stageDealsCount[deal.stage_id] || 0) + 1;
  });
  }

  const totalDealsCount = countResult.data?.length || 0;
  const recentDeals = recentDealsResult.data || [];

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Resumo do flow:', {
      totalDealsCount,
    stagesCounts: Object.keys(stageDealsCount).length,
      recentDealsCount: recentDeals.length
  });
  }

  return {
    stageDealsCount,
    totalDealsCount,
    recentDeals
  };
};

// 🚀 NOVA FUNÇÃO OTIMIZADA: Buscar todos os deals de uma etapa (para kanban)
const getAllDealsByStage = async (
  flowId: string,
  stageId: string
): Promise<WebDeal[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Buscando TODOS os deals da etapa ${stageId}`);
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  // 🚀 QUERY OTIMIZADA: Buscar todos os deals de uma etapa específica
  const { data: deals, error } = await supabase
    .from('web_deals')
    .select(`
      id,
      title,
      value,
      stage_id,
      position,
      temperature,
      tags,
      created_at,
      last_activity,
      probability,
      responsible_id,
      responsible_name,
      flow_id,
      client_id,
      companies:company_id(id, name),
      people:person_id(id, name),
      responsible:responsible_id(id, first_name, last_name, avatar_url)
    `)
    .eq('flow_id', flowId)
    .eq('stage_id', stageId)
    .eq('client_id', clientUser.client_id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar todos os deals da etapa:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${deals?.length || 0} deals carregados da etapa ${stageId}`);
  }

  return deals || [];
};

// 🚀 FUNÇÃO OTIMIZADA: Paginação inteligente usando RPC do Supabase
const getDealsPageOptimized = async (
  flowId: string,
  page: number,
  limit: number
): Promise<WebDeal[]> => {
  console.log(`🚀 PAGINAÇÃO OTIMIZADA: Página ${page}, limite ${limit}`);
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  const offset = page * limit;
  
  // 🚀 QUERY OTIMIZADA: Apenas campos essenciais para paginação
  const { data: deals, error } = await supabase
    .from('web_deals')
    .select(`
      id,
      title,
      value,
      stage_id,
      position,
      temperature,
      tags,
      created_at,
      last_activity,
      probability,
      responsible_id,
      responsible_name,
      flow_id,
      client_id,
      companies:company_id(id, name),
      people:person_id(id, name),
      responsible:responsible_id(id, first_name, last_name, avatar_url)
    `)
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id)
    .order('stage_id', { ascending: true })
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Erro na paginação otimizada:', error);
    throw error;
  }

  console.log(`✅ PAGINAÇÃO OTIMIZADA: ${deals?.length || 0} deals carregados`);
  return deals || [];
};

// 🚀 NOVA FUNÇÃO: Buscar deals com filtros de data aplicados
const getDealsByFlowWithFilters = async (
  flowId: string, 
  { page, limit }: { page: number; limit: number },
  dateFilter?: DateFilter
): Promise<WebDeal[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Buscando deals com filtros (página ${page}, limite ${limit})`, { dateFilter });
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  const offset = page * limit;
  
  // 🚀 QUERY COM FILTROS: Aplicar filtros de data
  let query = supabase
    .from('web_deals')
    .select(`
      id,
      title,
      value,
      stage_id,
      position,
      temperature,
      tags,
      created_at,
      last_activity,
      probability,
      responsible_id,
      responsible_name,
      flow_id,
      client_id,
      companies:company_id(id, name),
      people:person_id(id, name)
    `)
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id);

  // 🚀 APLICAR FILTROS DE DATA se fornecidos
  if (dateFilter && dateFilter.range !== 'all') {
    const { startDate, endDate } = getDateRange(dateFilter);
    if (startDate && endDate) {
      console.log(`📅 Aplicando filtro de data: ${dateFilter.type} entre ${startDate.toISOString()} e ${endDate.toISOString()}`);
      query = query
        .gte(dateFilter.type, startDate.toISOString())
        .lte(dateFilter.type, endDate.toISOString());
    }
  } else {
    console.log('📅 Sem filtros de data aplicados - retornando todos os deals');
  }

  const { data: deals, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Erro ao buscar deals com filtros:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${deals?.length || 0} deals carregados com filtros (página ${page})`);
    if (deals && deals.length > 0) {
      console.log('📊 Primeiro deal:', {
        id: deals[0].id,
        title: deals[0].title,
        created_at: deals[0].created_at,
        stage_id: deals[0].stage_id
      });
    }
  }
  return deals || [];
};

// 🚀 NOVA FUNÇÃO: Buscar resumo do flow com filtros de data
const getFlowSummaryWithFilters = async (
  flowId: string, 
  dateFilter?: DateFilter
): Promise<{
  stageDealsCount: Record<string, number>;
  totalDealsCount: number;
  recentDeals: WebDeal[];
}> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Buscando resumo do flow com filtros:', { flowId, dateFilter });
  }
  
  // 🔐 SEGURANÇA: Obter client_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    throw new Error('Usuário sem cliente associado');
  }

  // 🚀 QUERY BASE: Filtros aplicados
  let baseQuery = supabase
    .from('web_deals')
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id);

  // 🚀 APLICAR FILTROS DE DATA se fornecidos
  if (dateFilter && dateFilter.range !== 'all') {
    const { startDate, endDate } = getDateRange(dateFilter);
    if (startDate && endDate) {
      baseQuery = baseQuery
        .gte(dateFilter.type, startDate.toISOString())
        .lte(dateFilter.type, endDate.toISOString());
    }
  }

  // 🚀 QUERY PARALELA: Contagem e deals recentes com filtros
  const [countResult, recentDealsResult] = await Promise.all([
    // Contagem por etapa com filtros
    baseQuery.select('stage_id'),
    
    // Deals recentes com filtros
    baseQuery
      .select(`
        id,
        title,
        value,
        stage_id,
        position,
        temperature,
        tags,
        created_at,
        last_activity,
        probability,
        responsible_id,
        responsible_name,
        flow_id,
        client_id,
        companies:company_id(id, name),
        people:person_id(id, name),
        responsible:responsible_id(id, first_name, last_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  if (countResult.error) {
    console.error('❌ Erro ao buscar contagem com filtros:', countResult.error);
    throw countResult.error;
  }

  if (recentDealsResult.error) {
    console.error('❌ Erro ao buscar deals recentes com filtros:', recentDealsResult.error);
    throw recentDealsResult.error;
  }

  // 🚀 PROCESSAMENTO EM MEMÓRIA: Contar deals por etapa
  const stageDealsCount: Record<string, number> = {};
  if (countResult.data) {
    countResult.data.forEach(deal => {
      stageDealsCount[deal.stage_id] = (stageDealsCount[deal.stage_id] || 0) + 1;
    });
  }

  const totalDealsCount = countResult.data?.length || 0;
  const recentDeals = recentDealsResult.data || [];

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Resumo do flow com filtros:', {
      totalDealsCount,
      stagesCounts: Object.keys(stageDealsCount).length,
      recentDealsCount: recentDeals.length,
      dateFilter
    });
  }

  return {
    stageDealsCount,
    totalDealsCount,
    recentDeals
  };
};

// 🚀 FUNÇÃO OTIMIZADA: Gerar condições SQL para filtros de data
const getDateFilterCondition = (filter: DateFilter) => {
  if (filter.range === 'all') return '';

  const column = filter.type;
  const now = new Date();
  
  switch (filter.range) {
    case 'today':
      return `AND ${column} >= CURRENT_DATE AND ${column} < CURRENT_DATE + INTERVAL '1 day'`;
    
    case 'week':
      return `AND ${column} >= CURRENT_DATE - INTERVAL '7 days'`;
      
    case 'month':
      return `AND ${column} >= DATE_TRUNC('month', CURRENT_DATE)`;
      
    case 'quarter':
      return `AND ${column} >= DATE_TRUNC('quarter', CURRENT_DATE)`;
      
    case 'year':
      return `AND ${column} >= DATE_TRUNC('year', CURRENT_DATE)`;
      
    case 'last_90_days':
      return `AND ${column} >= CURRENT_DATE - INTERVAL '90 days'`;
      
    case 'custom':
      if (filter.startDate && filter.endDate) {
        return `AND ${column} >= '${filter.startDate.toISOString()}' AND ${column} <= '${filter.endDate.toISOString()}'`;
      }
      return '';
      
    default:
      return '';
  }
};

export default function FlowPage() {
  const { id: flowId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<WebDeal | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFlowConfigOpen, setIsFlowConfigOpen] = useState(false);
  const isMobile = useIsMobile();

  // 🚀 NOVOS ESTADOS: Filtros de data avançados
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: 'created_at',
    range: 'last_90_days' // 🔥 FILTRO PADRÃO: últimos 90 dias (para kanban)
  });
  const [showFilters, setShowFilters] = useState(false);

  // 🚀 NOVO ESTADO: Gerenciar carregamento de deals por etapa
  const [stageDealsState, setStageDealsState] = useState<Record<string, {
    deals: WebDeal[];
    hasNextPage: boolean;
    isFetching: boolean;
    page: number;
  }>>({});

  // 🚀 FILTRO EFETIVO: Para modo lista, usar filtro menos restritivo por padrão
  const effectiveDateFilter = useMemo(() => {
    if (viewMode === 'list' && dateFilter.range === 'last_90_days') {
      // Para modo lista, usar filtro 'all' se ainda estiver no padrão
      return { ...dateFilter, range: 'all' as const };
    }
    return dateFilter;
  }, [dateFilter, viewMode]);

  // 🚀 QUERIES OTIMIZADAS: Separar responsabilidades
  const { data: stages, isLoading: isLoadingStages } = useQuery<StageData[]>({
    queryKey: ['flowStages', flowId],
    queryFn: () => getFlowStages(flowId!),
    enabled: !!flowId,
  });

  // 🚀 NOVA QUERY: Buscar resumo do flow (contagens reais + amostra)
  const { 
    data: flowSummary, 
    isLoading: isLoadingFlowSummary,
    refetch: refetchFlowSummary 
  } = useQuery({
    queryKey: ['flowSummary', flowId],
    queryFn: () => getFlowSummary(flowId!),
    enabled: !!flowId,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
  });

  // 🚀 NOVA QUERY: Buscar contagem real de deals por etapa (COM FILTROS DE DATA)
  const { 
    data: realStageDealsCount, 
    isLoading: isLoadingStageCount,
    refetch: refetchStageCount 
  } = useQuery({
    queryKey: ['stageDealsCount', flowId, dateFilter],
    queryFn: () => getStageDealsCount(flowId!, dateFilter),
    enabled: !!flowId,
    staleTime: 30 * 1000, // 30 segundos de cache para dados mais atualizados
  });

  // 🚀 PAGINAÇÃO TRADICIONAL: Manter para modo lista (COM FILTROS DE DATA)
  const {
    items: allDeals,
    isLoading: isLoadingDeals,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchDeals,
  } = useVirtualPagination<WebDeal>({
    queryKey: ['deals', flowId, effectiveDateFilter],
    queryFn: ({ page, limit }) => getDealsByFlowWithFilters(flowId!, { page, limit }, effectiveDateFilter),
    pageSize: 50,
    maxPages: 5,
    enabled: !!flowId,
  });

  // 🚀 MEMOIZAÇÃO OTIMIZADA: Contagem real de deals por etapa (SEMPRE DO BANCO)
  const stageDealsCount = useMemo(() => {
    // 🔥 USAR SEMPRE A CONTAGEM REAL DO BANCO
    return realStageDealsCount || {};
  }, [realStageDealsCount]);

  // 🚀 CALCULAR TOTAL DE DEALS A PARTIR DA CONTAGEM REAL DAS ETAPAS
  const totalDealsCount = useMemo(() => {
    return Object.values(stageDealsCount).reduce((sum, count) => sum + count, 0);
  }, [stageDealsCount]);

  // 🚀 OTIMIZAÇÃO: filteredDeals com debounce implícito
  const filteredDeals = useMemo(() => {
    // Para modo lista, usar paginação tradicional
    if (viewMode === 'list') {
      if (!allDeals) return [];
      
      if (!searchTerm.trim()) return allDeals;
      
      const lowercaseSearch = searchTerm.toLowerCase().trim();
      return allDeals.filter((deal) => deal.title.toLowerCase().includes(lowercaseSearch));
    }
    
    // Para modo kanban, usar deals por etapa
    const allStageDeals: WebDeal[] = [];
    Object.values(stageDealsState).forEach(stageState => {
      // 🚀 VERIFICAÇÃO DE SEGURANÇA: Garantir que stageState e stageState.deals existem
      if (stageState && stageState.deals && Array.isArray(stageState.deals)) {
        allStageDeals.push(...stageState.deals);
      }
    });
    
    if (!searchTerm.trim()) return allStageDeals;
    
    const lowercaseSearch = searchTerm.toLowerCase().trim();
    return allStageDeals.filter((deal) => deal.title.toLowerCase().includes(lowercaseSearch));
  }, [viewMode, allDeals, stageDealsState, searchTerm]);

  // 🚀 NOVA FUNÇÃO: Carregar deals de uma etapa específica
  const loadStageDeals = useCallback(async (stageId: string, page: number = 0) => {
    if (!flowId) return;
    
    setStageDealsState(prev => ({
      ...prev,
      [stageId]: {
        deals: prev[stageId]?.deals || [], // 🚀 INICIALIZAÇÃO SEGURA
        hasNextPage: prev[stageId]?.hasNextPage || false,
        isFetching: true,
        page: prev[stageId]?.page || 0
      }
    }));

    try {
      const newDeals = await getDealsByStageWithPagination(flowId, stageId, { page, limit: 20 });
      
      setStageDealsState(prev => ({
        ...prev,
        [stageId]: {
          deals: page === 0 ? newDeals : [...(prev[stageId]?.deals || []), ...newDeals],
          hasNextPage: newDeals.length === 20,
          isFetching: false,
          page: page + 1
        }
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar deals da etapa:', error);
      setStageDealsState(prev => ({
        ...prev,
        [stageId]: {
          deals: prev[stageId]?.deals || [], // 🚀 MANTER DEALS EXISTENTES EM CASO DE ERRO
          hasNextPage: prev[stageId]?.hasNextPage || false,
          isFetching: false,
          page: prev[stageId]?.page || 0
        }
      }));
    }
  }, [flowId]);

  // 🚀 NOVA FUNÇÃO: Carregar mais deals de uma etapa
  const loadMoreStageDeals = useCallback((stageId: string) => {
    const stageState = stageDealsState[stageId];
    // 🚀 VERIFICAÇÃO DE SEGURANÇA: Garantir que stageState existe e tem dados válidos
    if (!stageState?.hasNextPage || stageState.isFetching) return;
    
    loadStageDeals(stageId, stageState.page);
  }, [stageDealsState, loadStageDeals]);

  // 🚀 EFEITO: Fechar painel de filtros quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilters && !(event.target as Element).closest('.filters-panel')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  // 🚀 EFEITO: Carregar deals iniciais das etapas quando entrar no modo kanban
  useEffect(() => {
    if (viewMode === 'kanban' && stages && stages.length > 0) {
      stages.forEach(stage => {
        // 🚀 VERIFICAÇÃO SIMPLIFICADA: Só carregar se a etapa não foi inicializada
        if (!stageDealsState[stage.id]) {
          loadStageDeals(stage.id, 0);
        }
      });
    }
  }, [viewMode, stages, loadStageDeals]); // 🚀 REMOVER stageDealsState das dependências para evitar loops

  // 🚀 EFEITO: Aplicar estilos CSS globais para z-index dos dropdowns
  useEffect(() => {
    addGlobalSelectStyles();
  }, []);

  // 🚀 OTIMIZAÇÃO: totalValue calculado apenas quando filteredDeals muda
  const totalValue = useMemo(() => {
    return filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  }, [filteredDeals]);

  const isLoading = isLoadingStages || isLoadingFlowSummary;
  const flowName = "Flow de Vendas";

  // 🚀 OTIMIZAÇÃO: mutation com onSuccess otimizado
  const createDealMutation = useMutation({
    mutationFn: (newDeal: WebDealInsert) => supabase.from('web_deals').insert(newDeal).select().single(),
    onSuccess: () => {
      // 🚀 REFETCH OTIMIZADO: Atualizar apenas os dados necessários
      if (viewMode === 'list') {
      refetchDeals();
      } else {
        refetchFlowSummary();
        refetchStageCount();
        // Recarregar deals das etapas afetadas
        Object.keys(stageDealsState).forEach(stageId => {
          loadStageDeals(stageId, 0);
        });
      }
      setIsAddDealOpen(false);
    },
  });

  // 🚀 OTIMIZAÇÃO: mutation com onSuccess otimizado
  const updateDealStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId, position }: { dealId: string; stageId: string; position: number }) => {
      console.log('🔄 Atualizando deal no banco:', { dealId, stageId, position });
      
      const { error } = await supabase
        .from('web_deals')
        .update({ stage_id: stageId, position })
        .eq('id', dealId);

      if (error) {
        console.error('❌ Erro na mutation do Supabase:', error);
        throw error;
      }
      
      console.log('✅ Deal atualizado com sucesso no banco de dados');
      return { dealId, stageId, position };
    },
    onSuccess: (data) => {
      console.log('✅ Mutation bem-sucedida, atualizando UI...', data);
      // 🚀 REFETCH OTIMIZADO: Atualizar apenas os dados necessários
      if (viewMode === 'list') {
        refetchDeals();
      } else {
        refetchFlowSummary();
        refetchStageCount();
        // Recarregar deals das etapas afetadas
        Object.keys(stageDealsState).forEach(stageId => {
          loadStageDeals(stageId, 0);
        });
      }
    },
    onError: (error) => {
      console.error('❌ Erro na mutation:', error);
    }
  });

  // 🚀 OTIMIZAÇÃO: handleAddDeal com useCallback
  const handleAddDeal = useCallback((data: Partial<WebDealInsert>) => {
    const firstStage = stages?.[0];
    if (!firstStage || !flowId) return;

    createDealMutation.mutate({
      ...data,
      flow_id: flowId,
      stage_id: firstStage.id,
    });
  }, [stages, flowId, createDealMutation]);

  // 🚀 OTIMIZAÇÃO: handleAddDealToStage com useCallback otimizado
  const handleAddDealToStage = useCallback((stageId: string) => {
    if (process.env.NODE_ENV === 'development') {
    console.log(`Abrindo modal para adicionar deal no estágio: ${stageId}`);
    }
    setIsAddDealOpen(true);
  }, []);

  // 🚀 NOVA IMPLEMENTAÇÃO: Drag and Drop COM OPTIMISTIC UPDATES
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    console.log('🚀 DRAG END - Active:', activeId, 'Over:', overId);
    
    // Encontrar o deal sendo arrastado
    const draggedDeal = filteredDeals.find(deal => deal.id === activeId);
    if (!draggedDeal) {
      console.log('❌ Deal não encontrado:', activeId);
      return;
    }

    // 🚀 LÓGICA MELHORADA: Extrair stageId do target
    let targetStageId = overId;
    
    // Se é uma drop zone (contém hífen), extrair apenas o stageId
    if (overId.includes('-')) {
      targetStageId = overId.split('-')[0];
      console.log('🔄 Drop zone detectada, stageId extraído:', targetStageId);
    } else {
      // Verificar se o overId é diretamente um stage válido
      const directStageMatch = stages.find(s => s.id === overId);
      if (directStageMatch) {
        targetStageId = overId;
        console.log('🔄 Stage direto detectado:', targetStageId);
      } else {
        // Pode ser outro deal - pegar o stage do deal
        const targetDeal = filteredDeals.find(d => d.id === overId);
        if (targetDeal) {
          targetStageId = targetDeal.stage_id;
          console.log('🔄 Deal target detectado, stageId:', targetStageId);
        } else {
          // 🚀 FALLBACK: Tentar encontrar stage por ID parcial (para casos de ID truncado)
          const partialStageMatch = stages.find(s => s.id.startsWith(overId) || overId.startsWith(s.id.substring(0, 8)));
          if (partialStageMatch) {
            targetStageId = partialStageMatch.id;
            console.log('🔄 Stage por ID parcial detectado:', targetStageId);
          } else {
            console.log('❌ Target inválido - não é stage nem deal:', overId);
            console.log('❌ Stages disponíveis:', stages.map(s => ({ id: s.id, name: s.name })));
            return;
          }
        }
      }
    }
    
    // Se não mudou de stage, não fazer nada
    if (draggedDeal.stage_id === targetStageId) {
      console.log('ℹ️ Deal já está na etapa correta');
      return;
    }
    
    console.log('🔄 Movendo deal:', draggedDeal.title, 'de', draggedDeal.stage_id, 'para etapa:', targetStageId);
    
    // Calcular nova posição
    const dealsInDestination = filteredDeals
      .filter(deal => deal.stage_id === targetStageId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
      
    const newPosition = dealsInDestination.length === 0 
      ? 1000 
      : (dealsInDestination[dealsInDestination.length - 1].position || 0) + 1000;

    console.log('🔄 Nova posição calculada:', newPosition);

    // 🚀 OPTIMISTIC UPDATE: Atualizar imediatamente o estado local das etapas
    const originalStageId = draggedDeal.stage_id;
    
    setStageDealsState(prev => {
      const newState = { ...prev };
      
      // Remover deal da etapa original
      if (newState[originalStageId]) {
        newState[originalStageId] = {
          ...newState[originalStageId],
          deals: newState[originalStageId].deals.filter(d => d.id !== activeId)
        };
      }
      
      // Adicionar deal na nova etapa
      if (newState[targetStageId]) {
        const updatedDeal = { 
          ...draggedDeal, 
          stage_id: targetStageId, 
          position: newPosition 
        };
        newState[targetStageId] = {
          ...newState[targetStageId],
          deals: [...newState[targetStageId].deals, updatedDeal]
            .sort((a, b) => (a.position || 0) - (b.position || 0))
        };
      }
      
      return newState;
    });

    // 🚀 MUTAÇÃO COM ROLLBACK: Executar mutation com rollback em caso de erro
    updateDealStageMutation.mutate({ 
      dealId: activeId, 
      stageId: targetStageId, 
      position: newPosition 
    }, {
      onError: (error) => {
        console.error('❌ Erro na mutation, fazendo rollback:', error);
        
        // 🚀 ROLLBACK: Reverter mudança em caso de erro
        setStageDealsState(prev => {
          const newState = { ...prev };
          
          // Remover deal da etapa de destino (onde foi colocado otimisticamente)
          if (newState[targetStageId]) {
            newState[targetStageId] = {
              ...newState[targetStageId],
              deals: newState[targetStageId].deals.filter(d => d.id !== activeId)
            };
          }
          
          // Adicionar deal de volta na etapa original
          if (newState[originalStageId]) {
            newState[originalStageId] = {
              ...newState[originalStageId],
              deals: [...newState[originalStageId].deals, draggedDeal]
                .sort((a, b) => (a.position || 0) - (b.position || 0))
            };
          }
          
          return newState;
        });
      }
    });
  }, [filteredDeals, stages, updateDealStageMutation, setStageDealsState]);
  
  // 🚀 OTIMIZAÇÃO: handleStageChange com useCallback
  const handleStageChange = useCallback((stageId: string) => {
    if (!selectedDeal) return;
    updateDealStageMutation.mutate(
      { dealId: selectedDeal.id, stageId, position: selectedDeal.position || 999999 },
      {
        onSuccess: () => setSelectedDeal(prev => prev ? { ...prev, stage_id: stageId } : null)
      }
    );
  }, [selectedDeal, updateDealStageMutation]);

  // 🚀 OTIMIZAÇÃO: Função para cor de tag melhorada com useCallback
  const tagColor = useCallback((tag: string) => {
    if (tag.toLowerCase().includes("whatsapp")) return "bg-emerald-100 text-emerald-800";
    if (tag.toLowerCase().includes("instagram")) return "bg-pink-100 text-pink-800";
    if (tag.toLowerCase().includes("live")) return "bg-violet-100 text-violet-800";
    if (tag.toLowerCase().includes("clp")) return "bg-blue-100 text-blue-800";
    if (tag.toLowerCase().includes("urgente")) return "bg-red-100 text-red-800";
    if (tag.toLowerCase().includes("vip")) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
  }, []);

  // 🚀 OTIMIZAÇÃO: Função para tags de temperatura/status com useCallback
  const getTemperatureTag = useCallback((temperature?: string) => {
    switch (temperature) {
      case 'hot': return { label: 'Quente', color: 'bg-red-100 text-red-700 ' };
      case 'warm': return { label: 'Morno', color: 'bg-orange-100 text-orange-700 ' };
      case 'cold': return { label: 'Frio', color: 'bg-blue-100 text-blue-700 border border-blue-20' };
      default: return { label: 'Novo', color: 'bg-gray-100 text-gray-700 ' };
    }
  }, []);

  // 🚀 OTIMIZAÇÃO: Função para cores dos stages com useCallback
  const getStageColors = useCallback((index: number) => {
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
  }, []);

  // 🚀 FUNÇÕES PARA MANIPULAR FILTROS DE DATA
  const applyDateFilter = useCallback((newDateFilter: DateFilter) => {
    setDateFilter(newDateFilter);
    // Refetch imediato das contagens para atualizar números das etapas
    refetchStageCount();
    refetchFlowSummary();
    if (viewMode === 'list') {
      refetchDeals();
    }
  }, [viewMode, refetchStageCount, refetchFlowSummary, refetchDeals]);

  const clearDateFilter = useCallback(() => {
    if (viewMode === 'list') {
      // Para modo lista, usar 'all' por padrão
      setDateFilter({ type: 'created_at', range: 'all' });
    } else {
      // Para modo kanban, usar filtro padrão
      setDateFilter({ type: 'created_at', range: 'last_90_days' });
    }
    refetchStageCount();
    refetchFlowSummary();
    if (viewMode === 'list') {
      refetchDeals();
    }
  }, [viewMode, refetchStageCount, refetchFlowSummary, refetchDeals]);

  const getDateFilterLabel = useCallback((filter: DateFilter) => {
    // Use o effectiveDateFilter para mostrar o label correto
    const activeFilter = viewMode === 'list' && filter.range === 'last_90_days' 
      ? { ...filter, range: 'all' as const } 
      : filter;
      
    if (activeFilter.range === 'all') return 'Todos os períodos';
    if (activeFilter.range === 'today') return 'Hoje';
    if (activeFilter.range === 'week') return 'Esta semana';
    if (activeFilter.range === 'month') return 'Este mês';
    if (activeFilter.range === 'quarter') return 'Este trimestre';
    if (activeFilter.range === 'year') return 'Este ano';
    if (activeFilter.range === 'last_90_days') return 'Últimos 90 dias';
    if (activeFilter.range === 'custom' && activeFilter.startDate && activeFilter.endDate) {
      return `${format(activeFilter.startDate, 'dd/MM')} - ${format(activeFilter.endDate, 'dd/MM')}`;
    }
    return 'Filtro personalizado';
  }, [viewMode]);

  const hasActiveFilters = useMemo(() => {
    const activeFilter = effectiveDateFilter;
    return activeFilter.range !== 'all' || searchTerm.trim() !== '';
  }, [effectiveDateFilter, searchTerm]);

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
              <RefreshCcw className="mr-2 h-3 w-3" />
              Atualizar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header ultra compacto */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-3 py-1.5 md:px-4 md:py-2 flex-shrink-0 shadow-sm relative">
        <div className="flex items-center gap-2">
          <MobileMenu />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-800 truncate">{flowName}</h1>
              <div className={`w-1 h-1 rounded-full ${totalValue > 100000 ? 'bg-emerald-500' : totalValue > 50000 ? 'bg-amber-500' : 'bg-slate-400'} animate-pulse`} />
              
              {/* Botão de Configuração do Flow */}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-slate-100"
                onClick={() => setIsFlowConfigOpen(true)}
              >
                <Settings className="h-3 w-3 text-slate-600" />
              </Button>
            </div>
          </div>

          {/* Filtros de data - Ultra compacto */}
          <div className="flex items-center gap-1 relative">
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="sm"
              className={`h-6 px-1.5 text-xs ${hasActiveFilters ? 'bg-blue-600' : 'bg-white/60 border-slate-200'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-2.5 w-2.5 mr-0.5" />
              {isMobile ? '' : 'Filtros'}
            </Button>

            {hasActiveFilters && (
              <Badge 
                variant="secondary" 
                className="h-6 px-1.5 text-xs bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                onClick={() => setShowFilters(true)}
              >
                {getDateFilterLabel(dateFilter)}
                <X 
                  className="h-2.5 w-2.5 ml-0.5 hover:bg-blue-300 rounded-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateFilter();
                  }}
                />
              </Badge>
            )}

            {/* 🚀 PAINEL DE FILTROS DENTRO DO HEADER (POSITION RELATIVE GARANTE Z-INDEX) */}
            {showFilters && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl p-4 mt-1 min-w-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de filtro */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Campo de data
                    </label>
                    <select 
                      value={dateFilter.type} 
                      onChange={(e) => applyDateFilter({ ...dateFilter, type: e.target.value as any })}
                      className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white"
                    >
                      <option value="created_at">Data de criação</option>
                      <option value="updated_at">Última atualização</option>
                      <option value="last_activity">Última atividade</option>
                      <option value="expected_close_date">Data prevista</option>
                    </select>
                  </div>

                  {/* Período */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Período
                    </label>
                    <select 
                      value={dateFilter.range} 
                      onChange={(e) => applyDateFilter({ ...dateFilter, range: e.target.value as any })}
                      className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white"
                    >
                      <option value="all">Todos os períodos</option>
                      <option value="today">Hoje</option>
                      <option value="week">Esta semana</option>
                      <option value="month">Este mês</option>
                      <option value="quarter">Este trimestre</option>
                      <option value="year">Este ano</option>
                      <option value="last_90_days">Últimos 90 dias</option>
                    </select>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Filtros aplicados: {getDateFilterLabel(dateFilter)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={clearDateFilter}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowFilters(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
                    <span className="font-medium">{totalDealsCount}</span>
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
              <Button size="sm" className="h-6 px-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm" onClick={() => setIsAddDealOpen(true)}>
                <Plus className="h-2.5 w-2.5 mr-0.5" />
                Novo
              </Button>
            </div>
          )}
        </div>

        {/* Estatísticas mobile ultra compactas */}
        {isMobile && (
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-xs text-slate-600">
                <Target className="h-2.5 w-2.5 text-blue-500" />
                <span className="font-medium">{totalDealsCount}</span>
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
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            totalDealsCount={totalDealsCount}
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
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            stageDealsCount={stageDealsCount}
            onLoadMoreForStage={loadMoreStageDeals}
            stagePagination={stageDealsState}
            stageDealsState={stageDealsState}
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

      {/* Modal de Configuração do Flow */}
      <FormBuilderModal
        open={isFlowConfigOpen}
        onOpenChange={setIsFlowConfigOpen}
        flowId={flowId || ''}
        flowName={flowName}
      />
    </div>
  );
} 
