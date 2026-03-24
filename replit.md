# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Backend**: PocketBase v0.25.9 (single Go binary — SQLite database, auth, real-time, file storage)
- **Frontend**: React + Vite + Tailwind CSS
- **Proxy**: Node.js native HTTP proxy wrapping PocketBase + static frontend serving (zero external deps)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── ability-stream/     # Neon social media streaming platform (React+Vite)
│   └── api-server/         # Legacy Express API (no longer used in deployment)
├── pocketbase/             # PocketBase backend
│   ├── pocketbase          # PocketBase binary (Linux amd64)
│   ├── start.js            # Node.js wrapper: starts PB, proxies API, serves frontend
│   ├── pb_migrations/      # Auto-applied collection migrations
│   └── pb_data/            # PocketBase data directory (SQLite)
├── lib/                    # Shared libraries
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
└── package.json            # Root package
```

## Architecture

### PocketBase Backend

PocketBase runs as an internal service on port 8090. A Node.js wrapper (`pocketbase/start.js`) runs on the public PORT and:
1. Starts PocketBase binary
2. Proxies `/api/*` and `/_/*` to PocketBase
3. Proxies Luma AI API at `/api/luma/generate` (POST) and `/api/luma/status/:id` (GET) — keeps API key server-side
4. Handles file uploads at `/api/upload` (saved to `uploads/` directory)
5. Serves uploaded files at `/api/uploads/*`
6. Serves the built frontend for all other routes (SPA fallback)

### PocketBase Collections (SQLite)

- `app_users` — email, password_hash, display_name, role (creator/supporter/admin), wallet_balance, payout_email
- `posts` — user_id, content, media_url, media_file, type (post/reel/story/show/video/photo), views, likes, author, title, filter_class, thumbnail, episodes, description, categories, avatar
- `likes` — post_id, user_id
- `tips` — creator_id, supporter_id, amount, status
- `earnings` — user_id, type (like/view/tip), amount, creator_share, platform_share
- `admin_config` — config_key, monetization, ad_slots, featured_show_ids, categories
- `live_saves` — user_id, room_name, display_name, duration_seconds, participant_count, captions_used, notes
- `video_gens` — user_id, prompt, luma_gen_id, status (pending/processing/completed/failed), video_url, thumbnail_url, model, duration, resolution, captions_on, error_msg, daily_date

### Frontend API Layer

- `src/api.ts` — PocketBase JS SDK client; handles signup/login (SHA-256 password hashing), CRUD for posts/likes/tips/earnings, admin config, wallet data
- `src/socket.ts` — PocketBase real-time subscriptions (replaces Socket.io); subscribes to posts, app_users, tips collections for live updates

### Deployment

- **Target**: VM (always-on) for persistent PocketBase process
- **Build**: `pnpm --filter @workspace/ability-stream run build`
- **Run**: `node pocketbase/start.js`
- **Data persistence**: PocketBase stores everything in `pocketbase/pb_data/data.db` (SQLite)

## Ability Stream Platform

Neon/cyberpunk social media streaming platform for disabled creators.

### Features
- Two-role system: Creator (upload, monetize, earn) and Guest Supporter (watch, like, tip)
- Auth: email/password with SHA-256 hashing, guest mode
- Video feed with snap-scroll, ambilight, cinematic filters
- Stories, Reels, Shows tabs
- Upload studio with filter selection, spray paint thumbnails
- Wallet with earnings tracking, 70/30 revenue split
- Tips system ($1/$3/$5/$10)
- Ad placement system (AdSense, AdMob, Ad Manager, direct sponsors)
- Admin Portal (super admin: wayed11@gmail.com only)
- Accessibility center: reduce motion, high contrast, dyslexic-friendly font
- Ability Live: real-time video/audio streaming via Jitsi Meet (open-source), auto-captions, cyberpunk UI, Live Chat Saves to profile
- Ability Video Generator: AI video creation via Luma Ray-2 API, text/voice prompt input, async polling with progress spinner, video player with captions overlay, TTS moral voiceover, daily limit (3 gens/user), generation history

### Platform Login
- Super admin: wayed11@gmail.com / AbilityStream2024!
- New accounts can be created via Sign Up on the login screen
- Guest supporters can join without an account (name only)

### Key Files
- `artifacts/ability-stream/src/App.tsx` — main app
- `artifacts/ability-stream/src/AbilityLive.tsx` — Jitsi Meet live streaming component
- `artifacts/ability-stream/src/AbilityVideoGen.tsx` — AI video generator (Luma Ray-2)
- `artifacts/ability-stream/src/AdminPortal.tsx` — admin portal
- `artifacts/ability-stream/src/api.ts` — PocketBase SDK API client
- `artifacts/ability-stream/src/socket.ts` — PocketBase real-time subscriptions

### PocketBase Admin Dashboard
- URL: `/_/` on the deployed app
- Superuser: admin@abilitystream.app
