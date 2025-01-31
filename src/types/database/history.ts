import { Json } from './json';

export interface ClientHistoryEntry {
  timestamp: string;
  action: string;
  changes: Record<string, { old: any; new: any }>;
  user?: string;
}

export type ClientHistoryEntryJson = {
  [K in keyof ClientHistoryEntry]: Json;
};
