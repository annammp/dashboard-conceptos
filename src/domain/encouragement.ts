/**
 * Las frases de aliento son datos, no condicionales.
 *
 * Cada alcance (editor / equipo) tiene su propia lista de bandas que cubre
 * `[0, ∞)` de forma contigua y sin traslapes. Elegir una frase es un `.find`:
 * complejidad ciclomática 1, y agregar o cambiar copy es editar una fila sin
 * tocar código. `validatePack` comprueba que la cobertura sea total, así que un
 * hueco se detecta en las pruebas y no cuando el banner aparece vacío.
 */

import type { ProgressStat } from './metrics';

export type EncouragementScope = 'editor' | 'team';

export const ENCOURAGEMENT_SCOPES: readonly EncouragementScope[] = ['editor', 'team'];

export type EncouragementTone = 'neutral' | 'warm' | 'push' | 'celebrate';

export interface EncouragementRule {
  readonly id: string;
  /** Inclusivo. */
  readonly minRatio: number;
  /** Exclusivo. `Infinity` en la banda más alta. */
  readonly maxRatio: number;
  readonly message: string;
  readonly tone: EncouragementTone;
}

export interface EncouragementPack {
  readonly id: string;
  readonly bands: Readonly<Record<EncouragementScope, readonly EncouragementRule[]>>;
}

/**
 * Si un paquete tuviera un hueco, esto es lo que se mostraría. Existe para que
 * la función sea total sin un `!` ni un `undefined` que haya que manejar en la
 * UI; `validatePack` y sus pruebas garantizan que nunca se alcance.
 */
export const FALLBACK_RULE: EncouragementRule = {
  id: 'fallback',
  minRatio: 0,
  maxRatio: Infinity,
  message: 'Vamos avanzando.',
  tone: 'neutral',
};

const covers = (rule: EncouragementRule, ratio: number): boolean =>
  ratio >= rule.minRatio && ratio < rule.maxRatio;

export const selectEncouragement = (
  stat: Pick<ProgressStat, 'ratio'>,
  scope: EncouragementScope,
  pack: EncouragementPack,
): EncouragementRule => pack.bands[scope].find((rule) => covers(rule, stat.ratio)) ?? FALLBACK_RULE;

/** Sustituye `{missing}` y `{name}`. Sin condicionales: lo que no viene, no se sustituye. */
export const renderMessage = (
  rule: EncouragementRule,
  vars: { readonly missing: number; readonly name?: string },
): string =>
  rule.message
    .replaceAll('{missing}', String(vars.missing))
    .replaceAll('{name}', vars.name ?? '');

export type PackProblem = string;

const validateBands = (
  scope: EncouragementScope,
  rules: readonly EncouragementRule[],
): readonly PackProblem[] => {
  const [first, ...rest] = [...rules].sort((left, right) => left.minRatio - right.minRatio);
  if (first === undefined) return [`${scope}: no tiene bandas`];

  const problems: PackProblem[] = [];
  if (first.minRatio !== 0) {
    problems.push(`${scope}: la primera banda empieza en ${first.minRatio}, debería ser 0`);
  }

  // `previous` arranca en una banda que ya existe, así que no hay caso indefinido
  // que verificar dentro del recorrido.
  let previous = first;
  for (const current of rest) {
    if (previous.maxRatio !== current.minRatio) {
      problems.push(
        `${scope}: hueco o traslape entre "${previous.id}" (hasta ${previous.maxRatio}) y "${current.id}" (desde ${current.minRatio})`,
      );
    }
    previous = current;
  }

  if (previous.maxRatio !== Infinity) {
    problems.push(`${scope}: la última banda termina en ${previous.maxRatio}, debería ser Infinity`);
  }
  return problems;
};

/** Comprueba que cada alcance cubra `[0, ∞)` sin huecos ni traslapes. */
export const validatePack = (pack: EncouragementPack): readonly PackProblem[] =>
  ENCOURAGEMENT_SCOPES.flatMap((scope) => validateBands(scope, pack.bands[scope]));
