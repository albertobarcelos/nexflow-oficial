import { useMemo } from "react";
import { useOpportunities, Contact } from "@/hooks/useOpportunities";
import { useIndications } from "@/hooks/useIndications";
import { Indication, Hunter } from "@/types/indications";

/**
 * Contato unificado que pode ser um contato normal ou uma indicação
 */
export interface UnifiedContact extends Contact {
  isIndication: boolean;
  indicationId?: string;
  hunter?: Hunter | null;
  indicationStatus?: "pending" | "processed" | "converted" | "rejected";
}

interface UseContactsWithIndicationsOptions {
  enabled?: boolean;
  filterTypes?: ("cliente" | "parceiro" | "indicações")[];
}

/**
 * Hook que combina contatos e indicações em uma única lista unificada
 */
export function useContactsWithIndications(
  options: UseContactsWithIndicationsOptions = {}
) {
  const { enabled = true, filterTypes } = options;

  // Buscar contatos
  const {
    contacts,
    isLoading: isLoadingContacts,
    isError: isErrorContacts,
    error: errorContacts,
  } = useOpportunities({ enabled });

  // Buscar indicações
  const {
    indications,
    isLoading: isLoadingIndications,
    isError: isErrorIndications,
    error: errorIndications,
  } = useIndications();

  // Combinar e normalizar dados
  const unifiedContacts = useMemo((): UnifiedContact[] => {
    const result: UnifiedContact[] = [];

    // Adicionar contatos normais
    contacts.forEach((contact) => {
      result.push({
        ...contact,
        isIndication: false,
      });
    });

    // Adicionar indicações como contatos unificados
    indications.forEach((indication) => {
      // Mapear indicação para formato de contato
      const unifiedContact: UnifiedContact = {
        id: `indication_${indication.id}`, // Prefixo para evitar conflitos
        client_id: indication.client_id,
        client_name: indication.indication_name || "Indicação sem nome",
        main_contact: indication.responsible || null,
        phone_numbers: indication.phone ? [indication.phone] : [],
        company_names: [],
        tax_ids: indication.cnpj_cpf ? [indication.cnpj_cpf] : [],
        related_card_ids: indication.related_card_ids || [],
        assigned_team_id: null,
        avatar_type: undefined,
        avatar_seed: undefined,
        created_at: indication.created_at,
        updated_at: indication.updated_at,
        contact_type: null, // Indicações não têm tipo de contato ainda
        indicated_by: null,
        isIndication: true,
        indicationId: indication.id,
        hunter: indication.hunter || null,
        indicationStatus: indication.status,
      };

      result.push(unifiedContact);
    });

    return result;
  }, [contacts, indications]);

  // Aplicar filtros se especificados
  const filteredContacts = useMemo(() => {
    if (!filterTypes || filterTypes.length === 0) {
      return unifiedContacts;
    }

    return unifiedContacts.filter((contact) => {
      // Filtro para indicações
      if (filterTypes.includes("indicações") && contact.isIndication) {
        return true;
      }

      // Filtro para tipos de contato
      if (!contact.isIndication && contact.contact_type) {
        // Verificar se algum tipo do contato está nos filtros selecionados
        const hasMatchingType = filterTypes.some((filterType) => {
          if (filterType === "indicações") return false;
          return contact.contact_type?.includes(filterType);
        });
        return hasMatchingType;
      }

      // Se não tem tipo definido e não é indicação, não mostrar se há filtros
      if (!contact.isIndication && !contact.contact_type) {
        return false;
      }

      return false;
    });
  }, [unifiedContacts, filterTypes]);

  return {
    contacts: filteredContacts,
    unifiedContacts, // Lista completa sem filtros
    isLoading: isLoadingContacts || isLoadingIndications,
    isError: isErrorContacts || isErrorIndications,
    error: errorContacts || errorIndications,
    contactsCount: contacts.length,
    indicationsCount: indications.length,
  };
}
