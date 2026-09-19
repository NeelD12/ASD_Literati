-- Seed the teacher unlock key
insert into public.unlock_keys (key, action, active)
values ('asdxbTeacher@2026!', 'upgrade', true)
on conflict (key) do update set action = 'upgrade', active = true;

-- Lock down helper functions: only the app-facing ones stay executable,
-- and only by signed-in members where appropriate.
revoke execute on function public.current_role() from anon;
revoke execute on function public.current_grade() from anon;
revoke execute on function public.has_role(uuid, public.user_role) from anon;

-- Internal helpers are not part of the public API surface.
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Rate-limit attempts table is internal only.
revoke all on public.unlock_key_attempts from anon, authenticated;