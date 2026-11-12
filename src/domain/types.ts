/**
 * Tipos del dominio. Puro: ni React, ni red, ni DOM.
 *
 * Los ids y las fechas son *branded*: aunque en tiempo de ejecución son
 * `string`, el compilador no deja confundir un `EditorId` con un `IsoDate`.
 * Eso convierte "invertí dos argumentos" de un bug silencioso en un error de
 * compilación.
 */

declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

/** Fecha de calendario, `YYYY-MM-DD`. Nunca lleva hora ni zona. */
export type IsoDate = Brand<string, 'IsoDate'>;

/** Instante absoluto en ISO-8601 (UTC). Solo para auditoría, nunca para agrupar por día. */
export type Instant = Brand<string, 'Instant'>;

export type EditorId = Brand<string, 'EditorId'>;
export type ConceptoId = Brand<string, 'ConceptoId'>;

export const asEditorId = (raw: string): EditorId => raw as EditorId;
export const asConceptoId = (raw: string): ConceptoId => raw as ConceptoId;
export const asInstant = (raw: string): Instant => raw as Instant;

/**
 * El orden importa: la UI dibuja las columnas a partir de esta tupla, así que
 * agregar un estado aquí lo agrega al tablero y rompe el build en cada `switch`
 * que no lo cubra.
 */
export const CONCEPTO_STATUSES = ['en_progreso', 'en_ajustes', 'entregado'] as const;

export type ConceptoStatus = (typeof CONCEPTO_STATUSES)[number];

export interface Editor {
  readonly id: EditorId;
  readonly name: string;
  /** Conceptos entregados esperados por día. */
  readonly dailyGoal: number;
  /** Quitar un editor es desactivarlo: borrarlo perdería historial. */
  readonly active: boolean;
  readonly sortOrder: number;
}

export interface Concepto {
  readonly id: ConceptoId;
  readonly editorId: EditorId;
  /** El día al que pertenece el concepto. */
  readonly date: IsoDate;
  readonly title: string;
  readonly status: ConceptoStatus;
  readonly deliveredAt: Instant | null;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
}

export interface AppSettings {
  /** `null` = la meta de equipo es la suma de las metas de los editores activos. */
  readonly teamGoalOverride: number | null;
  readonly encouragementPackId: string;
}

/** Rango inclusivo en ambos extremos. */
export interface DateRange {
  readonly from: IsoDate;
  readonly to: IsoDate;
}

/**
 * Congela la meta que tenía un editor un día dado. Sin esto, subir la meta de 4
 * a 5 re-calificaría todos los días pasados y el historial mentiría.
 */
export interface DailyGoal {
  readonly editorId: EditorId;
  readonly date: IsoDate;
  readonly goal: number;
}

/** Hace imposible olvidar un caso de una unión: el compilador lo exige. */
export const assertNever = (value: never): never => {
  throw new Error(`Caso no cubierto: ${JSON.stringify(value)}`);
};
