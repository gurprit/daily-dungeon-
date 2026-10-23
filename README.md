# 🐉 The Daily Dungeon

**One dungeon. Three rooms. Endless ways to survive.**

A mobile-first, bite-sized fantasy game where the whole world receives the same dungeon each UTC day. Write your own actions, roll the dice and improvise your way through a theatrical Dungeon Master with a questionable sense of humour.

> **Current status:** AI-enabled prototype on `feat/ai-dungeon-master`, not a full public launch.

## What's playable

- Three original three-room dungeons, rotating by UTC date from 23 October 2026 (sample content repeats after three days).
- Free-text actions. Use your inventory, bargain, make up an outrageous plan.
- Three hearts, D20 rolls, room difficulties and inventory rewards.
- An optional **Cloudflare Workers AI** judge that awards 0–5 creativity points and improvises alternate outcomes.
- The rules engine, not the LLM, owns the dice, hearts, difficulty, items and win/loss.
- Scripted narration fallback if AI is switched off or returns malformed output.
- A persistent adventure journal, **personalised achievements for ingenious successful solutions**, and spoiler-free result sharing.
- Optional personal 16-bit room artwork and a three-panel illustrated end-of-run gallery.
- Auto-scroll to the top after each resolved turn.
- A decorative end-of-dungeon certificate showing earned honours. Save or share a **1080 × 1350 PNG** generated locally in the browser (no extra API cost).
- Existing saved adventures can retroactively receive a scripted award based on what the hero did (e.g. Lord of the Dance).
- **Always-on handcrafted 16-bit homepage artwork:** themed preview scene for each of the three daily dungeons, with pixel hero/goblin/wizard/onion sprites and a retro HUD. No AI requests, secrets, R2 or image budget needed for these visuals.
- Retro pixel-art scene previews in encounters, even before an action is submitted.
- Responsive interface, local per-day progress, engine tests and GitHub Actions CI.

**Not built yet:** player accounts, D1-backed player-run persistence, global leaderboards, verified one-attempt-per-day enforcement, streaks, generated puzzles or full production abuse protection. Only the global AI-call counter is stored in D1. The three sample dungeons repeat while we test the loop.

## Getting started

Requirements: Node.js 22+ and npm.

~~~bash
git clone https://github.com/gurprit/daily-dungeon-.git
cd daily-dungeon-
git checkout feat/ai-dungeon-master
npm install
npm run dev
~~~

Open the localhost URL Vite prints. This mode runs a **scripted, local prototype** with no API key or Cloudflare account needed. The display will identify scripted narration; it does not pretend to be live AI.

For a Cloudflare Worker running both the API and frontend:

~~~bash
npx wrangler login
npm run dev:worker
~~~

Cloudflare Workers local emulation may not work on macOS 12.6: you can still use plain Vite mode above, or use a supported operating system for Wrangler.

## Enable the real AI Dungeon Master (code-free play)

**The Cloudflare D1 database is already bound in `wrangler.jsonc`, and AI_ENABLED is `"true"`.** Players can submit actions immediately without a password. The Worker will only make AI calls when its D1 budget database is configured. Daily limit: **36 AI calls across all players worldwide** (roughly 12 three-room adventures).

### One-time setup

On the `feat/ai-dungeon-master` branch:

~~~bash
git pull origin feat/ai-dungeon-master
npm test && npm run build
npx wrangler login
npx wrangler d1 migrations apply daily-dungeon-playtest --remote
npm run deploy
~~~

1. **Migration:** Confirm the migration targets the database named `daily-dungeon-playtest`. It runs the SQL in `migrations/0001_ai_budget.sql` and creates the daily budget counter. If you already executed the SQL in Cloudflare's D1 Console, it's safe to apply the idempotent migration as well.
2. **Deploy:** `npm run deploy` builds and deploys the site and API. It prints the Worker's public URL. Without a working D1 quota database, the AI endpoint fails closed and does not call a model.
3. **Play:** Visit the Worker URL, start a dungeon and submit an action. **There is no player passcode.** The `/api/health` endpoint should report `"narrator":"ai-ready"` when the AI and D1 bindings are configured.

### Safety, costs, and test boundaries

The Worker allows code-free play and applies an approximate per-IP rate limit. It also **reserves a slot in an atomic D1 daily counter before calling Workers AI**. The cap is 36 inference attempts per UTC day, configurable via `AI_DAILY_LIMIT` and clamped to 1–100 by the Worker. Exhausted or unavailable budget fails closed. Repeated attempts or malformed AI responses can consume slots.

This is a budget-limited prototype, not a production-ready public game: anyone with the URL can use the limited shared AI allowance, and browser-side game state can be manipulated, so these runs cannot support a trusted leaderboard. Workers, D1, and AI usage may have separate account-level charges or allowances. Check account limits before enabling traffic.

Each AI request prompts Qwen3 for two possible short outcomes, a creativity score of 0–5, and an **optional achievement title + description** when the action earns 4–5 points. All three pieces come back in the *same inference call*; a rare **5/5 Masterstroke** overrides a bad dice roll. The rules engine, never the AI, decides hearts, inventory, rewards, and progression.

`npm run dev` is **scripted-only** and uses a local fallback. Remote Workers AI can incur usage even when testing from Wrangler.

## How the artwork works

**Daily/homepage art is built in and always free:** Open or restart a dungeon to see the corresponding pixel-art hero scene, including the Goblin's Toll bridge, the Wizard's Complaint tavern and the Royal Pantry kitchen. The room encounter screen also has pixel art before you type anything. These illustrations are ordinary bundled SVG/React UI, not AI images.

