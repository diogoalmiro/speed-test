const https = require("https");

const Database = require("better-sqlite3");

const db = new Database("speed.db");

db.exec(`CREATE TABLE IF NOT EXISTS speed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start INTEGER,
  end INTEGER,
  duration INTEGER,
  filesize INTEGER
)`);

const insertStm = db.prepare(`INSERT INTO speed
    (start, end, duration, filesize) VALUES
    (:start, :end, :duration, :filesize)`);

const filesize = 1_000_000;
const TEST_URL = "https://fsn1-speed.hetzner.com/100MB.bin";
const TIMEOUT = 60_000;

function downloadSpeed(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    let bytes = 0;

    const req = https.get(url, { timeout: TIMEOUT }, (res) => {
      res.on("data", chunk => {
        bytes += chunk.length
      });
      res.on("end", () => {
        resolve({
            start,
            end: Date.now(),
            duration: Date.now() - start,
            filesize: bytes,
        });
      });
    });

    req.on("error", () => resolve({
        start,
        end: Date.now(),
        duration: Date.now() - start,
        filesize: 0,
    }));
    req.on("timeout", () => {
      req.destroy();
      resolve({
        start,
        end: Date.now(),
        duration: Date.now() - start,
        filesize: 0,
      });
    });
  });
}

async function runCheck() {
  const speed = await downloadSpeed(TEST_URL);
  insertStm.run(speed);
}

runCheck();

