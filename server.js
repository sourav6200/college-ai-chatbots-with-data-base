const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const fs   = require('fs');

const app  = express();
const PORT = 3000;

// ─────────────────────────────────────────────
//  DATABASE SETUP  (sql.js — pure JS, no C++ needed)
// ─────────────────────────────────────────────
const initSqlJs = require('sql.js');
const DB_FILE   = path.join(__dirname, 'chatbot.db');

let db;   // will be set after async init

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB from disk, or create fresh
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL DEFAULT 'New Conversation',
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      message_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      timestamp   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_msg_session  ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_sess_updated ON sessions(updated_at);
  `);

  saveDB();
  console.log('🗄️  SQLite (sql.js) database ready — chatbot.db');
}

// Persist DB to disk after every write
function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

// Helper: run a query and return all rows as objects
function query(sql, params = []) {
  const stmt    = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run INSERT / UPDATE / DELETE
function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ─────────────────────────────────────────────
//  MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─────────────────────────────────────────────
//  GEMINI AI
// ─────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─────────────────────────────────────────────
//  CHAT ENDPOINT
// ─────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const chat  = model.startChat({
      history: history || [],
      generationConfig: { maxOutputTokens: 1000 },
    });

    const result = await chat.sendMessage(message);
    const reply  = (await result.response).text();

    // Persist to DB
    const now = Date.now();
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      activeSessionId = genId();
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      run(
        'INSERT INTO sessions (id, title, created_at, updated_at, message_count) VALUES (?,?,?,?,0)',
        [activeSessionId, title, now, now]
      );
    } else {
      const rows = query('SELECT id FROM sessions WHERE id = ?', [activeSessionId]);
      if (!rows.length) {
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        run(
          'INSERT INTO sessions (id, title, created_at, updated_at, message_count) VALUES (?,?,?,?,0)',
          [activeSessionId, title, now, now]
        );
      }
    }

    // Save messages
    run('INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?,?,?,?,?)',
      [genId(), activeSessionId, 'user', message, now]);
    run('INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?,?,?,?,?)',
      [genId(), activeSessionId, 'model', reply, now + 1]);

    // Update session
    const sessRows = query('SELECT title FROM sessions WHERE id = ?', [activeSessionId]);
    const curTitle = sessRows.length ? sessRows[0].title : 'New Conversation';
    const newTitle = curTitle === 'New Conversation'
      ? (message.length > 50 ? message.substring(0, 50) + '...' : message)
      : curTitle;
    run(
      'UPDATE sessions SET title = ?, updated_at = ?, message_count = message_count + 2 WHERE id = ?',
      [newTitle, now, activeSessionId]
    );

    res.json({ reply, sessionId: activeSessionId });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
  }
});

// ─────────────────────────────────────────────
//  SESSION ENDPOINTS
// ─────────────────────────────────────────────
app.get('/sessions', (req, res) => {
  try {
    const { q } = req.query;
    const rows = q
      ? query('SELECT * FROM sessions WHERE title LIKE ? ORDER BY updated_at DESC', [`%${q}%`])
      : query('SELECT * FROM sessions ORDER BY updated_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/sessions/:id/messages', (req, res) => {
  try {
    res.json(query('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/sessions/:id', (req, res) => {
  try {
    run('DELETE FROM messages WHERE session_id = ?', [req.params.id]);
    run('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/sessions/:id', (req, res) => {
  try {
    run('UPDATE sessions SET title = ? WHERE id = ?', [req.body.title, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/stats', (_req, res) => {
  try {
    const sessions = query('SELECT COUNT(*) as c FROM sessions')[0].c;
    const messages = query('SELECT COUNT(*) as c FROM messages')[0].c;
    res.json({ total_sessions: sessions, total_messages: messages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'running', db: 'sql.js', file: 'chatbot.db' });
});

// ─────────────────────────────────────────────
//  START (init DB first, then listen)
// ─────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('🚀 Server running at http://localhost:' + PORT);
    console.log('📖 Open http://localhost:' + PORT + ' in your browser');
  });
}).catch(err => {
  console.error('Failed to init database:', err);
  process.exit(1);
});