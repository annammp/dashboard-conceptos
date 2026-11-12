# 0001 — Supabase como fuente única de datos

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

El dashboard se publica en GitHub Pages, que es estático: no hay servidor donde
guardar nada. La información estaba repartida en varios lugares y el objetivo
del producto es justamente que el equipo vea lo mismo. Guardar en el navegador
dejaría a cada persona con sus propios datos, que es el problema que venimos a
resolver.

## Decisión

Supabase (capa gratuita) como base compartida, con **lectura pública** y
**escritura restringida a una allowlist** (`writers`). El acceso va detrás de un
puerto (`ports/`), con dos adaptadores: Supabase y localStorage.

## Consecuencias

- El equipo y terceros ven el avance con solo abrir el link.
- La anon key viaja en el bundle: es pública por diseño y lo que protege de
  verdad son las políticas RLS. La `service_role` nunca toca el cliente.
- Dependemos de un servicio externo que en capa gratuita puede dormirse; el
  store lo maneja con polling de respaldo y un reintento visible.
- El adaptador local no es un juguete: es el driver de desarrollo y lo que hace
  que las pruebas end-to-end sean herméticas.
