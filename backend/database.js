const sqlite3 = require("sqlite3").verbose();
const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "lockers.db");

// Delete the old database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("Old database deleted.");
}

// Initialize the database connection
const db = new sqlite3.Database("lockers.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Promisify db.run and db.get
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Create tables
async function createTables() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        device_name TEXT NOT NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS lockers (
        locker_id INTEGER PRIMARY KEY AUTOINCREMENT,
        locker_location TEXT NOT NULL,
        is_vacant INTEGER NOT NULL CHECK (is_vacant IN (0, 1))
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS reservations (
        reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        locker_id INTEGER NOT NULL,
        reservation_date TEXT NOT NULL,
        code_sequence TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (locker_id) REFERENCES lockers(locker_id)
      )
    `);

    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err.message);
  }
}

// Insert sample data
async function insertData() {
  try {
    // Insert users
    const users = [
      {
        username: "admin",
        password: "admin",
        device_name: "aman",
      },
      {
        username: "user",
        password: "user",
        device_name: "PHANTOMBLUELE5",
      },
    ];

    for (const user of users) {
      await run(
        `INSERT INTO users (username, password, device_name) VALUES (?, ?, ?)`,
        [user.username, user.password, user.device_name, user.code_sequence]
      );
      console.log(`Inserted user: ${user.username}`);
    }

    // Insert lockers
    const lockers = [
      { location: "HB 9th Floor - Section A", is_vacant: 1 },
      { location: "HB 8th Floor - Section E", is_vacant: 0 },
      { location: "MB S2 - Section A", is_vacant: 1 },
      { location: "HB 9th Floor - Section A", is_vacant: 1 },
      { location: "MB S2 - Section A", is_vacant: 1 },
    ];

    for (const locker of lockers) {
      await run(
        `INSERT INTO lockers (locker_location, is_vacant) VALUES (?, ?)`,
        [locker.location, locker.is_vacant]
      );
      console.log(`Inserted locker at: ${locker.location}`);
    }

    // Insert reservations
    const reservations = [
      {
        user_id: 1,
        locker_id: 2,
        reservation_date: DateTime.now().setZone("America/Toronto").toISO(),
        code_sequence: "12,27,13,12,21,12,27,13",
      },
    ];

    for (const reservation of reservations) {
      await run(
        `INSERT INTO reservations (user_id, locker_id, reservation_date,code_sequence) VALUES (?, ?, ?, ?)`,
        [
          reservation.user_id,
          reservation.locker_id,
          reservation.reservation_date,
          reservation.code_sequence,
        ]
      );
      console.log(
        `Reservation added: User ${reservation.user_id} reserved Locker ${reservation.locker_id}`
      );
    }

    console.log("Sample data inserted successfully.");
  } catch (err) {
    console.error("Error inserting data:", err.message);
  }
}

// Initialize the database
async function initialize() {
  await createTables();
  await insertData();
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
  });
}

initialize().catch(console.error);
