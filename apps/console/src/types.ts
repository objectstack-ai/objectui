/**
 * Type Definitions
 */

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  is_active: boolean;
  priority: number;
  salary?: number;
  commission_rate?: number;
  birthdate?: string;
  last_contacted?: string;
  available_time?: string;
  profile_url?: string;
  department?: string;
  resume?: any;
  avatar?: any;
  created_at?: string;
}
