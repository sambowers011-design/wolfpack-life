# Wolfpack Life

A welcome page and account flow for an NC State student app concept — classes, friends, calendar, campus map, goals, and clubs in one board.

**Live:** https://sambowers011-design.github.io/wolfpack-life/

No custom domain yet — running on the free `github.io` URL for now. If a domain gets picked up later, add a `CNAME` file to the repo root, set it via the GitHub Pages API/settings, and point the registrar's DNS at GitHub's Pages servers.

## Status: not done

This is the welcome flow plus five real pages, not the whole app.

**Built:**
- Welcome / marketing page
- Create account, sign in, sign out (client-side, see caveat below)
- "Browse as a guest" mode
- A `board.html` page that gates on being signed in and links out to the pages below
- **Today** (`today.html`) — an "Up next" summary that highlights the class happening now or next, today's classes filtered from the weekly schedule, and a task list, all editable
- **Goals** (`goals.html`) — goals grouped by term (chronologically sorted, parsing "Season YYYY" strings), each with a click-to-cycle status pill (Not started → In progress → Done), add/edit/delete. The add form defaults the term field to the current term based on today's date.
- **Classes** (`classes.html`) — the full weekly schedule grouped by day, with add/edit/delete on the same recurring class data Today reads from
- **Calendar** (`calendar.html`) — a 7-day week grid merging the recurring class schedule with dated tasks, with prev/this-week/next-week navigation and per-day quick-add
- **Profile** (`profile.html`) — edit your display name, change your password (requires the current one), and a danger-zone account deletion (also requires your password) that wipes your account and all its data. Email is read-only since it's the storage key. Guests see a "no account to edit" state instead.
- **Privacy** (`privacy.html`) and **Terms** (`terms.html`) — real pages now; every footer previously linked to `#privacy`/`#terms` anchors that didn't exist anywhere

**Not built:**
- The other four pages — Campus Map, Opportunities, Chat, Friends — are listed on the board page as static description cards tagged "Soon," not real pages. Chat and Friends in particular are a poor fit for this architecture (no backend means no real multi-user data) and may stay stubs.

**Design:** white/NC State red palette, Roboto Slab display type paired with Inter for UI, rounded cards and pill-shaped controls, a solid red block for the feature section. Originally started closer to another independent student-app landing page's cream/black, sharp-square, condensed-type look; this pass replaced the type, palette, corner radius, and section treatment to make it visually its own.

## How accounts and data work (and why it's not real auth)

There's no backend or database. `auth.js` stores accounts in the browser's `localStorage` (password hashed with SHA-256 before saving) and sessions in `sessionStorage`. `data.js` stores each signed-in user's classes and tasks in `localStorage` keyed by their email; guest data lives in `sessionStorage` and disappears when the tab closes. This means:
- Accounts and data only exist in the browser they were created in — signing in from a different device or browser starts empty.
- This is not production-grade security. Don't reuse a real password here.
- If you're browsing as a guest and create an account, your current guest classes/tasks are migrated into the new account (so "Create an account to keep it" is actually true) — but only on account *creation*, not on signing into an existing account from a guest session.

## Running locally

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed localhost URL.
