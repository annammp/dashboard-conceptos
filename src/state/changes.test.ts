import { describe, expect, it } from 'vitest';
import { applyChange } from './changes';
import { initialState } from './load';
import { createFakeClock } from '../test/fakes';
import { instant, isoDate, makeConcepto, makeEditor, TODAY } from '../test/factories';
import type { DashboardState } from './types';

const base = (): DashboardState => ({
  ...initialState(createFakeClock().clock),
  status: 'ready',
  range: { from: isoDate('2026-11-06'), to: TODAY },
  selectedDate: TODAY,
});

describe('applyChange', () => {
  it('agrega un concepto nuevo que llega de fuera', () => {
    const row = makeConcepto({ date: TODAY });
    expect(applyChange(base(), { entity: 'concepto', op: 'upsert', row }).conceptos).toEqual([row]);
  });

  it('ignora conceptos de días que no tenemos cargados', () => {
    const row = makeConcepto({ date: isoDate('2020-01-01') });
    expect(applyChange(base(), { entity: 'concepto', op: 'upsert', row }).conceptos).toEqual([]);
  });

  it('reemplaza un concepto existente por id', () => {
    const row = makeConcepto({ date: TODAY, title: 'viejo' });
    const state = { ...base(), conceptos: [row] };
    const nuevo = { ...row, title: 'nuevo', updatedAt: instant('2026-11-12T20:00:00.000Z') };
    const result = applyChange(state, { entity: 'concepto', op: 'upsert', row: nuevo });
    expect(result.conceptos).toHaveLength(1);
    expect(result.conceptos[0]?.title).toBe('nuevo');
  });

  /** Gana el updatedAt más reciente, que lo pone el servidor y no el reloj de cada laptop. */
  it('no pisa un cambio más nuevo con uno más viejo', () => {
    const nuevo = makeConcepto({
      date: TODAY,
      title: 'nuevo',
      updatedAt: instant('2026-11-12T20:00:00.000Z'),
    });
    const viejo = { ...nuevo, title: 'viejo', updatedAt: instant('2026-11-12T10:00:00.000Z') };
    const state = { ...base(), conceptos: [nuevo] };
    const result = applyChange(state, { entity: 'concepto', op: 'upsert', row: viejo });
    expect(result.conceptos[0]?.title).toBe('nuevo');
  });

  /** Que un cambio propio vuelva por el websocket no debe duplicar nada. */
  it('aplicar dos veces el mismo evento deja el mismo resultado', () => {
    const row = makeConcepto({ date: TODAY });
    const event = { entity: 'concepto', op: 'upsert', row } as const;
    const once = applyChange(base(), event);
    expect(applyChange(once, event).conceptos).toEqual(once.conceptos);
  });

  it('elimina un concepto', () => {
    const row = makeConcepto({ date: TODAY });
    const state = { ...base(), conceptos: [row] };
    const result = applyChange(state, { entity: 'concepto', op: 'delete', id: row.id });
    expect(result.conceptos).toEqual([]);
  });

  it('agrega y actualiza editores', () => {
    const editor = makeEditor({ name: 'Ana' });
    const conEditor = applyChange(base(), { entity: 'editor', op: 'upsert', row: editor });
    expect(conEditor.editors).toEqual([editor]);
    const renombrado = { ...editor, name: 'Ana M.' };
    const result = applyChange(conEditor, { entity: 'editor', op: 'upsert', row: renombrado });
    expect(result.editors).toHaveLength(1);
    expect(result.editors[0]?.name).toBe('Ana M.');
  });

  it('elimina un editor', () => {
    const editor = makeEditor();
    const state = { ...base(), editors: [editor] };
    expect(applyChange(state, { entity: 'editor', op: 'delete', id: editor.id }).editors).toEqual(
      [],
    );
  });

  it('reemplaza los ajustes', () => {
    const row = { teamGoalOverride: 12, encouragementPackId: 'default' };
    expect(applyChange(base(), { entity: 'settings', op: 'upsert', row }).settings).toEqual(row);
  });

  it('una invalidación no cambia el estado: la recarga la hace el store', () => {
    const state = base();
    expect(applyChange(state, { entity: 'all', op: 'invalidate' })).toBe(state);
  });
});
