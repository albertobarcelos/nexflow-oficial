import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Person {
  id: string;
  name: string;
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  cargo?: string;
  client_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_type?: string;
  avatar_seed?: string;
  custom_avatar_url?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  deal_id: string;
  assigned_to?: string;
  created_at: string;
}

interface HistoryEvent {
  id: string;
  deal_id: string;
  description: string;
  details?: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  sector?: string;
  size?: string;
  revenue?: string;
}

export function usePeopleAndPartners(dealId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch people
  const {
    data: people,
    isLoading: isLoadingPeople,
    error: peopleError
  } = useQuery({
    queryKey: ["deal-people", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_people")
        .select(`
          id,
          name,
          email,
          phone,
          role,
          type,
          created_at
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Fetch company
  const {
    data: company,
    isLoading: isLoadingCompany,
    error: companyError
  } = useQuery({
    queryKey: ["deal-company", dealId],
    queryFn: async () => {
      const { data: deal } = await supabase
        .from("deals")
        .select("company_id")
        .eq("id", dealId)
        .single();

      if (!deal?.company_id) return null;

      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          email,
          phone,
          website,
          address,
          city,
          state,
          country,
          sector,
          size,
          revenue
        `)
        .eq("id", deal.company_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!dealId
  });

  // Fetch history
  const {
    data: history,
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery({
    queryKey: ["deal-history", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_history")
        .select(`
          id,
          deal_id,
          user_id,
          description,
          details,
          type,
          created_at,
          user:users(
            id,
            email,
            raw_user_meta_data->name as name,
            raw_user_meta_data->avatar_url as avatar_url
          )
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error);
        throw error;
      }

      return data || [];
    }
  });

  // Fetch partners
  const { data: partners = [], isLoading: isLoadingPartners } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("client_id")
        .eq("id", dealId)
        .single();

      if (dealError) throw dealError;

      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("client_id", deal.client_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!dealId
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["deal-tasks", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_to:users(id, name)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!dealId
  });

  // Add person
  const addPerson = useMutation({
    mutationFn: async (data: {
      name: string;
      email?: string;
      telefone?: string;
      cargo?: string;
      type?: string;
    }) => {
      const { data: deal } = await supabase
        .from("deals")
        .select("client_id")
        .eq("id", dealId)
        .single();

      if (!deal) throw new Error("Deal not found");

      const { data: person, error } = await supabase
        .from("deal_people")
        .insert([{
          deal_id: dealId,
          name: data.name,
          email: data.email,
          phone: data.telefone,
          role: data.cargo,
          type: data.type || "contact",
          client_id: deal.client_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to history
      await supabase.from("deal_history").insert([{
        deal_id: dealId,
        user_id: user?.id,
        description: `Adicionou ${data.name} como contato`,
        details: {
          personName: data.name,
          personRole: data.cargo,
          personType: data.type || "contact"
        },
        type: "person_added",
        client_id: deal.client_id
      }]);

      return person;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["deal-people", dealId]);
      queryClient.invalidateQueries(["deal-history", dealId]);
    }
  });

  // Remove person
  const removePerson = useMutation({
    mutationFn: async (personId: string) => {
      const { data: person } = await supabase
        .from("deal_people")
        .select("name, client_id")
        .eq("id", personId)
        .single();

      const { error } = await supabase
        .from("deal_people")
        .delete()
        .eq("id", personId);

      if (error) throw error;

      // Add to history
      await supabase.from("deal_history").insert([{
        deal_id: dealId,
        user_id: user?.id,
        description: `Removeu ${person?.name} dos contatos`,
        details: {
          personName: person?.name
        },
        type: "person_removed",
        client_id: person?.client_id
      }]);

      return personId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["deal-people", dealId]);
      queryClient.invalidateQueries(["deal-history", dealId]);
    }
  });

  // Add task
  const addTask = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      dueDate: string;
      assignedTo?: string;
    }) => {
      const { data: deal } = await supabase
        .from("deals")
        .select("client_id")
        .eq("id", dealId)
        .single();

      if (!deal) throw new Error("Deal not found");

      const { data: task, error } = await supabase
        .from("tasks")
        .insert([{
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          deal_id: dealId,
          assigned_to: data.assignedTo,
          client_id: deal.client_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to history
      await supabase.from("deal_history").insert([{
        deal_id: dealId,
        user_id: user?.id,
        description: "Criou uma nova tarefa",
        details: {
          taskTitle: data.title,
          dueDate: data.dueDate
        },
        type: "task_created",
        client_id: deal.client_id
      }]);

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["deal-tasks", dealId]);
      queryClient.invalidateQueries(["deal-history", dealId]);
    }
  });

  // Complete task
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .update({ completed: true })
        .eq("id", taskId)
        .select()
        .single();

      if (taskError) throw taskError;

      // Add to history
      await supabase.from("deal_history").insert([{
        deal_id: dealId,
        user_id: user?.id,
        description: "Completou uma tarefa",
        details: {
          taskTitle: task.title
        },
        type: "task_completed",
        client_id: task.client_id
      }]);

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["deal-tasks", dealId]);
      queryClient.invalidateQueries(["deal-history", dealId]);
    }
  });

  return {
    people,
    isLoadingPeople,
    peopleError,
    company,
    isLoadingCompany,
    companyError,
    history,
    isLoadingHistory,
    historyError,
    tasks,
    isLoadingTasks,
    addTask,
    completeTask,
    addPerson,
    removePerson
  };
}
