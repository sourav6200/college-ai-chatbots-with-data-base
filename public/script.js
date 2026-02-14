// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let chatHistory   = [];   // Gemini format history for current session
let currentSessionId = null;
let isLoading     = false;
let allSessions   = [];

const SERVER = 'http://localhost:3000';

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
window.onload = async () => {
  document.getElementById('userInput').focus();
  await loadSessions();
  await loadStats();
};

// ─────────────────────────────────────────────
//  SESSION LIST
// ─────────────────────────────────────────────
async function loadSessions(query = '') {
  try {
    const url   = query ? `${SERVER}/sessions?q=${encodeURIComponent(query)}` : `${SERVER}/sessions`;
    const res   = await fetch(url);
    allSessions = await res.json();
    renderSessionList(allSessions);
  } catch (e) {
    console.error('Could not load sessions:', e);
  }
}

function renderSessionList(sessions) {
  const list = document.getElementById('sessionList');

  if (!sessions.length) {
    list.innerHTML = `<div class="empty-history">
      No conversations yet.<br>Start chatting to see history here.
    </div>`;
    return;
  }

  list.innerHTML = sessions.map(s => `
    <div class="session-item ${s.id === currentSessionId ? 'active' : ''}"
         onclick="loadSession('${s.id}')" id="sess-${s.id}">
      <div class="session-title">${escapeHtml(s.title)}</div>
      <div class="session-meta">
        <span class="session-time">${timeAgo(s.updated_at)}</span>
        <span class="session-count">${s.message_count} msg</span>
      </div>
      <button class="session-delete" onclick="deleteSession('${s.id}', event)" title="Delete">&#10005;</button>
    </div>
  `).join('');
}

async function loadSession(id) {
  if (id === currentSessionId) return;

  try {
    const res      = await fetch(`${SERVER}/sessions/${id}/messages`);
    const messages = await res.json();

    currentSessionId = id;
    chatHistory      = [];

    // Rebuild Gemini history from DB messages
    messages.forEach(m => {
      chatHistory.push({ role: m.role, parts: [{ text: m.content }] });
    });

    // Render messages in the chat area
    const area = document.getElementById('chatArea');
    const session = allSessions.find(s => s.id === id);

    if (!messages.length) {
      resetWelcome();
    } else {
      area.innerHTML = '';
      messages.forEach(m => {
        appendMessage(m.role === 'user' ? 'user' : 'bot', m.content);
      });
    }

    // Update header
    document.getElementById('sessionTitle').textContent = session ? session.title : 'Chat';

    // Highlight active item
    document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`sess-${id}`);
    if (el) el.classList.add('active');

  } catch (e) {
    console.error('Could not load session:', e);
  }
}

async function deleteSession(id, event) {
  event.stopPropagation();
  if (!confirm('Delete this conversation?')) return;

  try {
    await fetch(`${SERVER}/sessions/${id}`, { method: 'DELETE' });

    if (currentSessionId === id) {
      currentSessionId = null;
      chatHistory      = [];
      resetWelcome();
      document.getElementById('sessionTitle').textContent = 'New Conversation';
    }

    await loadSessions();
    await loadStats();
  } catch (e) {
    console.error('Delete failed:', e);
  }
}

async function newChat() {
  currentSessionId = null;
  chatHistory      = [];
  resetWelcome();
  document.getElementById('sessionTitle').textContent = 'New Conversation';
  document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
  document.getElementById('userInput').focus();
}

// ─────────────────────────────────────────────
//  STATS
// ─────────────────────────────────────────────
async function loadStats() {
  try {
    const res   = await fetch(`${SERVER}/stats`);
    const stats = await res.json();
    document.getElementById('statSessions').textContent = stats.total_sessions  || 0;
    document.getElementById('statMessages').textContent = stats.total_messages  || 0;
  } catch (e) { /* silent */ }
}

// ─────────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────────
let searchTimer = null;
function onHistorySearch(value) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadSessions(value.trim()), 250);
}

