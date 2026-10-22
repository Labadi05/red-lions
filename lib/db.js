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