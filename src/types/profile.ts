import { User } from "@supabase/supabase-js";

export interface UserProfile extends User {
  organizationId?: string;
  organizationName?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}
