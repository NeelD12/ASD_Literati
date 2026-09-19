INSERT INTO public.unlock_keys (key, action, target_role, max_uses, uses, active)
VALUES ('asdxbTeacher@2026!', 'upgrade', 'poster', 1000000, 0, true)
ON CONFLICT DO NOTHING;

UPDATE public.unlock_keys
SET action = 'upgrade', target_role = 'poster', max_uses = 1000000, active = true
WHERE key = 'asdxbTeacher@2026!';