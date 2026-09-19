
-- Extend grade enum to 1..12
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS '1' BEFORE '6';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS '2' BEFORE '6';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS '3' BEFORE '6';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS '4' BEFORE '6';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS '5' BEFORE '6';

-- Fix posts insert policy: schema-qualify the role check so it doesn't collide
-- with pg_catalog.current_role (a reserved keyword that resolves first).
DROP POLICY IF EXISTS "posters can insert their own posts" ON public.posts;
CREATE POLICY "posters can insert their own posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (public.has_role(auth.uid(), 'poster'::public.user_role)
      OR public.has_role(auth.uid(), 'admin'::public.user_role))
  );
