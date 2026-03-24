const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 60, bottom: 60, left: 55, right: 55 },
  info: {
    Title: 'Ability Stream - Platform Documentation',
    Author: 'Ability Stream',
    Subject: 'Technical & Business Documentation',
  }
});

const output = fs.createWriteStream('/home/runner/workspace/Ability_Stream_Platform_Document.pdf');
doc.pipe(output);

const NEON_GREEN = '#39ff14';
const HOT_PINK = '#ff1493';
const DARK_BG = '#111111';
const WHITE = '#ffffff';
const GRAY = '#999999';
const LIGHT_GRAY = '#cccccc';
const CYAN = '#00ffff';

function drawHeader(doc) {
  doc.rect(0, 0, doc.page.width, 100).fill('#0a0a0a');
  doc.rect(0, 97, doc.page.width, 3).fill(HOT_PINK);
  doc.fontSize(28).font('Helvetica-Bold').fillColor(HOT_PINK).text('ABILITY STREAM', 55, 30, { align: 'left' });
  doc.fontSize(10).font('Helvetica').fillColor(LIGHT_GRAY).text('Platform Documentation  |  March 2026  |  Confidential', 55, 65, { align: 'left' });
}

function sectionTitle(doc, text, number) {
  doc.moveDown(1.2);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(HOT_PINK).text(`SECTION ${number}`, { continued: false });
  doc.fontSize(18).font('Helvetica-Bold').fillColor(WHITE).text(text);
  doc.moveTo(doc.x, doc.y + 4).lineTo(doc.x + 200, doc.y + 4).strokeColor(HOT_PINK).lineWidth(2).stroke();
  doc.moveDown(0.6);
}

function subSection(doc, text) {
  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(CYAN).text(text);
  doc.moveDown(0.3);
}

function bodyText(doc, text) {
  doc.fontSize(10).font('Helvetica').fillColor(LIGHT_GRAY).text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bulletPoint(doc, text) {
  const x = doc.x;
  doc.fontSize(10).font('Helvetica').fillColor(NEON_GREEN).text('  \u2022  ', { continued: true });
  doc.fillColor(LIGHT_GRAY).text(text, { lineGap: 2 });
}

function keyValue(doc, key, value) {
  doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE).text(`${key}: `, { continued: true });
  doc.font('Helvetica').fillColor(LIGHT_GRAY).text(value);
}

function tableRow(doc, col1, col2, isHeader) {
  const y = doc.y;
  if (isHeader) {
    doc.rect(55, y - 2, 500, 20).fill('#1a1a1a');
    doc.fontSize(9).font('Helvetica-Bold').fillColor(HOT_PINK);
  } else {
    doc.fontSize(9).font('Helvetica').fillColor(LIGHT_GRAY);
  }
  doc.text(col1, 60, y, { width: 200, continued: false });
  doc.text(col2, 260, y, { width: 290 });
  doc.moveDown(0.2);
}

// Page background
function drawPageBg(doc) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0d0d0d');
}

// Event for new pages
doc.on('pageAdded', () => {
  drawPageBg(doc);
  doc.y = 60;
});

// === PAGE 1: COVER PAGE ===
drawPageBg(doc);
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#050505');
doc.rect(0, doc.page.height/2 - 120, doc.page.width, 240).fill('#0a0a0a');
doc.rect(0, doc.page.height/2 - 120, doc.page.width, 3).fill(HOT_PINK);
doc.rect(0, doc.page.height/2 + 120, doc.page.width, 3).fill(NEON_GREEN);

doc.fontSize(48).font('Helvetica-Bold').fillColor(HOT_PINK).text('ABILITY', 0, doc.page.height/2 - 90, { align: 'center' });
doc.fontSize(48).font('Helvetica-Bold').fillColor(NEON_GREEN).text('STREAM', { align: 'center' });

