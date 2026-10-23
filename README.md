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
- A decorative end-of-dungeon certificate showing earned honours. Save or share a **1080 × 1350 PNG** generated locally in the browser (no extra API cost).
- Existing saved adventures can retroactively receive a scripted award based on what the hero did (e.g. Lord of the Dance).
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
