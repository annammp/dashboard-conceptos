/** Todo lo que la app necesita del exterior, en un solo objeto inyectable. */

import type { AuthPort } from './auth';
import type { RealtimePort } from './realtime';
import type {
  ConceptoRepository,
  DailyGoalRepository,
  EditorRepository,
  SettingsRepository,
} from './repositories';

export interface DataGateway {
  readonly conceptos: ConceptoRepository;
  readonly editors: EditorRepository;
  readonly settings: SettingsRepository;
  readonly dailyGoals: DailyGoalRepository;
  readonly realtime: RealtimePort;
  readonly auth: AuthPort;
}
