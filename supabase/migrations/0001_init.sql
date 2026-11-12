-- Dashboard de Conceptos — esquema inicial.
--
-- IDEMPOTENTE: se puede correr dos veces sobre la misma base sin errores y sin
-- cambiar nada la segunda vez. Si algo falla a la mitad, se vuelve a correr.
--
-- Modelo de acceso: LECTURA PÚBLICA (cualquiera con el link ve el dashboard) y
-- ESCRITURA solo para quien esté en la tabla `writers`. Estar autenticado no
-- basta: hay que estar en la allowlist.

begin;

create extension if not exists pgcrypto;

-- ───────────────────────── enum de estados ─────────────────────────
-- `create type` no acepta `if not exists`, así que va con guarda explícita.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'concepto_status') then
    create type public.concepto_status as enum ('en_progreso', 'en_ajustes', 'entregado');
  end if;
end $$;

-- ───────────────────────── utilidades ─────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────── allowlist de escritura ─────────────────────────
-- Las filas se agregan a mano desde el panel de Supabase: no hay política de
-- insert, así que nadie se puede dar permiso a sí mismo.
create table if not exists public.writers (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- `security definer` con `search_path` fijo: sin fijarlo, una función así es
-- un vector de escalación por secuestro de esquema.
create or replace function public.is_writer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.writers w where w.user_id = auth.uid());
$$;
revoke all on function public.is_writer() from public;
grant execute on function public.is_writer() to anon, authenticated;

-- ───────────────────────── editores ─────────────────────────
create table if not exists public.editors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  daily_goal smallint not null default 4 check (daily_goal between 0 and 100),
  active     boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists editors_name_unique_ci on public.editors (lower(btrim(name)));
create index if not exists editors_active_idx on public.editors (active, sort_order);

drop trigger if exists editors_touch on public.editors;
create trigger editors_touch before update on public.editors
  for each row execute function public.touch_updated_at();

-- ───────────────────────── conceptos ─────────────────────────
create table if not exists public.conceptos (
  id           uuid primary key default gen_random_uuid(),
  -- `restrict`: quitar un editor es desactivarlo. Perder historial por un
  -- clic tiene que ser imposible, no solo poco probable.
  editor_id    uuid not null references public.editors(id) on delete restrict,
  -- `date` sin zona: el día es calendario, no un instante.
  work_date    date not null,
  title        text not null default '' check (char_length(title) <= 140),
  status       public.concepto_status not null default 'en_progreso',
  -- Solo para auditoría. Agrupar por día se hace con `work_date`.
  delivered_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) default auth.uid(),
  constraint conceptos_delivered_consistent
    check ((status = 'entregado') = (delivered_at is not null))
);

-- Un índice por cada camino de lectura real, ni uno más: cada índice cuesta
-- en cada escritura.
create index if not exists conceptos_date_idx        on public.conceptos (work_date desc);
create index if not exists conceptos_date_editor_idx on public.conceptos (work_date, editor_id);
create index if not exists conceptos_date_status_idx on public.conceptos (work_date, status);

create or replace function public.sync_delivered_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'entregado' and new.delivered_at is null then
    new.delivered_at := now();
  elsif new.status <> 'entregado' then
    new.delivered_at := null;
  end if;
  return new;
end $$;

drop trigger if exists conceptos_delivered on public.conceptos;
create trigger conceptos_delivered before insert or update on public.conceptos
  for each row execute function public.sync_delivered_at();

drop trigger if exists conceptos_touch on public.conceptos;
create trigger conceptos_touch before update on public.conceptos
  for each row execute function public.touch_updated_at();

-- ───────────────────────── metas congeladas por día ─────────────────────────
-- Sin esto, subir la meta de 4 a 5 recalificaría todos los días pasados y el
-- historial cambiaría de significado.
create table if not exists public.daily_goals (
  editor_id uuid not null references public.editors(id) on delete cascade,
  work_date date not null,
  goal      smallint not null check (goal between 0 and 100),
  primary key (editor_id, work_date)
);
create index if not exists daily_goals_date_idx on public.daily_goals (work_date desc);

