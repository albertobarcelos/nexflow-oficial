// AIDEV-NOTE: Interface estendida do usuário com campos de avatar ToyFace
// Permite suporte completo a avatares personalizados e ToyFace
import { User } from "@supabase/supabase-js";

export interface UserProfile extends User {
  organizationId?: string;
  organizationName?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  avatar_type?: string;
  avatar_seed?: string;
  custom_avatar_url?: string;
}
