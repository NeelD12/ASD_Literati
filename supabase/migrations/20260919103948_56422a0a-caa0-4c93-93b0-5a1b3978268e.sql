-- ============================================================
-- Migration: content, attachments, comments v2, key redemption
-- ============================================================

-- ---------- posts columns ----------
alter table public.posts add column if not exists content text not null default '';
alter table public.posts add column if not exists cover_image text;
alter table public.posts add column if not exists tags text[] not null default '{}';
alter table public.posts add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.posts add column if not exists comment_cooldown_seconds int not null default 0;

-- ---------- comments ----------
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists updated_at timestamptz not null default now();

-- ---------- unlock key redemption (v2) ----------
create or replace function public.redeem_unlock_key(_key text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  k public.unlock_keys%rowtype;
  new_role public.user_role;
  attempts int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Rate limit: 5 redemption attempts per user per minute
  select count(*) into attempts
  from public.unlock_key_attempts
  where user_id = auth.uid() and attempted_at > now() - interval '1 minute';
  if attempts >= 5 then
    return json_build_object('ok', false, 'message', 'Too many attempts. Wait a minute.');
  end if;

  insert into public.unlock_key_attempts (user_id, attempted_at)
  values (auth.uid(), now());

  select * into k from public.unlock_keys where key = _key and active = true;
  if not found then
    return json_build_object('ok', false, 'message', 'Invalid or inactive key');
  end if;

  if k.action = 'upgrade' then
    new_role := 'poster';
  else
    new_role := 'default';
  end if;

  update public.profiles set role = new_role where id = auth.uid();

  -- Deactivate the key after use (single-use)
  update public.unlock_keys set active = false where id = k.id;

  return json_build_object('ok', true, 'role', new_role);
end;
$$;

-- attempts table for rate limiting
create table if not exists public.unlock_key_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  attempted_at timestamptz not null default now()
);
alter table public.unlock_key_attempts enable row level security;

revoke all on function public.redeem_unlock_key(text) from anon;
grant execute on function public.redeem_unlock_key(text) to authenticated;

-- ---------- updated_at trigger for posts/comments ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();