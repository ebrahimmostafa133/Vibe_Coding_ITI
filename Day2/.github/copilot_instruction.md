# Copilot Instruction — Build a ChatGPT Website

Purpose
-------
This document describes a minimal, secure workflow and example snippets to build a ChatGPT-style website using the OpenAI API. Keep the API key server-side and deploy the server as a serverless function or small Node/Express app.

Recommended stack
-----------------
- Frontend: plain HTML/CSS/JavaScript or React/Vite for SPA.
- Backend: Node.js + Express or serverless functions (recommended for hosting on Vercel/Netlify).
- API: OpenAI Chat Completions (gpt-4o/gpt-4 or gpt-3.5) via official OpenAI library or fetch.

Architecture
------------
Browser -> Your Backend (/api/chat) -> OpenAI API

Security
--------
- Never expose `OPENAI_API_KEY` to the browser. Store it in server environment variables or platform secrets.
- Add `OPENAI_API_KEY` to your repository/platform secrets (e.g., Vercel/GitHub Secrets) when deploying.

Quick local setup (Node.js)
--------------------------
1. Initialize project:

```bash
npm init -y
npm install express dotenv node-fetch@2
```

2. Create `.env` with:

```
OPENAI_API_KEY=your_api_key_here
```

3. Minimal `server.js` (example):

```js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const messages = req.body.messages;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages }),
  });
  const data = await resp.json();
  res.json(data);
});

app.listen(3000, () => console.log('Server listening on http://localhost:3000'));
```

4. Frontend fetch example (`app.js`):

```js
async function sendMessage(messages) {
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  return r.json();
}
```

Files to include
----------------
- `index.html` — UI and chat input
- `styles.css` — styling
- `app.js` — front-end logic
- `server.js` or serverless function — API proxy to OpenAI
- `.env` — API key locally (DO NOT commit)

Deployment notes
----------------
- For static-only frontends, use GitHub Pages, but backend must be hosted separately (Vercel, Heroku, Render).
- For easiest integration, deploy both frontend and serverless API on Vercel.
- Add `OPENAI_API_KEY` to platform secrets (Vercel env vars or GitHub Actions secrets) before deploying.

Policy & safety
---------------
- Implement rate limiting and input validation on the server to prevent abuse.
- Observe OpenAI's use-case policies and moderate generated content where appropriate.

Next steps
----------
- Scaffold minimal project files and a simple UI sample.
- Optionally add a GitHub Actions workflow or Vercel config for deployment.

If you want, I can scaffold the project files now (frontend + server example) and add a suggested deployment workflow.
