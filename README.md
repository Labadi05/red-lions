# 🦁 Red Lions: Official Football Club Website

Official website and team management system for **Red Lions**, a Moroccan football team based in **Jinzhou, China**.

One shared system powers three experiences:

| Area | Who | Purpose |
| --- | --- | --- |
| **Public website** | Everyone | Team story, squad and player profiles, news, fixtures and results, player stats, gallery, contact |
| **Players' portal** | Registered players | Private announcements, events and attendance, lineups, polls, payments, personal attendance record, inbox |
| **Captain's dashboard** | Admin (captain) | Runs everything above without editing code |

Whatever the captain publishes can be shown **publicly** or **only to players**, depending on the choice made when publishing.

The public site and the players' portal are available in **English and Arabic** (with right-to-left layout). The captain's dashboard is English only.

---

## Public website

- **Home**: club badge, quick links to every section.
- **About**: the team story, written by the captain.
- **Squad**: players grouped by position (goalkeepers, defenders, midfielders, forwards), with photo, shirt number and captain marker.
- **Player profiles**: large photo, number, position, and career stats (appearances, goals, assists, man of the match). Each profile has its own shareable link.
- **News**: official announcements marked as public.
- **Fixtures and results**: upcoming matches, past results with scores and win/draw/loss badges, and the team's overall record and goals.
- **Player stats**: leaderboards for top scorers, assists, man of the match and appearances.
- **Gallery**: photos, short video clips played in the page, and links to videos on other sites. Items marked "players only" are hidden from the public.
- **Contact**: WeChat ID, WhatsApp, email and social media links (only the ones the captain fills in are shown).
- **Language switch**: English / العربية, remembered in the browser. The first visit follows the browser's language.
- **Install as an app**: the site can be added to a phone's home screen with the team badge (works on iPhone and Android), with a simple offline screen and an install guide page.
## Players' portal

Each player has an individual account created by the captain.

- **Personal side panel**: team badge, the player's photo, shirt number and position, with quick links.
- **Upcoming events**: trainings, matches and meetings with time, place and notes. Players answer *Coming / Maybe / Can't come*, with an optional reason.
- **Lineups**: published match lineups shown on a pitch, with formation and bench.
- **Polls**: team decisions with optional deadlines. Results appear after voting, and votes can be changed until the poll closes.
- **Man of the match votes**: anonymous, and nobody can vote for themselves.
- **My attendance**: attendance rate, replies given, no-shows and recent history.
- **My payments**: what the player owes, for what and why, due dates (overdue ones are flagged), how to pay, and an "I've paid" button that the captain confirms. Players only ever see their own payments.
- **Announcements**: public and players-only posts, including internal-game team cards with penalty shooting order.
- **Inbox**: private messages, tasks, to-dos, punishments and rewards from the captain, with "mark as done" and an unread badge. Players can also write suggestions, messages or problems to the captain, follow their status and read the captain's reply.
- **Gallery**: includes the players-only photos and clips.
-  **Phone notifications**: players can turn on alerts for new announcements, events and schedule changes, polls, lineups, messages and tasks, payments and replies to their suggestions. Alerts never include private amounts.

## Captain's dashboard

- **Player accounts**: create logins, generate passwords, reset them (a reset signs the player out everywhere).
- **Squad**: add players, edit numbers, names and positions, upload player photos, delete players who have no history.
- **Announcements**: publish, edit, delete; public or players-only; one-tap *Copy for WeChat*.
- **Events**: create trainings, matches and meetings; see who answered and why; copy the event for WeChat. Matches carry an opponent and a final score.
- **Lineups**: formation builder for 11-a-side and 7-a-side, live pitch preview, bench, attendance hints, publish to players.
- **Match stats**: who played, goals, assists and man of the match, with a check against the final score.
- **Man of the match vote**: open a 48-hour anonymous vote for a match and record the winner.
- **Check-in and attendance ranking**: tick who actually came after each event. The dashboard ranks players by attendance rate, replies, no-shows and declines, filterable by trainings, matches or meetings.
- **Polls**: create with deadlines, close or reopen, see who has not voted yet, copy for WeChat.
- **Messages**: send messages, tasks, to-dos, punishments or rewards to everyone or selected players, with due dates, and see who has seen or completed them.
- **Player feedback**: review suggestions and problems, set a status (new, reviewed, planned, not for now) and reply.
- **Money tracker**: charges for pitch rental, water, fines, equipment and more; same amount per player or a total split with exact cents; per-player paid/unpaid, confirm "I've paid" claims, who owes what, a reminder to copy, and the payment instructions shown to players.
- **Teams**: build 2 to 4 teams by hand for internal games or penalty shootouts (with a per-player position override for the day), see them live, shuffle only the penalty shooting order, copy for WeChat or post to the players' portal.
- **Gallery manager**: upload photos (up to 10 at a time) and video clips, add video links, switch items between public and players-only, delete.
- **Site info**: social links, contact details, team story and payment details.
- **Security log**: failed login attempts from the last 7 days.
- **Notify**: send a custom alert to everyone or selected players, and see how many players have notifications on.

