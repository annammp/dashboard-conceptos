import { describe, expect, it } from 'vitest';
import { allOk, err, isOk, mapResult, ok, unwrapOr } from './result';

describe('Result', () => {
  it('ok envuelve un valor', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
  });

  it('err envuelve un error', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' });
  });

  it('isOk discrimina', () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isOk(err('boom'))).toBe(false);
  });

  it('unwrapOr devuelve el valor o el respaldo', () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err<string>('boom'), 0)).toBe(0);
  });

  it('mapResult transforma solo el caso feliz', () => {
    expect(mapResult(ok(2), (value) => value * 3)).toEqual({ ok: true, value: 6 });
    expect(mapResult(err<string>('boom'), (value: number) => value * 3)).toEqual({
      ok: false,
      error: 'boom',
    });
  });

  it('allOk recoge todos los valores', () => {
    expect(allOk([ok(1), ok(2)])).toEqual({ ok: true, value: [1, 2] });
  });

  it('allOk falla con el primer error', () => {
    expect(allOk([ok(1), err<string>('primero'), err<string>('segundo')])).toEqual({
      ok: false,
      error: 'primero',
    });
  });

  it('allOk de una lista vacía es ok', () => {
    expect(allOk([])).toEqual({ ok: true, value: [] });
  });
});
