# 0004 — Sin router: vistas por hash

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

Hay tres vistas (Hoy, Historial, Ajustes). En GitHub Pages, una SPA con rutas
reales devuelve 404 al recargar en una ruta profunda, y el remedio habitual es
copiar `index.html` a `404.html`.

## Decisión

Sin librería de router. Las vistas son estado derivado de `location.hash`.

## Consecuencias

- No hace falta el truco del `404.html` y los deep links siguen funcionando.
- Una dependencia menos y menos bundle.
- **Cuidado:** el magic link de Supabase en flujo implícito regresa como
  `#access_token=...` en el fragmento y chocaría con la navegación por hash,
  rompiendo las dos cosas. Por eso el cliente se configura con `flowType: 'pkce'`,
  que devuelve `?code=...` en el query string.
- Si algún día hacen falta rutas anidadas de verdad, migrar a `HashRouter` es
  barato; a `BrowserRouter` obligaría a resolver el 404.
