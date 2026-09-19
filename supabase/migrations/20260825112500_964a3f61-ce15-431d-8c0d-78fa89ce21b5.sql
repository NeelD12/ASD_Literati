-- ============ POSTS ============
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comment_cooldown_seconds integer NOT NULL DEFAULT 0;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============ GRADE PERMISSION TABLES ============
CREATE TABLE IF NOT EXISTS public.post_view_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  grade public.grade_level NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, grade)
);
CREATE TABLE IF NOT EXISTS public.post_comment_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  grade public.grade_level NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, grade)
);
GRANT SELECT, INSERT, DELETE ON public.post_view_permissions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.post_comment_permissions TO authenticated;
GRANT ALL ON public.post_view_permissions TO service_role;
GRANT ALL ON public.post_comment_permissions TO service_role;
ALTER TABLE public.post_view_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comment_permissions ENABLE ROW LEVEL SECURITY;

-- ============ UNLOCK KEYS ============
CREATE TABLE IF NOT EXISTS public.unlock_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  action public.unlock_action NOT NULL DEFAULT 'upgrade',
  target_role public.user_role NOT NULL DEFAULT 'poster',
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.unlock_keys TO service_role;
ALTER TABLE public.unlock_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage unlock keys" ON public.unlock_keys;
CREATE POLICY "admins manage unlock keys" ON public.unlock_keys
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.user_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.user_role));

-- ============ ACCESS HELPERS ============
CREATE OR REPLACE FUNCTION public.can_view_post(_post uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = _post AND author_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin'::public.user_role)
      OR EXISTS (SELECT 1 FROM public.post_view_permissions v
                  WHERE v.post_id = _post AND v.grade = public.current_grade())
$$;

CREATE OR REPLACE FUNCTION public.can_comment_post(_post uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = _post AND author_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin'::public.user_role)
      OR EXISTS (SELECT 1 FROM public.post_comment_permissions c
                  WHERE c.post_id = _post AND c.grade = public.current_grade())
$$;
REVOKE EXECUTE ON FUNCTION public.can_comment_post(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_post(uuid) FROM anon;

-- how long until this user may comment again on this post
CREATE OR REPLACE FUNCTION public.comment_wait_seconds(_post uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE gap integer; last_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  SELECT comment_cooldown_seconds INTO gap FROM public.posts WHERE id = _post;
  IF coalesce(gap, 0) <= 0 THEN RETURN 0; END IF;
  SELECT max(created_at) INTO last_at FROM public.comments
    WHERE post_id = _post AND author_id = auth.uid();
  IF last_at IS NULL THEN RETURN 0; END IF;
  RETURN greatest(0, ceil(extract(epoch FROM (last_at + make_interval(secs => gap) - now())))::int);
END; $$;
REVOKE EXECUTE ON FUNCTION public.comment_wait_seconds(uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.enforce_comment_cooldown()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gap integer; last_at timestamptz; wait_s integer;
BEGIN
  SELECT comment_cooldown_seconds INTO gap FROM public.posts WHERE id = NEW.post_id;
  IF coalesce(gap, 0) <= 0 THEN RETURN NEW; END IF;
  SELECT max(created_at) INTO last_at FROM public.comments
    WHERE post_id = NEW.post_id AND author_id = NEW.author_id;
  IF last_at IS NULL THEN RETURN NEW; END IF;
  wait_s := ceil(extract(epoch FROM (last_at + make_interval(secs => gap) - now())))::int;
  IF wait_s > 0 THEN
    RAISE EXCEPTION 'Please wait % more second(s) before commenting on this post again.', wait_s;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS comments_cooldown ON public.comments;
CREATE TRIGGER comments_cooldown BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_cooldown();

-- ============ PERMISSION ROW POLICIES ============
DROP POLICY IF EXISTS "view permission rows readable" ON public.post_view_permissions;
CREATE POLICY "view permission rows readable" ON public.post_view_permissions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "author manages view perms" ON public.post_view_permissions;
CREATE POLICY "author manages view perms" ON public.post_view_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

DROP POLICY IF EXISTS "comment permission rows readable" ON public.post_comment_permissions;
CREATE POLICY "comment permission rows readable" ON public.post_comment_permissions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "author manages comment perms" ON public.post_comment_permissions;
CREATE POLICY "author manages comment perms" ON public.post_comment_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

-- ============ POSTS POLICIES ============
DROP POLICY IF EXISTS "view permitted posts" ON public.posts;
DROP POLICY IF EXISTS "view posts you have access to" ON public.posts;
CREATE POLICY "view posts you have access to" ON public.posts
  FOR SELECT TO authenticated USING (public.can_view_post(id));

DROP POLICY IF EXISTS "staff create posts" ON public.posts;
DROP POLICY IF EXISTS "posters can insert their own posts" ON public.posts;
CREATE POLICY "posters can insert their own posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM public.profiles pr
                 WHERE pr.id = auth.uid()
                   AND pr.role IN ('poster'::public.user_role, 'admin'::public.user_role))
  );

DROP POLICY IF EXISTS "authors update posts" ON public.posts;
DROP POLICY IF EXISTS "authors can update their own posts" ON public.posts;
CREATE POLICY "authors can update their own posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::public.user_role))
  WITH CHECK (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::public.user_role));

DROP POLICY IF EXISTS "authors delete posts" ON public.posts;
DROP POLICY IF EXISTS "authors can delete their own posts" ON public.posts;
CREATE POLICY "authors can delete their own posts" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'::public.user_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;

-- ============ COMMENTS POLICIES ============
DROP POLICY IF EXISTS "approved comments readable" ON public.comments;
DROP POLICY IF EXISTS "read comments if you can view post" ON public.comments;
CREATE POLICY "read comments if you can view post" ON public.comments
  FOR SELECT TO authenticated USING (public.can_view_post(post_id));

DROP POLICY IF EXISTS "insert comments if you can comment on post" ON public.comments;
CREATE POLICY "insert comments if you can comment on post" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.can_comment_post(post_id));

DROP POLICY IF EXISTS "moderators update comments" ON public.comments;
DROP POLICY IF EXISTS "edit own comments" ON public.comments;
CREATE POLICY "edit own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "moderators delete comments" ON public.comments;
DROP POLICY IF EXISTS "delete own comments" ON public.comments;
CREATE POLICY "delete own comments" ON public.comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.user_role)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;

