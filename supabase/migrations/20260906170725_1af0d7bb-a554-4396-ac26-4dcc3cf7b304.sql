-- Restore admin bypass + section matching on access helpers
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

-- Restore staff-registry-aware signup trigger, now also storing grade + section from signup metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _login text;
  _role public.app_role := 'student';
  _name text;
begin
  _login := coalesce(new.raw_user_meta_data->>'login_id', split_part(new.email, '@', 1));
  _name := coalesce(new.raw_user_meta_data->>'full_name', _login);

  select r.role, coalesce(r.full_name, _name) into _role, _name
    from public.staff_registry r where lower(r.login_id) = lower(_login);
  if _role is null then _role := 'student'; end if;

  insert into public.profiles (id, username, email, login_id, full_name, app_role, grade_label, class_label, grade, section)
  values (
    new.id, _login, new.email, _login, _name, _role,
    nullif(new.raw_user_meta_data->>'grade_label',''),
    nullif(new.raw_user_meta_data->>'class_label',''),
    coalesce((new.raw_user_meta_data->>'grade')::public.grade_level, '9'),
    case when new.raw_user_meta_data->>'section' in ('A','B','C','D')
         then new.raw_user_meta_data->>'section' else 'A' end
  );
  return new;
end; $$;