# ChatGPT Demo

Minimal ChatGPT-style demo: static frontend plus Node/Express server proxy to the OpenAI Chat Completions API.

Setup
-----

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your OpenAI API key:

```text
OPENAI_API_KEY=sk-...
```

Run
---

```bash
npm start
# then open http://localhost:3000
```

Notes
-----
- Do NOT commit `.env` or your API key to the repo. Add `.env` to `.gitignore`.
- For production, deploy the server as a serverless function or to a managed host and set `OPENAI_API_KEY` as a platform secret.