**Action-specific images are different:** If you enable the optional Cloudflare art feature below, the game also illustrates each resolved player action and adds those images to the end-of-run gallery. This requires the R2 bucket, the D1 migration, the signing secret and ART_ENABLED=true. If disabled, the built-in homepage and room scenes still appear.

## QA shortcut: pretend it's tomorrow

While testing, set `PREVIEW_TOMORROW_ENABLED` to `"true"` in `wrangler.jsonc` (the feature branch has it enabled temporarily). Deploy the Worker, then choose **Test tomorrow's dungeon** on the homepage or end-of-run screen, or visit `/?preview=tomorrow`.

- Tomorrow's UTC date is used to select the next three-room storyline (for example 23 October 2026 previews the Wizard's Complaint on 24 October 2026).
- The preview saves to its own browser key and doesn't overwrite today's actual run. Use **Return to today** to switch back.
- API resolution verifies the preview flag and the submitted future date. AI and image calls still count against **today's real worldwide daily quotas**. Image tickets use the preview's dungeon date to illustrate the correct room.
- Never change your computer clock or edit the real D1 date. When public daily challenges are ready, switch `PREVIEW_TOMORROW_ENABLED` to `"false"` and deploy. A disabled backend rejects preview submissions.

## Optional: live 16-bit pixel-art chronicles

After every room, the game automatically scrolls to the top, shows the DM's verdict immediately, and **starts a non-blocking personalised retro pixel-art job** based on that room, your action and the result. The final screen shows all generated artwork as a gallery.

Images are generated once per server-signed receipt and cached in R2. Reloading or continuing the adventure reuses the existing job. An image failure never affects the dice, health, inventory or story.

**Art is disabled by default**, so deploying this branch won't silently start generating images. It has a separate global quota of **36 images per UTC day** by default. This does not change the existing text AI limit. A 512 × 512 Flux 2 Klein 4B image is listed at approximately $0.000287 before the shared Cloudflare free Workers AI allocation. Actual billing depends on your total usage: https://developers.cloudflare.com/workers-ai/platform/pricing/

### One-time setup

From the feat/ai-dungeon-master branch:

~~~bash
git pull origin feat/ai-dungeon-master
npm install
npm test && npm run build
npx wrangler r2 bucket create daily-dungeon-art
npx wrangler d1 migrations apply daily-dungeon-playtest --remote
npx wrangler secret put ART_SIGNING_KEY
~~~

When prompted for ART_SIGNING_KEY, provide a newly generated long random secret (at least 32 characters). Never commit it or paste it into chat. The R2 bucket must exist before any deployment using its binding, even when art is disabled.

Change ART_ENABLED to "true" in wrangler.jsonc and deploy:

~~~bash
npm run deploy
~~~

Requirements: Cloudflare AI binding, existing D1 database daily-dungeon-playtest, R2 bucket daily-dungeon-art, and ART_SIGNING_KEY. If a requirement is missing, regular gameplay still works but artwork cannot start. To stop future generations, switch ART_ENABLED to "false" and redeploy.

Images use model @cf/black-forest-labs/flux-2-klein-4b at 512 × 512. They are returned in Base64, stored in R2, and served through the Worker. The browser gets a short-lived HMAC-signed art ticket only after a legitimate game resolution, not arbitrary prompt-submission access. The generation endpoint is POST /api/generate-room-art, with status at GET /api/art-status/{id} and images at GET /api/art/{id}.

**Playtest limitations:** Runs are still saved locally, not authenticated or protected from replay. New signed tickets from repeated replays can consume the finite global image quota. Background image tasks may remain pending if interrupted. Before public scaling, add verified player sessions, stale-job recovery, and stronger moderation.

## Commands

| Command | Purpose |
| --- | --- |
| npm run dev | Frontend with local scripted fallback |
| npm run dev:worker | Build + run Cloudflare Worker and assets locally |
| npm run typecheck | Check TypeScript |
| npm test | Test daily rotation and rules engine |
| npm run build | Typecheck and build Vite assets |
| npm run deploy | Build and deploy to Cloudflare (requires login) |

## Project layout

~~~text
src/
  App.tsx          # UI, daily progress and shareable ending
  styles.scss      # Fantasy visual system and responsive layout
  game.ts          # Curated daily dungeon definitions
  engine.ts        # Deterministic rules and scripted fallback
worker/
  index.ts         # Server-side endpoint, rate limit and AI integration
tests/
  engine.test.mjs  # Mechanics and daily-challenge tests
wrangler.jsonc     # Worker, assets, rate limiting, AI binding
~~~

## How decisions work

Each room has a target difficulty. The system rolls a D20 and awards a small modifier for using an existing inventory item. When Workers AI is enabled, it may award an extra **0–5 creativity points** based on inventiveness and relevance. A successful roll awards the room's item, otherwise one heart is lost. The story always advances, so each daily game stays short. Running out of hearts ends the adventure.

Player-submitted words are treated as story input, never as instructions to change the game's rules.

## Near-term roadmap

1. Verify build and gameplay on the feature branch, improve judging quality and narrative consistency.
2. Add 14–30 genuinely distinct daily dungeons and difficulty balancing.
3. Introduce Cloudflare D1-backed player runs and strict per-user daily attempt limits (the AI-call budget table already exists).
4. Add signed session identities, abuse prevention, quotas, and observability.
5. Introduce streaks, cosmetic unlocks, amusing post-game highlights and richer opt-in sharing (personalised achievements and a locally generated certificate already work).
6. Add weekly story arcs and persistent character flavour without penalising newcomers.

The game uses original fantasy settings, not proprietary Dungeons & Dragons characters or branding.
