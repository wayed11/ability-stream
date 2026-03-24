import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
const basePath = process.env.BASE_PATH || "/";

function lumaProxyPlugin(): Plugin {
  return {
    name: 'luma-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/luma/generate' && req.method === 'POST') {
          const LUMA_KEY = process.env.LUMA_API_KEY;
          if (!LUMA_KEY) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Luma API key not configured' }));
            return;
          }
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              if (!body.user_id) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Authentication required' }));
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
            } catch (e: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message || 'Luma request failed' }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/luma/status/')) {
          const LUMA_KEY = process.env.LUMA_API_KEY;
          if (!LUMA_KEY) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Luma API key not configured' }));
            return;
          }
          const genId = req.url.split('/api/luma/status/')[1]?.split('?')[0];
          if (!genId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing generation ID' }));
            return;
          }
          try {
            const lumaRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${genId}`, {
              headers: { 'Authorization': `Bearer ${LUMA_KEY}` },
            });
            const data = await lumaRes.json();
            res.writeHead(lumaRes.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message || 'Poll failed' }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    lumaProxyPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        ws: true,
      },
      '/_': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
