const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const { DateTime } = require("luxon");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../build")));

// Initialize database
const db = new sqlite3.Database("lockers.db", (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to the lockers database.");
  }
});

// Endpoint to update device name
app.post("/api/update-device-name", (req, res) => {
  const { userId, newDeviceName } = req.body;

  if (!userId || !newDeviceName) {
    return res
      .status(400)
      .json({ message: "User ID and new device name are required." });
  }

  const query = `UPDATE users SET device_name = ? WHERE id = ?`;

  db.run(query, [newDeviceName, userId], function (err) {
    if (err) {
      console.error("Error updating device name:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (this.changes === 0) {
      return res
        .status(404)
        .json({ message: "User not found or no changes made." });
    }

    res.json({ message: "Device name updated successfully." });
  });
});

// Endpoint to update the sequence
app.post("/api/update-sequence", (req, res) => {
  const { userId, newSequence } = req.body;

  if (!userId || !newSequence) {
    return res
      .status(400)
      .json({ message: "User ID and new sequence are required." });
  }

  const query = `UPDATE reservations SET code_sequence = ? WHERE user_id = ?`;

  db.run(query, [newSequence, userId], function (err) {
    if (err) {
      console.error("Error updating sequence:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (this.changes === 0) {
      return res
        .status(404)
        .json({ message: "Reservation not found or no changes made." });
    }

    res.json({ message: "Sequence updated successfully." });
  });
});

// Fetch sequence and locker details for a user
app.post("/api/locker-info", (req, res) => {
  const { username, lockerId } = req.body;

  if (!username || !lockerId) {
    return res
      .status(400)
      .json({ message: "Username and Locker ID are required." });
  }

  const query = `
    SELECT reservations.reservation_date, users.device_name, reservations.code_sequence
    FROM reservations
    JOIN users ON reservations.user_id = users.id
    WHERE reservations.locker_id = ? AND users.username = ?
  `;

  db.get(query, [lockerId, username], (err, result) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (result) {
      res.json({
        sequence: result.code_sequence,
        device_name: result.device_name,
        reservation_date: result.reservation_date,
      });
    } else {
      res
        .status(404)
        .json({ message: "No reservation found for this locker and user." });
    }
  });
});

// Endpoint to verify login credentials
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  const queryUser = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.get(queryUser, [username, password], (err, user) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const queryReservation = `
      SELECT locker_id FROM reservations WHERE user_id = ?
    `;

    db.get(queryReservation, [user.id], (err, reservation) => {
      if (err) {
        console.error("Error querying reservations:", err.message);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (reservation) {
        // User has a reserved locker
        res.json({
          message: "Login successful.",
          user: user,
          reservedLockerId: reservation.locker_id,
        });
      } else {
        // User has no reserved locker
        res.json({ message: "Login successful.", user: user });
      }
    });
  });
});

// Endpoint to create a new user
app.post("/api/signup", (req, res) => {
  const { username, password, deviceName } = req.body;

  if (!username || !password || !deviceName) {
    return res.status(400).json({
      message: "Username, password, and device name are required.",
    });
  }

  // Check for existing username
  const checkUserQuery = `SELECT id FROM users WHERE username = ?`;

  db.get(checkUserQuery, [username], (err, existingUser) => {
    if (err) {
      console.error("Error checking for existing user:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username is already taken. Please choose another." });
    }

    // Insert new user into the database
    const insertUserQuery = `INSERT INTO users (username, password, device_name) VALUES (?, ?, ?)`;

    db.run(insertUserQuery, [username, password, deviceName], function (err) {
      if (err) {
        console.error("Error creating user:", err.message);
        return res.status(500).json({ message: "Internal server error." });
      }

      // Fetch and return the newly created user
      const getUserQuery = `SELECT * FROM users WHERE id = ?`;

      db.get(getUserQuery, [this.lastID], (err, newUser) => {
        if (err) {
          console.error("Error fetching new user:", err.message);
          return res.status(500).json({ message: "Internal server error." });
        }

        res.status(201).json({
          message: "User created successfully.",
          user: newUser,
        });
      });
    });
  });
});

// Endpoint to fetch lockers
app.get("/api/lockers", (req, res) => {
  const query = `SELECT * FROM lockers`;

  db.all(query, [], (err, lockers) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    res.json(lockers);
  });
});

// Endpoint to reserve a locker
app.post("/api/reserve", (req, res) => {
  const { userId, lockerId, sequence } = req.body;

  if (!userId || !lockerId) {
    return res
      .status(400)
      .json({ message: "User ID and Locker ID are required." });
  }

  // Check if the locker is vacant
  const queryCheckVacancy = `SELECT * FROM lockers WHERE locker_id = ? AND is_vacant = 1`;

  db.get(queryCheckVacancy, [lockerId], (err, locker) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (!locker) {
      return res.status(400).json({ message: "Locker is not available." });
    }

    // Reserve the locker
    const queryReserve = `INSERT INTO reservations (user_id, locker_id, reservation_date, code_sequence) VALUES (?, ?, ?, ?)`;
    const reservationDate = DateTime.now().setZone("America/Toronto").toISO();

    db.run(
      queryReserve,
      [userId, lockerId, reservationDate, sequence],
      function (err) {
        if (err) {
          console.error("Error reserving the locker:", err.message);
          return res.status(500).json({ message: "Internal server error." });
        }

        // Update the locker status to not vacant
        const queryUpdateLocker = `UPDATE lockers SET is_vacant = 0 WHERE locker_id = ?`;

        db.run(queryUpdateLocker, [lockerId], (err) => {
          if (err) {
            console.error("Error updating locker status:", err.message);
            return res.status(500).json({ message: "Internal server error." });
          }

          res.json({
            message: "Locker reserved successfully.",
            reservationId: this.lastID,
          });
        });
      }
    );
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
