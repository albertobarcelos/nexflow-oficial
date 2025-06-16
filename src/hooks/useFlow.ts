import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { createHistory } from "@/lib/history";

type Deal = Database["public"]["Tables"]["web_deals"]["Row"];
type FlowStage = Database["public"]["Tables"]["web_funnel_stages"]["Row"];
type Flow = Database["public"]["Tables"]["web_funnels"]["Row"];

interface CreateDealInput {
  title: string;
  company_id?: string;
  person_id?: string;
  value?: number;
  tags?: string[];
  responsible_ids?: string[];
  partner_id?: string;
}

interface UpdateDealInput {
  id: string;
  title?: string;
  value?: number | null;
  description?: string;
  partner_id?: string | null;
}

interface MoveDealInput {
  dealId: string;
  stageId: string;
  newPosition: number;
}

// Função helper para obter dados do usuário (incluindo usuário de teste)
const getCurrentUserData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Tentar buscar na tabela core_client_users
  const { data: collaborator } = await supabase
    .from("core_client_users")
    .select("client_id")
    .eq("id", user.id)
    .single();

  // Se encontrou, retorna os dados
  if (collaborator) {
    return collaborator;
  }

  // Se não encontrou e é o usuário de teste, retorna dados temporários
  if (user.email === 'barceloshd@gmail.com') {
    return {
      client_id: 'ee065908-ecd5-4bc1-a3c9-eee45d34219f'
    };
  }

  throw new Error("Colaborador não encontrado");
};

