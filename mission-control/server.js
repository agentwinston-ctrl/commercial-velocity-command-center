#!/usr/bin/env node

/**
 * Mission Control (local)
 * - Serves a simple dashboard from mission-control/tasks.json
 * - No external dependencies
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TASKS_PATH = path.join(ROOT, 'tasks.json');

const PORT = Number(process.env.PORT || 3033);
const HOST = process.env.HOST || '127.0.0.1';

function readTasks() {
  const raw = fs.readFileSync(TASKS_PATH, 'utf8');
  return JSON.parse(raw);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(obj, null, 2));
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render(tasks) {
  const updatedAt = tasks?.meta?.updatedAt || '';
  const name = tasks?.meta?.name || 'Mission Control';

  const cols = (tasks.columns || []).map((col) => {
    const items = (col.items || []).map((it) => {
      return `
        <div class="card">
          <div class="card-top">
            <div class="title">${escapeHtml(it.title || it.id)}</div>
            <div class="pill">${escapeHtml(it.priority || '')}</div>
          </div>
          ${it.notes ? `<div class="notes">${escapeHtml(it.notes)}</div>` : ''}
          <div class="meta">id: ${escapeHtml(it.id || '')}</div>
        </div>
      `;
    }).join('');

    return `
      <section class="col">
        <div class="col-title">${escapeHtml(col.title || col.id)}</div>
        <div class="col-body">${items || '<div class="empty">(empty)</div>'}</div>
      </section>
    `;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(name)}</title>
  <style>
    :root {
      --bg: #0b0f19;
      --panel: #121a2a;
      --panel2: #0f1624;
      --text: #e8eefc;
      --muted: #a7b3d6;
      --border: rgba(255,255,255,0.10);
      --pill: rgba(255,255,255,0.08);
      --accent: #7aa2ff;
    }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    .topbar { display:flex; justify-content: space-between; align-items: baseline; padding: 16px 20px; border-bottom: 1px solid var(--border); background: linear-gradient(180deg, rgba(122,162,255,0.12), rgba(0,0,0,0)); }
    .name { font-size: 18px; font-weight: 700; letter-spacing: 0.2px; }
    .sub { font-size: 12px; color: var(--muted); }
    .wrap { padding: 16px 20px 28px; }
    .grid { display:grid; gap: 12px; grid-template-columns: repeat(4, minmax(240px, 1fr)); align-items: start; }
    @media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, minmax(240px, 1fr)); } }
    @media (max-width: 650px) { .grid { grid-template-columns: 1fr; } }

    .col { background: var(--panel2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .col-title { padding: 10px 12px; font-weight: 700; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.03); }
    .col-body { padding: 12px; display:flex; flex-direction: column; gap: 10px; min-height: 120px; }

    .card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 10px 8px; }
    .card-top { display:flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
    .title { font-weight: 700; line-height: 1.2; }
    .pill { font-size: 11px; color: var(--muted); background: var(--pill); border: 1px solid var(--border); padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
    .notes { margin-top: 6px; font-size: 12px; color: var(--muted); line-height: 1.35; }
    .meta { margin-top: 8px; font-size: 11px; color: rgba(167,179,214,0.75); }
    .empty { color: rgba(167,179,214,0.55); font-size: 12px; padding: 10px 4px; }

    .btns { display:flex; gap: 10px; align-items: center; }
    .btn { color: var(--text); text-decoration: none; font-size: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 10px; }
    .btn:hover { border-color: rgba(122,162,255,0.55); }
  </style>
</head>
<body>
  <div class="topbar">
    <div>
      <div class="name">${escapeHtml(name)}</div>
      <div class="sub">Updated: ${escapeHtml(updatedAt)} • Local dashboard • Source: mission-control/tasks.json</div>
    </div>
    <div class="btns">
      <a class="btn" href="/api/tasks" target="_blank">tasks.json</a>
      <a class="btn" href="/" onclick="setTimeout(() => location.reload(), 50)">refresh</a>
    </div>
  </div>

  <div class="wrap">
    <div class="grid">${cols}</div>
  </div>

  <script>
    // auto-refresh every 15s
    setTimeout(() => location.reload(), 15000);
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  try {
    if (req.url === '/api/tasks') {
      const tasks = readTasks();
      return sendJson(res, 200, tasks);
    }

    if (req.url === '/' || req.url.startsWith('/?')) {
      const tasks = readTasks();
      return send(res, 200, render(tasks));
    }

    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end('Not found');
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end(`Server error: ${e?.message || e}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mission Control running: http://${HOST}:${PORT}`);
  console.log(`Tasks JSON: http://${HOST}:${PORT}/api/tasks`);
});
