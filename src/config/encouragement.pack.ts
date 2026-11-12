/**
 * La copy motivacional, como datos.
 *
 * Cada alcance cubre `[0, ∞)` de forma contigua: la prueba de `encouragement`
 * barre los ratios y falla si queda un hueco o un traslape. Para cambiar el
 * tono del dashboard se edita esta tabla y nada más.
 *
 * `{missing}` se sustituye por cuántos faltan; `{name}` por el nombre del editor.
 */

import type { EncouragementPack } from '../domain/encouragement';
import { DEFAULT_PACK_ID } from './defaults';

export const DEFAULT_ENCOURAGEMENT_PACK: EncouragementPack = {
  id: DEFAULT_PACK_ID,
  bands: {
    editor: [
      {
        id: 'sin_arrancar',
        minRatio: 0,
        maxRatio: 0.01,
        message: '¡Arranquemos! Hoy toca crear.',
        tone: 'neutral',
      },
      {
        id: 'primer_paso',
        minRatio: 0.01,
        maxRatio: 0.34,
        message: '¡Buen inicio! Faltan {missing}.',
        tone: 'warm',
      },
      {
        id: 'a_mitad',
        minRatio: 0.34,
        maxRatio: 0.6,
        message: '¡Vas a mitad de camino!',
        tone: 'warm',
      },
      {
        id: 'cerca',
        minRatio: 0.6,
        maxRatio: 0.85,
        message: '¡Ya casi se cumple la meta! Faltan {missing}.',
        tone: 'push',
      },
      {
        id: 'casi',
        minRatio: 0.85,
        maxRatio: 1,
        message: '¡Falta poquísimo, tú puedes!',
        tone: 'push',
      },
      {
        id: 'meta',
        minRatio: 1,
        maxRatio: 1.25,
        message: '¡Excelente trabajo! Meta cumplida.',
        tone: 'celebrate',
      },
      {
        id: 'arriba',
        minRatio: 1.25,
        maxRatio: Infinity,
        message: '¡Increíble! Superaste la meta.',
        tone: 'celebrate',
      },
    ],
    team: [
      {
        id: 'equipo_inicio',
        minRatio: 0,
        maxRatio: 0.01,
        message: 'Arranca el día. La meta del equipo son {missing} conceptos.',
        tone: 'neutral',
      },
      {
        id: 'equipo_primer_paso',
        minRatio: 0.01,
        maxRatio: 0.34,
        message: 'El equipo ya arrancó. Faltan {missing}.',
        tone: 'warm',
      },
      {
        id: 'equipo_mitad',
        minRatio: 0.34,
        maxRatio: 0.6,
        message: 'El equipo va a mitad de camino. Faltan {missing}.',
        tone: 'warm',
      },
      {
        id: 'equipo_cerca',
        minRatio: 0.6,
        maxRatio: 1,
        message: 'El equipo está a {missing} de la meta. ¡Vamos!',
        tone: 'push',
      },
      {
        id: 'equipo_meta',
        minRatio: 1,
        maxRatio: Infinity,
        message: '¡Meta del equipo cumplida! Gran trabajo.',
        tone: 'celebrate',
      },
    ],
  },
};
