-- 1. Sections on profiles
alter table public.profiles add column section text not null default 'A' check (section in ('A','B','C','D'));
grant update (section) on public.profiles to authenticated;

-- 2. Section-aware permission tables
alter table public.post_view_permissions add column section text not null default 'A' check (section in ('A','B','C','D'));
alter table public.post_comment_permissions add column section text not null default 'A' check (section in ('A','B','C','D'));

alter table public.post_view_permissions drop constraint if exists post_view_permissions_post_id_grade_key;
alter table public.post_comment_permissions drop constraint if exists post_comment_permissions_post_id_grade_key;

-- Backfill: existing posts stay visible/commentable across all sections
insert into public.post_view_permissions (post_id, grade, section)
select post_id, grade, s.section from public.post_view_permissions cross join (values ('B'),('C'),('D')) as s(section);
insert into public.post_comment_permissions (post_id, grade, section)
select post_id, grade, s.section from public.post_comment_permissions cross join (values ('B'),('C'),('D')) as s(section);

alter table public.post_view_permissions add constraint post_view_permissions_post_id_grade_section_key unique (post_id, grade, section);
alter table public.post_comment_permissions add constraint post_comment_permissions_post_id_grade_section_key unique (post_id, grade, section);

-- 3. Section-aware access helpers
create or replace function public.current_section() returns text
language sql stable security definer set search_path = public as $$
  select section from public.profiles where id = auth.uid()
$$;

create or replace function public.can_view_post(_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists(select 1 from public.posts where id = _post and author_id = auth.uid())
    or exists(
      select 1 from public.post_view_permissions
      where post_id = _post and grade = public.current_grade() and section = public.current_section()
    )
$$;

create or replace function public.can_comment_post(_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.post_comment_permissions
    where post_id = _post and grade = public.current_grade() and section = public.current_section()
  )
$$;

grant execute on function public.current_section() to authenticated, anon;
grant execute on function public.can_view_post(uuid) to authenticated, anon;
grant execute on function public.can_comment_post(uuid) to authenticated, anon;

-- 4. Signup trigger picks up the section chosen at registration
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email, grade, section)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'grade')::public.grade_level, '9'),
    case when new.raw_user_meta_data->>'section' in ('A','B','C','D')
         then new.raw_user_meta_data->>'section' else 'A' end
  );
  return new;
end; $$;