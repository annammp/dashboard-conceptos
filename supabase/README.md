# Supabase

## Puesta en marcha (una sola vez)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega `migrations/0001_init.sql` y ejecútalo. Es idempotente:
   si algo falla a la mitad, se vuelve a correr sin problema.
3. Pega `verify.sql` y comprueba que **ninguna** tabla salga con
   `rls_activo = false`.
4. **Authentication → Providers → Email**: desactiva *"Allow new users to sign up"*.
   Sin esto, cualquiera que encuentre la URL pública podría registrarse solo.
5. **Authentication → Users**: invita tu correo. Copia tu `user id`.
6. **SQL Editor**: date permiso de escritura.
   ```sql
   insert into public.writers (user_id, email)
   values ('TU-USER-ID', 'tu@correo.com')
   on conflict (user_id) do nothing;
   ```
7. **Authentication → URL Configuration → Redirect URLs**: agrega la URL de
   GitHub Pages (`https://<usuario>.github.io/<repo>/`).
8. **Project Settings → Data API**: copia *Project URL* y la *anon key* a
   `.env.local` (usa `.env.example` como plantilla).

## Prueba de humo: que el anónimo NO pueda escribir

Esto es lo único que separa un dashboard de equipo de un pizarrón público.
Con tu `anon key`:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST "$SUPABASE_URL/rest/v1/conceptos" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"editor_id":"00000000-0000-0000-0000-000000000000","work_date":"2026-01-01"}'
```

Debe responder **401** o **403**. Si responde 201, algo está mal con las
políticas: no sigas hasta resolverlo.

Que leer sí funcione:

```bash
curl -s "$SUPABASE_URL/rest/v1/editors?select=name" -H "apikey: $ANON_KEY"
```

## Sobre las llaves

- La **anon key es pública por diseño**: viaja en el bundle del navegador y lo
  que protege los datos son las políticas RLS, no el secreto de la llave.
- La **`service_role` key nunca** va al repo, ni a `.env.local`, ni a un secret
  de GitHub Actions. Un paso del CI falla el build si aparece.
