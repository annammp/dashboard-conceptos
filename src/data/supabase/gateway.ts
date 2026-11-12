import type { DataGateway } from '../../ports';
import { createSupabaseClient } from './client';
import { createSupabaseAuth } from './auth';
import { createSupabaseRealtime } from './realtime';
import {
  createSupabaseConceptoRepository,
  createSupabaseDailyGoalRepository,
  createSupabaseEditorRepository,
  createSupabaseSettingsRepository,
} from './repositories';

export interface SupabaseGatewayOptions {
  readonly url: string;
  readonly anonKey: string;
}

export const createSupabaseGateway = (options: SupabaseGatewayOptions): DataGateway => {
  const client = createSupabaseClient(options.url, options.anonKey);
  return {
    conceptos: createSupabaseConceptoRepository(client),
    editors: createSupabaseEditorRepository(client),
    settings: createSupabaseSettingsRepository(client),
    dailyGoals: createSupabaseDailyGoalRepository(client),
    realtime: createSupabaseRealtime(client),
    auth: createSupabaseAuth(client),
  };
};
