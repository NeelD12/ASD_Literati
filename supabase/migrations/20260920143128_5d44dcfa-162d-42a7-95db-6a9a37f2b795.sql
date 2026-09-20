create or replace function public.increment_post_views(_post uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.can_view_post(_post) then
    update public.posts set view_count = view_count + 1 where id = _post;
  end if;
end;
$$;

revoke all on function public.increment_post_views(uuid) from public;
grant execute on function public.increment_post_views(uuid) to authenticated;
grant execute on function public.increment_post_views(uuid) to service_role;