export function useFlow() {
  const queryClient = useQueryClient();
  const { id } = useParams();

  // Buscar flow pelo ID da rota ou o flow padrão
  const { data: flow, isLoading: isFlowLoading, isError: isFlowError } = useQuery({
    queryKey: ["flow", id],
    queryFn: async () => {
      try {
        const collaborator = await getCurrentUserData();
        
        const query = supabase.from("web_funnels").select("*").eq("client_id", collaborator.client_id);
        
        if (id && id !== "default") {
          query.eq("id", id);
        } else {
          query.eq("is_default", true);
        }

        const { data, error } = await query.single();

        if (error) {
          console.error("Erro ao carregar flow:", error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Erro ao carregar flow:", error);
        return null;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Buscar estágios do flow
  const { data: stages = [], isLoading: isStagesLoading, isError: isStagesError } = useQuery({
    queryKey: ["flow", flow?.id, "stages"],
    queryFn: async () => {
      if (!flow?.id) return [];
      
      try {
        const collaborator = await getCurrentUserData();
        
        const { data, error } = await supabase
          .from("web_funnel_stages")
          .select("*")
          .eq("funnel_id", flow.id)
          .eq("client_id", collaborator.client_id)
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Erro ao carregar estágios:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("Erro ao carregar estágios:", error);
        return [];
      }
    },
    enabled: !!flow?.id && !isFlowError,
    retry: 3,
    retryDelay: 1000,
  });

  // Query dos negócios com configurações otimizadas
  const { data: deals = [], isLoading: isDealsLoading, isError: isDealsError } = useQuery({
    queryKey: ["flow-deals", flow?.id],
    queryFn: async () => {
      if (!flow?.id) return [];

      try {
        const collaborator = await getCurrentUserData();

        const { data, error } = await supabase
          .from("web_deals")
          .select(`
            *,
            partner:partner_id (
              id,
              name,
              avatar_type,
              avatar_seed,
              custom_avatar_url
            )
          `)
          .eq("funnel_id", flow.id)
          .eq("client_id", collaborator.client_id)
          .order("position");

        if (error) {
          console.error("Erro ao carregar negócios:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("Erro ao carregar negócios:", error);
        return [];
      }
    },
    enabled: !!flow?.id,
    staleTime: 2000, // Dados permanecem fresh por 2 segundos
    cacheTime: 10 * 60 * 1000, // Cache por 10 minutos
    refetchOnWindowFocus: false, // Evita refetch ao focar a janela
    refetchOnMount: false, // Evita refetch ao montar o componente
    refetchOnReconnect: false // Evita refetch ao reconectar
  });

  // Mutation para mover negócio com otimizações
  const moveDealMutation = useMutation({
    mutationFn: async ({ dealId, stageId, newPosition }: MoveDealInput) => {
      const { error } = await supabase
        .from("web_deals")
        .update({ 
          stage_id: stageId, 
          position: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq("id", dealId);

      if (error) throw error;

      await createHistory({
        deal_id: dealId,
        action: "move",
        description: `Negócio movido para nova etapa`,
        metadata: { stage_id: stageId, position: newPosition }
      });
    },
    onMutate: async ({ dealId, stageId, newPosition }) => {
      // Cancelar queries pendentes
      await queryClient.cancelQueries({ 
        queryKey: ["flow-deals", flow?.id],
        exact: true
      });
      
      // Snapshot do estado atual
      const previousDeals = queryClient.getQueryData(["flow-deals", flow?.id]);

      // Atualizar o cache otimisticamente
      queryClient.setQueryData(
        ["flow-deals", flow?.id],
        (old: any[] = []) => {
          return old.map(deal => 
            deal.id === dealId 
              ? { ...deal, stage_id: stageId, position: newPosition }
              : deal
          );
        }
      );

      return { previousDeals };
    },
    onError: (err, variables, context) => {
      // Reverter para o estado anterior em caso de erro
      queryClient.setQueryData(
        ["flow-deals", flow?.id], 
        context?.previousDeals
      );
      toast.error("Erro ao mover o negócio. Tente novamente.");
    },
    onSettled: () => {
      // Atrasar a invalidação e usar uma estratégia mais suave
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["flow-deals", flow?.id],
          exact: true,
          refetchType: "inactive" // Só refetch se os dados estiverem inativos
        });
      }, 800);
    }
  });

  // Mutation para criar negócio
  const createDealMutation = useMutation({
    mutationFn: async (data: CreateDealInput) => {
      const collaborator = await getCurrentUserData();

      // Buscar o primeiro estágio do flow
      const { data: firstStage } = await supabase
        .from('web_funnel_stages')
        .select('id')
        .eq('funnel_id', flow?.id)
        .eq('client_id', collaborator.client_id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (!firstStage) throw new Error('Nenhum estágio encontrado no flow');

      // Buscar a maior posição atual
      const { data: stageDeals } = await supabase
        .from('web_deals')
        .select('position')
        .eq('stage_id', firstStage.id)
        .eq('client_id', collaborator.client_id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (stageDeals?.[0]?.position ?? 0) + 10000;

      // Criar o negócio
      const { data: deal, error: dealError } = await supabase
        .from('web_deals')
        .insert({
          title: data.title,
          company_id: data.company_id,
          person_id: data.person_id,
          partner_id: data.partner_id,
          value: data.value,
          stage_id: firstStage.id,
          client_id: collaborator.client_id,
          position: nextPosition,
          funnel_id: flow?.id,
          responsible_ids: data.responsible_ids || [],
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Se houver tags, criar as relações
      if (data.tags && data.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('web_deal_tags')
          .insert(
            data.tags.map(tagId => ({
              deal_id: deal.id,
              tag_id: tagId,
              client_id: collaborator.client_id
            }))
          );

        if (tagsError) throw tagsError;
      }

      return deal.id;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar negócio. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["flow-deals", flow?.id]);
      toast.success("Negócio criado com sucesso!");
    },
  });

  // Mutation para atualizar parceiro do negócio
  const updateDealPartnerMutation = useMutation({
    mutationFn: async ({ 
      dealId, 
      partnerId 
    }: { 
      dealId: string; 
      partnerId: string | null;
    }) => {
      // Buscar informações do parceiro se houver
      let partnerName = "nenhum";
      if (partnerId) {
        const { data: partner } = await supabase
          .from("web_partners")
          .select("name")
          .eq("id", partnerId)
          .single();
        partnerName = partner?.name || "desconhecido";
      }

      const { error } = await supabase
        .from("web_deals")
        .update({ partner_id: partnerId })
        .eq("id", dealId);

      if (error) throw error;

      // Registrar no histórico
      await createHistory({
        dealId,
        type: partnerId ? "partner_added" : "partner_removed",
        description: `Parceiro alterado para ${partnerName}`,
        details: {
          partner_id: partnerId,
          partner_name: partnerName
        }
      });
    },
    onError: () => {
      toast.error("Erro ao atualizar parceiro. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["flow-deals", flow?.id]);
      toast.success("Parceiro atualizado com sucesso!");
    }
  });

  // Mutation para atualizar negócio
  const updateDealMutation = useMutation({
    mutationFn: async (data: UpdateDealInput) => {
      const { error } = await supabase
        .from('web_deals')
        .update({
          title: data.title,
          value: data.value,
          description: data.description,
          partner_id: data.partner_id
        })
        .eq('id', data.id);

      if (error) throw error;

      // Registrar no histórico
      await createHistory({
        dealId: data.id,
        type: "updated",
        description: `Negócio "${data.title}" atualizado`,
        details: {
          title: data.title,
          value: data.value,
          description: data.description,
          partner_id: data.partner_id
        }
      });
    },
    onSuccess: () => {
      toast.success('Negócio atualizado com sucesso!');
      queryClient.invalidateQueries({
        queryKey: ['flow-deals', flow?.id]
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar negócio:', error);
      toast.error('Erro ao atualizar negócio. Por favor, tente novamente.');
    }
  });

  // Mutation para excluir negócio
  const deleteDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('web_deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      // Registrar no histórico
      await createHistory({
        dealId,
        type: "deleted",
        description: `Negócio excluído`,
        details: {}
      });
    },
    onSuccess: () => {
      toast.success('Negócio excluído com sucesso!');
      queryClient.invalidateQueries({
        queryKey: ['flow-deals', flow?.id]
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir negócio:', error);
      toast.error('Erro ao excluir negócio. Por favor, tente novamente.');
    }
  });

  // Mutation para adicionar tag
  const addTagMutation = useMutation({
    mutationFn: async ({ dealId, tag }: { dealId: string; tag: string }) => {
      // Primeiro, buscar as tags atuais
      const { data: currentDeal } = await supabase
        .from('deals')
        .select('tags')
        .eq('id', dealId)
        .single();

      const currentTags = currentDeal?.tags || [];
      const newTags = [...new Set([...currentTags, tag])];

      const { error } = await supabase
        .from('deals')
        .update({ tags: newTags })
        .eq('id', dealId);

      if (error) throw error;

      // Registrar no histórico
      await createHistory({
        dealId,
        type: "tag_added",
        description: `Tag "${tag}" adicionada`,
        details: {
          tag
        }
      });
    },
    onSuccess: () => {
      toast.success('Tag adicionada com sucesso!');
      queryClient.invalidateQueries({
        queryKey: ['flow-deals', flow?.id]
      });
    },
    onError: (error) => {
      console.error('Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag. Por favor, tente novamente.');
    }
  });

  // Mutation para remover tag
  const removeTagMutation = useMutation({
    mutationFn: async ({ dealId, tag }: { dealId: string; tag: string }) => {
      // Primeiro, buscar as tags atuais
      const { data: currentDeal } = await supabase
        .from('deals')
        .select('tags')
        .eq('id', dealId)
        .single();

      const currentTags = currentDeal?.tags || [];
      const newTags = currentTags.filter((t: string) => t !== tag);

      const { error } = await supabase
        .from('deals')
        .update({ tags: newTags })
        .eq('id', dealId);

      if (error) throw error;

      // Registrar no histórico
      await createHistory({
        dealId,
        type: "tag_removed",
        description: `Tag "${tag}" removida`,
        details: {
          tag
        }
      });
    },
    onSuccess: () => {
      toast.success('Tag removida com sucesso!');
      queryClient.invalidateQueries({
        queryKey: ['flow-deals', flow?.id]
      });
    },
    onError: (error) => {
      console.error('Erro ao remover tag:', error);
      toast.error('Erro ao remover tag. Por favor, tente novamente.');
    }
  });

  // Adicionar tarefa
  const addTask = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      dueDate: string;
      dealId: string;
      assignedTo?: string;
    }) => {
      const { data: deal } = await supabase
        .from("deals")
        .select("client_id")
        .eq("id", data.dealId)
        .single();

      if (!deal) throw new Error("Deal not found");

      const { data: task, error } = await supabase
        .from("tasks")
        .insert([{
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          deal_id: data.dealId,
          assigned_to: data.assignedTo,
          client_id: deal.client_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await createHistory({
        dealId: data.dealId,
        type: "task_created",
        description: `Tarefa "${data.title}" criada`,
        details: {
          taskTitle: data.title,
          dueDate: data.dueDate
        }
      });

      return task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["deal-tasks", variables.dealId]);
      queryClient.invalidateQueries(["deal-history", variables.dealId]);
    }
  });

  // Completar tarefa
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .update({ completed: true })
        .eq("id", taskId)
        .select()
        .single();

      if (taskError) throw taskError;

      // Registrar no histórico
      await createHistory({
        dealId: task.deal_id,
        type: "task_completed",
        description: `Tarefa "${task.title}" completada`,
        details: {
          taskTitle: task.title
        }
      });

      return task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries(["deal-tasks", task.deal_id]);
      queryClient.invalidateQueries(["deal-history", task.deal_id]);
    }
  });

  // Se houver erro em alguma query principal, mostrar toast
  if (isFlowError || isStagesError || isDealsError) {
    toast.error("Erro ao carregar dados do flow. Tente recarregar a página.");
  }

  return {
    flow,
    stages,
    deals: deals?.sort((a, b) => a.position - b.position), // Garantir ordenação
    isLoading: isFlowLoading || isStagesLoading || isDealsLoading,
    isError: isFlowError || isStagesError || isDealsError,
    createDeal: createDealMutation.mutateAsync,
    moveDeal: (dealId: string, stageId: string, newPosition: number) => 
      moveDealMutation.mutate({ dealId, stageId, newPosition }),
    updateDeal: updateDealMutation.mutateAsync,
    deleteDeal: deleteDealMutation.mutateAsync,
    addTag: addTagMutation.mutateAsync,
    removeTag: removeTagMutation.mutateAsync,
  };
}
