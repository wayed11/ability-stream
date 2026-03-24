const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = parseInt(process.env.PORT || '8080', 10);
const PB_PORT = 8090;
const PB_DIR = path.resolve(__dirname);
const PB_BIN = path.join(PB_DIR, 'pocketbase');
const PB_DATA = path.join(PB_DIR, 'pb_data');

const FRONTEND_DIST = [
  path.resolve(process.cwd(), 'artifacts/ability-stream/dist/public'),
  path.resolve(process.cwd(), 'dist/public'),
].find(p => fs.existsSync(p));

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function ensureSuperuser() {
  try {
    execSync(`${PB_BIN} superuser upsert admin@abilitystream.app 'AbilityStream2024!' --dir=${PB_DATA}`, { stdio: 'pipe' });
    console.log('Superuser ready');
  } catch {}
}

function startPocketBase() {
  return new Promise((resolve) => {
    const migrationsDir = path.join(PB_DIR, 'pb_migrations');
    const pb = spawn(PB_BIN, ['serve', `--http=0.0.0.0:${PB_PORT}`, `--dir=${PB_DATA}`, `--migrationsDir=${migrationsDir}`, '--automigrate'], {
      cwd: PB_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    pb.stdout.on('data', (d) => {
      const msg = d.toString();
      process.stdout.write('[PB] ' + msg);
      if (msg.includes('Server started')) resolve(pb);
    });
    pb.stderr.on('data', (d) => process.stderr.write('[PB-err] ' + d.toString()));
    pb.on('error', (e) => { console.error('PB error:', e); process.exit(1); });
    pb.on('exit', (code) => { console.error(`PB exited: ${code}`); process.exit(1); });
    setTimeout(() => resolve(pb), 6000);
  });
}

async function waitForPB() {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PB_PORT}/api/health`, (res) => {
          res.resume();
          if (res.statusCode === 200) resolve(); else reject();
        }).on('error', reject);
      });
      return;
    } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  throw new Error('PocketBase failed to start');
}

async function seedAdminConfig() {
  const authRes = await fetch(`http://127.0.0.1:${PB_PORT}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@abilitystream.app', password: 'AbilityStream2024!' }),
  });
  if (!authRes.ok) return;
  const { token } = await authRes.json();
  const headers = { 'Content-Type': 'application/json', 'Authorization': token };

  try {
    const check = await fetch(`http://127.0.0.1:${PB_PORT}/api/collections/admin_config/records?filter=(config_key='platform')`, { headers });
    const data = await check.json();
    if (!data.items || data.items.length === 0) {
      await fetch(`http://127.0.0.1:${PB_PORT}/api/collections/admin_config/records`, {
        method: 'POST', headers,
        body: JSON.stringify({
          config_key: 'platform',
          monetization: { view_rate: 0.001, like_rate: 0.01, creator_split: 70, platform_split: 30 },
          ad_slots: [], featured_show_ids: [], categories: [],
        }),
      });
      console.log('Admin config seeded');
    }
  } catch (e) { console.log('Seed note:', e.message); }

  try {
    const userCheck = await fetch(`http://127.0.0.1:${PB_PORT}/api/collections/app_users/records?filter=(email='wayed11@gmail.com')`, { headers });
    const userData = await userCheck.json();
    if (!userData.items || userData.items.length === 0) {
      await fetch(`http://127.0.0.1:${PB_PORT}/api/collections/app_users/records`, {
        method: 'POST', headers,
        body: JSON.stringify({
          email: 'wayed11@gmail.com',
          password_hash: '$sha256$ba2ec515670c582c7721515f231848bc606e66ae68d27ebf405f6af63a0380da',
          display_name: 'AbilityAdmin',
          role: 'creator',
          wallet_balance: 0,
        }),
      });
      console.log('Super admin platform account seeded');
    }
  } catch (e) { console.log('User seed note:', e.message); }
}

function proxyToPB(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: PB_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${PB_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend unavailable' }));
  });

  req.pipe(proxyReq, { end: true });
}

function serveFrontend(req, res) {
  if (!FRONTEND_DIST) { res.writeHead(404); res.end('No frontend'); return; }
  let filePath = path.join(FRONTEND_DIST, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(FRONTEND_DIST, 'index.html');
  }
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.webp': 'image/webp',
  };
  const ct = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { 'Content-Type': ct });
  stream.pipe(res);
  stream.on('error', () => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(FRONTEND_DIST, 'index.html')).pipe(res);
  });
}

