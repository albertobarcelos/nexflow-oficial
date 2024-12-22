import { ClientDocument } from './document';
import { ClientHistoryEntry } from './history';
import { Json } from './json';

export interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string;
  crm_id: string | null;
  partner_portal_id: string | null;
  status: 'active' | 'inactive';
  plan: 'free' | 'premium';
  contact_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  tax_id: string;
  documents: ClientDocument[];
  history: ClientHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface ClientRow extends Omit<Client, 'documents' | 'history'> {
  documents: Json;
  history: Json;
}

export const mapClientRowToClient = (row: any): Client => ({
  ...row,
  documents: (row.documents as any[] || []).map((doc: any) => ({
    name: doc.name,
    path: doc.path,
    type: doc.type,
    size: doc.size,
    uploadedAt: doc.uploadedAt
  })),
  history: (row.history as any[] || []).map((entry: any) => ({
    timestamp: entry.timestamp,
    action: entry.action,
    changes: entry.changes,
    user: entry.user
  }))
});

export const mapClientToClientRow = (client: Client): ClientRow => ({
  ...client,
  documents: client.documents.map(doc => ({
    name: doc.name,
    path: doc.path,
    type: doc.type,
    size: doc.size,
    uploadedAt: doc.uploadedAt
  })),
  history: client.history.map(entry => ({
    timestamp: entry.timestamp,
    action: entry.action,
    changes: entry.changes,
    user: entry.user
  }))
});