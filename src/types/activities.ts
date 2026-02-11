// =====================================================
// TIPOS PARA SISTEMA DE ATIVIDADES DOS CARDS
// =====================================================

export interface FlowActivityType {
  id: string;
  flow_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  client_id: string;
}

/** Tipo de atividade com nome do flow (join). Usado na listagem por cliente. */
export type FlowActivityTypeWithFlow = FlowActivityType & {
  flow?: { id: string; name: string } | null;
};

export interface CardActivity {
  id: string;
  card_id: string;
  activity_type_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  assignee_id: string | null;
  creator_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client_id: string;
  step_action_id?: string | null; // Vincula a atividade ao processo que a gerou
  // Relacionamentos (opcionais, preenchidos via joins)
  activity_type?: FlowActivityType | null;
  assignee?: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  creator?: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  card?: {
    id: string;
    title: string;
    flow_id: string;
  } | null;
}

export interface CreateFlowActivityTypeInput {
  flow_id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  active?: boolean;
}

export interface UpdateFlowActivityTypeInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
  active?: boolean;
}

export interface CreateCardActivityInput {
  card_id: string;
  activity_type_id: string;
  title: string;
  description?: string | null;
  start_at: string; // ISO 8601 string
  end_at: string; // ISO 8601 string
  assignee_id?: string | null; // Se não fornecido, usa creator_id
  step_action_id?: string | null; // Vincula a atividade ao processo que a gerou
}

export interface UpdateCardActivityInput {
  activity_type_id?: string;
  title?: string;
  description?: string | null;
  start_at?: string;
  end_at?: string;
  assignee_id?: string | null;
  completed?: boolean;
}

// Agrupamento de atividades por data para exibição
export interface GroupedCardActivities {
  date: string; // ISO date string (YYYY-MM-DD)
  activities: CardActivity[];
}

// Filtros para atividades
export type ActivityFilter = 'all' | 'pending' | 'completed' | 'today' | 'upcoming';
