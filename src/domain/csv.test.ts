import { beforeEach, describe, expect, it } from 'vitest';
import { conceptoCsvColumns, escapeCell, toCsv } from './csv';
import { asEditorId, type EditorId } from './types';
import { instant, makeConcepto, resetSequence, TODAY } from '../test/factories';

beforeEach(resetSequence);

describe('escapeCell', () => {
  it('deja en paz el texto simple', () => {
    expect(escapeCell('Concepto uno')).toBe('Concepto uno');
  });

  it('entrecomilla cuando hay coma: si no, se rompen las columnas', () => {
    expect(escapeCell('uno, dos')).toBe('"uno, dos"');
  });

  it('duplica las comillas internas', () => {
    expect(escapeCell('el "mejor" concepto')).toBe('"el ""mejor"" concepto"');
  });

  it('entrecomilla los saltos de línea', () => {
    expect(escapeCell('linea1\nlinea2')).toBe('"linea1\nlinea2"');
    expect(escapeCell('linea1\r\nlinea2')).toBe('"linea1\r\nlinea2"');
  });

  it('no toca los acentos ni la eñe', () => {
    expect(escapeCell('Diseño de la campaña')).toBe('Diseño de la campaña');
  });

  it('una celda vacía queda vacía', () => {
    expect(escapeCell('')).toBe('');
  });
});

describe('toCsv', () => {
  const columns = [
    { header: 'a', value: (row: { a: string; b: string }) => row.a },
    { header: 'b', value: (row: { a: string; b: string }) => row.b },
  ];

  it('escribe encabezado y filas separadas por CRLF', () => {
    expect(toCsv([{ a: '1', b: '2' }], columns)).toBe('a,b\r\n1,2');
  });

  it('sin filas deja solo el encabezado', () => {
    expect(toCsv([], columns)).toBe('a,b');
  });

  it('escapa también los encabezados', () => {
    const raros = [{ header: 'con,coma', value: () => 'x' }];
    expect(toCsv([{}], raros)).toBe('"con,coma"\r\nx');
  });
});

describe('conceptoCsvColumns', () => {
  const ana = asEditorId('editor-ana');
  const nombre = (id: EditorId): string => (id === ana ? 'Ana' : 'Desconocido');

  it('exporta las columnas esperadas en orden', () => {
    const headers = conceptoCsvColumns(nombre).map((column) => column.header);
    expect(headers).toEqual([
      'fecha',
      'editor',
      'titulo',
      'estado',
      'entregado_en',
      'creado_en',
      'actualizado_en',
    ]);
  });

  it('traduce el estado a su etiqueta legible', () => {
    const concepto = makeConcepto({ editorId: ana, status: 'en_ajustes', title: 'Reel 1' });
    const csv = toCsv([concepto], conceptoCsvColumns(nombre));
    expect(csv).toContain('En ajustes');
    expect(csv).toContain('Ana');
    expect(csv).toContain(TODAY);
  });

  it('un concepto sin entregar deja la celda de entrega vacía', () => {
    const concepto = makeConcepto({ editorId: ana, deliveredAt: null });
    const linea = toCsv([concepto], conceptoCsvColumns(nombre)).split('\r\n')[1] ?? '';
    expect(linea.split(',')[4]).toBe('');
  });

  it('un título con coma y acentos sobrevive el viaje', () => {
    const concepto = makeConcepto({
      editorId: ana,
      title: 'Campaña de otoño, versión "corta"',
      status: 'entregado',
      deliveredAt: instant(),
    });
    const csv = toCsv([concepto], conceptoCsvColumns(nombre));
    expect(csv).toContain('"Campaña de otoño, versión ""corta"""');
  });
});
