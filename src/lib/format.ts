/**
 * Formato para mostrar. Construye el `Date` en UTC y lo formatea en UTC a
 * propósito: así la etiqueta corresponde exactamente a la fecha de calendario
 * y no se corre un día según dónde esté quien mira.
 */

import { isoParts, type IsoDate } from '../domain';

const LOCALE = 'es-MX';

const atUtcNoon = (date: IsoDate): Date => {
  const { year, month, day } = isoParts(date);
  return new Date(Date.UTC(year, month - 1, day, 12));
};

const formatWith = (date: IsoDate, options: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' }).format(atUtcNoon(date));

/** "jue 12" — para los ejes de la gráfica. */
export const formatDayShort = (date: IsoDate): string =>
  formatWith(date, { weekday: 'short', day: 'numeric' });

/** "jueves, 12 de noviembre" — para encabezados. */
export const formatDayLong = (date: IsoDate): string =>
  formatWith(date, { weekday: 'long', day: 'numeric', month: 'long' });

export const formatPercent = (ratio: number): string =>
  new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);

/** "2 conceptos" / "1 concepto" — para que el texto no diga "1 conceptos". */
export const pluralize = (count: number, singular: string, plural: string): string =>
  `${String(count)} ${count === 1 ? singular : plural}`;
