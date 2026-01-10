import { useCallback } from "react";
import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";
import type { User } from "@/types/database";
import type { Team } from "@/types/entities";

export function useBoardSearch() {
  const normalizeSearchTerm = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }, []);

  const searchCards = useCallback(
    (cards: NexflowCard[], searchQuery: string, users: User[], teams: Team[]): NexflowCard[] => {
      if (!searchQuery.trim()) {
        return cards;
      }

      const normalizedQuery = normalizeSearchTerm(searchQuery);
      const statusMap: Record<string, string> = {
        inprogress: 'em progresso',
        completed: 'concluído',
        canceled: 'cancelado',
      };

      return cards.filter((card) => {
        // Buscar no título
        if (normalizeSearchTerm(card.title).includes(normalizedQuery)) {
          return true;
        }

        // Buscar no status (traduzido)
        if (card.status && statusMap[card.status]) {
          if (normalizeSearchTerm(statusMap[card.status]).includes(normalizedQuery)) {
            return true;
          }
        }

        // Buscar na data formatada
        try {
          const createdDate = new Date(card.createdAt);
          const formattedDate = createdDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          if (normalizeSearchTerm(formattedDate).includes(normalizedQuery)) {
            return true;
          }
        } catch {
          // Ignorar erros de data
        }

        // Buscar no nome do usuário atribuído
        if (card.assignedTo) {
          const assignedUser = users.find((u) => u.id === card.assignedTo);
          if (assignedUser) {
            const fullName = `${assignedUser.name} ${assignedUser.surname}`;
            if (normalizeSearchTerm(fullName).includes(normalizedQuery)) {
              return true;
            }
          }
        }

        // Buscar no nome do time atribuído
        if (card.assignedTeamId) {
          const assignedTeam = teams.find((t) => t.id === card.assignedTeamId);
          if (assignedTeam) {
            if (normalizeSearchTerm(assignedTeam.name).includes(normalizedQuery)) {
              return true;
            }
          }
        }

        // Buscar em fieldValues
        const fieldValuesStr = Object.values(card.fieldValues)
          .map((value) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'number') return value.toString();
            if (Array.isArray(value)) return value.join(' ');
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          })
          .join(' ');

        if (normalizeSearchTerm(fieldValuesStr).includes(normalizedQuery)) {
          return true;
        }

        // Buscar em checklistProgress (itens marcados)
        const checklistItems = Object.entries(card.checklistProgress || {})
          .flatMap(([fieldId, progress]) => {
            if (typeof progress === 'object' && progress !== null) {
              return Object.entries(progress as Record<string, boolean>)
                .filter(([, checked]) => checked)
                .map(([item]) => item);
            }
            return [];
          })
          .join(' ');

        if (normalizeSearchTerm(checklistItems).includes(normalizedQuery)) {
          return true;
        }

        return false;
      });
    },
    [normalizeSearchTerm]
  );

  return {
    searchCards,
    normalizeSearchTerm,
  };
}

