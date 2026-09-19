DROP POLICY IF EXISTS "view posts you have access to" ON public.posts;

CREATE POLICY "view posts you have access to"
ON public.posts
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
  OR public.can_view_post(id)
);