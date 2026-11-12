# Criterio de aceptación técnico (Definition of Done)

Un cambio no está listo hasta que **todo** esto pasa. Es checkable, no interpretable.

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Lint, typecheck, unitarias y e2e en verde | `npm run verify` |
| 2 | Cero `any` y cero `@ts-ignore` en `src/` | regla de eslint |
| 3 | Las fronteras entre capas se respetan | `eslint-plugin-boundaries` |
| 4 | Complejidad ciclomática ≤ 8, anidamiento ≤ 3, componentes ≤ 80 líneas | reglas de eslint |
| 5 | `src/domain/` con 100 % de líneas cubiertas | `vitest --coverage` con umbral |
| 6 | Todo recorrido de usuario nuevo trae su prueba e2e; `axe` sin violaciones | `npm run test:e2e` |
| 7 | La suite de fechas pasa con `TZ=America/Mexico_City` y con `TZ=UTC` | matriz en CI |
| 8 | La suite de contrato pasa contra los dos adaptadores | `gatewayContract` |
| 9 | Toda tabla nueva tiene RLS activo y políticas explícitas | `supabase/verify.sql` |
| 10 | El SQL y los scripts son idempotentes: correrlos dos veces no falla | se corren dos veces |
| 11 | Ni `service_role` ni secretos en el repo o el bundle | paso de CI que hace grep |
| 12 | Contraste ≥ 4.5:1, foco visible, operable con teclado, `prefers-reduced-motion` | axe + revisión manual |
| 13 | JS inicial ≤ 150 kB gzip | reporte de `vite build` |
| 14 | Decisión estructural → ADR en `docs/adr/` | revisión |
| 15 | `.claude/context/estado.md` actualizado al cerrar la etapa | revisión |

## Qué NO cuenta como terminado

- "Funciona en mi máquina" sin que el CI esté en verde.
- Una función de dominio nueva sin pruebas.
- Un componente que creció a 120 líneas "por ahora".
- Un `catch` que se come el error sin convertirlo en `Result`.
- Lógica de negocio duplicada entre un componente y el dominio.
