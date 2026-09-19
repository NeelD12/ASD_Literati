GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_grade() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public."current_role"() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_comment_post(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.comment_wait_seconds(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.redeem_unlock_key(text) TO authenticated;