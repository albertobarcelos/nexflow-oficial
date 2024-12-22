import { Json } from './json';

export interface ClientDocument {
  name: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export type ClientDocumentJson = {
  [K in keyof ClientDocument]: Json;
};