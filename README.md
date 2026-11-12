# Dashboard de Conceptos

Seguimiento diario de los videos ("conceptos") que entrega el equipo de
edición. Meta de 4 por editor al día, 8 entre los dos.

**En vivo:** https://annammp.github.io/dashboard-conceptos/

Responde de un vistazo: cuántos conceptos van hoy y en qué estado está cada
uno, cuánto falta para la meta individual y la del equipo, cómo viene la
semana, y una frase de aliento según el avance.

## Cómo funciona

- **Tres estados**: En progreso → En ajustes → Entregado. Solo "entregado"
  cuenta para la meta.
- **Los contadores se derivan de la lista**, nunca se editan aparte: si se
  pudieran editar por separado acabarían diciendo cosas distintas. Para que
  registrar sea rápido hay botones **+1** y **+4**.
- **La meta se congela por día**: subirla hoy no recalifica los días pasados.
- **Quitar un editor es desactivarlo**, para no perder su historial.
- **Lectura pública, escritura restringida**: cualquiera con el link ve el
  avance; solo quien esté en la allowlist de Supabase puede editar.

## Arrancar en local

```bash
./scripts/setup-env.sh   # instala Node y gh en ~/.local (idempotente)
npm ci
npm run dev
```

Sin credenciales de Supabase arranca con el driver local, que guarda en el
navegador. Funciona completo, pero cada quien ve sus propios datos.

## Conectar Supabase

Los pasos están en [`supabase/README.md`](supabase/README.md). Resumen: crear
el proyecto, correr `supabase/migrations/0001_init.sql`, desactivar el registro
público, agregarte a `writers`, y poner `SUPABASE_URL` y `SUPABASE_ANON_KEY`
como **variables** del repo (no secrets: la anon key es pública por diseño).

## Verificar

```bash
npm run verify
```

Lint, tipos, fronteras entre capas, escaneo de llaves, 188 pruebas unitarias
con 100 % de cobertura del dominio, y 21 end-to-end con `axe`.

## Arquitectura

Hexagonal: `domain` (puro) → `ports` (interfaces) → `data` (Supabase y local) →
`state` → `ui`. Las fronteras las verifica el lint, y
`scripts/check-boundaries.sh` mete violaciones a propósito para comprobar que
las reglas disparan de verdad.

El detalle está en [`.claude/context/`](.claude/context/) y las decisiones
estructurales en [`docs/adr/`](docs/adr/).
