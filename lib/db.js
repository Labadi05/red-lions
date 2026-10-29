import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// The database is one file inside the "data" folder
const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "redlions.db"));
db.pragma("journal_mode = WAL");

// Players table (numbers are text so "00" and "01" keep their zeros)
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    is_captain INTEGER NOT NULL DEFAULT 0
  );
`);

// Fill the squad the first time only
const count = db.prepare("SELECT COUNT(*) AS n FROM players").get().n;
if (count === 0) {
  const squad = [
    ["01", "Soufiane", "Goalkeeper", 0],
    ["12", "Ayoub", "Defender", 1],
    ["02", "Hanafi", "Defender", 0],
    ["88", "Farid", "Defender", 0],
    ["05", "Yassine", "Defender", 0],
    ["22", "Abaouss", "Defender", 0],
    ["26", "Amine", "Defender", 0],
    ["07", "Mohamed", "Defender", 0],
    ["37", "Yahya", "Midfielder", 0],
    ["00", "Amine", "Midfielder", 0],
    ["10", "Barmaqui", "Midfielder", 0],
    ["06", "Rayane", "Midfielder", 0],
    ["20", "Haytam", "Midfielder", 0],
    ["08", "Zack", "Midfielder", 0],
    ["21", "Adnane", "Forward", 0],
    ["09", "Saad", "Forward", 0],
    ["49", "Abdo", "Forward", 0],
    ["11", "Elhima", "Forward", 0],
    ["17", "Ayoub", "Forward", 0],
  ];
  const insert = db.prepare(
    "INSERT INTO players (number, name, position, is_captain) VALUES (?, ?, ?, ?)"
  );
  for (const p of squad) insert.run(...p);
}

// Announcements: visibility is 'public' (everyone) or 'players' (logged-in only)
db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'players',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Events (training / match / meeting) and players' attendance answers
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
  );
`);

// Match details (opponent + final score), added to existing events table
const eventCols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
if (!eventCols.includes("opponent")) {
  db.exec("ALTER TABLE events ADD COLUMN opponent TEXT NOT NULL DEFAULT ''");
}
if (!eventCols.includes("score_for")) {
  db.exec("ALTER TABLE events ADD COLUMN score_for INTEGER");
}
if (!eventCols.includes("score_against")) {
  db.exec("ALTER TABLE events ADD COLUMN score_against INTEGER");
}


// Lineup for matches: formation, 11 slots (player ids), bench, and published flag
const eventCols2 = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
if (!eventCols2.includes("formation")) {
  db.exec("ALTER TABLE events ADD COLUMN formation TEXT NOT NULL DEFAULT '4-3-3'");
}
if (!eventCols2.includes("lineup")) {
  db.exec("ALTER TABLE events ADD COLUMN lineup TEXT NOT NULL DEFAULT '[]'");
}
if (!eventCols2.includes("bench")) {
  db.exec("ALTER TABLE events ADD COLUMN bench TEXT NOT NULL DEFAULT '[]'");
}
if (!eventCols2.includes("lineup_published")) {
  db.exec("ALTER TABLE events ADD COLUMN lineup_published INTEGER NOT NULL DEFAULT 0");
}

// Per-player stats for each match (only players who played get a row)
db.exec(`
  CREATE TABLE IF NOT EXISTS match_stats (
    event_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    played INTEGER NOT NULL DEFAULT 0,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    motm INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, player_id)
  );
`);

// Who actually showed up at each event (one row per player once checked in)
db.exec(`
  CREATE TABLE IF NOT EXISTS checkins (
    event_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    attended INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, player_id)
  );
`);

// Polls: question, options, and one vote per user (changeable until closed)
db.exec(`
  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    closes_at TEXT,
    closed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS poll_votes (
    poll_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    PRIMARY KEY (poll_id, user_id)
  );
`);

// Site info edited by the captain (social links, contact details, team story)
db.exec(`
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
`);

// Gallery: photos (stored on disk) and videos (external links)
db.exec(`
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    filename TEXT,
    url TEXT,
    caption TEXT NOT NULL DEFAULT '',
    visibility TEXT NOT NULL DEFAULT 'public',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Captain -> players messages (message / task / to-do / punishment / reward)
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL DEFAULT 'message',
    subject TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    due_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS message_recipients (
    message_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    read_at TEXT,
    done_at TEXT,
    PRIMARY KEY (message_id, player_id)
  );

  -- Players -> captain: suggestions, messages and problems to review
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'suggestion',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    reply TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    replied_at TEXT
  );
`);

// Player photos (file name of the uploaded picture, if any)
const playerCols = db.prepare("PRAGMA table_info(players)").all().map((c) => c.name);
if (!playerCols.includes("photo")) {
  db.exec("ALTER TABLE players ADD COLUMN photo TEXT");
}

// Man-of-the-match polls: a poll can belong to a match, and options can point to a player
const pollCols = db.prepare("PRAGMA table_info(polls)").all().map((c) => c.name);
if (!pollCols.includes("kind")) {
  db.exec("ALTER TABLE polls ADD COLUMN kind TEXT NOT NULL DEFAULT 'poll'");
}
if (!pollCols.includes("event_id")) {
  db.exec("ALTER TABLE polls ADD COLUMN event_id INTEGER");
}
const optionCols = db.prepare("PRAGMA table_info(poll_options)").all().map((c) => c.name);
if (!optionCols.includes("player_id")) {
  db.exec("ALTER TABLE poll_options ADD COLUMN player_id INTEGER");
}

// Money tracker: a charge is something to pay (pitch, water, fine...).
// charge_items has one row per player who has to pay it. Amounts are stored in fen (1/100 yuan).
db.exec(`
  CREATE TABLE IF NOT EXISTS charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT 'other',
    title TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    due_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS charge_items (
    charge_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    paid_at TEXT,
    claimed_at TEXT,
    PRIMARY KEY (charge_id, player_id)
  );
`);

export default db;

// Users table (logins). Each user can be linked to a player.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player',
    player_id INTEGER REFERENCES players(id)
  );
`);

// Create the captain's admin account the first time only
const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (userCount === 0 && process.env.ADMIN_PASSWORD) {
  const captain = db.prepare("SELECT id FROM players WHERE is_captain = 1").get();
  db.prepare(
    "INSERT INTO users (username, password_hash, role, player_id) VALUES (?, ?, 'admin', ?)"
  ).run("captain", bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10), captain?.id ?? null);
}