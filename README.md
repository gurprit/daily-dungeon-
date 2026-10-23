# 🐉 The Daily Dungeon

**One dungeon. Three rooms. Endless ways to survive.**

A mobile-first, bite-sized fantasy game where the whole world receives the same dungeon each UTC day. Write your own actions, roll the dice and improvise your way through a theatrical Dungeon Master with a questionable sense of humour.

> **Current status:** playable foundation/playtest on the feat/foundation branch, not a production launch.

## What's playable

- Three original three-room dungeons, rotating by UTC date from 23 October 2026.
- Free-text actions. Use your inventory, bargain, make up an outrageous plan.
- Three hearts, D20 rolls, room difficulties and inventory rewards.
- An optional **Cloudflare Workers AI** judge that awards 0–3 creativity points and improvises alternate outcomes.
- The rules engine, not the LLM, owns the dice, hearts, difficulty, items and win/loss.
- Scripted narration fallback if AI is switched off or returns malformed output.
- A persistent adventure journal and spoiler-free result sharing.
- Responsive interface, local per-day progress, engine tests and GitHub Actions CI.

**Not built yet:** player accounts, D1 persistence, global leaderboards, verified one-attempt-per-day enforcement, streaks, generated puzzles or a production abuse-prevention system. The three sample dungeons repeat while we test the loop.

## Getting started

Requirements: Node.js 22+ and npm.

~~~bash
git clone https://github.com/gurprit/daily-dungeon-.git
cd daily-dungeon-
git checkout feat/foundation
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

## Enable the real AI Dungeon Master

Cloudflare Workers AI uses the model @cf/qwen/qwen3-30b-a3b-fp8. Its binding is already declared in wrangler.jsonc.

The AI_ENABLED variable defaults to "false" **to prevent accidental inference charges**. Once your Cloudflare account, AI allowance, and usage safeguards are ready:

1. Change AI_ENABLED to "true" in the Wrangler configuration.
2. Deploy or run the Worker with npm run dev:worker.
3. The /api/resolve endpoint will ask the model to score each action's creativity (0–3) and produce two possible narrations.
4. The server adds the bounded creativity bonus to the dice roll and selects the appropriate narration. If AI fails, it falls back to scripted text.

The Workers API includes an approximate Cloudflare rate limiter (12 actions per minute per IP/location). **This is not a strict global budget limit or anti-cheat protection.** Do not launch a publicly advertised AI version until a server-side daily quota, abuse controls and cost alert or spending limit have been added.

No secret model key is embedded in the browser.

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

Each room has a target difficulty. The system rolls a D20 and awards a small transparent modifier for using an existing item and for providing a detailed action. When Workers AI is enabled, it may award an extra **0–3 creativity points** based on inventiveness and relevance. A successful roll awards the room's item, otherwise one heart is lost. The story always advances, so each daily game stays short. Running out of hearts ends the adventure.

Player-submitted words are treated as story input, never as instructions to change the game's rules.

## Near-term roadmap

1. Verify build and gameplay on the feature branch, improve judging quality and narrative consistency.
2. Add 14–30 genuinely distinct daily dungeons and difficulty balancing.
3. Introduce Cloudflare D1-backed runs and strict daily attempt limits.
4. Add signed session identities, abuse prevention, quotas, and observability.
5. Introduce streaks, cosmetic unlocks, amusing post-game highlights and opt-in sharing.
6. Add weekly story arcs and persistent character flavour without penalising newcomers.

The game uses original fantasy settings, not proprietary Dungeons & Dragons characters or branding.
