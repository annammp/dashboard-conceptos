import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareIso,
  dayNumber,
  daysBetween,
  enumerateDays,
  fromDayNumber,
  lastNDays,
  parseIsoDate,
  toIsoDate,
  todayIso,
  weekdayIndex,
} from './date';
import type { IsoDate } from './types';

const iso = (raw: string): IsoDate => {
  const parsed = parseIsoDate(raw);
  if (!parsed.ok) throw new Error(`fecha de prueba inválida: ${raw}`);
  return parsed.value;
};

describe('toIsoDate', () => {
  it('rellena con ceros a la izquierda', () => {
    expect(toIsoDate(2026, 1, 5)).toBe('2026-01-05');
    expect(toIsoDate(999, 12, 31)).toBe('0999-12-31');
  });
});

describe('parseIsoDate', () => {
  it('acepta una fecha válida', () => {
    const result = parseIsoDate('2026-11-12');
    expect(result).toEqual({ ok: true, value: '2026-11-12' });
  });

  it.each(['12/11/2026', '2026-11-1', '', 'hoy', '2026-11-12T10:00:00Z'])(
    'rechaza el formato %s',
    (raw) => {
      expect(parseIsoDate(raw)).toEqual({ ok: false, error: 'invalid_format' });
    },
  );

  it.each(['2026-13-01', '2026-00-10', '2026-11-00', '2026-11-32'])(
    'rechaza componentes fuera de rango: %s',
    (raw) => {
      expect(parseIsoDate(raw)).toEqual({ ok: false, error: 'invalid_date' });
    },
  );

  it('rechaza días que no existen en el mes', () => {
    expect(parseIsoDate('2026-02-30')).toEqual({ ok: false, error: 'invalid_date' });
    expect(parseIsoDate('2026-04-31')).toEqual({ ok: false, error: 'invalid_date' });
  });

  it('maneja los años bisiestos, incluida la regla de los siglos', () => {
    expect(parseIsoDate('2024-02-29').ok).toBe(true);
    expect(parseIsoDate('2000-02-29').ok).toBe(true);
    expect(parseIsoDate('2026-02-29').ok).toBe(false);
    expect(parseIsoDate('1900-02-29').ok).toBe(false);
  });
});

describe('dayNumber / fromDayNumber', () => {
  it('ancla la época en 1970-01-01', () => {
    expect(dayNumber(iso('1970-01-01'))).toBe(0);
    expect(fromDayNumber(0)).toBe('1970-01-01');
  });

  it('hace viaje redondo para un rango amplio de fechas', () => {
    for (let offset = -40_000; offset <= 40_000; offset += 137) {
      const date = fromDayNumber(offset);
      expect(dayNumber(date)).toBe(offset);
    }
  });

  it('funciona antes de la época', () => {
    expect(fromDayNumber(-1)).toBe('1969-12-31');
  });
});

