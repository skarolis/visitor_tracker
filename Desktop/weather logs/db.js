const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const envDbFile = process.env.DB_FILE;

let dbFilePath = path.join(__dirname, "data.sqlite");
if (envDbFile) {
  if (envDbFile === ":memory:") {
    dbFilePath = ":memory:";
  } else if (path.isAbsolute(envDbFile)) {
    dbFilePath = envDbFile;
  } else {
    dbFilePath = path.join(__dirname, envDbFile);
  }
}

const db = new sqlite3.Database(dbFilePath);

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS daily_logs (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "log_date TEXT NOT NULL UNIQUE," +
      "location TEXT," +
      "temp_c REAL," +
      "condition TEXT," +
      "notes TEXT," +
      "created_at TEXT NOT NULL," +
      "updated_at TEXT NOT NULL" +
      ")"
  );
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  all,
  get,
  run,
  close,
};
