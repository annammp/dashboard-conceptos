# 0005 — La anon key va como *variable* del repo, no como *secret*

**Fecha:** 2026-11-12 · **Estado:** aceptada

## Contexto

El build necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. El reflejo es
meterlas como *secrets* de GitHub Actions.

## Decisión

Van como **variables** (`vars.*`), no como secrets.

## Consecuencias

- Es honesto: la anon key viaja en el bundle que descarga cualquier visitante.
  Llamarla "secret" sugiere que protege algo, y lo que protege los datos son
  las políticas RLS.
- Evita la trampa: una vez que existe un cajón de "secrets de Supabase", a
  alguien le va a parecer natural guardar ahí la `service_role`. Un paso del
  CI falla el build si aparece esa cadena en cualquier parte del repo.
- Las variables salen en los logs sin enmascarar, que para una llave pública
  es una ventaja al depurar.
