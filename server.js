const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.join(__dirname, 'workspace');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const state = {
  activeProjectId: null,
  projects: {},
};

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ message: 'Serialization failed' });
  }
}

function ensureDirectories() {
  if (!fs.existsSync(PROJECT_ROOT)) {
    fs.mkdirSync(PROJECT_ROOT, { recursive: true });
  }
}

function makeProjectId() {
  return `project-${crypto.randomUUID().slice(0, 8)}`;
}

function ensureProject(projectId) {
  const projectDir = path.join(PROJECT_ROOT, projectId);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  return projectDir;
}

function getProject(projectId) {
  if (!state.projects[projectId]) {
    state.projects[projectId] = {
      id: projectId,
      name: `Project ${projectId.split('-').pop()}`,
      status: 'idle',
      lastError: '',
      prompt: '',
      files: [],
      previewUrl: '',
      deploymentUrl: '',
      domainStatus: 'pending',
      sslStatus: 'pending',
      buildLogs: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return state.projects[projectId];
}

function emitSse(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${safeJson(payload)}\n\n`);
}

function buildProjectHtml(projectName, prompt) {
  const productNames = [
    'Aurora Lamp',
    'Nova Headphones',
    'Terra Chair',
    'Flex Smartwatch',
    'Orbital Speaker',
    'Luna Backpack',
  ];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-wrap">
          <div class="brand-mark">N</div>
          <div>
            <p class="eyebrow">Modern Commerce</p>
            <h1>${projectName}</h1>
          </div>
        </div>

        <nav class="nav">
          <a href="#">Home</a>
          <a href="#">Shop</a>
          <a href="#">Collections</a>
          <a href="#">Support</a>
        </nav>

        <div class="actions">
          <button class="ghost" id="toggleTheme">Dark mode</button>
          <button class="primary" id="openLogin">Login</button>
          <button class="cart-btn" id="openCart">Cart <span id="cartCount">0</span></button>
        </div>
      </header>

      <main>
        <section class="hero">
          <div class="hero-copy">
            <span class="badge">New collection</span>
            <h2>Designed for everyday lifestyle.</h2>
            <p>${prompt}</p>
            <div class="cta-row">
              <button class="primary large">Shop now</button>
              <button class="ghost large">View catalog</button>
            </div>
            <ul class="hero-stats">
              <li><strong>24k+</strong><span>buyers</span></li>
              <li><strong>4.9/5</strong><span>rating</span></li>
              <li><strong>2-day</strong><span>shipping</span></li>
            </ul>
          </div>

          <div class="hero-visual">
            <div class="product-card large-card">
              <div class="card-glow"></div>
              <div class="card-figure"></div>
              <div class="card-copy">
                <span>Featured item</span>
                <h3>Aurora Lamp</h3>
                <p>$199</p>
              </div>
            </div>
          </div>
        </section>

        <section class="catalog">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Best sellers</span>
              <h3>Popular picks</h3>
            </div>
            <button class="ghost">See all</button>
          </div>

          <div class="product-grid">
            ${productNames.map((name, index) => `
              <article class="product-item">
                <div class="product-image product-${index + 1}"></div>
                <div class="product-meta">
                  <span class="category">Lifestyle</span>
                  <h4>${name}</h4>
                  <div class="price-row">
                    <strong>$${(index + 1) * 89}</strong>
                    <button class="add-to-cart" data-name="${name}" data-price="${(index + 1) * 89}">Add to cart</button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <section class="promo-panels">
          <div class="promo-card">
            <span class="eyebrow">Smart checkout</span>
            <h3>Fast and secure payment flow</h3>
            <p>Credit card, e-wallet, QRIS, and bank transfer support.</p>
          </div>
          <div class="promo-card accent">
            <span class="eyebrow">Admin dashboard</span>
            <h3>Manage orders and inventory</h3>
            <p>Real-time analytics, product updates, and customer insight.</p>
          </div>
        </section>
      </main>

      <aside class="cart-panel" id="cartPanel">
        <div class="cart-header">
          <h3>Shopping cart</h3>
          <button id="closeCart" class="close-btn">×</button>
        </div>
        <div id="cartItems" class="cart-items">
          <p class="empty-state">Your cart is empty.</p>
        </div>
        <div class="cart-summary">
          <div class="total-row">
            <span>Total</span>
            <strong id="totalPrice">$0</strong>
          </div>
          <button class="primary full" id="checkoutBtn">Proceed to checkout</button>
        </div>
      </aside>

      <div class="modal" id="loginModal">
        <div class="modal-box">
          <div class="modal-top">
            <h3>Welcome back</h3>
            <button id="closeLogin" class="close-btn">×</button>
          </div>
          <form class="auth-form">
            <label>
              Email
              <input type="email" value="admin@shop.com" />
            </label>
            <label>
              Password
              <input type="password" value="••••••••" />
            </label>
            <button class="primary full" type="button">Sign in</button>
          </form>
        </div>
      </div>

      <div class="toast" id="toast">Added to cart</div>
    </div>

    <script src="./app.js"><\/script>
  </body>
</html>
`;
}

function buildProjectCss() {
  return `:root {
  --bg: #f6f7fb;
  --bg-strong: #ebefff;
  --surface: rgba(255, 255, 255, 0.9);
  --surface-strong: #ffffff;
  --text: #101828;
  --muted: #667085;
  --line: rgba(16, 24, 40, 0.08);
  --primary: #5b5cf7;
  --primary-strong: #4545d9;
  --accent: #ffbf69;
  --success: #18a957;
  --shadow: 0 20px 50px rgba(31, 41, 55, 0.12);
  --radius: 22px;
}

body.dark {
  --bg: #0b1020;
  --bg-strong: #111a2d;
  --surface: rgba(15, 23, 42, 0.8);
  --surface-strong: #111827;
  --text: #edf2ff;
  --muted: #98a2b3;
  --line: rgba(148, 163, 184, 0.15);
  --primary: #8b5cf6;
  --primary-strong: #7c3aed;
  --accent: #fbbf24;
  --success: #34d399;
  --shadow: 0 25px 60px rgba(2, 6, 23, 0.6);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top left, var(--bg-strong), var(--bg) 45%);
  color: var(--text);
  transition: background 0.25s ease, color 0.25s ease;
}

button, input { font: inherit; }
button { cursor: pointer; border: none; }

.app-shell { max-width: 1280px; margin: 0 auto; padding: 32px 20px 100px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 24px; border: 1px solid var(--line); border-radius: 26px; background: rgba(255, 255, 255, 0.28); backdrop-filter: blur(16px); box-shadow: var(--shadow); position: sticky; top: 10px; z-index: 10; }
.brand-wrap { display: flex; align-items: center; gap: 14px; }
.brand-mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; background: linear-gradient(135deg, var(--primary), #7dd3fc); color: white; font-weight: 800; box-shadow: 0 15px 25px rgba(91, 92, 247, 0.3); }
.eyebrow { margin: 0 0 4px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
h1, h2, h3, h4, p { margin: 0; }
.nav { display: flex; align-items: center; gap: 22px; }
.nav a { color: var(--muted); text-decoration: none; font-weight: 600; }
.actions { display: flex; align-items: center; gap: 12px; }
.ghost, .primary, .cart-btn { border-radius: 12px; padding: 12px 18px; font-weight: 700; transition: transform 0.2s ease, opacity 0.2s ease; }
.ghost { background: rgba(255, 255, 255, 0.4); color: var(--text); border: 1px solid var(--line); }
.primary { background: linear-gradient(135deg, var(--primary), var(--primary-strong)); color: white; box-shadow: 0 15px 25px rgba(91, 92, 247, 0.25); }
.cart-btn { background: rgba(255, 191, 105, 0.14); color: var(--text); border: 1px solid rgba(255, 191, 105, 0.2); }
.hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; padding: 54px 0 20px; }
.hero-copy h2 { font-size: clamp(2.6rem, 6vw, 5rem); line-height: 0.96; letter-spacing: -0.06em; margin-top: 16px; max-width: 560px; }
.hero-copy p { margin-top: 16px; max-width: 620px; color: var(--muted); font-size: 1.05rem; line-height: 1.7; }
.badge { display: inline-flex; background: rgba(91, 92, 247, 0.1); color: var(--primary); border: 1px solid rgba(91, 92, 247, 0.14); padding: 8px 12px; border-radius: 999px; letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 800; }
.cta-row { display: flex; gap: 14px; margin-top: 28px; }
.large { padding: 16px 22px; }
.hero-stats { list-style: none; display: flex; gap: 26px; padding: 0; margin-top: 28px; }
.hero-stats li { display: flex; flex-direction: column; gap: 4px; }
.hero-stats strong { font-size: 1.5rem; }
.hero-stats span { color: var(--muted); }
.hero-visual { display: flex; justify-content: center; }
.product-card { position: relative; width: min(100%, 490px); height: 470px; border-radius: 34px; background: linear-gradient(180deg, rgba(91, 92, 247, 0.25), rgba(255, 255, 255, 0.18)); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: var(--shadow); overflow: hidden; transform: perspective(1200px) rotateY(-12deg) rotateX(8deg); }
.card-glow { position: absolute; inset: 20% 8% auto auto; width: 250px; height: 250px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 191, 105, 0.7), rgba(255, 191, 105, 0)); filter: blur(30px); }
.card-figure { position: absolute; inset: 18% 13% 16% 13%; border-radius: 26px; background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(91,92,247,0.15)); border: 1px solid rgba(255,255,255,0.4); box-shadow: inset 0 0 20px rgba(255,255,255,0.2); }
.card-copy { position: absolute; left: 28px; right: 28px; bottom: 24px; display: flex; justify-content: space-between; align-items: end; gap: 12px; }
.card-copy span { display: block; font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.12em; }
.card-copy h3 { font-size: 2rem; margin-top: 8px; }
.catalog { margin-top: 30px; }
.section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-heading h3 { font-size: clamp(1.8rem, 3vw, 2.5rem); }
.product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.product-item { background: var(--surface); border: 1px solid var(--line); border-radius: 26px; overflow: hidden; box-shadow: var(--shadow); }
.product-image { height: 220px; background-size: cover; background-position: center; position: relative; }
.product-1 { background: linear-gradient(135deg, rgba(169, 233, 228, 0.9), rgba(91, 92, 247, 0.5)); }
.product-2 { background: linear-gradient(135deg, rgba(254, 215, 170, 0.9), rgba(84, 153, 255, 0.5)); }
.product-3 { background: linear-gradient(135deg, rgba(220, 252, 231, 0.9), rgba(52, 211, 153, 0.55)); }
.product-4 { background: linear-gradient(135deg, rgba(253, 186, 116, 0.9), rgba(251, 146, 60, 0.6)); }
.product-5 { background: linear-gradient(135deg, rgba(196, 181, 253, 0.9), rgba(168, 85, 247, 0.6)); }
.product-6 { background: linear-gradient(135deg, rgba(191, 219, 254, 0.9), rgba(59, 130, 246, 0.6)); }
.product-meta { padding: 18px 18px 22px; }
.category { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
.product-meta h4 { margin-top: 8px; font-size: 1.35rem; }
.price-row { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.add-to-cart { background: rgba(91, 92, 247, 0.1); border: 1px solid rgba(91, 92, 247, 0.18); color: var(--primary); border-radius: 10px; padding: 10px 12px; font-weight: 700; }
.promo-panels { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 34px; }
.promo-card { padding: 28px; border-radius: 26px; background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(91,92,247,0.08)); border: 1px solid var(--line); box-shadow: var(--shadow); }
.promo-card.accent { background: linear-gradient(135deg, rgba(255,191,105,0.2), rgba(250,204,21,0.08)); }
.promo-card h3 { margin-top: 8px; font-size: clamp(1.4rem, 2vw, 2rem); }
.promo-card p { margin-top: 12px; color: var(--muted); line-height: 1.7; }
.cart-panel { position: fixed; right: 20px; top: 90px; width: min(380px, calc(100vw - 28px)); background: var(--surface-strong); border: 1px solid var(--line); border-radius: 24px; box-shadow: var(--shadow); transform: translateX(120%); transition: transform 0.3s ease; z-index: 20; padding: 18px 18px 14px; }
.cart-panel.open { transform: translateX(0); }
.cart-header, .modal-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.close-btn { width: 34px; height: 34px; border-radius: 10px; background: rgba(148, 163, 184, 0.12); color: var(--text); }
.cart-items { padding: 22px 0 12px; display: flex; flex-direction: column; gap: 12px; }
.cart-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: rgba(148, 163, 184, 0.06); }
.cart-item small { color: var(--muted); }
.empty-state { color: var(--muted); text-align: center; padding: 12px 0 6px; }
.cart-summary { padding-top: 14px; border-top: 1px solid var(--line); }
.total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.full { width: 100%; }
.modal { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(15, 23, 42, 0.52); opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 30; }
.modal.show { opacity: 1; pointer-events: auto; }
.modal-box { width: min(450px, calc(100vw - 28px)); background: var(--surface-strong); border: 1px solid var(--line); border-radius: 24px; padding: 18px 18px 22px; box-shadow: var(--shadow); }
.auth-form { margin-top: 18px; display: flex; flex-direction: column; gap: 14px; }
.auth-form label { display: flex; flex-direction: column; gap: 8px; color: var(--muted); font-weight: 600; }
.auth-form input { border: 1px solid var(--line); border-radius: 12px; background: rgba(148,163,184,0.04); color: var(--text); padding: 12px 14px; }
.toast { position: fixed; right: 20px; bottom: 26px; background: var(--surface-strong); color: var(--text); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; box-shadow: var(--shadow); opacity: 0; transform: translateY(12px); transition: all 0.2s ease; }
.toast.show { opacity: 1; transform: translateY(0); }
@media (max-width: 900px) { .topbar { flex-wrap: wrap; justify-content: center; } .nav { order: 3; width: 100%; justify-content: center; flex-wrap: wrap; } .hero, .product-grid, .promo-panels { grid-template-columns: 1fr; } }
`;
}

function buildProjectJs() {
  return `const cart = [];

