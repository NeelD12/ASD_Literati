-- =====================================================================
-- Scholarly — Blog platform schema
-- Run this in the Supabase SQL editor for your own project.
-- =====================================================================

-- ---------- Enums ---------------------------------------------------
create type public.user_role as enum ('default', 'poster', 'admin');
create type public.grade_level as enum ('6','7','8','9','10','11','12');
create type public.unlock_action as enum ('upgrade','downgrade');

-- ---------- Profiles ------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text not null,
  role public.user_role not null default 'default',
  grade public.grade_level not null default '9',
  created_at timestamptz not null default now()
);

grant select on public.profiles to anon, authenticated;
grant update (username, grade) on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

create policy "users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email, grade)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'grade')::public.grade_level, '9')
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: get current user's role / grade
create or replace function public.current_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_grade() returns public.grade_level
language sql stable security definer set search_path = public as $$
  select grade from public.profiles where id = auth.uid()
$$;

create or replace function public.has_role(_uid uuid, _role public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = _uid and role = _role)
$$;

-- ---------- Posts ---------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null default '',
  cover_image text,
  tags text[] not null default '{}',
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_idx on public.posts(author_id);
create index posts_created_idx on public.posts(created_at desc);

grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;

alter table public.posts enable row level security;

-- ---------- Permission tables --------------------------------------
create table public.post_view_permissions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  grade public.grade_level not null,
  unique(post_id, grade)
);
create index post_view_post_idx on public.post_view_permissions(post_id);

create table public.post_comment_permissions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  grade public.grade_level not null,
  unique(post_id, grade)
);
create index post_comment_post_idx on public.post_comment_permissions(post_id);

grant select, insert, delete on public.post_view_permissions to authenticated;
grant select, insert, delete on public.post_comment_permissions to authenticated;
grant all on public.post_view_permissions to service_role;
grant all on public.post_comment_permissions to service_role;

alter table public.post_view_permissions enable row level security;
alter table public.post_comment_permissions enable row level security;

-- Helper: can current user view a post?
create or replace function public.can_view_post(_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists(select 1 from public.posts where id = _post and author_id = auth.uid())
    or exists(
      select 1 from public.post_view_permissions
      where post_id = _post and grade = public.current_grade()
    )
$$;

create or replace function public.can_comment_post(_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.post_comment_permissions
    where post_id = _post and grade = public.current_grade()
  )
$$;

-- Posts: RLS
create policy "view posts you have access to"
  on public.posts for select to authenticated
  using (public.can_view_post(id));

create policy "posters can insert their own posts"
  on public.posts for insert to authenticated
  with check (auth.uid() = author_id and public.current_role() in ('poster','admin'));

create policy "authors can update their own posts"
  on public.posts for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "authors can delete their own posts"
  on public.posts for delete to authenticated
  using (auth.uid() = author_id);

-- Permission rows: readable by anyone who can view the post; author manages
create policy "view permission rows readable" on public.post_view_permissions
  for select to authenticated using (public.can_view_post(post_id));
create policy "comment permission rows readable" on public.post_comment_permissions
  for select to authenticated using (public.can_view_post(post_id));

create policy "author manages view perms (insert)" on public.post_view_permissions
  for insert to authenticated with check (
    exists(select 1 from public.posts where id = post_id and author_id = auth.uid())
  );
create policy "author manages view perms (delete)" on public.post_view_permissions
  for delete to authenticated using (
    exists(select 1 from public.posts where id = post_id and author_id = auth.uid())
  );

create policy "author manages comment perms (insert)" on public.post_comment_permissions
  for insert to authenticated with check (
    exists(select 1 from public.posts where id = post_id and author_id = auth.uid())
  );
create policy "author manages comment perms (delete)" on public.post_comment_permissions
  for delete to authenticated using (
    exists(select 1 from public.posts where id = post_id and author_id = auth.uid())
  );

-- ---------- Comments -----------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id, created_at);

grant select, insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;

alter table public.comments enable row level security;

create policy "read comments if you can view post"
  on public.comments for select to authenticated
  using (public.can_view_post(post_id));

create policy "insert comments if you can comment on post"
  on public.comments for insert to authenticated
  with check (auth.uid() = author_id and public.can_comment_post(post_id));

create policy "edit own comments"
  on public.comments for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "delete own comments OR post author can delete"
  on public.comments for delete to authenticated
  using (
    auth.uid() = author_id
    or exists(select 1 from public.posts where id = post_id and author_id = auth.uid())
  );

-- ---------- Unlock keys --------------------------------------------
create table public.unlock_keys (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  action public.unlock_action not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.unlock_keys to authenticated;
grant all on public.unlock_keys to service_role;

alter table public.unlock_keys enable row level security;
-- No SELECT policy = users can't list keys. They use the redeem RPC below.

-- Secure redemption RPC
create or replace function public.redeem_unlock_key(_key text)
returns json language plpgsql security definer set search_path = public as $$
declare
  k public.unlock_keys%rowtype;
  new_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into k from public.unlock_keys where key = _key and active = true;
  if not found then
    return json_build_object('ok', false, 'message', 'Invalid or inactive key');
  end if;

  if k.action = 'upgrade' then new_role := 'poster';
  else new_role := 'default';
  end if;

  update public.profiles set role = new_role where id = auth.uid();
  return json_build_object('ok', true, 'role', new_role);
end; $$;

grant execute on function public.redeem_unlock_key(text) to authenticated;

-- Seed two example keys (change these in production!)
insert into public.unlock_keys (key, action) values
  ('POSTER-2026', 'upgrade'),
  ('REVERT-2026', 'downgrade');