## Security and privacy

- Passwords are stored hashed (bcrypt). Sessions use signed, HTTP-only cookies, and a password reset invalidates old sessions.
- Every admin page and action checks the captain role on the server.
- **Login protection**: repeated failed logins lock the username or address for 15 minutes. Unknown usernames and wrong passwords get the same answer.
- Security headers are sent on every page (no embedding in other sites, no content sniffing, strict referrer policy).
- Players-only photos and clips are only served to logged-in users.
- Uploaded photos are re-encoded and stripped of hidden metadata such as location. Uploaded videos are checked by their real file type and size.
- Private data is only shown to the people it belongs to: payments and attendance records to the player and the captain, messages to their recipients, and votes in man-of-the-match polls to nobody.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router, Server Actions) and React
- [Tailwind CSS](https://tailwindcss.com/)
- SQLite through [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), a single database file
- [sharp](https://sharp.pixelplumbing.com/) for image processing
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) and [jose](https://github.com/panva/jose) for authentication
- Fonts through `next/font` (Geist, and Cairo for Arabic), served from the site itself

## Getting started

Requirements: [Node.js](https://nodejs.org/) (LTS).

```bash
git clone <this-repo-url>
cd red-lions
npm install
```

Create a `.env.local` file in the project root:

```
SESSION_SECRET=<a long random string>
ADMIN_PASSWORD=<password for the captain account>
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

On the first run the database is created automatically in `data/`, the squad is loaded, and a captain account is created with the username `captain` and the `ADMIN_PASSWORD` you set. Player accounts are then created from the captain's dashboard.

> Watch and remenber that  `.env.local` or the `data/` folder contain secrets, player logins and uploaded files , Do not share !!.

## Languages

All wording for the public site and the players' portal lives in plain text files in `lib/i18n/`:

- `en-common.js`, `en-public.js`, `en-portal.js` for English
- `ar-common.js`, `ar-public.js`, `ar-portal.js` for Arabic

To fix a sentence, edit its line in the matching file. Content typed by the captain (news, event titles, messages) is shown exactly as written.


<<<<<<< HEAD
```
app/
  admin/          captain's dashboard (accounts, squad, news, events, lineups, stats,
                  check-in, polls, messages, feedback, money, teams, gallery, site info)
  portal/         players' portal and inbox
  login/          login page and actions
  about/ contact/ fixtures/ gallery/ news/ squad/ stats/    public pages
  api/            clip upload endpoint
  clip/ media/ player-photo/                                protected file routes
components/       shared UI (logo, pitch, player photo, team cards, language switch)
lib/              database, sessions, access checks, login protection, i18n, helpers
public/           logo and icons
data/             SQLite database and uploads (not committed)
```

## Running in production

- The site needs a Node.js server with a **persistent disk**: the database (`data/redlions.db`) and all uploads (`data/uploads/`) live in the `data` folder, so back it up regularly.
- Serve it over **HTTPS** (session cookies are marked secure in production) and make the reverse proxy forward the visitor's address in `X-Forwarded-For`, which the login protection relies on.
- Set `SESSION_SECRET` and `ADMIN_PASSWORD` as environment variables on the server.
=======

## Notes

Built for a team in mainland China: the site avoids Google-dependent services, and notifications target **WeChat** (for now through a "Copy for WeChat" button).

## Author

Built by the Red Lions captain, 
