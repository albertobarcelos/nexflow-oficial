import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserData } from "@/lib/auth";
import type { Partner, CreatePartnerData, UpdatePartnerData } from "@/types/partner";
import { normalizePhone, validatePhoneFormat } from "@/lib/validations/phone";

export function usePartners(id?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar todos os parceiros
  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      try {
        const collaborator = await getCurrentUserData();

        const { data, error } = await supabase
          .from("app_partners")
          .select(`
            *,
            people:web_people(
              id,
              name,
              email,
              whatsapp,
              phone,
              linkedin,
              instagram,
              description,
              birth_date,
              avatar_type,
              avatar_seed,
              company:web_companies!partners_company_id_fkey (
                id,
                name,
                razao_social,
                cnpj
              )
            )
          `)
          .eq("cliente_id", collaborator.client_id);

        if (error) {
          console.error("Erro ao buscar parceiros:", error);
          return [];
        }

        // Mapear dados para o formato Partner
        const mappedPartners = data.map((partner: any) => {
          const people = partner.people;
          return {
            id: partner.id,
            client_id: partner.cliente_id,
            name: people?.name || "",
            email: people?.email || "",
            whatsapp: people?.whatsapp || "",
            phone: people?.phone || null,
            linkedin: people?.linkedin || null,
            instagram: people?.instagram || null,
            description: people?.description || null,
            birth_date: people?.birth_date || null,
            avatar_type: people?.avatar_type || null,
            avatar_seed: people?.avatar_seed || null,
            partner_type: "AFILIADO" as const, // Valor padrão, pode precisar ser ajustado
            status: "ATIVO" as const, // Valor padrão, pode precisar ser ajustado
            company_id: people?.company?.id || null,
            company_name: people?.company?.name || null,
            company_razao_social: people?.company?.razao_social || null,
            company_cnpj: people?.company?.cnpj || null,
            current_level: partner.current_level || 1,
            points: partner.lifetime_xp || 0,
            total_indications: 0, // Pode precisar ser calculado
            created_at: partner.created_at || "",
            updated_at: partner.created_at || "",
          };
        });

        // Ordenar por nome
        return mappedPartners.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error("Erro ao buscar parceiros:", error);
        return [];
      }
    },
    enabled: !!user?.id && !id,
  });

  // Buscar um parceiro específico
  const { data: partner } = useQuery({
    queryKey: ["partners", id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("app_partners")
          .select(`
            *,
            people:web_people(
              id,
              name,
              email,
              whatsapp,
              phone,
              linkedin,
              instagram,
              description,
              birth_date,
              avatar_type,
              avatar_seed,
              company:web_companies!partners_company_id_fkey (
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

        const people = data.people;
        return {
          id: data.id,
          client_id: data.cliente_id,
          name: people?.name || "",
          email: people?.email || "",
          whatsapp: people?.whatsapp || "",
          phone: people?.phone || null,
          linkedin: people?.linkedin || null,
          instagram: people?.instagram || null,
          description: people?.description || null,
          birth_date: people?.birth_date || null,
          avatar_type: people?.avatar_type || null,
          avatar_seed: people?.avatar_seed || null,
          partner_type: "AFILIADO" as const, // Valor padrão, pode precisar ser ajustado
          status: "ATIVO" as const, // Valor padrão, pode precisar ser ajustado
          company_id: people?.company?.id || null,
          company_name: people?.company?.name || null,
          company_razao_social: people?.company?.razao_social || null,
          company_cnpj: people?.company?.cnpj || null,
          current_level: data.current_level || 1,
          points: data.lifetime_xp || 0,
          total_indications: 0, // Pode precisar ser calculado
          created_at: data.created_at || "",
          updated_at: data.created_at || "",
        } as Partner;
      } catch (error) {
        console.error("Erro ao buscar parceiro:", error);
        return null;
      }
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

    // Validar formato de telefone
    if (data.whatsapp && !validatePhoneFormat(data.whatsapp)) {
      throw new Error("WhatsApp inválido. Use o formato (99) 99999-9999 ou (99) 9999-9999");
    }
    if (data.phone && !validatePhoneFormat(data.phone)) {
      throw new Error("Telefone inválido. Use o formato (99) 99999-9999 ou (99) 9999-9999");
    }

    // Buscar o client_id do usuário logado
    const collaborator = await getCurrentUserData();

    // Verificar unicidade de telefone/whatsapp
    const normalizedWhatsapp = data.whatsapp ? normalizePhone(data.whatsapp) : null;
    const normalizedPhone = data.phone ? normalizePhone(data.phone) : null;

    if (normalizedWhatsapp || normalizedPhone) {
      const { data: existingPeople, error: checkError } = await supabase
        .from("web_people")
        .select("id, name, whatsapp, phone")
        .eq("client_id", collaborator.client_id);

      if (checkError) {
        console.error("Erro ao verificar unicidade de telefone:", checkError);
      } else if (existingPeople) {
        const duplicate = existingPeople.find((person) => {
          const personWhatsapp = person.whatsapp ? normalizePhone(person.whatsapp) : null;
          const personPhone = person.phone ? normalizePhone(person.phone) : null;
          
          return (
            (normalizedWhatsapp && personWhatsapp === normalizedWhatsapp) ||
            (normalizedPhone && personPhone === normalizedPhone) ||
            (normalizedWhatsapp && personPhone === normalizedWhatsapp) ||
            (normalizedPhone && personWhatsapp === normalizedPhone)
          );
        });

        if (duplicate) {
          throw new Error(
            `Telefone já cadastrado para ${duplicate.name}. Por favor, use um número diferente.`
          );
        }
      }
    }

    // Primeiro, criar web_people com os dados básicos
    const { data: newPeople, error: createPeopleError } = await supabase
      .from("web_people")
      .insert({
        client_id: collaborator.client_id,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        phone: data.phone,
        linkedin: data.linkedin,
        instagram: data.instagram,
        description: data.description,
        birth_date: data.birth_date,
        company_id: data.company_id || null,
      })
      .select()
      .single();

    if (createPeopleError) {
      console.error("Erro ao criar pessoa:", createPeopleError);
      throw createPeopleError;
    }

    // Depois, criar app_partners com o people_id
    const partnerData = {
      cliente_id: collaborator.client_id,
      people_id: newPeople.id,
      current_level: 1,
      season_xp: 0,
      lifetime_xp: 0,
      completed_missions: 0,
      created_at: new Date().toISOString(),
    };

    const { data: newPartner, error } = await supabase
      .from("app_partners")
      .insert([partnerData])
      .select()
      .single();

    if (error) {
      // Se falhar, tentar remover o web_people criado
      await supabase.from("web_people").delete().eq("id", newPeople.id);
      console.error("Erro ao criar parceiro:", error);
      throw error;
    }

    // Invalidar cache
    queryClient.invalidateQueries({ queryKey: ["partners"] });

    return newPartner;
  };

  // Atualizar um parceiro existente
  const updatePartner = async (partner: UpdatePartnerData & { id: string }) => {
    try {
      const { company_id, ...partnerData } = partner;

      // Validar formato de telefone se fornecido
      if (partnerData.whatsapp && !validatePhoneFormat(partnerData.whatsapp)) {
        throw new Error("WhatsApp inválido. Use o formato (99) 99999-9999 ou (99) 9999-9999");
      }
      if (partnerData.phone && !validatePhoneFormat(partnerData.phone)) {
        throw new Error("Telefone inválido. Use o formato (99) 99999-9999 ou (99) 9999-9999");
      }

      // Primeiro buscar o collaborator
      const collaborator = await getCurrentUserData();

      // Buscar o parceiro para obter people_id
      const { data: currentPartner } = await supabase
        .from("app_partners")
        .select("people_id")
        .eq("id", partner.id)
        .single();

      if (!currentPartner?.people_id) {
        throw new Error("Parceiro não possui people_id associado");
      }

      // Verificar unicidade de telefone/whatsapp (excluindo o próprio registro)
      const normalizedWhatsapp = partnerData.whatsapp ? normalizePhone(partnerData.whatsapp) : null;
      const normalizedPhone = partnerData.phone ? normalizePhone(partnerData.phone) : null;

      if (normalizedWhatsapp || normalizedPhone) {
        const { data: existingPeople, error: checkError } = await supabase
          .from("web_people")
          .select("id, name, whatsapp, phone")
          .eq("client_id", collaborator.client_id)
          .neq("id", currentPartner.people_id); // Excluir o próprio registro

        if (checkError) {
          console.error("Erro ao verificar unicidade de telefone:", checkError);
        } else if (existingPeople) {
          const duplicate = existingPeople.find((person) => {
            const personWhatsapp = person.whatsapp ? normalizePhone(person.whatsapp) : null;
            const personPhone = person.phone ? normalizePhone(person.phone) : null;
            
            return (
              (normalizedWhatsapp && personWhatsapp === normalizedWhatsapp) ||
              (normalizedPhone && personPhone === normalizedPhone) ||
              (normalizedWhatsapp && personPhone === normalizedWhatsapp) ||
              (normalizedPhone && personWhatsapp === normalizedPhone)
            );
          });

          if (duplicate) {
            throw new Error(
              `Telefone já cadastrado para ${duplicate.name}. Por favor, use um número diferente.`
            );
          }
        }
      }

      // Atualizar dados em web_people (name, email, whatsapp, etc.)
      const peopleUpdateData: any = {};
      if (partnerData.name !== undefined) peopleUpdateData.name = partnerData.name;
      if (partnerData.email !== undefined) peopleUpdateData.email = partnerData.email;
      if (partnerData.whatsapp !== undefined) peopleUpdateData.whatsapp = partnerData.whatsapp;
      if (partnerData.phone !== undefined) peopleUpdateData.phone = partnerData.phone;
      if (partnerData.description !== undefined) peopleUpdateData.description = partnerData.description;
      if (partnerData.avatar_type !== undefined) peopleUpdateData.avatar_type = partnerData.avatar_type;
      if (partnerData.avatar_seed !== undefined) peopleUpdateData.avatar_seed = partnerData.avatar_seed;
      if (company_id !== undefined) peopleUpdateData.company_id = company_id;

      if (Object.keys(peopleUpdateData).length > 0) {
        const { error: updatePeopleError } = await supabase
          .from("web_people")
          .update(peopleUpdateData)
          .eq("id", currentPartner.people_id);

        if (updatePeopleError) throw new Error(updatePeopleError.message);
      }

      // Atualizar dados do parceiro (apenas campos que existem em app_partners)
      const appPartnerUpdateData: any = {};
      if (partnerData.current_level !== undefined) appPartnerUpdateData.current_level = partnerData.current_level;
      if (partnerData.points !== undefined) appPartnerUpdateData.lifetime_xp = partnerData.points;
      if (partnerData.total_indications !== undefined) {
        // total_indications pode não existir diretamente, pode precisar ser calculado
        // Por enquanto, não atualizamos
      }

      if (Object.keys(appPartnerUpdateData).length > 0) {
        const { error: updatePartnerError } = await supabase
          .from("app_partners")
          .update(appPartnerUpdateData)
          .eq("id", partner.id);

        if (updatePartnerError) throw new Error(updatePartnerError.message);
      }

      // Buscar o parceiro atualizado para retornar
      const { data: updatedPartner, error: fetchError } = await supabase
        .from("app_partners")
        .select(`
          *,
          people:web_people(
            id,
            name,
            email,
            whatsapp,
            phone,
            linkedin,
            instagram,
            description,
            birth_date,
            avatar_type,
            avatar_seed,
            company:web_companies (
              id,
              name,
              razao_social,
              cnpj
            )
          )
        `)
        .eq("id", partner.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // Mapear para o formato Partner
      const people = updatedPartner.people;
      const mappedPartner: Partner = {
        id: updatedPartner.id,
        client_id: updatedPartner.cliente_id,
        name: people?.name || "",
        email: people?.email || "",
        whatsapp: people?.whatsapp || "",
        phone: people?.phone || null,
        linkedin: people?.linkedin || null,
        instagram: people?.instagram || null,
        description: people?.description || null,
        birth_date: people?.birth_date || null,
        avatar_type: people?.avatar_type || null,
        avatar_seed: people?.avatar_seed || null,
        partner_type: "AFILIADO" as const,
        status: "ATIVO" as const,
        company_id: people?.company?.id || null,
        company_name: people?.company?.name || null,
        company_razao_social: people?.company?.razao_social || null,
        company_cnpj: people?.company?.cnpj || null,
        current_level: updatedPartner.current_level || 1,
        points: updatedPartner.lifetime_xp || 0,
        total_indications: 0,
        created_at: updatedPartner.created_at || "",
        updated_at: updatedPartner.created_at || "",
      };

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partners", partner.id] });

      return mappedPartner;
    } catch (error) {
      console.error("Erro ao atualizar parceiro:", error);
      throw error;
    }
  };

  // Excluir um parceiro
  const deletePartner = async (id: string) => {
    if (!user?.id) throw new Error("Usuário não autenticado");

    const collaborator = await getCurrentUserData();

    if (!collaborator) throw new Error("Colaborador não encontrado");

    const { error } = await supabase
      .from("app_partners")
      .delete()
      .eq("id", id)
      .eq("cliente_id", collaborator.client_id);

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
