import { describe, expect, it } from 'vitest';
import {
  ENCOURAGEMENT_SCOPES,
  FALLBACK_RULE,
  selectEncouragement,
  validatePack,
  type EncouragementPack,
} from '../domain/encouragement';
import { DEFAULT_ENCOURAGEMENT_PACK } from './encouragement.pack';

describe('el paquete por defecto es válido', () => {
  it('no tiene huecos ni traslapes en ningún alcance', () => {
    expect(validatePack(DEFAULT_ENCOURAGEMENT_PACK)).toEqual([]);
  });

  /**
   * La prueba que evita que cambiar la copy rompa el banner en silencio: barre
   * los ratios y exige que siempre caiga una frase real, nunca el fallback.
   */
  it.each(ENCOURAGEMENT_SCOPES)('cubre todos los ratios de 0 a 3 (%s)', (scope) => {
    for (let ratio = 0; ratio <= 3; ratio = Number((ratio + 0.005).toFixed(3))) {
      const rule = selectEncouragement({ ratio }, scope, DEFAULT_ENCOURAGEMENT_PACK);
      expect(rule.id, `ratio ${String(ratio)} quedó sin frase`).not.toBe(FALLBACK_RULE.id);
    }
  });

  it('un ratio enorme sigue cayendo en la banda más alta', () => {
    const rule = selectEncouragement({ ratio: 1000 }, 'editor', DEFAULT_ENCOURAGEMENT_PACK);
    expect(rule.tone).toBe('celebrate');
  });
});

describe('selectEncouragement', () => {
  it('con cero entregados invita a arrancar', () => {
    expect(selectEncouragement({ ratio: 0 }, 'editor', DEFAULT_ENCOURAGEMENT_PACK).id).toBe(
      'sin_arrancar',
    );
  });

  it('a 3 de 4 avisa que ya casi', () => {
    const rule = selectEncouragement({ ratio: 0.75 }, 'editor', DEFAULT_ENCOURAGEMENT_PACK);
    expect(rule.id).toBe('cerca');
    expect(rule.message).toContain('Ya casi');
  });

  it('al cumplir la meta celebra', () => {
    const rule = selectEncouragement({ ratio: 1 }, 'editor', DEFAULT_ENCOURAGEMENT_PACK);
    expect(rule.id).toBe('meta');
    expect(rule.tone).toBe('celebrate');
  });

  it('el límite inferior es inclusivo y el superior exclusivo', () => {
    expect(selectEncouragement({ ratio: 0.6 }, 'editor', DEFAULT_ENCOURAGEMENT_PACK).id).toBe(
      'cerca',
    );
    expect(selectEncouragement({ ratio: 0.85 }, 'editor', DEFAULT_ENCOURAGEMENT_PACK).id).toBe(
      'casi',
    );
  });

  it('el alcance de equipo tiene su propia copy', () => {
    const rule = selectEncouragement({ ratio: 1 }, 'team', DEFAULT_ENCOURAGEMENT_PACK);
    expect(rule.id).toBe('equipo_meta');
    expect(rule.message).toContain('equipo');
  });

  it('cae al fallback si el paquete tuviera un hueco', () => {
    const roto: EncouragementPack = { id: 'roto', bands: { editor: [], team: [] } };
    expect(selectEncouragement({ ratio: 0.5 }, 'editor', roto)).toBe(FALLBACK_RULE);
  });
});
