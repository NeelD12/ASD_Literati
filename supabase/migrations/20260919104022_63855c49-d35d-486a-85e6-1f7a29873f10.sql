-- ============================================================
-- Grade + section permissions
-- ============================================================

-- Add section columns to the permission tables.
alter table public.post_view_permissions
  add column if not exists section text not null default 'A';
alter table public.post_comment_permissions
  add column if not exists section text not null default 'A';

-- Widen uniqueness to (post, grade, section).
alter table public.post_view_permissions
  drop constraint if exists post_view_permissions_post_id_grade_key;
alter table public.post_comment_permissions
  drop constraint if exists post_comment_permissions_post_id_grade_key;

alter table public.post_view_permissions
  add constraint post_view_permissions_unique
  unique (post_id, grade, section);
alter table public.post_comment_permissions
  add constraint post_comment_permissions_unique
  unique (post_id, grade, section);

create index if not exists post_view_post_idx on public.post_view_permissions(post_id);
create index if not exists post_comment_post_idx on public.post_comment_permissions(post_id);

-- Access helpers now match on grade + section.
create or replace function public.can_view_post(_post uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists(
      select 1 from public.posts
      where id = _post and author_id = auth.uid()
    )
    or exists(
      select 1 from public.post_view_permissions
      where post_id = _post
        and grade = public.current_grade()
        and section = (select section from public.profiles where id = auth.uid())
    )
$$;

create or replace function public.can_comment_post(_post uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.post_comment_permissions
    where post_id = _post
      and grade = public.current_grade()
      and section = (select section from public.profiles where id = auth.uid())
  )
$$;

-- Signup now records the section too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, grade, section)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'grade')::public.grade_level, '6'),
    coalesce(nullif(new.raw_user_meta_data->>'section', ''), 'A')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Keep grants aligned
grant select, insert, delete on public.post_view_permissions to authenticated;
grant select, insert, delete on public.post_comment_permissions to authenticated;