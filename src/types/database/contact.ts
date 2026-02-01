import { Company } from './company';
import { Person } from './person';
import { Partner } from './partner';

export interface ContactRelationship {
  id: string;
  client_id: string;
  contact_id: string;
  company_id?: string;
  person_id?: string;
  partner_id?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  person?: Person;
  partner?: Partner;
}

export interface Contact {
  id: string;
  client_id: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  description?: string;
  value?: number;
  status: 'open' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
  relationships?: ContactRelationship[];
}

// Alias para compatibilidade
export type Opportunity = Contact;
export type OpportunityRelationship = ContactRelationship; 
