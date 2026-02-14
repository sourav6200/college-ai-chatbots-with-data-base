# 🤖 AI ChatBot — College Project

A full-stack AI chatbot powered by **Google Gemini API** with a **SQLite database** for persistent chat history. Built with Node.js, Express, and a sleek dark-themed UI.

---

## 📸 UI Screenshots

### 1. Welcome Screen — New Conversation
> The app opens with a clean welcome screen. The left sidebar shows your full chat history with timestamps and message counts. Click any past conversation to instantly restore it.

<img width="1505" height="837" alt="image" src="https://github.com/user-attachments/assets/df15630b-a25c-432c-aa5b-e9f61eae2b75" />


---

### 2. Active Conversation — AI Responses with Markdown
> Messages appear in styled bubbles. AI responses render **bold text**, bullet points, numbered lists, and code blocks automatically. The active session is highlighted in the sidebar.

<img width="1347" height="814" alt="image" src="https://github.com/user-attachments/assets/c444e1e9-50d6-42cd-a7e2-a41d1e0843b1" />


---

### 3. Search History — Filter Past Conversations
> Type in the search bar to filter through all saved conversations in real time. Results highlight instantly. The green dot at the bottom confirms the SQLite database is live.

<img width="347" height="808" alt="image" src="https://github.com/user-attachments/assets/2fc694d1-6053-4af6-be41-6661836bd853" />


---

## ✨ Features

- 💬 **Real-time AI chat** powered by Google Gemini (`gemini-2.5-flash-lite`)
- 🗄️ **SQLite database** via `sql.js` — no Visual Studio or C++ build tools needed on Windows
- 📜 **Persistent chat history** — all conversations saved across server restarts
- 🔍 **Search & filter** past conversations from the sidebar in real time
- ➕ **Multiple sessions** — start new chats and freely switch between old ones
- 🗑️ **Delete conversations** individually with one click
- 📊 **Live DB stats** — total chats and messages shown at all times
- ✨ **Markdown rendering** — bold, code blocks, lists, tables all render correctly
- 📱 **Responsive design** — sidebar hides on mobile for a clean single-column layout

---

## 🗂️ Project Structure

```
college-chatbot/
├── public/
│   ├── index.html       # Frontend UI (sidebar + chat window)
│   ├── script.js        # Frontend logic (sessions, API calls, rendering)
│   └── style.css        # Dark-themed styles
├── server.js            # Express server + Gemini API + SQLite DB
├── package.json         # Project dependencies
├── .env                 # Your Gemini API key (do NOT commit this)
├── .gitignore           # Ignores node_modules, .env, chatbot.db
└── chatbot.db           # SQLite database file (auto-created on first run)
```

> **Note:** `index.html`, `script.js`, and `style.css` must be inside a `public/` folder so Express can serve them as static files.

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## 🚀 Setup & Installation

### 1. Clone or download the project

```bash
git clone https://github.com/your-username/college-chatbot.git
cd college-chatbot
```

### 2. Install dependencies

```bash
npm install
```

> ✅ **No Visual Studio or C++ build tools required** — `sql.js` is pure JavaScript/WebAssembly.

### 3. Configure your API key

Create a `.env` file in the root folder:

```
GEMINI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with your key from Google AI Studio.

### 4. Move frontend files to `public/`

```
mkdir public
move index.html public\
move script.js  public\
move style.css  public\
```

### 5. Start the server

```bash
npm start
```

### 6. Open the app

Go to **http://localhost:3000** in your browser.

---

## ▶️ How It Works

```
User types message
      ↓
Frontend (script.js) sends POST /chat  { message, history, sessionId }
      ↓
Server (server.js) calls Google Gemini API
      ↓
Gemini returns AI reply
      ↓
Server saves user message + AI reply to chatbot.db (SQLite)
      ↓
Server returns { reply, sessionId } to frontend
      ↓
Frontend renders reply as Markdown, updates sidebar stats
```

---

## 🗄️ Database

The app uses **SQLite** via `sql.js` — a pure JavaScript port compiled to WebAssembly. No native build tools needed on any platform. The database file `chatbot.db` is created automatically on first run.

### Tables

**`sessions`** — One row per conversation

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique session ID |
| `title` | TEXT | Auto-generated from first message |
| `created_at` | INTEGER | Unix timestamp (ms) |
| `updated_at` | INTEGER | Unix timestamp (ms) |
| `message_count` | INTEGER | Total messages in this session |

**`messages`** — One row per chat message

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique message ID |
| `session_id` | TEXT | Links to `sessions.id` |
| `role` | TEXT | `user` or `model` |
| `content` | TEXT | Full message text |
| `timestamp` | INTEGER | Unix timestamp (ms) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send a message, get AI reply |
| `GET` | `/sessions` | List all sessions (supports `?q=search`) |
| `GET` | `/sessions/:id/messages` | Get all messages in a session |
| `DELETE` | `/sessions/:id` | Delete a session and its messages |
| `PATCH` | `/sessions/:id` | Rename a session |
| `GET` | `/stats` | Total sessions and messages count |
| `GET` | `/health` | Server health check |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Markdown | [marked.js](https://marked.js.org/) v9 |
| Backend | Node.js + Express.js |
| AI Model | Google Gemini (`gemini-2.5-flash-lite`) |
| Database | SQLite via [sql.js](https://sql.js.org/) |
| Fonts | Google Fonts (Syne + DM Sans) |

---

## 🔧 Troubleshooting

### `Error: Cannot find module 'sql.js'`
Run `npm install` again from the project root folder.

### `better-sqlite3` build error on Windows
This project uses `sql.js` instead — no Visual Studio needed. Make sure your `package.json` lists `sql.js` and **not** `better-sqlite3`.

### `Failed to get response from AI`
- Check that `.env` exists with a valid `GEMINI_API_KEY`
- Make sure you have an active internet connection
- Verify your key at [aistudio.google.com](https://aistudio.google.com)

### UI shows "Could not connect to server"
- Confirm the server is running (`npm start`)
- Open `http://localhost:3000` — don't open `index.html` directly as a file

### Port 3000 already in use
Change the port in `server.js`:
```js
const PORT = 3001;
```

---

## 🔐 Security Notes

- **Never commit your `.env` file** — it contains your private API key
- The `.gitignore` already excludes `.env`, `node_modules`, and `chatbot.db`
- For production, set `GEMINI_API_KEY` as an environment variable on the server

---
---

## 👨‍💻 Author

Built as a college project demonstrating full-stack web development with AI integration.
