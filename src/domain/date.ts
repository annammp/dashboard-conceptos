/**
 * Fechas de calendario, sin zona horaria y sin `Date`.
 *
 * Por qué: `new Date().toISOString().slice(0, 10)` devuelve la fecha **UTC**.
 * A las 7 de la noche en CDMX eso ya es el día siguiente, así que un concepto
 * entregado de noche caería en el día equivocado y la meta se vería incumplida.
 *
 * La aritmética es entera (algoritmo de días civiles de Hinnant): convertir
 * `YYYY-MM-DD` a un número de días y de vuelta. Determinista, sin zonas, sin
 * horario de verano y sin un solo `Date` construido.
 *
 * El único punto donde entra el reloj del sistema es `todayIso`, que recibe el
 * `Date` ya construido desde fuera y solo lee sus componentes **locales**.
 */

import type { DateRange, IsoDate } from './types';
import { err, ok, type Result } from './result';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, width: number): string => String(value).padStart(width, '0');

/** Días transcurridos desde 1970-01-01 para una fecha civil. */
const daysFromCivil = (year: number, month: number, day: number): number => {
  const shiftedYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(shiftedYear / 400);
  const yearOfEra = shiftedYear - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146097 + dayOfEra - 719468;
};

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** Inverso exacto de `daysFromCivil`. */
const civilFromDays = (days: number): CivilDate => {
  const shifted = days + 719468;
  const era = Math.floor(shifted / 146097);
  const dayOfEra = shifted - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const year = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthPrime = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthPrime + 2) / 5) + 1;
  const month = monthPrime + (monthPrime < 10 ? 3 : -9);
  return { year: month <= 2 ? year + 1 : year, month, day };
};

/** Formatea componentes ya válidos. Para texto externo usa `parseIsoDate`. */
export const toIsoDate = (year: number, month: number, day: number): IsoDate =>
  `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as IsoDate;

export type DateParseError = 'invalid_format' | 'invalid_date';

/**
 * Valida de verdad: `2026-02-30` tiene el formato correcto pero no existe, y se
 * detecta porque el viaje redondo a número de días no regresa lo mismo.
 */
export const parseIsoDate = (raw: string): Result<IsoDate, DateParseError> => {
  const match = ISO_DATE_PATTERN.exec(raw);
  if (match === null) return err('invalid_format');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // El viaje redondo es la validación completa: un mes 13, un día 0 o un
  // 30 de febrero normalizan a otra fecha y por eso no regresan iguales.
  // No hace falta además comprobar los rangos a mano.
  const roundTrip = civilFromDays(daysFromCivil(year, month, day));
  const same = roundTrip.year === year && roundTrip.month === month && roundTrip.day === day;
  return same ? ok(toIsoDate(year, month, day)) : err('invalid_date');
};

export const isoParts = (date: IsoDate): CivilDate => {
  const match = ISO_DATE_PATTERN.exec(date);
  /* c8 ignore next */
  if (match === null) throw new Error(`IsoDate malformada: ${date}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

export const dayNumber = (date: IsoDate): number => {
  const { year, month, day } = isoParts(date);
  return daysFromCivil(year, month, day);
};

export const fromDayNumber = (days: number): IsoDate => {
  const { year, month, day } = civilFromDays(days);
  return toIsoDate(year, month, day);
};

/**
 * El único punto de contacto con el reloj. Lee los componentes **locales** del
 * `Date` que recibe, así que el día es el del calendario de quien mira la
 * pantalla, no el de UTC.
 */
export const todayIso = (now: Date): IsoDate =>
  toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

export const addDays = (date: IsoDate, amount: number): IsoDate =>
  fromDayNumber(dayNumber(date) + amount);

export const compareIso = (left: IsoDate, right: IsoDate): -1 | 0 | 1 => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

export const daysBetween = (range: DateRange): number =>
  dayNumber(range.to) - dayNumber(range.from);

/** Días del rango, inclusive en ambos extremos. Vacío si está invertido. */
export const enumerateDays = (range: DateRange): readonly IsoDate[] => {
  const start = dayNumber(range.from);
  const end = dayNumber(range.to);
  const days: IsoDate[] = [];
  for (let current = start; current <= end; current += 1) {
    days.push(fromDayNumber(current));
  }
  return days;
};

/** Ventana de `count` días que termina en `end`. `lastNDays(hoy, 7)` = esta semana. */
export const lastNDays = (end: IsoDate, count: number): DateRange => ({
  from: addDays(end, -(Math.max(1, count) - 1)),
  to: end,
});

/** 0 = domingo, 6 = sábado. 1970-01-01 fue jueves. */
export const weekdayIndex = (date: IsoDate): number => {
  const days = dayNumber(date);
  return ((((days + 4) % 7) + 7) % 7);
};