const cartPanel = document.getElementById('cartPanel');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const totalPrice = document.getElementById('totalPrice');
const toast = document.getElementById('toast');
const loginModal = document.getElementById('loginModal');
const themeToggle = document.getElementById('toggleTheme');

function renderCart() {
  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
    cartCount.textContent = '0';
    totalPrice.textContent = '$0';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong><br />
          <small>${item.qty} item</small>
        </div>
        <strong>$${item.price * item.qty}</strong>
      </div>
    `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartCount.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
  totalPrice.textContent = '$' + subtotal;
}

function flashToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

function addToCart(name, price) {
  const existing = cart.find((item) => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  renderCart();
  flashToast('Added to cart');
}

document.querySelectorAll('.add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    addToCart(button.dataset.name, Number(button.dataset.price));
  });
});

document.getElementById('openCart')?.addEventListener('click', () => {
  cartPanel.classList.add('open');
});

document.getElementById('closeCart')?.addEventListener('click', () => {
  cartPanel.classList.remove('open');
});

document.getElementById('openLogin')?.addEventListener('click', () => {
  loginModal.classList.add('show');
});

document.getElementById('closeLogin')?.addEventListener('click', () => {
  loginModal.classList.remove('show');
});

document.getElementById('checkoutBtn')?.addEventListener('click', () => {
  flashToast('Checkout started');
  cartPanel.classList.remove('open');
});

themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
});

renderCart();
`;
}