doc.fontSize(14).font('Helvetica').fillColor(LIGHT_GRAY).text('Neon/Cyberpunk Social Media Streaming Platform', 0, doc.page.height/2 + 40, { align: 'center' });
doc.fontSize(11).fillColor(GRAY).text('Complete Platform Documentation', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(10).fillColor(GRAY).text('Version 2.0  |  March 2026  |  Deployed & Live', { align: 'center' });
doc.moveDown(3);
doc.fontSize(9).fillColor('#666').text('This document is confidential and proprietary.', { align: 'center' });
doc.text('For authorized personnel only.', { align: 'center' });

// === PAGE 2: EXECUTIVE SUMMARY ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Executive Summary', '01');
bodyText(doc, 'Ability Stream is a fully deployed, production-ready social media streaming platform built with a neon/cyberpunk aesthetic. The platform serves two user roles: Creators who upload and monetize content, and Guest Supporters who watch, like, and tip creators.');
doc.moveDown(0.3);
bodyText(doc, 'The platform is designed mobile-first with full accessibility support, making it usable for people of all abilities. It runs entirely on Replit infrastructure with no external dependencies on Firebase, Supabase, or Google authentication.');

subSection(doc, 'Key Highlights');
bulletPoint(doc, 'Fully deployed as an always-on VM on Replit (WebSocket support)');
bulletPoint(doc, 'PostgreSQL database with real-time Socket.io updates');
bulletPoint(doc, 'Creator monetization with 70/30 revenue split');
bulletPoint(doc, 'Mobile-first Admin Portal with full ad management control');
bulletPoint(doc, 'Google AdSense, AdMob, Ad Manager integration ready');
bulletPoint(doc, 'Direct sponsor campaign management');
bulletPoint(doc, 'Content moderation tools built in');
bulletPoint(doc, 'Email/password auth with bcrypt encryption');
bulletPoint(doc, 'Tipping system with real-time wallet updates');
bulletPoint(doc, 'Shows, Reels, Stories, and Feed content types');

subSection(doc, 'Deployment Status');
keyValue(doc, 'Status', 'LIVE - Always-On VM Deployment');
keyValue(doc, 'Frontend', 'React + Vite (optimized production build, 356KB)');
keyValue(doc, 'Backend', 'Express.js + Socket.io (1.4MB compiled)');
keyValue(doc, 'Database', 'Replit PostgreSQL (production, persistent)');
keyValue(doc, 'Auth', 'Email/Password with bcrypt hashing (no Google auth)');
keyValue(doc, 'Real-time', 'Socket.io with WebSocket transport');

// === PAGE 3: ARCHITECTURE ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Technical Architecture', '02');

subSection(doc, 'System Overview');
bodyText(doc, 'The platform follows a monorepo architecture managed by pnpm workspaces. The frontend and backend are separate packages that communicate via REST API and WebSocket connections.');

subSection(doc, 'Frontend Stack');
bulletPoint(doc, 'React 19 with TypeScript');
bulletPoint(doc, 'Vite 7 build tool with optimized production bundling');
bulletPoint(doc, 'Tailwind CSS for neon/cyberpunk styling');
bulletPoint(doc, 'Lucide React icons throughout the UI');
bulletPoint(doc, 'Socket.io-client for real-time updates');
bulletPoint(doc, 'SPA with client-side routing');

subSection(doc, 'Backend Stack');
bulletPoint(doc, 'Node.js with Express.js');
bulletPoint(doc, 'Socket.io for real-time WebSocket communication');
bulletPoint(doc, 'PostgreSQL via pg driver (Replit managed)');
bulletPoint(doc, 'bcrypt for password hashing');
bulletPoint(doc, 'Multer for file upload handling');
bulletPoint(doc, 'Production: serves frontend static files');

subSection(doc, 'Database Schema');
bodyText(doc, 'All data is stored in Replit PostgreSQL with the following tables:');
doc.moveDown(0.2);
keyValue(doc, 'users', 'id (UUID), email, password_hash, display_name, role, wallet_balance, created_at');
keyValue(doc, 'posts', 'id (UUID), user_id, content, media_url, type (post/reel/story/show), author, title, thumbnail, episodes (JSON), categories (JSON), filter_class, likes, views, created_at');
keyValue(doc, 'likes', 'id (UUID), user_id, post_id, created_at');
keyValue(doc, 'tips', 'id (UUID), tipper_id, creator_id, amount, created_at');
keyValue(doc, 'earnings', 'id (UUID), user_id, amount, type, post_id, created_at');
keyValue(doc, 'admin_config', 'id, monetization (JSON), ad_slots (JSON), categories (JSON), featured_show_ids (JSON), updated_at');

subSection(doc, 'Real-Time Events (Socket.io)');
bulletPoint(doc, 'like_update - broadcasts new like count to all connected users');
bulletPoint(doc, 'view_update - broadcasts view count updates');
bulletPoint(doc, 'wallet_update - sends wallet balance changes to specific user');
bulletPoint(doc, 'new_post - broadcasts new content to all users');
bulletPoint(doc, 'tip_received - notifies creator when they receive a tip');

// === PAGE 4: USER ROLES & AUTH ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'User Roles & Authentication', '03');

subSection(doc, 'Authentication System');
bodyText(doc, 'The platform uses a custom email/password authentication system. Passwords are hashed with bcrypt (10 salt rounds) before storage. No external auth providers (Google, Facebook, etc.) are used. User sessions are maintained via localStorage on the client side.');

subSection(doc, 'Creator Role');
bodyText(doc, 'Creators sign up with email and password. They have full access to:');
bulletPoint(doc, 'Upload posts, reels, stories, and shows');
bulletPoint(doc, 'Neon Canvas spray-paint thumbnail creator');
bulletPoint(doc, '7 cinematic filters: Normal, Cyber Pink, Neon Mint, Golden Hour, Vaporwave, Cinematic Noir, Glitch Mode');
bulletPoint(doc, 'Wallet with real earnings from views, likes, and tips');
bulletPoint(doc, 'Three payout tiers: $10 (starter), $50 (standard), $100 (priority)');
bulletPoint(doc, 'Profile with stats, content management');
bulletPoint(doc, 'PayPal and Venmo payout options');
bulletPoint(doc, 'Milestone badges at earnings thresholds');

subSection(doc, 'Guest Supporter Role');
bodyText(doc, 'Guest supporters join with just a username (no email required). They can:');
bulletPoint(doc, 'Watch all content (posts, reels, stories, shows)');
bulletPoint(doc, 'Like content (generates creator earnings)');
bulletPoint(doc, 'Tip creators directly');
bulletPoint(doc, 'View their profile and browse content');
bulletPoint(doc, 'Cannot upload content or access the wallet');

subSection(doc, 'Super Admin');
bodyText(doc, 'The super admin account (wayed11@gmail.com) has access to the Admin Portal via a shield icon in the top-right corner. Only this specific email can see or access the admin controls.');

// === PAGE 5: ADMIN PORTAL ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Admin Portal - Mobile-First Control Center', '04');

bodyText(doc, 'The Admin Portal gives you complete Tubi-developer-level control over every aspect of the platform, designed to be used entirely from your phone. Every button and input has a minimum 48px touch target for accessibility.');

subSection(doc, 'Monetization Controls');
bulletPoint(doc, 'Revenue split slider: Set creator vs platform percentage (default 70/30)');
bulletPoint(doc, 'Payout thresholds: Configure Tier 1 ($10), Tier 2 ($50), Tier 3 ($100)');
bulletPoint(doc, 'Earning rates: Per View ($0.001), Per Like ($0.05), Story View ($0.07), Show View ($0.15), Ad Boost ($0.10)');
bulletPoint(doc, 'All changes save to the database and apply instantly to all users');

subSection(doc, 'Ad Placement Management');
bodyText(doc, 'Full drag-and-drop ad management with four Google ad network integrations:');
doc.moveDown(0.2);
keyValue(doc, 'Google AdSense', 'Web display ads - banners, native in-feed ads');
keyValue(doc, 'Google AdMob', 'Mobile app ads - native, interstitial, rewarded');
keyValue(doc, 'Google Ad Manager', 'Premium ad serving - video pre-rolls, programmatic');
keyValue(doc, 'Direct Sponsors', 'Custom sponsor campaigns with brand name, creative image, click URL, and budget');

doc.moveDown(0.3);
bodyText(doc, 'Quick-Add buttons let you create ad slots instantly:');
bulletPoint(doc, 'AdSense Banner - one tap to add a web banner ad');
bulletPoint(doc, 'AdMob Native - one tap to add a mobile native ad');
bulletPoint(doc, 'Ad Manager Pre-Roll - one tap to add a video pre-roll');
bulletPoint(doc, 'Direct Sponsor - one tap to add a sponsor card');

doc.moveDown(0.3);
bodyText(doc, 'Each ad slot can be placed in: Feed, Reels, Shows, Stories, Wallet, or Profile sections. You can enable/disable each slot with a toggle, reorder with up/down arrows, duplicate slots, and delete with a confirmation step.');

subSection(doc, 'Content Moderation');
bulletPoint(doc, 'View all user-created posts with author, title, and type');
bulletPoint(doc, 'View all user-created shows with series titles');
bulletPoint(doc, 'Remove any content with one tap (44px delete buttons)');
bulletPoint(doc, 'Content lists auto-scroll for large amounts of content');

subSection(doc, 'Categories & Filters');
bulletPoint(doc, 'Add/remove content categories (default: Trending, Neon Originals, Audio Described)');
bulletPoint(doc, 'Inline category input - no browser popups');
bulletPoint(doc, 'Categories apply to the Shows upload flow');

// === PAGE 6: CONTENT TYPES ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Content Types & Features', '05');

subSection(doc, 'Feed Posts');
bodyText(doc, 'Standard social media posts with images or videos. Features ambilight background effects, neon glow-pulse animations, double-tap heart likes, and cinematic filter overlays. Posts appear in the main stream tab.');

subSection(doc, 'Reels');
bodyText(doc, 'Short-form vertical videos in a dedicated Reels tab. Full-screen snap-scroll experience with like, tip, and share actions. Auto-play with haptic feedback on interactions.');

subSection(doc, 'Stories');
bodyText(doc, 'Ephemeral content displayed in a horizontal carousel at the top of the feed. Stories support image and video content with auto-advance and tap-to-navigate. Creators can add stories from the upload flow.');

subSection(doc, 'Shows');
bodyText(doc, 'Long-form episodic content inspired by Netflix and Tubi. Features include:');
bulletPoint(doc, 'Series/playlist organization with episode lists');
bulletPoint(doc, 'Netflix-style 3D card layout with category filtering');
bulletPoint(doc, 'Video pre-roll ad slot support (Ad Manager integration)');
bulletPoint(doc, 'Spray-paint thumbnail studio with canvas drawing tools');
bulletPoint(doc, 'Category assignment: Trending, Neon Originals, Audio Described');
bulletPoint(doc, 'Full-screen player with series info, view count, and tip button');

subSection(doc, 'Upload Flow');
bodyText(doc, 'Creators access the upload studio from the + button in the bottom nav. The flow includes:');
bulletPoint(doc, 'Destination selection: Stream, Reel, or Story');
bulletPoint(doc, 'File picker with camera roll access');
bulletPoint(doc, 'Live preview with applied cinematic filter');
bulletPoint(doc, '7 Cinematic Filters: Normal, Cyber Pink, Neon Mint, Golden Hour, Vaporwave, Cinematic Noir, Glitch Mode');
bulletPoint(doc, 'Caption/title input');
bulletPoint(doc, '"PAINT IT VIRAL" publish button with haptic feedback');

subSection(doc, 'Tipping System');
bodyText(doc, 'Guest supporters and other creators can send tips to creators. Tips are processed through the backend and update the creator\'s wallet balance in real-time via Socket.io. The tip button appears on posts, reels, and shows.');

// === PAGE 7: MONETIZATION ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Monetization & Revenue Model', '06');

subSection(doc, 'Revenue Split');
bodyText(doc, 'All creator earnings are split between the creator and the platform. The default is 70% to the creator and 30% to the platform, configurable from the Admin Portal.');

subSection(doc, 'Earning Sources');
doc.moveDown(0.2);
keyValue(doc, 'Views', '$0.001 per view (configurable)');
keyValue(doc, 'Likes', '$0.05 per like (configurable) - triggers real-time wallet update');
keyValue(doc, 'Story Views', '$0.07 per story view (configurable)');
keyValue(doc, 'Show Views', '$0.15 per show episode view (configurable)');
keyValue(doc, 'Ad Boost', '$0.10 bonus when ads are served on content (configurable)');
keyValue(doc, 'Tips', 'Direct creator-to-creator or supporter-to-creator tips');

subSection(doc, 'Payout System');
bodyText(doc, 'Creators can request payouts when their wallet balance reaches the minimum threshold:');
bulletPoint(doc, 'Tier 1 ($10): Starter payout - basic processing');
bulletPoint(doc, 'Tier 2 ($50): Standard payout - regular processing');
bulletPoint(doc, 'Tier 3 ($100): Priority payout - fastest processing');
bulletPoint(doc, 'Payout methods: PayPal or Venmo');
bulletPoint(doc, 'Milestone badges awarded at earnings thresholds');

subSection(doc, 'Database Triggers');
bodyText(doc, 'The earnings system uses PostgreSQL triggers to automatically calculate and credit earnings when likes and views occur. The 70/30 split is applied at the database level, ensuring accurate calculations regardless of API layer changes.');

subSection(doc, 'Ad Revenue');
bodyText(doc, 'When Google ad unit IDs are configured in the Admin Portal, ad revenue flows into the platform. The platform takes its configured percentage, and creators earn the Ad Boost rate for content that serves ads. All ad networks (AdSense, AdMob, Ad Manager) can run simultaneously.');

// === PAGE 8: DEPLOYMENT ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Deployment & Infrastructure', '07');

subSection(doc, 'Deployment Configuration');
keyValue(doc, 'Target', 'Always-On VM (required for WebSocket/Socket.io support)');
keyValue(doc, 'Build Command', 'pnpm --filter @workspace/ability-stream run build && pnpm --filter @workspace/api-server run build');
keyValue(doc, 'Run Command', 'node artifacts/api-server/dist/index.cjs');
keyValue(doc, 'Port', '8080 (production) / PORT env variable');

subSection(doc, 'Production Architecture');
bodyText(doc, 'In production, the Express server serves both the API and the frontend:');
bulletPoint(doc, 'API routes: /api/ability-stream/*, /api/auth/*, /api/upload/*');
bulletPoint(doc, 'Socket.io path: /api/socket.io');
bulletPoint(doc, 'Static files: Served from artifacts/ability-stream/dist/public/');
bulletPoint(doc, 'SPA fallback: All non-API routes serve index.html');

subSection(doc, 'File Storage');
bodyText(doc, 'Uploaded files (images, videos, thumbnails) are stored on the local filesystem in the uploads/ directory. The API serves these files at /uploads/* paths. In production, file paths are resolved relative to the process working directory.');

subSection(doc, 'Environment Variables');
doc.moveDown(0.2);
keyValue(doc, 'DATABASE_URL', 'PostgreSQL connection string (auto-provided by Replit)');
keyValue(doc, 'PORT', 'Server port (default: 8080)');
keyValue(doc, 'NODE_ENV', 'Set to "production" for deployed builds');

subSection(doc, 'Health Check');
bodyText(doc, 'The API exposes a /api/health endpoint that returns server status for Replit\'s deployment health monitoring system.');

// === PAGE 9: API REFERENCE ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'API Reference', '08');

subSection(doc, 'Authentication Endpoints');
doc.moveDown(0.2);
keyValue(doc, 'POST /api/auth/signup', 'Create new account. Body: {email, password, role}. Returns: {user}');
keyValue(doc, 'POST /api/auth/login', 'Sign in. Body: {email, password}. Returns: {user}');
keyValue(doc, 'POST /api/auth/guest', 'Guest login. Body: {username}. Returns: {user}');

subSection(doc, 'Content Endpoints');
keyValue(doc, 'GET /api/ability-stream/posts', 'Fetch all posts/reels/stories/shows');
keyValue(doc, 'POST /api/ability-stream/posts', 'Create new content. Body: {user_id, content, media_url, type, author, title, ...}');
keyValue(doc, 'POST /api/ability-stream/posts/:id/like', 'Like a post. Triggers earnings calculation');
keyValue(doc, 'POST /api/ability-stream/posts/:id/view', 'Record a view');
keyValue(doc, 'DELETE /api/ability-stream/posts/:id', 'Delete content (admin moderation)');

subSection(doc, 'Wallet & Tips Endpoints');
keyValue(doc, 'GET /api/ability-stream/wallet/:userId', 'Get wallet balance and earnings');
keyValue(doc, 'POST /api/ability-stream/tip', 'Send tip. Body: {tipperId, creatorId, amount}');

subSection(doc, 'Admin Endpoints');
keyValue(doc, 'GET /api/ability-stream/admin/config', 'Fetch platform configuration');
keyValue(doc, 'POST /api/ability-stream/admin/config', 'Save platform configuration (monetization, ad slots, categories)');

subSection(doc, 'Upload Endpoint');
keyValue(doc, 'POST /api/upload', 'Upload file (multipart/form-data). Returns: {url}');

// === PAGE 10: ACCESSIBILITY & UX ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Accessibility & Mobile-First Design', '09');

subSection(doc, 'Mobile-First Principles');
bodyText(doc, 'The entire platform is designed to be used primarily on mobile devices. This includes:');
bulletPoint(doc, 'All interactive elements have minimum 48px touch targets');
bulletPoint(doc, 'Bottom navigation with large, labeled icons');
bulletPoint(doc, 'Floating action buttons for primary actions');
bulletPoint(doc, 'Full-screen overlays for upload flows and players');
bulletPoint(doc, 'Safe area padding for notched devices');
bulletPoint(doc, 'Smooth scroll with overscroll containment');

subSection(doc, 'Accessibility Features');
bulletPoint(doc, 'High Contrast mode toggle in profile settings');
bulletPoint(doc, 'Reduce Motion toggle for animation sensitivity');
bulletPoint(doc, 'Dyslexic-friendly font option');
bulletPoint(doc, 'Large text sizes throughout the interface');
bulletPoint(doc, 'Color-coded visual indicators with text labels');
bulletPoint(doc, 'Haptic feedback on interactions (via Vibration API)');

subSection(doc, 'Admin Portal Accessibility');
bodyText(doc, 'The Admin Portal has been specifically designed for accessibility:');
bulletPoint(doc, 'Every button and input is minimum 48px height');
bulletPoint(doc, 'Inline category input (no browser prompt() dialogs)');
bulletPoint(doc, 'Confirm-before-delete on all destructive actions');
bulletPoint(doc, 'Quick-add buttons for common ad configurations');
bulletPoint(doc, 'Floating "Save All Changes" button always visible at bottom');
bulletPoint(doc, 'Clear section cards with icon badges and counts');
bulletPoint(doc, 'Network selection cards instead of small dropdowns');
bulletPoint(doc, 'Sponsor image preview before saving');
bulletPoint(doc, 'Duplicate slot functionality to avoid recreating similar configs');

// === PAGE 11: GETTING STARTED ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Getting Started Guide', '10');

subSection(doc, 'For the Platform Owner (Admin)');
bodyText(doc, 'Step-by-step guide to configure and launch your platform:');
doc.moveDown(0.2);
bulletPoint(doc, '1. Sign in with your admin email (wayed11@gmail.com) and password');
bulletPoint(doc, '2. Tap the shield icon in the top-right corner to open Admin Portal');
bulletPoint(doc, '3. Configure your revenue split in the Monetization section');
bulletPoint(doc, '4. Set up ad placements using Quick-Add buttons');
bulletPoint(doc, '5. Paste your Google Ad Unit IDs from your Google Ads dashboard');
bulletPoint(doc, '6. Tap "Save All Changes" at the bottom');
bulletPoint(doc, '7. Add content categories for Shows organization');
bulletPoint(doc, '8. Monitor content in the Content Moderation section');

subSection(doc, 'Setting Up Google Ads');
bodyText(doc, 'To connect Google ads to your platform:');
bulletPoint(doc, '1. Sign up for Google AdSense at adsense.google.com');
bulletPoint(doc, '2. Sign up for Google AdMob at admob.google.com (for mobile)');
bulletPoint(doc, '3. Sign up for Google Ad Manager at admanager.google.com (for video pre-rolls)');
bulletPoint(doc, '4. Create ad units in each platform');
bulletPoint(doc, '5. Copy the ad unit IDs (format: ca-pub-xxx/1234567)');
bulletPoint(doc, '6. Open Admin Portal > Ad Placements');
bulletPoint(doc, '7. Edit each ad slot and paste the corresponding ad unit ID');
bulletPoint(doc, '8. Toggle the slot to "enabled"');
bulletPoint(doc, '9. Save All Changes');

subSection(doc, 'For New Users');
bodyText(doc, 'Users can join the platform in two ways:');
bulletPoint(doc, 'Creator: Sign up with email + password to upload and monetize content');
bulletPoint(doc, 'Guest Supporter: Enter a username and tap "SUPPORT A CREATOR" to watch and interact');
bodyText(doc, 'All user data (accounts, content, likes, tips, earnings) is saved to the PostgreSQL database and persists across sessions. Users can sign out and sign back in and all their data will be there, just like any major platform.');

// === PAGE 12: SECURITY ===
doc.addPage();
drawHeader(doc);
doc.y = 120;

sectionTitle(doc, 'Security & Data Protection', '11');

subSection(doc, 'Password Security');
bulletPoint(doc, 'All passwords hashed with bcrypt (10 salt rounds)');
bulletPoint(doc, 'Raw passwords are never stored or logged');
bulletPoint(doc, 'Password validation on both client and server side');

subSection(doc, 'Data Storage');
bulletPoint(doc, 'All data stored in Replit-managed PostgreSQL (encrypted at rest)');
bulletPoint(doc, 'Database connection uses environment variables (never hardcoded)');
bulletPoint(doc, 'User sessions stored in localStorage (client-side only)');
bulletPoint(doc, 'File uploads stored on server filesystem');

subSection(doc, 'Admin Access');
bulletPoint(doc, 'Admin Portal restricted to specific email address');
bulletPoint(doc, 'Admin check happens on both frontend and backend');
bulletPoint(doc, 'No public admin routes - configuration endpoints require admin context');

subSection(doc, 'Platform Independence');
bodyText(doc, 'Ability Stream has ZERO external service dependencies:');
bulletPoint(doc, 'No Firebase - all auth and data is self-hosted');
bulletPoint(doc, 'No Supabase - using Replit PostgreSQL directly');
bulletPoint(doc, 'No Google Auth - custom email/password system');
bulletPoint(doc, 'No third-party auth tokens to expire or manage');
bulletPoint(doc, 'Complete ownership and control of all user data');

// === FINAL PAGE ===
doc.addPage();
drawPageBg(doc);
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#050505');
doc.rect(0, doc.page.height/2 - 80, doc.page.width, 160).fill('#0a0a0a');
doc.rect(0, doc.page.height/2 - 80, doc.page.width, 2).fill(HOT_PINK);
doc.rect(0, doc.page.height/2 + 80, doc.page.width, 2).fill(NEON_GREEN);

doc.fontSize(32).font('Helvetica-Bold').fillColor(HOT_PINK).text('ABILITY STREAM', 0, doc.page.height/2 - 55, { align: 'center' });
doc.fontSize(14).font('Helvetica').fillColor(LIGHT_GRAY).text('Deployed & Live', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(11).fillColor(GRAY).text('All Systems Operational', { align: 'center' });
doc.moveDown(2);
doc.fontSize(9).fillColor('#555').text('Ability Stream Platform Documentation v2.0', { align: 'center' });
doc.text('March 2026 | Confidential', { align: 'center' });
doc.moveDown(0.5);
doc.text('Creative Expression Starts Here.', { align: 'center' });

doc.end();

output.on('finish', () => {
  console.log('PDF generated successfully: Ability_Stream_Platform_Document.pdf');
});
