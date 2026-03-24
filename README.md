# Ability Stream

**Creative expression platform for disabled creators with realtime live, AI video gen, and accessibility-first tools.**

Live. Create. Express.

## Features

- Two-role system: Creator (upload, monetize, earn) and Guest Supporter (watch, like, tip)
- Video feed with snap-scroll, ambilight, cinematic filters
- Stories, Reels, Shows tabs
- Upload studio with filter selection and spray paint thumbnails
- Wallet with earnings tracking (70/30 revenue split)
- Tips system ($1/$3/$5/$10)
- Ability Live: real-time video/audio streaming via Jitsi Meet with auto-captions
- AI Video Generator: powered by Luma Ray-2 API with voice input, progress tracking, and TTS voiceover
- Admin Portal for platform management
- Accessibility center: reduce motion, high contrast, dyslexic-friendly font
- PWA: installable on mobile home screens

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: PocketBase v0.25.9 (Go binary + SQLite)
- **AI Video**: Luma Labs Ray-2 API
- **Live Streaming**: Jitsi Meet (open-source)
- **Monorepo**: pnpm workspaces

## Getting Started

```bash
# Install dependencies
pnpm install

# Download PocketBase binary
bash pocketbase/setup.sh

# Start development
pnpm --filter @workspace/ability-stream run dev
```

## Deployment

### Replit (Current)
The app is deployed as a VM on Replit with PocketBase running alongside the frontend.

### Vercel (Frontend Only)
To deploy the frontend on Vercel:

1. Import this repo in [Vercel](https://vercel.com)
2. Vercel will auto-detect the settings from `vercel.json`
3. Set your environment variables in Vercel's dashboard:
   - `LUMA_API_KEY` — your Luma Labs API key
4. Note: PocketBase backend still needs to run on Replit (or another always-on server). Update the PocketBase URL in `src/api.ts` to point to your Replit deployment.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LUMA_API_KEY` | Luma Labs API key for AI video generation |

## License

All rights reserved.