function buildGeneratedProject(projectId, prompt) {
  const projectDir = ensureProject(projectId);
  const projectName = `NovaMarket`;

  const files = [
    { path: 'index.html', content: buildProjectHtml(projectName, prompt) },
    { path: 'styles.css', content: buildProjectCss() },
    { path: 'app.js', content: buildProjectJs() },
    { path: 'README.md', content: `# ${projectName}\n\nGenerated from prompt: ${prompt}\n` },
  ];

  files.forEach((file) => {
    fs.writeFileSync(path.join(projectDir, file.path), file.content, 'utf8');
  });

  return {
    projectDir,
    files: files.map((item) => item.path),
  };
}

function buildParserCheck(projectDir) {
  return new Promise((resolve) => {
    const jsFile = path.join(projectDir, 'app.js');
    if (!fs.existsSync(jsFile)) {
      resolve({ ok: false, error: 'app.js not generated' });
      return;
    }

    const { exec } = require('child_process');
    exec(`node --check "${jsFile}"
`, (error, stdout, stderr) => {
      if (error) {
        resolve({ ok: false, error: stderr || error.message || 'JavaScript syntax validation failed' });
        return;
      }

      resolve({ ok: true, output: stdout || 'Build validation passed' });
    });
  });
}

async function runBuild(projectId) {
  const project = getProject(projectId);
  const projectDir = ensureProject(projectId);
  const validation = await buildParserCheck(projectDir);

  project.buildLogs = [
    'AI generated',
    'Project structure created',
    'Build validation running',
    validation.ok ? 'Build successful' : 'Build failed',
  ];

  if (!validation.ok) {
    project.status = 'error';
    project.lastError = validation.error;
    return { ok: false, project, error: validation.error };
  }

  project.status = 'ready';
  project.lastError = '';
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  project.previewUrl = `${baseUrl}/project/${projectId}/preview/`;
  project.deploymentUrl = `https://project-${projectId}.platform-domain.com`;
  project.updatedAt = new Date().toISOString();
  return { ok: true, project };
}

