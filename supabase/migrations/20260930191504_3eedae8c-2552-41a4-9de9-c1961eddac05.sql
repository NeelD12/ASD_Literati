insert into public.notifications (recipient_id, post_id, title, body, link)
select p.id, w.id, 'Classroom code generated', 'Code 482913 for "Morning essay" — valid for 30 minutes.', '/posts/' || w.id
from public.profiles p
join (select id from public.posts order by created_at desc limit 1) w on true
where p.username = 'bell.test.teacher'
returning id, recipient_id, title;