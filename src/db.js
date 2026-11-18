const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function createDatabase(filename = process.env.DATABASE_FILE || path.join(__dirname, "..", "data", "appointments.sqlite")) {
  const resolved = filename === ":memory:" ? ":memory:" : path.resolve(filename);
  if (resolved !== ":memory:") fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new Database(resolved);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      guardian_name TEXT,
      doctor_id TEXT NOT NULL,
      start_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'reservada',
      is_emergency INTEGER NOT NULL DEFAULT 0,
      cancellation_fee REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_start
      ON appointments(doctor_id, start_at, status);
  `);
  return db;
}

module.exports = { createDatabase };
