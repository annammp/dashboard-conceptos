# 0007 — Los e2e corren antes del build de producción

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

El primer despliegue salió en blanco: el sitio pedía `/assets/index-*.js` en
vez de `/dashboard-conceptos/assets/index-*.js`.

La causa no era la configuración de `base`, que estaba bien. Era el **orden**
de los pasos del CI. Para previsualizar, `playwright.config.ts` ejecuta su
propio `npm run build && npm run preview` con `VITE_BASE=/` y
`VITE_DATA_DRIVER=local`. Como ese paso iba después del build de producción,
sobrescribía `dist/`, y `upload-pages-artifact` publicaba el build de las
pruebas: rutas rotas y, peor, el driver local en vez de Supabase.

## Decisión

Las pruebas end-to-end van **antes** del build de producción. Así el último
`dist/` que existe cuando se sube el artefacto es siempre el de producción.

## Consecuencias

- Se publica lo que se construyó para publicar.
- En local pasa lo mismo: `npm run verify` termina con `test:e2e`, así que
  deja un `dist/` de pruebas. No afecta al despliegue (lo hace el CI), pero
  conviene saberlo antes de subir un `dist/` a mano.
- Alternativa descartada: darle a Playwright un `outDir` propio. Habría que
  mantener dos salidas sincronizadas para evitar un problema que el orden
  resuelve gratis.
