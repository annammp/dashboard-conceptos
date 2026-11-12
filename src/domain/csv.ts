/**
 * Serialización CSV según RFC 4180: se entrecomilla cuando hay coma, comillas o
 * salto de línea, y las comillas internas se duplican. Sin esto, el título de
 * un concepto con una coma rompe todas las columnas del archivo.
 */

import { STATUS_LABELS } from './status';
import type { Concepto, EditorId } from './types';

export interface CsvColumn<T> {
  readonly header: string;
  readonly value: (row: T) => string;
}

const NEEDS_QUOTES = /[",\r\n]/;

export const escapeCell = (raw: string): string =>
  NEEDS_QUOTES.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;

const toRow = <T>(row: T, columns: readonly CsvColumn<T>[]): string =>
  columns.map((column) => escapeCell(column.value(row))).join(',');

export const toCsv = <T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string => {
  const header = columns.map((column) => escapeCell(column.header)).join(',');
  return [header, ...rows.map((row) => toRow(row, columns))].join('\r\n');
};

/** Excel y Sheets necesitan el BOM para leer los acentos como UTF-8. */
export const CSV_BOM = '﻿';

export const conceptoCsvColumns = (
  editorName: (id: EditorId) => string,
): readonly CsvColumn<Concepto>[] => [
  { header: 'fecha', value: (concepto) => concepto.date },
  { header: 'editor', value: (concepto) => editorName(concepto.editorId) },
  { header: 'titulo', value: (concepto) => concepto.title },
  { header: 'estado', value: (concepto) => STATUS_LABELS[concepto.status] },
  { header: 'entregado_en', value: (concepto) => concepto.deliveredAt ?? '' },
  { header: 'creado_en', value: (concepto) => concepto.createdAt },
  { header: 'actualizado_en', value: (concepto) => concepto.updatedAt },
];
