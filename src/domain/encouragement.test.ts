import { describe, expect, it } from 'vitest';
import {
  FALLBACK_RULE,
  renderMessage,
  selectEncouragement,
  validatePack,
  type EncouragementPack,
  type EncouragementRule,
} from './encouragement';

const BANDA_BAJA: EncouragementRule = {
  id: 'baja',
  minRatio: 0,
  maxRatio: 0.5,
  message: 'vamos',
  tone: 'warm',
};
const BANDA_ALTA: EncouragementRule = {
  id: 'alta',
  minRatio: 0.5,
  maxRatio: Infinity,
  message: 'listo',
  tone: 'celebrate',
};
const PAQUETE: EncouragementPack = {
  id: 'prueba',
  bands: { editor: [BANDA_BAJA, BANDA_ALTA], team: [BANDA_BAJA, BANDA_ALTA] },
};

describe('selectEncouragement', () => {
  it('elige la banda que contiene el ratio', () => {
    expect(selectEncouragement({ ratio: 0.2 }, 'editor', PAQUETE).id).toBe('baja');
    expect(selectEncouragement({ ratio: 0.9 }, 'editor', PAQUETE).id).toBe('alta');
  });

  it('el límite inferior es inclusivo y el superior exclusivo', () => {
    expect(selectEncouragement({ ratio: 0.5 }, 'editor', PAQUETE).id).toBe('alta');
    expect(selectEncouragement({ ratio: 0.4999 }, 'editor', PAQUETE).id).toBe('baja');
  });

  it('cada alcance usa sus propias bandas', () => {
    const soloEditor: EncouragementPack = {
      id: 'parcial',
      bands: { editor: [BANDA_BAJA, BANDA_ALTA], team: [] },
    };
    expect(selectEncouragement({ ratio: 0.2 }, 'team', soloEditor)).toBe(FALLBACK_RULE);
  });

  it('cae al fallback si el paquete tuviera un hueco', () => {
    const roto: EncouragementPack = { id: 'roto', bands: { editor: [], team: [] } };
    expect(selectEncouragement({ ratio: 0.5 }, 'editor', roto)).toBe(FALLBACK_RULE);
  });
});

describe('validatePack detecta paquetes mal armados', () => {
  const band = (id: string, minRatio: number, maxRatio: number) =>
    ({ id, minRatio, maxRatio, message: id, tone: 'neutral' }) as const;

  // El alcance de equipo se deja válido a propósito: así los problemas que se
  // reportan son solo los del alcance que se está probando.
  const packWith = (editor: readonly EncouragementRule[]): EncouragementPack => ({
    id: 'prueba',
    bands: { editor, team: [BANDA_BAJA, BANDA_ALTA] },
  });

  it('reporta un alcance vacío', () => {
    expect(validatePack(packWith([])).join(' ')).toContain('no tiene bandas');
  });

  it('reporta que no empieza en 0', () => {
    expect(validatePack(packWith([band('a', 0.5, Infinity)])).join(' ')).toContain('debería ser 0');
  });

  it('reporta que no termina en infinito', () => {
    expect(validatePack(packWith([band('a', 0, 2)])).join(' ')).toContain('Infinity');
  });

  it('reporta un hueco entre bandas', () => {
    const problems = validatePack(
      packWith([band('a', 0, 0.4), band('b', 0.6, Infinity)]),
    ).join(' ');
    expect(problems).toContain('hueco o traslape');
  });

  it('reporta un traslape entre bandas', () => {
    const problems = validatePack(
      packWith([band('a', 0, 0.7), band('b', 0.6, Infinity)]),
    ).join(' ');
    expect(problems).toContain('hueco o traslape');
  });
});

describe('renderMessage', () => {
  it('sustituye cuántos faltan', () => {
    const rule = { ...FALLBACK_RULE, message: 'Faltan {missing}.' };
    expect(renderMessage(rule, { missing: 2 })).toBe('Faltan 2.');
  });

  it('sustituye el nombre cuando viene', () => {
    const rule = { ...FALLBACK_RULE, message: '{name}, faltan {missing}.' };
    expect(renderMessage(rule, { missing: 1, name: 'Ana' })).toBe('Ana, faltan 1.');
  });

  it('sin nombre no deja el marcador a la vista', () => {
    const rule = { ...FALLBACK_RULE, message: 'Hola {name}'.trim() };
    expect(renderMessage(rule, { missing: 0 })).not.toContain('{name}');
  });

  it('sustituye todas las apariciones', () => {
    const rule = { ...FALLBACK_RULE, message: '{missing} y {missing}' };
    expect(renderMessage(rule, { missing: 3 })).toBe('3 y 3');
  });
});
