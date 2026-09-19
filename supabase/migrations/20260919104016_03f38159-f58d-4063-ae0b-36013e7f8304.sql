-- ============================================================
-- Comment rate limiting (cooldown) + updated_at triggers
-- ============================================================

-- Recreate cooldown helpers with consistent search_path
create or replace function public.comment_wait_seconds(_post uuid)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cooldown int;
  last_at timestamptz;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select comment_cooldown_seconds into cooldown
  from public.posts where id = _post;

  if cooldown is null or cooldown <= 0 then
    return 0;
  end if;

  select max(created_at) into last_at
  from public.comments
  where post_id = _post and author_id = auth.uid();

  if last_at is null then
    return 0;
  end if;

  return greatest(0, cooldown - extract(epoch from (now() - last_at))::int);
end;
$$;

create or replace function public.enforce_comment_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wait int;
begin
  wait := public.comment_wait_seconds(new.post_id);
  if wait > 0 then
    raise exception 'Please wait %s before commenting again', wait;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_enforce_cooldown on public.comments;
create trigger comments_enforce_cooldown
  before insert on public.comments
  for each row execute function public.enforce_comment_cooldown();

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
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

-- Access tightening
revoke execute on function public.enforce_comment_cooldown() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
grant execute on function public.comment_wait_seconds(uuid) to authenticated;
revoke execute on function public.comment_wait_seconds(uuid) from anon;