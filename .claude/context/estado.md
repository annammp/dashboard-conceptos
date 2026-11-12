# Estado del proyecto

**Última actualización:** 2026-11-12

## Dónde quedamos

**Fase 0 — entorno.** Node 26.13.1 y gh 2.103.3 instalados en `~/.local` con
checksum verificado, vía `scripts/setup-env.sh` (idempotente). Skill
`ui-ux-pro-max` instalado; design system persistido en
`design-system/dashboard-de-conceptos/MASTER.md` (Minimalism & Swiss Style,
azul de datos + ámbar, Fira Sans / Fira Code).

**Fase 0.5 — memoria.** `CLAUDE.md` + `.claude/context/` + 4 ADRs.

**Fase 1 — andamiaje y dominio.** React 19 + TypeScript 6 + Vite 8, tsconfig
estricto, ESLint con fronteras y límites de complejidad, Prettier, Vitest 5 y
Playwright configurados. El dominio completo y probado:

| Módulo | Qué hace |
|---|---|
| `types` | branded types, entidades, `assertNever` |
| `result` | `Result<T,E>` y helpers |
| `date` | aritmética civil en enteros, sin `Date` |
| `status` | máquina de estados en tabla |
| `goals` | metas por editor, de equipo y congeladas por día |
| `metrics` | progreso, conteos y serie diaria |
| `encouragement` | selección de frase por banda de progreso |
| `csv` | serialización RFC 4180 |

**Estado del gate:** `npm run verify` en verde — lint limpio, typecheck limpio,
8 fronteras verificadas, 142 pruebas y **100 % de cobertura** del dominio
(líneas, ramas, funciones y sentencias).

**Fase 2 — datos y estado.** Puertos, adaptador local sobre `localStorage` con
puente entre pestañas, suite de contrato (20 casos) y el store observable con
acciones optimistas y reversión.

**Fase 3 — UI del día.** Vista "Hoy" funcionando sobre el driver local:
navegación por fecha, progreso por editor y de equipo, banner de aliento,
registro rápido (+1 / +4) y tablero de tres columnas. Tokens del design system
con modo claro y oscuro.

Verificado en el navegador: registrar 4 conceptos y entregarlos lleva al Editor 1
a 4/4 con "¡Meta cumplida!" y al equipo a 4/8 con la frase de medio camino. Los
datos sobreviven a recargar.

## Siguiente paso

1. Vista Historial con la gráfica de tendencia (SVG a mano) y exportar CSV.
2. Vista Ajustes: editores configurables y meta de equipo.
3. Suite end-to-end con Playwright (los 10 recorridos).
4. Adaptador de Supabase + auth PKCE, y despliegue a Pages.

## Pendientes que dependen de Ana

1. `gh auth login` en la terminal (flujo del navegador; nadie más ve el token).
2. Crear el proyecto en supabase.com, correr `supabase/migrations/0001_init.sql`
   y desactivar "Allow new users to sign up" en Auth.
3. Pegar Project URL y anon key en `.env.local`.
4. Insertar su `user_id` en la tabla `writers` para poder escribir.

## Decisiones abiertas

Ninguna por ahora.

## Notas para quien retome esto

- `eslint-plugin-boundaries` se probó y **no disparaba** (ver ADR 0002). Las
  fronteras van con `no-restricted-imports` y se verifican con
  `scripts/check-boundaries.sh`. No lo reemplaces sin correr ese script.
- La cobertura del dominio tiene umbral de 100 %: si agregas una función ahí,
  el build falla hasta que la pruebes.
