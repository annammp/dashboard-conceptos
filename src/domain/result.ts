/**
 * Los errores esperables son parte del tipo de retorno, no excepciones que se
 * pierden. Si una función puede fallar, su firma lo dice y quien la llama no
 * puede ignorarlo por descuido.
 */

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => result.ok;

export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
  result.ok ? result.value : fallback;

export const mapResult = <T, U, E>(result: Result<T, E>, map: (value: T) => U): Result<U, E> =>
  result.ok ? ok(map(result.value)) : result;

/** Recoge una lista de resultados en un resultado de lista: falla con el primer error. */
export const allOk = <T, E>(results: readonly Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
};