-- ============ UNLOCK KEY REDEMPTION ============
CREATE OR REPLACE FUNCTION public.redeem_unlock_key(_key text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k public.unlock_keys;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'message', 'You must be signed in.');
  END IF;
  SELECT * INTO k FROM public.unlock_keys WHERE key = btrim(_key) FOR UPDATE;
  IF NOT FOUND OR NOT k.active THEN
    RETURN json_build_object('ok', false, 'message', 'That key is not valid.');
  END IF;
  IF k.uses >= k.max_uses THEN
    RETURN json_build_object('ok', false, 'message', 'That key has already been used.');
  END IF;
  UPDATE public.profiles
     SET role = CASE WHEN k.action = 'upgrade' THEN k.target_role ELSE 'default'::public.user_role END
   WHERE id = auth.uid();
  UPDATE public.unlock_keys SET uses = uses + 1 WHERE id = k.id;
  RETURN json_build_object('ok', true, 'message',
    CASE WHEN k.action = 'upgrade'
      THEN 'Your account is now a ' || k.target_role::text || '.'
      ELSE 'Your account was returned to the default role.' END);
END; $$;
REVOKE EXECUTE ON FUNCTION public.redeem_unlock_key(text) FROM anon;

-- ============ STORAGE POLICIES (post-files) ============
DROP POLICY IF EXISTS "posters upload post files" ON storage.objects;
CREATE POLICY "posters upload post files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (SELECT 1 FROM public.profiles pr
                 WHERE pr.id = auth.uid()
                   AND pr.role IN ('poster'::public.user_role, 'admin'::public.user_role))
  );

DROP POLICY IF EXISTS "signed-in users read post files" ON storage.objects;
CREATE POLICY "signed-in users read post files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'post-files');

DROP POLICY IF EXISTS "owners delete post files" ON storage.objects;
CREATE POLICY "owners delete post files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text
         OR public.has_role(auth.uid(), 'admin'::public.user_role))
  );