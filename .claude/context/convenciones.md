# Convenciones

## Nombres

- Archivos de módulo: `camelCase.ts` (`dashboardStore.ts`). Componentes: `PascalCase.tsx`.
- Identificadores en **inglés**; los valores de estado del negocio en **español**
  (`en_progreso`), porque son vocabulario del dominio.
- Un `index.ts` de barril solo en `domain/`: es la superficie que consumen las
  capas de arriba. En el resto, imports directos.

## TypeScript

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`, `noImplicitOverride`.
- Cero `any`, cero `@ts-ignore`. En los bordes: `unknown` + validación.
- Firmas del dominio con `readonly` / `ReadonlyArray`.
- Los `switch` sobre uniones cierran con `assertNever(x: never)`, para que agregar
  un caso rompa el build en cada lugar que falte cubrir.
- Branded types para los ids y las fechas: `IsoDate` y `EditorId` no se pueden
  confundir entre sí aunque los dos sean `string`.

## Componentes

- Máximo 80 líneas. Si crece, se parte.
- **Presentacionales**: reciben props y emiten eventos. No leen del store, no
  llaman a la red, no conocen `async`. Se prueban con props literales.
- **Contenedores**: uno por vista. Leen con selectores, despachan acciones.
- Cero lógica de negocio en el JSX: llega resuelta por un selector.
- Composición con `children` antes que pasar props tres niveles abajo.
- `key` por `id`, nunca por índice.
- `React.memo` / `useMemo` / `useCallback` solo donde el Profiler muestre un costo
  real. Memoizar por reflejo agrega carga cognitiva y no rinde.
- Nada de `useEffect` para estado derivado: si se puede calcular en el render, se calcula.

## Anti-patrones que el lint rechaza

`any` y `@ts-ignore` · `useEffect` que solo copia props a estado · `index` como
`key` · objetos de estilo recreados en cada render · un componente que importa de
`data/` · props tipadas como `object` o `Record<string, unknown>` · complejidad
ciclomática > 8 · anidamiento > 3.

## Pruebas

- Unitarias sobre `domain/`: sin mocks, porque no hay nada que mockear.
- Contrato (`src/test/gatewayContract.ts`): una suite, los dos adaptadores.
- Componentes: por rol accesible (`getByRole`, `getByLabelText`), nunca por clase CSS.
- E2E: contra el driver local, reloj fijo, selectores accesibles. Si una prueba
  necesita `data-testid`, primero se pregunta si a la UI le falta semántica.

## Commits

Convencionales: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

## Decisiones estructurales

Van a `docs/adr/NNNN-titulo.md` con el formato contexto → decisión → consecuencias.
