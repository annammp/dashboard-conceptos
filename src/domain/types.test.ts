import { describe, expect, it } from 'vitest';
import { asConceptoId, asEditorId, asInstant, assertNever, CONCEPTO_STATUSES } from './types';

describe('constructores de ids', () => {
  it('conservan el valor en tiempo de ejecución', () => {
    expect(asEditorId('e1')).toBe('e1');
    expect(asConceptoId('c1')).toBe('c1');
    expect(asInstant('2026-11-12T00:00:00.000Z')).toBe('2026-11-12T00:00:00.000Z');
  });
});

describe('CONCEPTO_STATUSES', () => {
  it('define los tres estados en el orden del tablero', () => {
    expect(CONCEPTO_STATUSES).toEqual(['en_progreso', 'en_ajustes', 'entregado']);
  });
});

describe('assertNever', () => {
  /**
   * En código bien tipado es inalcanzable: existe para que agregar un caso a
   * una unión rompa el build. Si en ejecución llegara algo inesperado, grita
   * en vez de seguir en silencio.
   */
  it('lanza con el valor no cubierto', () => {
    expect(() => assertNever('inesperado' as never)).toThrow('Caso no cubierto');
  });
});
