# 🦁 Red Lions: Official Football Club Website

Official website and team management system for **Red Lions**, a Moroccan football team based in **Jinzhou, China**.

One shared system powers three experiences:

| Area | Who | What |
| --- | --- | --- |
| **Public website** | Everyone | Squad, news, fixtures and results, player stats |
| **Players' portal** | Registered players | Private announcements, events, attendance, polls, lineups, personal attendance record |
| **Captain's dashboard** | Admin (captain) | Publish announcements, manage events, accounts, polls, lineups, stats and attendance check-ins, without editing code |

When the captain publishes an announcement, they choose whether it appears **publicly** or **only in the players' portal**.

## Features

**Public**
- Squad page grouped by position, with shirt numbers and captain marker
- Public news (only announcements marked public)
- Fixtures and results with the team's win/draw/loss record
- Player stats leaderboards: top scorers, assists, man of the match, appearances

**Players' portal (login required)**
- Private and public announcements
- Upcoming trainings, matches and meetings, with "Coming / Maybe / Can't come" and an optional reason
- Published lineups on a pitch view, with the bench
- Polls with deadlines; results appear after voting; votes can be changed until the poll closes
- Personal attendance record and recent history

**Captain's dashboard (admin only)**
- Create and reset player accounts
- Announcements: publish, edit, delete, public or players-only, "Copy for WeChat" button
- Events: create and edit trainings, matches and meetings; see who answered
- Match results (opponent and score), lineup builder with formations, per-player match stats
- Check-in after events and an **attendance ranking** (rate, replies, no-shows)
- Polls with voter names and who has not voted yet

## Tech stack

- [Next.js](https://nextjs.org/) (App Router, Server Actions) and React
- [Tailwind CSS](https://tailwindcss.com/)
- SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), a single database file
- Custom authentication: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing and signed session cookies with [jose](https://github.com/panva/jose)

## Getting started

Requirements: [Node.js](https://nodejs.org/) (LTS).

```bash
git clone <https://github.com/Labadi05/red-lions>
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

On the first run the database is created automatically in `data/` (ignored by git), the squad is seeded, and a captain account is created with username `captain` and the `ADMIN_PASSWORD` you set. Player accounts are then created from the captain's dashboard.



## Project structure

```
app/
  admin/        captain's dashboard (news, events, polls, lineups, stats, check-in)
  portal/       players' portal
  login/        login page and actions
  squad/ news/ fixtures/ stats/    public pages
components/     shared UI (pitch view)
lib/            database, sessions, auth guard, formations, attendance, polls helpers
data/           SQLite database (not committed)
```

## Roadmap

- [x] Public squad, news, fixtures and results, player stats
- [x] Player accounts, login, private portal
- [x] Announcements with public / players-only visibility
- [x] Events, attendance, check-in and attendance ranking
- [x] Lineups, match results and match stats
- [x] Polls and voting
- [x] Social media links and contact page
- [x] Photo and video gallery
- [ ] Players can change their own password
- [ ] Deployment on a Hong Kong server with HTTPS (China-friendly hosting) and backups
- [ ] Automatic WeChat notifications

## Notes

Built for a team in mainland China: the site avoids Google-dependent services, and notifications target **WeChat** (for now through a "Copy for WeChat" button).

## Author

Built by the Red Lions captain, 
