import { Database } from "./supabase";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Partner {
  id: string;
  name: string;
  avatar_type?: string;
  avatar_seed?: string;
  custom_avatar_url?: string;
  status?: "online" | "offline" | "away";
}

export interface Company {
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

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  position: number;
  stage_id: string;
  funnel_id: string;
  partner?: Partner;
  tags?: Tag[];
  company?: Company;
  company_id?: string;
  people?: Person;
  next_contact?: string;
  created_at: string;
  updated_at: string;
}

export type DealRow = Database["public"]["Tables"]["deals"]["Row"];
