-- ============================================================
-- Posts & comments policy refresh + comment cooldown + storage
-- ============================================================

-- comment cooldown helper
create or replace function public.comment_wait_seconds(_post uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown int;
  last_at timestamptz;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select comment_cooldown_seconds into cooldown
  from public.posts where id = _post;

  if cooldown is null or cooldown <= 0 then
    return 0;
  end if;

  select max(created_at) into last_at
  from public.comments
  where post_id = _post and author_id = auth.uid();

  if last_at is null then
    return 0;
  end if;

  return greatest(0, cooldown - extract(epoch from (now() - last_at))::int);
end;
$$;

create or replace function public.enforce_comment_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wait int;
begin
  wait := public.comment_wait_seconds(new.post_id);
  if wait > 0 then
    raise exception 'Please wait %s before commenting again', wait;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_enforce_cooldown on public.comments;
create trigger comments_enforce_cooldown
  before insert on public.comments
  for each row execute function public.enforce_comment_cooldown();

-- ============ POSTS POLICIES ============
DROP POLICY IF EXISTS "view posts you have access to" ON public.posts;
DROP POLICY IF EXISTS "posts viewable" ON public.posts;
CREATE POLICY "view posts you have access to" ON public.posts
  FOR SELECT TO authenticated
  USING (public.can_view_post(id));

DROP POLICY IF EXISTS "posters can insert their own posts" ON public.posts;
CREATE POLICY "posters can insert their own posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (public.has_role(auth.uid(), 'poster'::public.user_role)
      OR public.has_role(auth.uid(), 'admin'::public.user_role))
  );

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

-- ============ STORAGE: post-files bucket ============
-- Authors upload; viewers with read access download.

DROP POLICY IF EXISTS "post authors upload files" ON storage.objects;
CREATE POLICY "post authors upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "post authors manage files" ON storage.objects;
CREATE POLICY "post authors manage files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "post authors delete files" ON storage.objects;
CREATE POLICY "post authors delete files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "post files readable by permitted" ON storage.objects;
CREATE POLICY "post files readable by permitted" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'post-files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.post_view_permissions pvp
        WHERE pvp.post_id::text = (storage.foldername(name))[2]
          AND pvp.grade = public.current_grade()
      )
      OR EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.author_id = auth.uid()
      )
    )
  );

-- Seed teacher key + profile (idempotent)
INSERT INTO public.unlock_keys (key, action, active)
VALUES ('asdxbTeacher@2026!', 'upgrade', true)
ON CONFLICT (key) DO UPDATE SET active = true;

INSERT INTO public.profiles (id, username, email, role, grade)
SELECT u.id, 'asdxbTeacher', u.email, 'poster', '12'
FROM auth.users u
WHERE u.email = 'asdxbTeacher@scholarly.local'
ON CONFLICT (id) DO NOTHING;

GRANT EXECUTE ON FUNCTION public.comment_wait_seconds(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.comment_wait_seconds(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_comment_cooldown() FROM anon, authenticated;