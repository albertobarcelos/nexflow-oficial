export interface MockDeal {
  id: string;
  title: string;
  value?: number;
  company_id?: string;
  person_id?: string;
  stage_id: string;
  position: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  temperature?: "hot" | "warm" | "cold";
  responsible_id?: string;
  responsible_name?: string;
  probability?: number;
  notes?: string;
  last_activity?: string;
}

export interface Stage {
  id: string;
  name: string;
  color?: string;
  description?: string;
  order_index?: number;
}

export interface StageColors {
  bg: string;
  border?: string;
  accent: string;
}

export interface TemperatureTag {
  label: string;
  color: string;
}

export interface Responsible {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  is_online?: boolean;
}
