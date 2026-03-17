import http from 'http';
import fs from 'fs';
import path from 'path';

const FILE_PATH = process.argv[2] || '_drafts/tablecloth-time-relaunch.markdown';
const PORT = 3457;

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Edit: ${path.basename(FILE_PATH)}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #282a36; }
    .header { 
      padding: 10px 15px; 
      background: #44475a; 
      color: #f8f8f2;
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .header h1 { font-size: 14px; font-weight: 500; }
    .status { font-size: 12px; color: #6272a4; }
    .status.saved { color: #50fa7b; }
    .status.saving { color: #ffb86c; }
    .status.error { color: #ff5555; }
    button {
      background: #6272a4;
      color: #f8f8f2;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover { background: #7082b4; }
    button:active { background: #50fa7b; color: #282a36; }
    .CodeMirror { 
      height: calc(100vh - 50px); 
      font-size: 16px;
      line-height: 1.5;
    }
    @media (max-width: 600px) {
      .CodeMirror { font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${path.basename(FILE_PATH)}</h1>
    <span class="status" id="status">Ready</span>
    <button onclick="save()">Save</button>
  </div>
  <textarea id="editor"></textarea>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/markdown/markdown.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/yaml/yaml.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/yaml-frontmatter/yaml-frontmatter.min.js"></script>
  <script>
    const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
      mode: 'yaml-frontmatter',
      theme: 'dracula',
      lineNumbers: true,
      lineWrapping: true,
      autofocus: true,
      inputStyle: 'contenteditable' // Better mobile support
    });

    const status = document.getElementById('status');

    // Load content
    fetch('/content')
      .then(r => r.text())
      .then(content => {
        editor.setValue(content);
        status.textContent = 'Loaded';
        status.className = 'status saved';
      });

    // Auto-save on Ctrl+S / Cmd+S
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    });

    async function save() {
      status.textContent = 'Saving...';
      status.className = 'status saving';
      try {
        const res = await fetch('/save', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: editor.getValue()
        });
        if (res.ok) {
          status.textContent = 'Saved ✓';
          status.className = 'status saved';
        } else {
          throw new Error(await res.text());
        }
      } catch (err) {
        status.textContent = 'Error: ' + err.message;
        status.className = 'status error';
      }
    }
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const filePath = path.resolve(FILE_PATH);
  
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.method === 'GET' && req.url === '/content') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(content);
    } catch (err) {
      res.writeHead(500);
      res.end(err.message);
    }
  } else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        fs.writeFileSync(filePath, body);
        res.writeHead(200);
        res.end('OK');
        console.log(`[${new Date().toISOString()}] Saved ${filePath}`);
      } catch (err) {
        res.writeHead(500);
        res.end(err.message);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Editor running at http://100.97.168.36:${PORT}`);
  console.log(`Editing: ${path.resolve(FILE_PATH)}`);
});