-- ───────────────────────── ajustes (fila única) ─────────────────────────
create table if not exists public.app_settings (
  id                    boolean primary key default true check (id),
  -- null = la meta de equipo es la suma de las metas de los editores activos.
  team_goal_override    smallint check (team_goal_override between 0 and 1000),
  encouragement_pack_id text not null default 'default',
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users(id)
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

commit;

-- ───────────────────────── permisos (privilegio mínimo) ─────────────────────────
begin;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select on public.editors, public.conceptos, public.daily_goals, public.app_settings
  to anon, authenticated;
grant insert, update, delete on public.conceptos, public.daily_goals to authenticated;
grant insert, update on public.editors to authenticated;
grant update on public.app_settings to authenticated;
-- `anon` no recibe nada sobre `writers`: quién puede escribir no es público.
grant select on public.writers to authenticated;

-- ───────────────────────── RLS ─────────────────────────
-- Una tabla sin RLS en un proyecto con anon key pública es una filtración.
alter table public.editors      enable row level security;
alter table public.conceptos    enable row level security;
alter table public.daily_goals  enable row level security;
alter table public.app_settings enable row level security;
alter table public.writers      enable row level security;

-- Lectura pública.
drop policy if exists editors_read on public.editors;
create policy editors_read on public.editors for select to anon, authenticated using (true);

drop policy if exists conceptos_read on public.conceptos;
create policy conceptos_read on public.conceptos for select to anon, authenticated using (true);

drop policy if exists daily_goals_read on public.daily_goals;
create policy daily_goals_read on public.daily_goals for select to anon, authenticated using (true);

drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to anon, authenticated using (true);

-- Escritura solo para la allowlist.
drop policy if exists conceptos_insert on public.conceptos;
create policy conceptos_insert on public.conceptos for insert to authenticated
  with check (public.is_writer());

drop policy if exists conceptos_update on public.conceptos;
create policy conceptos_update on public.conceptos for update to authenticated
  using (public.is_writer()) with check (public.is_writer());

drop policy if exists conceptos_delete on public.conceptos;
create policy conceptos_delete on public.conceptos for delete to authenticated
  using (public.is_writer());

drop policy if exists daily_goals_insert on public.daily_goals;
create policy daily_goals_insert on public.daily_goals for insert to authenticated
  with check (public.is_writer());

drop policy if exists editors_insert on public.editors;
create policy editors_insert on public.editors for insert to authenticated
  with check (public.is_writer());

drop policy if exists editors_update on public.editors;
create policy editors_update on public.editors for update to authenticated
  using (public.is_writer()) with check (public.is_writer());

drop policy if exists settings_update on public.app_settings;
create policy settings_update on public.app_settings for update to authenticated
  using (public.is_writer()) with check (public.is_writer());

-- Sin políticas de delete en editors ni daily_goals, y sin insert/delete en
-- app_settings: desactivar no es borrar, y la fila única se siembra una vez.

drop policy if exists writers_self_read on public.writers;
create policy writers_self_read on public.writers for select to authenticated
  using (user_id = auth.uid());

-- ───────────────────────── tiempo real ─────────────────────────
-- Agregar dos veces la misma tabla a la publicación es un error, así que va
-- con guarda.
do $$
declare
  t text;
begin
  foreach t in array array['editors', 'conceptos', 'daily_goals', 'app_settings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ───────────────────────── semilla ─────────────────────────
-- Dos editores con meta 4 (meta de equipo 8). Renómbralos en Ajustes.
insert into public.editors (name, daily_goal, sort_order)
values ('Editor 1', 4, 0), ('Editor 2', 4, 1)
on conflict do nothing;

commit;
