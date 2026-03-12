const form = document.getElementById('form');
const input = document.getElementById('input');
const chat = document.getElementById('chat');
const modelSelect = document.getElementById('model');
const modelListEl = document.getElementById('modelList');
const modelBadge = document.getElementById('modelBadge');
const clearBtn = document.getElementById('clearBtn');

let conversation = [
  { role: 'system', content: 'You are a helpful assistant.' }
];

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(date){
  const d = date || new Date();
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  return `${h}:${m}`;
}

function buildContentNode(text){
  const container = document.createElement('div');
  container.className = 'content';
  const codeBlock = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while((match = codeBlock.exec(text))){
    const before = text.slice(lastIndex, match.index);
    if(before) appendText(container, before);
    const pre = document.createElement('pre');
    pre.className = 'code';
    const code = document.createElement('code');
    code.textContent = match[1];
    pre.appendChild(code);
    container.appendChild(pre);
    lastIndex = match.index + match[0].length;
  }
  const rest = text.slice(lastIndex);
  if(rest) appendText(container, rest);
  return container;

  function appendText(parent, txt){
    const urlRe = /https?:\/\/[\w\-./?%&=+#~:,;@]+/g;
    const lines = txt.split('\n');
    lines.forEach((line, i)=>{
      let last=0; let m;
      while((m = urlRe.exec(line))){
        if(m.index > last) parent.appendChild(document.createTextNode(line.slice(last, m.index)));
        const a = document.createElement('a');
        a.href = m[0]; a.textContent = m[0]; a.target = '_blank'; a.rel='noopener noreferrer';
        parent.appendChild(a);
        last = m.index + m[0].length;
      }
      if(last < line.length) parent.appendChild(document.createTextNode(line.slice(last)));
      if(i < lines.length - 1) parent.appendChild(document.createElement('br'));
    });
  }
}

function renderMessage(role, text, opts = {}){
  const el = document.createElement('div');
  el.className = 'message ' + (role === 'user' ? 'user' : 'assistant');

  const avatar = document.createElement('div');
  avatar.className = 'avatar ' + (role === 'user' ? 'user' : 'assistant');
  avatar.textContent = role === 'user' ? 'You' : 'A';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const meta = document.createElement('div');
  meta.className = 'meta';
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = role === 'user' ? 'You' : 'Assistant';
  meta.appendChild(name);
  bubble.appendChild(meta);

  if(opts.typing){
    const content = document.createElement('div');
    content.className = 'content';
    const dots = document.createElement('div');
    dots.className = 'typing';
    dots.innerHTML = '<span></span><span></span><span></span>';
    content.appendChild(dots);
    bubble.appendChild(content);
  } else {
    if (opts.image) {
      const img = document.createElement('img');
      img.src = opts.image;
      img.alt = 'Generated image';
      img.style.maxWidth = '480px';
      img.style.borderRadius = '8px';
      img.style.display = 'block';
      img.style.marginTop = '8px';
      bubble.appendChild(img);
    } else {
      bubble.appendChild(buildContentNode(text));
    }
  }

  // add time and status info (WhatsApp-like)
  const info = document.createElement('div');
  info.className = 'msg-info';
  const timeEl = document.createElement('span');
  timeEl.className = 'time';
  timeEl.textContent = formatTime(new Date());
  info.appendChild(timeEl);
  if (role === 'user') {
    const statusEl = document.createElement('span');
    statusEl.className = 'status';
    statusEl.textContent = '✓';
    info.appendChild(statusEl);
  }
  bubble.appendChild(info);

  el.appendChild(avatar);
  el.appendChild(bubble);
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

async function sendRequest(messages, model){
  const res = await fetch('/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,model})});
  const text = await res.text();
  if(!text) throw new Error('Empty response from server');
  try{
    const data = JSON.parse(text);
    if(!res.ok){
      const message = data?.error || data?.message || 'OpenAI error';
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }
    return data;
  }catch(err){
    if(err instanceof SyntaxError) throw new Error('Invalid JSON from server: ' + text.slice(0,1000));
    throw err;
  }
}

async function loadModels(){
  // placeholder
  modelSelect.innerHTML = '';
  const loading = document.createElement('option');
  loading.textContent = 'Loading models...'; loading.disabled = true; loading.selected = true;
  modelSelect.appendChild(loading);
  try{
    const res = await fetch('/api/models');
    const data = await res.json();
    let models = Array.isArray(data.models) ? data.models : [];
    if(models.length === 0) models = ['gpt-3.5-turbo','gpt-4'];

    modelSelect.innerHTML = '';
    const saved = localStorage.getItem('model');
    models.forEach(m => {
      const opt = document.createElement('option'); opt.value = m; opt.textContent = m;
      if(saved ? saved === m : m === 'gpt-3.5-turbo') opt.selected = true;
      modelSelect.appendChild(opt);
    });

    // populate model list cards
    modelListEl.innerHTML = '';
    // helper to infer model type on client
    function inferModelTypeLocal(id){
      const s = String(id || '').toLowerCase();
      if (/gpt-|gpt\.|gpt|o4|o4-/.test(s)) return 'chat';
      if (/davinci|babbage|curie|ada|text-|code-/.test(s)) return 'completion';
      if (/embed|embedding|text-embedding/.test(s)) return 'embedding';
      if (/image|img|gpt-image/.test(s)) return 'image';
      if (/whisper|audio|tts|speech/.test(s)) return 'audio';
      return 'other';
    }

    models.forEach(m => {
      const card = document.createElement('div'); card.className = 'model-card'; card.tabIndex = 0;
      const label = document.createElement('div'); label.textContent = m; label.style.fontWeight='600';
      const small = document.createElement('div'); small.className = 'muted';
      const t = inferModelTypeLocal(m);
      small.textContent = t;
      card.appendChild(label); card.appendChild(small);
      if((saved && saved === m) || (!saved && m === 'gpt-3.5-turbo')) card.classList.add('active');
      card.addEventListener('click', ()=>{
        // select model
        modelSelect.value = m; localStorage.setItem('model', m); updateModelBadge(m);
        // mark active
        [...modelListEl.children].forEach(c=>c.classList.remove('active'));
        card.classList.add('active');
      });
      modelListEl.appendChild(card);
    });

    updateModelBadge(modelSelect.value);
  }catch(err){
    console.error('Could not load models', err);
    modelSelect.innerHTML = '';
    ['gpt-3.5-turbo','gpt-4'].forEach(m => { const opt = document.createElement('option'); opt.value = m; opt.textContent = m; modelSelect.appendChild(opt); });
    updateModelBadge(modelSelect.value);
  }
}

function updateModelBadge(m){ if(modelBadge) modelBadge.textContent = m; }

modelSelect.addEventListener('change', ()=>{ localStorage.setItem('model', modelSelect.value); updateModelBadge(modelSelect.value); });
clearBtn?.addEventListener('click', ()=>{
  conversation = [{ role:'system', content: 'You are a helpful assistant.' }];
  chat.innerHTML = '';
});

loadModels();

// form behavior
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  const model = modelSelect.value;
  const userEl = renderMessage('user', text);
  input.value = '';
  conversation.push({ role:'user', content: text });

  const typingEl = renderMessage('assistant','', {typing:true});
  const sendBtn = document.getElementById('sendBtn'); sendBtn.disabled = true; input.disabled = true;
  try{
    let data;
    try{
      data = await sendRequest(conversation, model);
    }catch(err){
      const msg = err?.message || '';
      if(/model_not_found|does not have access to model|access to model/i.test(msg)){
        // try fallbacks
        const res = await fetch('/api/models');
        const js = await res.json();
        const available = Array.isArray(js.models)?js.models:[];
        const fallbacks = ['gpt-5-mini','gpt-5-nano','gpt-4o-mini','gpt-4.1-nano','o4-mini','gpt-4','gpt-3.5-turbo'];
        let lastErr;
        for(const cand of fallbacks){
          if(!available.includes(cand)) continue;
          // show ephemeral message
          const note = renderMessage('assistant', `Model ${model} unavailable; retrying with ${cand}...`);
          try{ data = await sendRequest(conversation, cand); modelSelect.value = cand; localStorage.setItem('model', cand); updateModelBadge(cand); note.remove(); break;}catch(e2){ lastErr = e2; note.remove(); }
        }
        if(!data) throw lastErr || err;
      }else{
        throw err;
      }
    }

    typingEl.remove();
    // If the server returned an image URL or data URI, render it
    if (data?.image) {
      renderMessage('assistant', '', { image: data.image });
      conversation.push({ role: 'assistant', content: '', image: data.image });
    } else {
      const reply = data?.choices?.[0]?.message?.content || data?.error || 'No response';
      renderMessage('assistant', reply);
      conversation.push({ role: 'assistant', content: reply });
    }

    // mark last user message as delivered (double tick)
    try {
      if (userEl) {
        const st = userEl.querySelector('.status');
        if (st) { st.textContent = '✓✓'; st.classList.add('delivered'); }
      }
    } catch (ex) { /* ignore */ }
  }catch(err){
    typingEl.remove();
    renderMessage('assistant', 'Error: ' + (err?.message || 'Request failed'));
  }finally{
    sendBtn.disabled = false; input.disabled = false; input.focus();
  }
});

// allow Shift+Enter for newline
input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault(); form.dispatchEvent(new Event('submit', {cancelable:true}));
  }
});
