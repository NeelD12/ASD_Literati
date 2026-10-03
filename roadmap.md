# Roadmap

## Done

- [x] Full Name + password auth for everyone; 7-digit School ID uniqueness
      check for students
- [x] Two-tier teacher access: Admin Key (verification only) vs. Poster Key
      (posting rights)
- [x] Teachers see/comment on every post regardless of grade or section
- [x] Per-viewer deduplicated view counts
- [x] Live updates for new posts, comments, and replies (Supabase Realtime)
- [x] Classroom comment codes (30-minute window) with a live notification
      to other verified teachers when one is generated
- [x] Standalone Vercel + Supabase deployment, decoupled from Lovable's
      credit-metered hosting
- [x] Sky-blue auth pages / warmer green app theme, consistent heading
      sizes, bottom-right credit widget

## Open

- [x] Redesign PDF previews as a large overlay with a collapsible, independently scrolling comments panel; keep the existing comments behavior and use Helvetica for micro text
- [ ] Ambassador School logo in the header (and ideally the auth pages) —
      blocked on getting the actual logo file into the repo
- [ ] Broader accessibility / color-contrast pass now that the palette has
      changed
- [ ] Decide whether teacher accounts should be scoped to specific grades
      they teach (currently: a verified teacher sees/comments on every
      grade, with no per-teacher grade assignment)
