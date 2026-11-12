# Arquitectura

Hexagonal (ports & adapters). El objetivo es que el núcleo de negocio no sepa
nada de React ni de Supabase, para que ambos sean reemplazables.

## Regla de capas

| Capa | Puede importar | Nunca importa |
|---|---|---|
| `domain/` | solo `domain/` | React, red, DOM, `Date.now()`, Supabase |
| `ports/` | `domain/` | adaptadores, estado, UI |
| `data/` | `domain/`, `ports/`, `config/`, su SDK | estado, UI, otros adaptadores |
| `state/` | `domain/`, `ports/`, `config/`, react | `data/` (el gateway llega inyectado) |
| `ui/` | `domain/` (tipos y funciones puras), `state/`, `lib/` | `data/`, el SDK de Supabase |
| `container.ts` | todo | — es el único lugar que toca `data/` |

Lo verifica `eslint-plugin-boundaries` en CI: cruzar una frontera rompe el build.

## Por qué cada pieza

- **`domain/` puro** → la lógica que produce los números se prueba sin montar
  nada y sin mocks. Es donde un error costaría confianza en el dashboard.
- **`ports/`** → el dominio define lo que necesita; la infraestructura se adapta.
  Hay dos adaptadores (`data/supabase` y `data/local`) y una sola suite de
  contrato (`src/test/gatewayContract.ts`) que corre contra los dos. Esa suite es
  la garantía real de que son intercambiables.
- **`data/local`** → no es solo un juguete: es el driver de desarrollo, el doble
  de prueba y lo que hace que los e2e sean herméticos y deterministas.
- **`state/`** → store observable propio + `useSyncExternalStore`. Los cambios
  llegan **desde fuera de React** (websocket, evento `storage`, auth), y ese hook
  es la API correcta para eso; además es a prueba de *tearing*.
- **`ui/`** → presentacionales (props en, eventos fuera) y contenedores (leen con
  selectores y despachan acciones). No se mezclan.

## Patrones y dónde viven

| Patrón | Dónde |
|---|---|
| Ports & Adapters | `ports/` + `data/supabase`, `data/local` |
| Repository | un puerto por entidad (conceptos, editors, settings) |
| Dependency Injection | `container.ts` |
| Observer | store + `RealtimePort` |
| State machine | `domain/status.ts` (`STATUS_FLOW`) |
| Rules table | `config/encouragement.pack.ts`, etiquetas, transiciones |
| Mapper / DTO boundary | `data/supabase/mappers.ts` |
| Factory | `createGateway(env)` |
| Result type | `domain/result.ts`, en toda operación de red |
| Value Object (branded) | `IsoDate`, `EditorId`, `ConceptoId` |

## SOLID, aterrizado

- **S** — cada módulo de `domain/` tiene una sola razón de cambio; la UI presenta, no calcula.
- **O** — agregar una frase, un estado o una columna es agregar una fila a una tabla.
- **L** — los dos adaptadores son intercambiables, y así corren las pruebas.
- **I** — tres puertos chicos en vez de un `DataService` omnisciente.
- **D** — `state` depende de interfaces; las implementaciones se inyectan desde el borde.