describe('addDays', () => {
  it('cruza el fin de mes', () => {
    expect(addDays(iso('2026-01-31'), 1)).toBe('2026-02-01');
  });

  it('cruza el fin de año en los dos sentidos', () => {
    expect(addDays(iso('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(iso('2027-01-01'), -1)).toBe('2026-12-31');
  });

  it('cruza el 29 de febrero bisiesto', () => {
    expect(addDays(iso('2024-02-28'), 1)).toBe('2024-02-29');
    expect(addDays(iso('2024-02-29'), 1)).toBe('2024-03-01');
    expect(addDays(iso('2026-02-28'), 1)).toBe('2026-03-01');
  });

  it('sumar cero no cambia nada', () => {
    expect(addDays(iso('2026-11-12'), 0)).toBe('2026-11-12');
  });
});

describe('enumerateDays', () => {
  it('incluye los dos extremos', () => {
    expect(enumerateDays({ from: iso('2026-11-10'), to: iso('2026-11-12') })).toEqual([
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
    ]);
  });

  it('un rango de un solo día devuelve ese día', () => {
    expect(enumerateDays({ from: iso('2026-11-12'), to: iso('2026-11-12') })).toEqual([
      '2026-11-12',
    ]);
  });

  it('un rango invertido devuelve vacío en vez de colgarse', () => {
    expect(enumerateDays({ from: iso('2026-11-12'), to: iso('2026-11-10') })).toEqual([]);
  });

  it('cubre una semana completa a través de un cambio de mes', () => {
    const days = enumerateDays({ from: iso('2026-10-29'), to: iso('2026-11-04') });
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-10-29');
    expect(days[6]).toBe('2026-11-04');
  });
});

describe('lastNDays', () => {
  it('cuenta hacia atrás incluyendo el día final', () => {
    expect(lastNDays(iso('2026-11-12'), 7)).toEqual({ from: '2026-11-06', to: '2026-11-12' });
  });

  it('una ventana de un día es ese día', () => {
    expect(lastNDays(iso('2026-11-12'), 1)).toEqual({ from: '2026-11-12', to: '2026-11-12' });
  });

  it('trata una ventana no positiva como un día', () => {
    expect(lastNDays(iso('2026-11-12'), 0)).toEqual({ from: '2026-11-12', to: '2026-11-12' });
  });
});

describe('compareIso y daysBetween', () => {
  it('ordena cronológicamente', () => {
    expect(compareIso(iso('2026-11-10'), iso('2026-11-12'))).toBe(-1);
    expect(compareIso(iso('2026-11-12'), iso('2026-11-10'))).toBe(1);
    expect(compareIso(iso('2026-11-12'), iso('2026-11-12'))).toBe(0);
  });

  it('cuenta los días del rango', () => {
    expect(daysBetween({ from: iso('2026-11-10'), to: iso('2026-11-12') })).toBe(2);
  });
});

describe('weekdayIndex', () => {
  it('identifica días conocidos', () => {
    expect(weekdayIndex(iso('1970-01-01'))).toBe(4); // jueves
    expect(weekdayIndex(iso('2026-11-12'))).toBe(4); // jueves
    expect(weekdayIndex(iso('2026-11-15'))).toBe(0); // domingo
    expect(weekdayIndex(iso('2026-11-14'))).toBe(6); // sábado
  });
});

/**
 * Esta es la prueba que importa, y la razón por la que la suite corre con dos
 * valores de TZ en CI. `new Date(2026, 10, 12, 23, 30)` es 11:30 de la noche en
 * la zona local de quien corre esto. El día del calendario de esa persona es el
 * 12, y eso es lo que debe guardarse — aunque en UTC ya sea el 13.
 */
describe('todayIso: el día es el local, nunca el de UTC', () => {
  it('a las 23:30 locales sigue siendo el mismo día', () => {
    expect(todayIso(new Date(2026, 10, 12, 23, 30, 0))).toBe('2026-11-12');
  });

  it('a las 00:30 locales ya es el día nuevo', () => {
    expect(todayIso(new Date(2026, 10, 13, 0, 30, 0))).toBe('2026-11-13');
  });

  it('un segundo antes de medianoche no se adelanta', () => {
    expect(todayIso(new Date(2026, 10, 12, 23, 59, 59))).toBe('2026-11-12');
  });

  it('medianoche exacta es el día que empieza', () => {
    expect(todayIso(new Date(2026, 10, 13, 0, 0, 0))).toBe('2026-11-13');
  });

  it('funciona en el cambio de año', () => {
    expect(todayIso(new Date(2026, 11, 31, 22, 0, 0))).toBe('2026-12-31');
  });

  it('funciona alrededor del cambio de horario de verano', () => {
    expect(todayIso(new Date(2026, 3, 5, 2, 30, 0))).toBe('2026-04-05');
    expect(todayIso(new Date(2026, 9, 25, 1, 30, 0))).toBe('2026-10-25');
  });
});
