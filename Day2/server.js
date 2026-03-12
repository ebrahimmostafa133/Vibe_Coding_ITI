require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

// Try to load local config.js if present (not recommended for committed secrets)
let localConfig = {};
try {
  // eslint-disable-next-line global-require
  localConfig = require('./config');
} catch (e) {
  localConfig = {};
}

// Support both OPENAI_API_KEY and older/typo keys (OPIN_API_KEY) and local config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || localConfig.OPENAI_API_KEY || process.env.OPIN_API_KEY || localConfig.OPIN_API_KEY;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// helpers to infer model category
function inferModelType(modelId) {
  if (!modelId) return 'unknown';
  const id = String(modelId).toLowerCase();
  if (/image|img|gpt-image/.test(id)) return 'image';
  if (/embed|embedding|text-embedding/.test(id)) return 'embedding';
  if (/whisper|audio|tts|speech/.test(id)) return 'audio';
  if (/davinci|babbage|curie|ada|text-|code-/.test(id)) return 'completion';
  if (/gpt-|gpt\.|gpt|o4|o4-/.test(id)) return 'chat';
  return 'other';
}

function messagesToPrompt(messages) {
  // convert chat-style messages into a single prompt for completion models
  let prompt = '';
  messages.forEach((m) => {
    if (!m || !m.role) return;
    if (m.role === 'system') {
      prompt += (m.content || '') + '\n\n';
    } else if (m.role === 'user') {
      prompt += `User: ${m.content || ''}\n`;
    } else if (m.role === 'assistant') {
      prompt += `Assistant: ${m.content || ''}\n`;
    }
  });
  prompt += '\nAssistant:';
  return prompt;
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }
    const messages = req.body.messages || [];
    const model = req.body.model || process.env.DEFAULT_MODEL || 'gpt-3.5-turbo';

    const type = inferModelType(model);

    if (type === 'chat') {
      // Chat-capable models: use chat completions endpoint
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model, messages }),
      });
      const text = await resp.text();
      if (!text) {
        return res.status(502).json({ error: 'Empty response from OpenAI' });
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse OpenAI response as JSON:', parseErr, text.slice(0, 1000));
        return res.status(502).json({ error: 'Invalid JSON from OpenAI', details: text.slice(0, 1000) });
      }
      if (!resp.ok) {
        const status = resp.status || 502;
        const errMsg = data?.error?.message || data?.message || JSON.stringify(data);
        console.error('OpenAI API error', status, errMsg, data);
        return res.status(status).json({ error: errMsg, details: data });
      }
      return res.json(data);
    }

    if (type === 'completion') {
      // Completion-only models: convert messages into a prompt and call completions endpoint
      const prompt = messagesToPrompt(messages);
      const resp = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model, prompt, max_tokens: 512, temperature: 0.7 }),
      });
      const text = await resp.text();
      if (!text) {
        return res.status(502).json({ error: 'Empty response from OpenAI' });
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse OpenAI completions response as JSON:', parseErr, text.slice(0, 1000));
        return res.status(502).json({ error: 'Invalid JSON from OpenAI', details: text.slice(0, 1000) });
      }
      if (!resp.ok) {
        const errMsg = data?.error?.message || data?.message || JSON.stringify(data);
        console.error('OpenAI completions API error', resp.status, errMsg, data);
        return res.status(resp.status || 502).json({ error: errMsg, details: data });
      }

      // Map completions response to chat-like shape so the client can display it
      const messageText = data?.choices?.[0]?.text || '';
      const mapped = {
        id: data.id || null,
        object: 'chat.completion',
        created: data.created || Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: messageText },
            finish_reason: data.choices?.[0]?.finish_reason || 'stop',
          },
        ],
        usage: data.usage || {},
      };
      return res.json(mapped);
    }

    if (type === 'image') {
      // Image generation: use Images API (generations)
      // Use the last user message as the prompt, or join all messages if not found
      const lastUser = (messages.slice().reverse().find(m => m && m.role === 'user') || {}).content;
      const prompt = lastUser || messages.map(m => m.content).filter(Boolean).join('\n') || req.body.prompt;
      if (!prompt) {
        return res.status(400).json({ error: 'No prompt provided for image generation' });
      }

      const size = req.body.size || '1024x1024';
      const n = req.body.n || 1;

      // First try the Images Generations endpoint
      try {
        const resp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ model, prompt, size, n }),
        });

        const text = await resp.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (parseErr) {
          console.error('Failed to parse OpenAI images response as JSON:', parseErr, text && text.slice(0, 1000));
          data = null;
        }

        if (resp.ok && data) {
          const first = Array.isArray(data.data) && data.data[0] ? data.data[0] : null;
          let imageUrl = null;
          if (first) {
            if (first.url) imageUrl = first.url;
            else if (first.b64_json) imageUrl = 'data:image/png;base64,' + first.b64_json;
          }
          return res.json({ id: data.id || null, object: 'image.generation', created: data.created || Math.floor(Date.now() / 1000), model, image: imageUrl, raw: data });
        }

        // If the images endpoint responded with an error that indicates this model is only supported
        // via the Responses API, fall back to calling /v1/responses.
        const errMsg = data?.error?.message || '';
        if (/only supported in v1\/responses/i.test(errMsg)) {
          // fall through to responses API below
        } else {
          console.error('OpenAI images API error', resp.status, errMsg || text, data);
          return res.status(resp.status || 502).json({ error: errMsg || 'OpenAI images API error', details: data || text });
        }
      } catch (imagesErr) {
        console.error('Error calling images API:', imagesErr);
        // continue to try responses API
      }

      // Fallback: call the Responses API which some image models require
      try {
        const rresp = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ model, input: prompt }),
        });

        const rtext = await rresp.text();
        let rdata;
        try {
          rdata = rtext ? JSON.parse(rtext) : null;
        } catch (parseErr) {
          console.error('Failed to parse Responses API JSON:', parseErr, rtext && rtext.slice(0, 1000));
          return res.status(502).json({ error: 'Invalid JSON from OpenAI (responses)', details: rtext && rtext.slice(0, 1000) });
        }

        if (!rresp.ok) {
          const msg2 = rdata?.error?.message || rdata?.message || JSON.stringify(rdata);
          console.error('OpenAI responses API error', rresp.status, msg2, rdata);
          return res.status(rresp.status || 502).json({ error: msg2, details: rdata });
        }

        // Try to discover an image URL or base64 inside the responses payload
        const full = JSON.stringify(rdata);
        const dataUriMatch = full.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
        const urlMatch = full.match(/https?:\/\/[^"'\s>]+\.(?:png|jpe?g|gif|webp)/i);
        let imageUrl = null;
        if (dataUriMatch) imageUrl = dataUriMatch[0];
        else if (urlMatch) imageUrl = urlMatch[0];
        else if (rdata && rdata.output && Array.isArray(rdata.output)) {
          // try to find image-like fields
          for (const out of rdata.output) {
            if (!out || !out.content) continue;
            const c = out.content;
            // if content is array
            if (Array.isArray(c)) {
              for (const item of c) {
                if (item.image_url) { imageUrl = item.image_url; break; }
                if (item.url) { imageUrl = item.url; break; }
                if (item.b64_json) { imageUrl = 'data:image/png;base64,' + item.b64_json; break; }
              }
            }
          }
        }

        return res.json({ id: rdata.id || null, object: 'image.generation', created: rdata.created || Math.floor(Date.now() / 1000), model, image: imageUrl, raw: rdata });
      } catch (respErr) {
        console.error('Error calling Responses API for image model:', respErr);
        return res.status(500).json({ error: 'Image generation failed', details: String(respErr) });
      }
    }

    // Other model types (embeddings, image, audio) are not supported by the chat endpoint
    return res.status(400).json({ error: `Model ${model} is not a chat/completion model. Use a chat-capable model or the appropriate API for embeddings/images/audio.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Return list of available models from OpenAI
app.get('/api/models', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }
    const resp = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Failed to parse OpenAI models response as JSON:', parseErr, text.slice(0, 1000));
      return res.status(502).json({ error: 'Invalid JSON from OpenAI', details: text.slice(0, 1000) });
    }
    if (!resp.ok) {
      const errMsg = data?.error?.message || data?.message || JSON.stringify(data);
      console.error('OpenAI models API error', resp.status, errMsg, data);
      return res.status(resp.status || 502).json({ error: errMsg, details: data });
    }

    const models = Array.isArray(data.data) ? data.data.map(m => m.id).filter(Boolean) : [];
    // sort and dedupe
    const unique = Array.from(new Set(models)).sort();
    res.json({ models: unique });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
