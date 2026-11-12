/**
 * `localStorage` puede fallar: modo privado, cookies bloqueadas, cuota llena.
 * Cada acceso va en try/catch y la app funciona igual sin él, solo que sin
 * recordar nada entre recargas.
 */

export interface Persistence {
  read(): unknown;
  write(value: unknown): void;
}

const memoryFallback = (): Persistence => {
  let held: unknown = null;
  return {
    read: () => held,
    write: (value) => {
      held = value;
    },
  };
};

export const createPersistence = (key: string): Persistence => {
  if (typeof localStorage === 'undefined') return memoryFallback();
  return {
    read: () => {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : (JSON.parse(raw) as unknown);
      } catch {
        return null;
      }
    },
    write: (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Sin persistencia la sesión sigue siendo usable; no vale romper por esto.
      }
    },
  };
};