const DAILY_GEN_LIMIT = 3;

async function checkDailyLimit(userId) {
  if (!userId) return false;
  try {
    const today = new Date().toISOString().split('T')[0];
    const pbRes = await fetch(`http://127.0.0.1:${PB_PORT}/api/collections/video_gens/records?filter=(user_id='${userId}' %26%26 daily_date='${today}')&perPage=1`);
    const data = await pbRes.json();
    return (data.totalItems || 0) < DAILY_GEN_LIMIT;
  } catch { return true; }
}

function handleLumaGenerate(req, res) {
  const LUMA_KEY = process.env.LUMA_API_KEY;
  if (!LUMA_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Luma API key not configured' }));
    return;
  }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const userId = body.user_id;
      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication required' }));
        return;
      }
      const withinLimit = await checkDailyLimit(userId);
      if (!withinLimit) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Daily generation limit reached' }));
        return;
      }
      const lumaRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LUMA_KEY}` },
        body: JSON.stringify({
          prompt: body.prompt,
          model: body.model || 'ray-2',
          duration: body.duration || '5s',
          resolution: body.resolution || '720p',
        }),
      });
      const data = await lumaRes.json();
      res.writeHead(lumaRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message || 'Luma request failed' }));
    }
  });
}

function handleLumaPoll(req, res) {
  const LUMA_KEY = process.env.LUMA_API_KEY;
  if (!LUMA_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Luma API key not configured' }));
    return;
  }
  const genId = (req.url || '').split('/api/luma/status/')[1]?.split('?')[0];
  if (!genId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing generation ID' }));
    return;
  }
  (async () => {
    try {
      const lumaRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${genId}`, {
        headers: { 'Authorization': `Bearer ${LUMA_KEY}` },
      });
      const data = await lumaRes.json();
      res.writeHead(lumaRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message || 'Poll failed' }));
    }
  })();
}

function handleUpload(req, res) {
  const boundary = req.headers['content-type']?.split('boundary=')[1];
  if (!boundary) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'No boundary' })); return; }
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const bStr = '--' + boundary;
      let start = buffer.indexOf(bStr) + Buffer.byteLength(bStr);
      const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), start);
      const headerStr = buffer.slice(start, headerEnd).toString();
      const match = headerStr.match(/filename="(.+?)"/);
      const ext = path.extname(match ? match[1] : 'upload');
      const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
      const dataStart = headerEnd + 4;
      const endBound = buffer.indexOf(Buffer.from('\r\n' + bStr), dataStart);
      fs.writeFileSync(path.join(uploadsDir, filename), buffer.slice(dataStart, endBound));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ url: `/api/uploads/${filename}`, filename }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upload failed' }));
    }
  });
}

function serveUpload(req, res) {
  const filename = (req.url || '').replace('/api/uploads/', '').split('?')[0];
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const mimeTypes = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
    '.webm': 'video/webm', '.mov': 'video/quicktime',
  };
  res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

async function main() {
  console.log('Initializing Ability Stream...');
  ensureSuperuser();

  console.log('Starting PocketBase...');
  const pbProcess = await startPocketBase();
  await waitForPB();
  console.log('PocketBase healthy');

  await seedAdminConfig();

  const server = http.createServer((req, res) => {
    const reqUrl = req.url || '/';
    if (reqUrl === '/api/luma/generate' && req.method === 'POST') return handleLumaGenerate(req, res);
    if (reqUrl.startsWith('/api/luma/status/')) return handleLumaPoll(req, res);
    if (reqUrl === '/api/upload' && req.method === 'POST') return handleUpload(req, res);
    if (reqUrl.startsWith('/api/uploads/')) return serveUpload(req, res);
    if (reqUrl.startsWith('/api/') || reqUrl.startsWith('/_/')) return proxyToPB(req, res);
    serveFrontend(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    const options = {
      hostname: '127.0.0.1',
      port: PB_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${PB_PORT}` },
    };
    const proxyReq = http.request(options);
    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
        Object.entries(proxyRes.headers).map(([k,v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n');
      if (proxyHead && proxyHead.length) socket.write(proxyHead);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });
    proxyReq.on('error', () => socket.end());
    proxyReq.end();
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ability Stream live on port ${PORT}`);
    if (FRONTEND_DIST) console.log(`Frontend: ${FRONTEND_DIST}`);
  });

  process.on('SIGTERM', () => { pbProcess.kill(); server.close(); process.exit(0); });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
