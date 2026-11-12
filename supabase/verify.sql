-- Resumen del estado del esquema. Correr después de la migración.
-- Lo importante: que NINGUNA tabla aparezca con rls_activo = false.

select 'tablas' as seccion, tablename as nombre, rowsecurity as rls_activo
from pg_tables where schemaname = 'public'
union all
select 'politicas', policyname, true from pg_policies where schemaname = 'public'
union all
select 'indices', indexname, true from pg_indexes where schemaname = 'public'
union all
select 'realtime', tablename, true from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
order by seccion, nombre;
