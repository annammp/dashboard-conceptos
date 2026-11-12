# 0002 — Las fronteras entre capas con `no-restricted-imports`

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

La arquitectura hexagonal solo sirve si las capas se respetan. Dejarlo a la
disciplina no funciona, así que tenía que verificarlo el CI.

La opción natural era `eslint-plugin-boundaries`. Se configuró y **no disparaba**:
con `default: 'disallow'` y cero políticas, un archivo del dominio importando
React no producía error. Se comprobó que los archivos sí se clasificaban (con
`boundaries/no-unknown-files`), así que el problema estaba en la resolución de
módulos: sin un resolutor que entienda `.ts`, la regla no conoce el destino del
import y se salta la comprobación. Tampoco funcionó al agregar
`eslint-import-resolver-typescript`.

## Decisión

Usar `no-restricted-imports`, que es nativo de ESLint y trabaja sobre el **texto
del import**, sin resolver módulos. Las capas se declaran una sola vez en la
constante `LAYERS` de `eslint.config.js` y las configuraciones se generan en un
`map`.

Además, `scripts/check-boundaries.sh` mete ocho violaciones a propósito y exige
que el lint falle en cada una. Forma parte de `npm run verify`.

## Consecuencias

- La comprobación es por patrón de ruta, no semántica: un alias raro podría
  escapársele. El script de verificación existe justamente para que eso se note.
- Una dependencia menos y un modo de fallo menos.
- La regla que protege la arquitectura está ella misma probada. Una regla de
  lint que nunca dispara es peor que no tenerla, porque da confianza falsa.
