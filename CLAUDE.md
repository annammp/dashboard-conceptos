# Dashboard de Conceptos

Dashboard de seguimiento diario de entregables de video ("conceptos") para un
equipo de edición. Se publica en GitHub Pages con Supabase como fuente única de
datos: **lectura pública, escritura solo para quien esté en la allowlist**.

## Reglas que no se negocian

1. **Las capas van en una sola dirección.** `domain` → nada · `ports` → domain ·
   `data` → domain+ports · `state` → domain+ports · `ui` → domain+state.
   Solo `container.ts` toca `data/`. Lo verifica `eslint-plugin-boundaries`.
2. **`src/domain/` es puro.** Sin React, sin red, sin DOM, sin `Date.now()` ni
   `Math.random()` — el reloj y los ids se inyectan (`Clock`, `IdFactory`).
3. **Cero `any` y cero `@ts-ignore`.** En los bordes se usa `unknown` + validación.
4. **Las reglas son datos, no condicionales.** Frases de aliento, etiquetas y
   transiciones de estado viven en tablas. Agregar comportamiento = agregar una fila.
5. **Ningún componente pasa de 80 líneas** y no hay lógica de negocio en el JSX.
6. **Todo lo ejecutable es idempotente**: SQL y scripts se pueden correr dos veces.
7. **Las fechas son calendario local, nunca UTC.** Ver `.claude/context/datos.md`.
8. **La `service_role` key de Supabase nunca** entra al repo ni al cliente.

## Comandos

```bash
npm run dev          # servidor local (driver local, sin Supabase)
npm run lint         # eslint, incluye reglas de frontera y complejidad
npm run typecheck    # tsc --noEmit
npm run test:unit    # vitest
npm run test:e2e     # playwright
npm run build
```

## Contexto

@.claude/context/producto.md
@.claude/context/arquitectura.md
@.claude/context/criterios-aceptacion.md
@.claude/context/convenciones.md
@.claude/context/glosario.md
@.claude/context/datos.md
@.claude/context/estado.md