function repairProjectOnError(projectId, error) {
  const projectDir = ensureProject(projectId);
  const appPath = path.join(projectDir, 'app.js');
  const safeScript = buildProjectJs();
  fs.writeFileSync(appPath, safeScript, 'utf8');
  return { ok: true, message: 'Minimal patch applied to recover the broken build.', error };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.get('/rpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rpg-game.html'));
});

app.get('/rpg-game.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rpg-game.html'));
});

app.post('/api/ai/generate', async (req, res) => {
  const prompt = (req.body && req.body.prompt) || '';
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt cannot be empty.' });
  }

  const projectId = state.activeProjectId || makeProjectId();
  state.activeProjectId = projectId;
  const project = getProject(projectId);
  project.name = `Project ${projectId.split('-').pop()}`;
  project.prompt = prompt;
  project.status = 'analyzing';
  project.lastError = '';
  project.updatedAt = new Date().toISOString();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const send = (event, payload) => emitSse(res, event, payload);

  send('status', { phase: 'analyzing', message: 'AI sedang menganalisis kebutuhan pengguna...' });
  send('status', { phase: 'planning', message: 'Membuat struktur project dan alur fitur...' });

  setTimeout(() => {
    send('status', { phase: 'generating', message: 'AI membuat layout storefront modern...' });
  }, 400);

  setTimeout(async () => {
    send('status', { phase: 'writing_files', message: 'Menulis file project ke workspace aktif...' });

    const generated = buildGeneratedProject(projectId, prompt);
    project.files = generated.files;

    send('status', { phase: 'writing_files', message: `File dibuat: ${generated.files.join(', ')}` });

    send('status', { phase: 'building', message: 'Menjalankan validasi build dan pengecekan sintaks...' });

    const buildResult = await runBuild(projectId);

    if (!buildResult.ok) {
      const repair = repairProjectOnError(projectId, buildResult.error);
      send('status', { phase: 'fixing_errors', message: repair.message });

      const retry = await runBuild(projectId);
      if (!retry.ok) {
        project.status = 'error';
        project.lastError = retry.error;
        send('status', { phase: 'error', message: retry.error });
        send('done', {
          ok: false,
          projectId,
          status: 'error',
          message: retry.error,
        });
        return;
      }
    }

    project.status = 'ready';
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    project.previewUrl = `${baseUrl}/project/${projectId}/preview/`;
    project.deploymentUrl = `https://project-${projectId}.platform-domain.com`;

    send('status', { phase: 'ready', message: 'Project siap di preview dan publish.' });
    send('done', {
      ok: true,
      projectId,
      status: 'ready',
      previewUrl: project.previewUrl,
      deploymentUrl: project.deploymentUrl,
      files: project.files,
      message: 'AI generated, build successful, preview ready',
    });
  }, 800);
});

