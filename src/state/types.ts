import type {
  AppSettings,
  Concepto,
  DailyGoal,
  DateRange,
  Editor,
  IsoDate,
} from '../domain';
import type { RepoError, Session } from '../ports';

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface DashboardState {
  readonly status: LoadStatus;
  readonly error: RepoError | null;
  /** El día que se está viendo. Por defecto, hoy. */
  readonly selectedDate: IsoDate;
  /** La ventana cargada en memoria: cubre el día visible y el historial. */
  readonly range: DateRange;
  readonly editors: readonly Editor[];
  readonly conceptos: readonly Concepto[];
  readonly dailyGoals: readonly DailyGoal[];
  readonly settings: AppSettings;
  readonly session: Session | null;
  /** `false` cuando se perdió el tiempo real y estamos haciendo polling. */
  readonly live: boolean;
  /** Mensaje efímero para el usuario (un error de escritura, por ejemplo). */
  readonly notice: string | null;
}
