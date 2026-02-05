require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

function nowIso() {
  return new Date().toISOString();
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/logs", async (req, res) => {
  try {
    const { from, to } = req.query;

    let where = "";
    const params = [];

    if (from) {
      where += (where ? " AND " : " WHERE ") + "log_date >= ?";
      params.push(from);
    }

    if (to) {
      where += (where ? " AND " : " WHERE ") + "log_date <= ?";
      params.push(to);
    }

    const rows = await db.all(
      `SELECT id, log_date, location, temp_c, condition, notes, created_at, updated_at FROM daily_logs${where} ORDER BY log_date DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load logs" });
  }
});

app.get("/api/logs/:id", async (req, res) => {
  try {
    const row = await db.get(
      "SELECT id, log_date, location, temp_c, condition, notes, created_at, updated_at FROM daily_logs WHERE id = ?",
      [req.params.id]
    );

    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to load log" });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const { log_date, location, temp_c, condition, notes } = req.body || {};

    if (!isIsoDate(log_date)) {
      return res.status(400).json({ error: "log_date must be YYYY-MM-DD" });
    }

    const createdAt = nowIso();
    const updatedAt = createdAt;

    const result = await db.run(
      "INSERT INTO daily_logs (log_date, location, temp_c, condition, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        log_date,
        location ?? null,
        temp_c === "" || temp_c === undefined ? null : temp_c,
        condition ?? null,
        notes ?? null,
        createdAt,
        updatedAt,
      ]
    );

    const row = await db.get(
      "SELECT id, log_date, location, temp_c, condition, notes, created_at, updated_at FROM daily_logs WHERE id = ?",
      [result.lastID]
    );

    res.status(201).json(row);
  } catch (err) {
    if (String(err && err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "A log already exists for that date" });
    }
    res.status(500).json({ error: "Failed to create log" });
  }
});

app.put("/api/logs/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await db.get(
      "SELECT id, log_date, location, temp_c, condition, notes, created_at, updated_at FROM daily_logs WHERE id = ?",
      [id]
    );

    if (!existing) return res.status(404).json({ error: "Not found" });

    const { log_date, location, temp_c, condition, notes } = req.body || {};

    if (log_date !== undefined && !isIsoDate(log_date)) {
      return res.status(400).json({ error: "log_date must be YYYY-MM-DD" });
    }

    const next = {
      log_date: log_date ?? existing.log_date,
      location: location ?? existing.location,
      temp_c:
        temp_c === "" || temp_c === undefined ? existing.temp_c : temp_c,
      condition: condition ?? existing.condition,
      notes: notes ?? existing.notes,
      updated_at: nowIso(),
    };

    await db.run(
      "UPDATE daily_logs SET log_date = ?, location = ?, temp_c = ?, condition = ?, notes = ?, updated_at = ? WHERE id = ?",
      [
        next.log_date,
        next.location,
        next.temp_c,
        next.condition,
        next.notes,
        next.updated_at,
        id,
      ]
    );

    const row = await db.get(
      "SELECT id, log_date, location, temp_c, condition, notes, created_at, updated_at FROM daily_logs WHERE id = ?",
      [id]
    );

    res.json(row);
  } catch (err) {
    if (String(err && err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "A log already exists for that date" });
    }
    res.status(500).json({ error: "Failed to update log" });
  }
});

app.delete("/api/logs/:id", async (req, res) => {
  try {
    const result = await db.run("DELETE FROM daily_logs WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete log" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Weather tracker running on http://localhost:${port}`);
  });
}

module.exports = app;
