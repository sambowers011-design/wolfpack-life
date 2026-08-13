# Wolfpack Life

A welcome page and account flow for an NC State student app concept — classes, friends, calendar, campus map, goals, and clubs in one board.

**Live:** https://sambowers011-design.github.io/wolfpack-life/

No custom domain yet — running on the free `github.io` URL for now. If a domain gets picked up later, add a `CNAME` file to the repo root, set it via the GitHub Pages API/settings, and point the registrar's DNS at GitHub's Pages servers.

## Status: not done

This is the welcome flow plus one real page, not the whole app.

**Built:**
- Welcome / marketing page
- Create account, sign in, sign out (client-side, see caveat below)
- "Browse as a guest" mode
- A `board.html` page that gates on being signed in and links out to the pages below
- **Today** (`today.html`) — an "Up next" summary, a recurring weekly class schedule filtered to today, and a task list, all editable

**Not built:**
- The other eight pages — Goals, Classes, Calendar, Campus Map, Opportunities, Chat, Friends, Profile — are listed on the board page as static description cards tagged "Soon," not real pages.

## How accounts and data work (and why it's not real auth)

There's no backend or database. `auth.js` stores accounts in the browser's `localStorage` (password hashed with SHA-256 before saving) and sessions in `sessionStorage`. `data.js` stores each signed-in user's classes and tasks in `localStorage` keyed by their email; guest data lives in `sessionStorage` and disappears when the tab closes. This means:
- Accounts and data only exist in the browser they were created in — signing in from a different device or browser starts empty.
- This is not production-grade security. Don't reuse a real password here.

## Running locally

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed localhost URL.
