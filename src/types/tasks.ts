export interface TaskType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  scheduled_date: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  deal_id: string;
}
