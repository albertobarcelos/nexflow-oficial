export * from './json';
export * from './document';
export * from './history';
export * from './client';
export * from './admin';
export * from './license';
export * from './report';
export * from './collaborator';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      collaborators: {
        Row: {
          id: string;
          auth_user_id: string;
          client_id: string;
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          client_id: string;
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          client_id?: string;
          name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      people: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          cpf: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          cpf?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          cpf?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
