-- ============================================================
-- Reconciliation: profiles.section, section helpers, admin bypass,
-- unlock key usage columns, helper grants
-- ============================================================

-- 1. Profiles: section column with A-D check
alter table public.profiles add column if not exists section text not null default 'A';
grant update (section) on public.profiles to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_section_check'
  ) then
    alter table public.profiles add constraint profiles_section_check check (section in ('A','B','C','D'));
  end if;
end $$;

-- 2. Permission tables: enforce A-D on the existing section columns
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'post_view_permissions_section_check') then
    alter table public.post_view_permissions add constraint post_view_permissions_section_check check (section in ('A','B','C','D'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'post_comment_permissions_section_check') then
    alter table public.post_comment_permissions add constraint post_comment_permissions_section_check check (section in ('A','B','C','D'));
  end if;
end $$;

-- Backfill: existing posts stay visible/commentable across all sections
insert into public.post_view_permissions (post_id, grade, section)
select post_id, grade, s.section from public.post_view_permissions cross join (values ('B'),('C'),('D')) as s(section)
on conflict do nothing;
insert into public.post_comment_permissions (post_id, grade, section)
select post_id, grade, s.section from public.post_comment_permissions cross join (values ('B'),('C'),('D')) as s(section)
on conflict do nothing;

-- 3. current_section helper
create or replace function public.current_section() returns text
language sql stable security definer set search_path = public as $$
  select section from public.profiles where id = auth.uid()
$$;

-- 4. Section-aware access helpers with admin bypass
create or replace function public.can_view_post(_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = _post and author_id = auth.uid())
      or public.has_role(auth.uid(), 'admin'::public.user_role)
      or exists (select 1 from public.post_view_permissions v
                  where v.post_id = _post and v.grade = public.current_grade() and v.section = public.current_section())
$$;

create or replace function public.can_comment_post(_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = _post and author_id = auth.uid())
      or public.has_role(auth.uid(), 'admin'::public.user_role)
      or exists (select 1 from public.post_comment_permissions c
                  where c.post_id = _post and c.grade = public.current_grade() and c.section = public.current_section())
$$;

-- 5. Signup trigger picks up grade + section chosen at registration
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
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- 6. Unlock keys: usage tracking columns + teacher key seed
alter table public.unlock_keys add column if not exists target_role public.user_role;
alter table public.unlock_keys add column if not exists max_uses int;
alter table public.unlock_keys add column if not exists uses int not null default 0;

insert into public.unlock_keys (key, action, target_role, max_uses, uses, active)
values ('asdxbTeacher@2026!', 'upgrade', 'poster', 1000000, 0, true)
on conflict (key) do update set action = 'upgrade', target_role = 'poster', max_uses = 1000000, active = true;

update public.unlock_keys
set action = 'upgrade', target_role = 'poster', max_uses = 1000000, active = true
where key = 'asdxbTeacher@2026!';

-- 7. Admin bypass on post visibility
DROP POLICY IF EXISTS "view posts you have access to" ON public.posts;
CREATE POLICY "view posts you have access to"
ON public.posts FOR SELECT TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.user_role) OR public.can_view_post(id));

-- 8. Helper grants so the app can evaluate access
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_grade() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public."current_role"() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_section() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_comment_post(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.comment_wait_seconds(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.redeem_unlock_key(text) TO authenticated;