// ─────────────────────────────────────────────
//  SEND MESSAGE
// ─────────────────────────────────────────────
async function sendMessage() {
  const input   = document.getElementById('userInput');
  const message = input.value.trim();
  if (!message || isLoading) return;

  isLoading = true;
  document.getElementById('sendBtn').disabled = true;
  input.value = '';
  input.style.height = 'auto';

  const welcome = document.getElementById('welcomeScreen');
  if (welcome) welcome.remove();

  appendMessage('user', message);
  showTyping();

  try {
    const res = await fetch(`${SERVER}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: chatHistory,
        sessionId: currentSessionId,
      }),
    });

    removeTyping();

    if (!res.ok) throw new Error('Server error');

    const data = await res.json();

    // Store returned sessionId (new session was created)
    if (data.sessionId && !currentSessionId) {
      currentSessionId = data.sessionId;
    }

    appendMessage('bot', data.reply);

    // Update in-memory Gemini history
    chatHistory.push(
      { role: 'user',  parts: [{ text: message    }] },
      { role: 'model', parts: [{ text: data.reply }] }
    );

    // Refresh sidebar
    await loadSessions();
    await loadStats();

    // Re-highlight active session
    document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`sess-${currentSessionId}`);
    if (el) el.classList.add('active');

    // Update header title from session list
    const session = allSessions.find(s => s.id === currentSessionId);
    if (session) document.getElementById('sessionTitle').textContent = session.title;

  } catch (err) {
    removeTyping();
    appendMessage('bot', '⚠ Could not connect. Make sure the server is running on localhost:3000.', true);
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}

// ─────────────────────────────────────────────
//  MESSAGE RENDERING
// ─────────────────────────────────────────────
function appendMessage(role, text, isError = false) {
  const area  = document.getElementById('chatArea');
  const group = document.createElement('div');
  group.className = `msg-group ${role}`;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}${isError ? ' error' : ''}`;

  if (role === 'bot' && !isError) {
    bubble.innerHTML = marked.parse(text);
  } else {
    bubble.textContent = text;
  }

  group.appendChild(bubble);
  area.appendChild(group);
  area.scrollTop = area.scrollHeight;
}

function showTyping() {
  const area  = document.getElementById('chatArea');
  const group = document.createElement('div');
  group.className = 'msg-group bot';
  group.id = 'typingGroup';
  const t = document.createElement('div');
  t.className = 'typing-bubble';
  t.innerHTML = '<span></span><span></span><span></span>';
  group.appendChild(t);
  area.appendChild(group);
  area.scrollTop = area.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typingGroup');
  if (el) el.remove();
}

function resetWelcome() {
  document.getElementById('chatArea').innerHTML = `
    <div class="welcome" id="welcomeScreen">
      <div class="welcome-icon">&#10022;</div>
      <h2>How can I help you?</h2>
      <p>Ask me anything — from coding questions to study help, I'm here for you.</p>
      <div class="suggestion-chips">
        <div class="chip" onclick="useChip(this)">&#129504; Explain neural networks</div>
        <div class="chip" onclick="useChip(this)">&#128187; Help me debug code</div>
        <div class="chip" onclick="useChip(this)">&#128221; Write a project summary</div>
        <div class="chip" onclick="useChip(this)">&#128290; Solve a math problem</div>
        <div class="chip" onclick="useChip(this)">&#128640; Give me project ideas</div>
      </div>
    </div>`;
}

function clearChat() {
  currentSessionId = null;
  chatHistory      = [];
  resetWelcome();
  document.getElementById('sessionTitle').textContent = 'New Conversation';
  document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
  document.getElementById('userInput').focus();
}

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────
function useChip(el) {
  const text  = el.textContent.replace(/^\S+\s/, '');
  const input = document.getElementById('userInput');
  input.value = text;
  input.focus();
  autoResize(input);
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)      return 'just now';
  if (diff < 3600000)    return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000)   return Math.floor(diff / 3600000) + 'h ago';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}