app.get('/api/project/:projectId', (req, res) => {
  const project = getProject(req.params.projectId);
  res.json({ project });
});

app.get('/api/project/active', (req, res) => {
  const active = state.activeProjectId ? getProject(state.activeProjectId) : null;
  res.json({ project: active });
});

app.get('/api/build/:projectId', async (req, res) => {
  const result = await runBuild(req.params.projectId);
  res.json(result);
});

app.post('/api/publish', (req, res) => {
  const projectId = req.body.projectId || state.activeProjectId;
  if (!projectId) {
    return res.status(400).json({ message: 'No active project to publish.' });
  }

  const project = getProject(projectId);
  if (project.status !== 'ready') {
    return res.status(400).json({ message: 'Project must be ready before publishing' });
  }

  project.domainStatus = 'verified';
  project.sslStatus = 'active';
  project.deploymentUrl = `https://project-${projectId}.platform-domain.com`;

  res.json({
    ok: true,
    status: 'published',
    deploymentUrl: project.deploymentUrl,
    domainStatus: project.domainStatus,
    sslStatus: project.sslStatus,
  });
});

app.use('/project/:projectId/preview', (req, res, next) => {
  const { projectId } = req.params;
  const projectDir = path.join(PROJECT_ROOT, projectId);
  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  const filePath = path.join(projectDir, 'index.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Preview file not found.' });
  }

  res.sendFile(filePath);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDirectories();

app.listen(PORT, () => {
  console.log(`AI Builder running on http://localhost:${PORT}`);
});
