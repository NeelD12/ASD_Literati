# ASD Literati

A student literary magazine for Ambassador School Dubai — grades 1–12 write
essays, stories, and criticism, and publish them for their classmates and
teachers to read and discuss, scoped by grade and section.

**Live app:** https://asd-literati.vercel.app

## What it does

- **Accounts.** Everyone signs in with their Full Name and a password —
  no usernames to remember. Students also register a 7-digit School ID at
  signup, which is checked for uniqueness so the same student can't create
  two accounts.
- **Roles.**
  - **Student** — reads whatever posts are shared with their grade/section,
    and comments where allowed.
  - **Teacher** — verified with a one-time **Admin Key** at signup. A
    verified teacher can see and comment on *every* post, regardless of
    grade or section, but that alone does not grant posting rights.
  - **Poster** — a verified teacher who has also redeemed a **Poster Key**
    (in Settings) gets permanent publishing access: rich-text posts, PDF
    attachments, and per-grade/section read & comment permissions on
    whatever they publish.
- **Classroom comment codes.** A post's author can generate a 6-digit code
  that's valid for 30 minutes. Students need that code to comment during
  class; the post's author, admins, and any verified teacher never need
  one. Every other verified teacher gets a live in-app notification the
  moment a code is generated, so they don't have to be in the room to get
  it.
- **View counts** are deduplicated per signed-in viewer — refreshing a post
  doesn't inflate the count.
- **Live updates.** New posts, comments, and replies appear for everyone
  with the page open, via Supabase Realtime — no manual refresh.

## Stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing —
  see `src/routes/README.md` for routing conventions) + Tailwind CSS +
  shadcn/ui
- [Supabase](https://supabase.com) — Postgres, Auth, Realtime, and all
  row-level security / business logic (roles, grade/section visibility,
  comment codes, notifications) implemented as SQL functions and RLS
  policies, not just app code
- Deployed on [Vercel](https://vercel.com), auto-deploying from `main`

### Why Vercel + a standalone Supabase project, instead of just Lovable?

This app started in [Lovable](https://lovable.dev) and is still edited
there for AI-assisted changes — Lovable's own commits land straight on
`main` here, same as anyone else's. But Lovable's own hosted preview runs
on a metered credit system, which isn't something a live, full-school
publication should depend on for everyday *traffic*. So the app is
deployed independently on Vercel against its own standalone Supabase
project (schema kept in sync with Lovable's managed one) — real student
and teacher usage never touches Lovable credits at all. Credits are only
spent when someone asks Lovable's agent to make a code change.

## Development

```sh
git clone https://github.com/NeelD12/ASD_Literati.git
cd ASD_Literati
npm i   # or: bun install
npm run dev
```

You'll need a `.env` with your Supabase project's URL and publishable key
(see `.env` in the repo for the variable names) — either point it at a
fresh Supabase project and apply the schema yourself, or ask for a copy of
the existing one.

```sh
npm run build    # production build
npm run lint      # eslint + prettier
```

## Credits

Developed by Neel Dhakan and Adityansu Pattanaik.
