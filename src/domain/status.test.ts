import { describe, expect, it } from 'vitest';
import {
  allowedTargets,
  canTransition,
  countsTowardGoal,
  STATUS_FLOW,
  STATUS_LABELS,
  transition,
} from './status';
import { CONCEPTO_STATUSES, type ConceptoStatus } from './types';
import { instant, makeConcepto } from '../test/factories';

describe('la tabla de estados', () => {
  it('cubre todos los estados con etiqueta', () => {
    for (const status of CONCEPTO_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
      expect(STATUS_FLOW[status]).toBeDefined();
    }
  });

  it('solo "entregado" cuenta para la meta', () => {
    expect(countsTowardGoal('entregado')).toBe(true);
    expect(countsTowardGoal('en_progreso')).toBe(false);
    expect(countsTowardGoal('en_ajustes')).toBe(false);
  });

  it('ningún estado puede transicionar a sí mismo', () => {
    for (const status of CONCEPTO_STATUSES) {
      expect(allowedTargets(status)).not.toContain(status);
    }
  });
});

/** La matriz 3×3 completa, explícita: así un cambio en la tabla se nota aquí. */
describe('matriz de transiciones', () => {
  const matrix: ReadonlyArray<readonly [ConceptoStatus, ConceptoStatus, boolean]> = [
    ['en_progreso', 'en_progreso', false],
    ['en_progreso', 'en_ajustes', true],
    ['en_progreso', 'entregado', true],
    ['en_ajustes', 'en_progreso', true],
    ['en_ajustes', 'en_ajustes', false],
    ['en_ajustes', 'entregado', true],
    ['entregado', 'en_progreso', false],
    ['entregado', 'en_ajustes', true],
    ['entregado', 'entregado', false],
  ];

  it.each(matrix)('de %s a %s -> %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});

describe('transition', () => {
  const now = instant('2026-11-12T18:00:00.000Z');

  it('rechaza quedarse en el mismo estado', () => {
    const concepto = makeConcepto({ status: 'en_progreso' });
    expect(transition(concepto, 'en_progreso', now)).toEqual({
      ok: false,
      error: { kind: 'same_status', status: 'en_progreso' },
    });
  });

  it('rechaza un salto ilegal', () => {
    const concepto = makeConcepto({ status: 'entregado', deliveredAt: instant() });
    expect(transition(concepto, 'en_progreso', now)).toEqual({
      ok: false,
      error: { kind: 'illegal', from: 'entregado', to: 'en_progreso' },
    });
  });

  it('al entregar sella deliveredAt y actualiza updatedAt', () => {
    const result = transition(makeConcepto({ status: 'en_progreso' }), 'entregado', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('entregado');
    expect(result.value.deliveredAt).toBe(now);
    expect(result.value.updatedAt).toBe(now);
  });

  it('al salir de entregado limpia deliveredAt', () => {
    const entregado = makeConcepto({ status: 'entregado', deliveredAt: instant() });
    const result = transition(entregado, 'en_ajustes', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.deliveredAt).toBeNull();
  });

  it('reentregar conserva la fecha de la primera entrega', () => {
    const primera = instant('2026-11-12T09:00:00.000Z');
    const reabierto = makeConcepto({ status: 'en_ajustes', deliveredAt: primera });
    const result = transition(reabierto, 'entregado', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.deliveredAt).toBe(primera);
    expect(result.value.updatedAt).toBe(now);
  });

  it('no muta el concepto original', () => {
    const concepto = makeConcepto({ status: 'en_progreso' });
    transition(concepto, 'entregado', now);
    expect(concepto.status).toBe('en_progreso');
    expect(concepto.deliveredAt).toBeNull();
  });
});
