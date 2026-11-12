/**
 * La "base de datos" local: un objeto JSON en `localStorage`.
 *
 * No es un juguete. Es el driver de desarrollo, el doble de prueba y lo que
 * hace que las pruebas end-to-end sean herméticas y deterministas. Cumple
 * exactamente el mismo contrato que el adaptador de Supabase.
 */

import type { AppSettings, Concepto, DailyGoal, Editor } from '../../domain';
import type { ChangeEvent } from '../../ports';

export const DB_VERSION = 1;
export const STORAGE_KEY = `conceptos.v${String(DB_VERSION)}`;

export interface LocalDb {
  readonly version: number;
  readonly editors: readonly Editor[];
  readonly conceptos: readonly Concepto[];
  readonly dailyGoals: readonly DailyGoal[];
  readonly settings: AppSettings;
}

export interface LocalDbHandle {
  get(): LocalDb;
  /** Persiste y avisa a las demás pestañas. */
  set(next: LocalDb): void;
  /** Notifica a esta pestaña. */
  emit(event: ChangeEvent): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Validación de forma, no de contenido: basta para no explotar con datos
 * viejos o corruptos y caer al estado inicial en su lugar.
 */
export const isLocalDb = (value: unknown): value is LocalDb =>
  isRecord(value) &&
  value['version'] === DB_VERSION &&
  Array.isArray(value['editors']) &&
  Array.isArray(value['conceptos']) &&
  Array.isArray(value['dailyGoals']) &&
  isRecord(value['settings']);
