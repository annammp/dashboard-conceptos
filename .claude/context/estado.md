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

## Siguiente paso

Puertos (`src/ports/`) y adaptador local (`src/data/local/`) con la suite de
contrato `src/test/gatewayContract.ts`, para que la app corra end-to-end sin red.

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
