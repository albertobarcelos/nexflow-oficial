import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Partner, CreatePartnerData, UpdatePartnerData } from "@/types/partner";

export function usePartners(id?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar todos os parceiros
  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const { data, error } = await supabase
        .from("partners")
        .select(`
          *,
          company:company_partners(
            company:companies (
              id,
              name,
              razao_social,
              cnpj
            )
          )
        `)
        .eq("client_id", collaborator.client_id)
        .order("name");

      if (error) {
        console.error("Erro ao buscar parceiros:", error);
        throw error;
      }

      return data.map((partner: any) => ({
        ...partner,
        company_id: partner.company?.[0]?.company?.id || null,
        company_name: partner.company?.[0]?.company?.name || null,
        company_razao_social: partner.company?.[0]?.company?.razao_social || null,
        company_cnpj: partner.company?.[0]?.company?.cnpj || null,
        company: undefined // Remove o campo company para não confundir
      }));
    },
    enabled: !!user?.id && !id,
  });

  // Buscar um parceiro específico
  const { data: partner } = useQuery({
    queryKey: ["partners", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select(`
          *,
          company:company_partners(
            company:companies (
              id,
              name,
              razao_social,
              cnpj
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar parceiro:", error);
        throw error;
      }

      return {
        ...data,
        company_id: data.company?.[0]?.company?.id || null,
        company_name: data.company?.[0]?.company?.name || null,
        company_razao_social: data.company?.[0]?.company?.razao_social || null,
        company_cnpj: data.company?.[0]?.company?.cnpj || null,
        company: undefined
      } as Partner;
    },
    enabled: !!user?.id && !!id,
  });

  // Criar um novo parceiro
  const createPartner = async (data: CreatePartnerData) => {
    if (!user?.id) throw new Error("Usuário não autenticado");

    // Validar dados obrigatórios
    if (!data.name) throw new Error("Nome é obrigatório");
    if (!data.email) throw new Error("Email é obrigatório");
    if (!data.whatsapp) throw new Error("WhatsApp é obrigatório");
    if (!data.partner_type) throw new Error("Tipo de parceiro é obrigatório");

    // Buscar o client_id do usuário logado
    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!collaborator) throw new Error("Colaborador não encontrado");

    // Formatar dados
    const partnerData = {
      ...data,
      client_id: collaborator.client_id,
      status: data.status || "PENDENTE",
      current_level: 1,
      points: 0,
      total_indications: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Inserir parceiro
    const { data: newPartner, error } = await supabase
      .from("partners")
      .insert([partnerData])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar parceiro:", error);
      throw error;
    }

    // Se tem empresa, criar vínculo
    if (data.company_id) {
      const { error: linkError } = await supabase
        .from("company_partners")
        .insert({
          client_id: collaborator.client_id,
          company_id: data.company_id,
          partner_id: newPartner.id,
          relationship_type: "MATRIZ" // Por padrão, toda empresa vinculada é MATRIZ
        });

      if (linkError) {
        console.error("Erro ao vincular empresa:", linkError);
        throw linkError;
      }
    }

    // Invalidar cache
    queryClient.invalidateQueries({ queryKey: ["partners"] });

    return newPartner;
  };

  // Atualizar um parceiro existente
  const updatePartner = async (partner: UpdatePartnerData & { id: string }) => {
    const { company_id, ...partnerData } = partner;

    // Primeiro buscar o collaborator
    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("client_id")
      .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!collaborator) throw new Error("Colaborador não encontrado");

    // Gerenciar vínculo com empresa
    if (company_id) {
      // Verifica se já existe um vínculo
      const { data: existingLink } = await supabase
        .from("company_partners")
        .select()
        .eq("partner_id", partner.id)
        .single();

      if (existingLink) {
        // Atualiza o vínculo existente
        const { error: updateError } = await supabase
          .from("company_partners")
          .update({
            company_id: company_id,
            relationship_type: "MATRIZ" // Por padrão, toda empresa vinculada é MATRIZ
          })
          .eq("partner_id", partner.id);

        if (updateError) throw new Error(updateError.message);
      } else {
        // Cria novo vínculo
        const { error: insertError } = await supabase
          .from("company_partners")
          .insert({
            client_id: collaborator.client_id,
            company_id: company_id,
            partner_id: partner.id,
            relationship_type: "MATRIZ" // Por padrão, toda empresa vinculada é MATRIZ
          });

        if (insertError) throw new Error(insertError.message);
      }
    } else {
      // Se não tem company_id, remove qualquer vínculo existente
      const { error: deleteError } = await supabase
        .from("company_partners")
        .delete()
        .eq("partner_id", partner.id);

      if (deleteError) throw new Error(deleteError.message);
    }

    // Depois atualizar o parceiro e buscar os dados atualizados
    const { data: updatedPartner, error: updateError } = await supabase
      .from("partners")
      .update(partnerData)
      .eq("id", partner.id)
      .select(`
        *,
        company:company_partners(
          company:companies (
            id,
            name,
            razao_social,
            cnpj
          )
        )
      `)
      .single();

    if (updateError) throw new Error(updateError.message);

    // Invalidar todos os queries relacionados a partners
    await queryClient.invalidateQueries({ 
      queryKey: ["partners"],
      exact: false,
      refetchType: "all"
    });
    
    return {
      ...updatedPartner,
      company_id: updatedPartner.company?.[0]?.company?.id || null,
      company_name: updatedPartner.company?.[0]?.company?.name || null,
      company_razao_social: updatedPartner.company?.[0]?.company?.razao_social || null,
      company_cnpj: updatedPartner.company?.[0]?.company?.cnpj || null,
      company: undefined
    } as Partner;
  };

  // Excluir um parceiro
  const deletePartner = async (id: string) => {
    if (!user?.id) throw new Error("Usuário não autenticado");

    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!collaborator) throw new Error("Colaborador não encontrado");

    const { error } = await supabase
      .from("partners")
      .delete()
      .eq("id", id)
      .eq("client_id", collaborator.client_id);

    if (error) {
      console.error("Erro ao excluir parceiro:", error);
      throw error;
    }

    // Invalidar cache
    queryClient.invalidateQueries({ queryKey: ["partners"] });
  };

  return {
    partners,
    partner,
    isLoading,
    createPartner,
    updatePartner,
    deletePartner,
  };
}
