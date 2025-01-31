import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { createHistory } from "@/lib/history";

type Deal = Database["public"]["Tables"]["deals"]["Row"];
type FunnelStage = Database["public"]["Tables"]["funnel_stages"]["Row"];
type Funnel = Database["public"]["Tables"]["funnels"]["Row"];

interface CreateDealInput {
  title: string;
  company_id?: string;
  person_id?: string;
  value?: number;
}

interface UpdateDealInput {
  id: string;
  title?: string;
  value?: number | null;
  description?: string;
  partner_id?: string | null;
}

export function useFunnel() {
  const queryClient = useQueryClient();
  const { id } = useParams();

  // Buscar funil pelo ID da rota ou o funil padrão
  const { data: funnel, isError: isFunnelError } = useQuery({
    queryKey: ["funnel", id],
    queryFn: async () => {
      const query = supabase.from("funnels").select("*");
      
      if (id && id !== "default") {
        query.eq("id", id);
      } else {
        query.eq("is_default", true);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error("Erro ao carregar funil:", error);
        throw error;
      }

      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Buscar estágios do funil
  const { data: stages = [], isError: isStagesError } = useQuery({
    queryKey: ["funnel", funnel?.id, "stages"],
    queryFn: async () => {
      if (!funnel?.id) return [];
      
      const { data, error } = await supabase
        .from("funnel_stages")
        .select("*")
        .eq("funnel_id", funnel.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Erro ao carregar estágios:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!funnel?.id && !isFunnelError,
    retry: 3,
    retryDelay: 1000,
  });

  // Buscar negócios do funil ordenados por posição
  const { data: deals = [], isError: isDealsError } = useQuery({
    queryKey: ["funnel", funnel?.id, "deals"],
    queryFn: async () => {
      if (!funnel?.id) return [];
      
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          entity_type,
          companies!fk_deals_company(name),
          people!fk_deals_person(name),
          partner:partners(*)
        `)
        .eq("funnel_id", funnel.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Erro ao carregar negócios:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!funnel?.id && !isFunnelError && !isStagesError,
    retry: 3,
    retryDelay: 1000,
  });

  // Mutation para mover negócio
  const moveDealMutation = useMutation({
    mutationFn: async ({ 
      dealId, 
      stageId,
      newPosition 
    }: { 
      dealId: string; 
      stageId: string;
      newPosition: number;
    }) => {
      const { data: stage } = await supabase
        .from("funnel_stages")
        .select("name")
        .eq("id", stageId)
        .single();

      const { error } = await supabase
        .from("deals")
        .update({ 
          stage_id: stageId,
          position: newPosition
        })
        .eq("id", dealId);

      if (error) {
        console.error("Erro ao mover negócio:", error);
        throw error;
      }

      // Registrar no histórico
      await createHistory({
        dealId,
        type: "stage_changed",
        description: `Movido para o estágio "${stage?.name}"`,
        details: {
          stage_id: stageId,
          stage_name: stage?.name,
          position: newPosition
        }
      });
    },
    onMutate: async ({ dealId, stageId, newPosition }) => {
      await queryClient.cancelQueries({ queryKey: ["funnel", funnel?.id, "deals"] });
      const previousDeals = queryClient.getQueryData(["funnel", funnel?.id, "deals"]);

      queryClient.setQueryData(
        ["funnel", funnel?.id, "deals"],
        (old: any[] = []) => old.map(deal => 
          deal.id === dealId 
            ? { ...deal, stage_id: stageId, position: newPosition }
            : deal
        )
      );

      return { previousDeals };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["funnel", funnel?.id, "deals"], context?.previousDeals);
      toast.error("Erro ao mover o negócio. Tente novamente.");
    },
    onSuccess: () => {
      toast.success("Negócio movido com sucesso!");
    },
  });

  // Mutation para criar negócio
  const createDealMutation = useMutation({
    mutationFn: async (data: CreateDealInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o client_id do colaborador
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      // Buscar o primeiro estágio do funil
      const { data: firstStage } = await supabase
        .from('funnel_stages')
        .select('id')
        .eq('funnel_id', funnel?.id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (!firstStage) throw new Error('Nenhum estágio encontrado no funil');

      // Buscar a maior posição atual
      const { data: stageDeals } = await supabase
        .from('deals')
        .select('position')
        .eq('stage_id', firstStage.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (stageDeals?.[0]?.position ?? 0) + 10000;

      // Criar o negócio
      const { data: deal, error } = await supabase
        .from('deals')
        .insert({
          ...data,
          stage_id: firstStage.id,
          client_id: collaborator.client_id,
          position: nextPosition,
          funnel_id: funnel?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar negócio:", error);
        throw error;
      }

      return deal.id;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar negócio. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["funnel", funnel?.id, "deals"]);
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
          .from("partners")
          .select("name")
          .eq("id", partnerId)
          .single();
        partnerName = partner?.name || "desconhecido";
      }

      const { error } = await supabase
        .from("deals")
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
      queryClient.invalidateQueries(["funnel", funnel?.id, "deals"]);
      toast.success("Parceiro atualizado com sucesso!");
    }
  });

  // Mutation para atualizar negócio
  const updateDealMutation = useMutation({
    mutationFn: async (data: UpdateDealInput) => {
      const { error } = await supabase
        .from('deals')
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
        queryKey: ['funnel', funnel?.id, 'deals']
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
        .from('deals')
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
        queryKey: ['funnel', funnel?.id, 'deals']
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
        queryKey: ['funnel', funnel?.id, 'deals']
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
        queryKey: ['funnel', funnel?.id, 'deals']
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
  if (isFunnelError || isStagesError || isDealsError) {
    toast.error("Erro ao carregar dados do funil. Tente recarregar a página.");
  }

  return {
    funnel,
    stages,
    deals,
    isError: isFunnelError || isStagesError || isDealsError,
    moveDeal: moveDealMutation.mutate,
    createDeal: createDealMutation.mutate,
    updateDealPartner: updateDealPartnerMutation.mutate,
    updateDeal: updateDealMutation.mutate,
    deleteDeal: deleteDealMutation.mutate,
    addTag: addTagMutation.mutate,
    removeTag: removeTagMutation.mutate,
    addTask: addTask.mutate,
    completeTask: completeTask.mutate,
    isMovingDeal: moveDealMutation.isLoading,
    isCreatingDeal: createDealMutation.isLoading,
    isUpdatingPartner: updateDealPartnerMutation.isLoading
  };
}
