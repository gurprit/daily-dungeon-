# 🐉 The Daily Dungeon

**Five minutes. One adventure. Your story.**

A mobile-first daily fantasy role-playing game. Everyone encounters the same
three-room adventure each UTC day. Write any action, let the AI Dungeon Master
interpret it, and roll a real D20. The engine owns health, inventory, dice,
objectives and consequences.

## All artwork is local CSS + SVG

**There is NO image-generation model or image-inference service in the game.**
Every illustrated moment is composed immediately in the browser from reusable
React SVG geometry and CSS. The images are not downloaded from a remote service,
and nothing needs pre-generation, R2 storage, signing keys or art API endpoints.

The illustration system provides:

- **Room scenes:** separate scene compositions for every dungeon and room,
  with layered atmosphere, torchlight and animated fantasy effects.
- **Personalised action pictures:** the action's recognisable motif (dance,
  kiss, unlocking, item offering, magic, fighting, sneaking, investigating,
  talking), relevant prop, success/failure and room context determine
  characters, gestures, items, lighting and particles.
- **Discoveries:** illustrated collectible clue cards, including Spoon's
  warning, the loose note, the inscription and the broken gears.
- **Endings:** distinct locally illustrated Hollowmere fates for freeing
  Elowen, renewing the ward, the willing oath and setbacks.
- **Hero's Journey:** every resolved action has its own deterministic SVG
  illustration, so revisiting the saved journey shows the same picture.

The pictures are **procedural, not limitless AI drawings**. Unrecognised
actions still receive a deterministic atmospheric "other" composition; their
exact wording and outcome are conveyed by the Dungeon Master's narration.
To cover more creative actions visually, add gesture/prop recognition and SVG
assets in the illustration system. All visual states render instantly and
without any image service costs.

Relevant files:
- src/PixelScene.tsx: hand-authored SVG settings and scenery
- src/ClueSketch.tsx: collectible discovery artwork
- src/illustration-recipe.ts: pure deterministic action/prop/mood rules
- src/ProceduralIllustration.tsx: layered React SVG sprites and outcomes
- src/styles.scss: atmosphere, responsive layout and accessible animation

PNG export of the **certificate** happens locally in the browser and likewise
does not require an image-generation model.

## Story-driven daily quests

The 26 October 2026 adventure, **The Bell of Hollowmere**, includes an explicit
mission, Spoon the frightened goblin, the memory mechanism, a ghost called
Elowen, clues and meaningful endings. NPC reactions and discoveries can affect
later rooms. Key decisions are defined in src/story.ts; the AI Dungeon Master
improvises with the user's words but does not rewrite the canonical ending.
A local playtest is available at /?preview=hollowmere when the preview switch
is enabled on the Worker.

The AI judge gives 0–5 creativity points in one text-model inference per
action, writes brief funny responses and short achievement copy. A 5/5
Masterstroke automatically succeeds. Players have 3 hearts and one-use items.

## Local development

Requirements: Node.js 22+ and npm.

    git clone https://github.com/gurprit/daily-dungeon-.git
    cd daily-dungeon-
    git switch feat/story-driven-hollowmere-v0.2
    npm install
    npm run dev

The Vite prototype runs with scripted narration if the Worker API is absent.
**All the SVG artwork works identically with or without text AI.**

    npm test
    npm run build

## Cloudflare deployment

This is an Astro-free React + Vite client with a Cloudflare Worker for
the optional **text-only AI Dungeon Master**. Wrangler configuration includes:

- AI binding: used exclusively for Qwen text judging
- D1 binding: holds the global AI text-call budget
- Action rate limiter
- Static asset binding
- No R2 image bucket, no art budget or image-generation binding

For a Cloudflare deploy:

    npx wrangler login
    npx wrangler d1 migrations apply daily-dungeon-playtest --remote
    npm run deploy

The original second migration creates historic unused art-job tables; the
current game never reads, writes or requires those tables. Existing Cloudflare
R2 resources may remain in the account until manually cleaned up, but the
Worker is no longer connected to them. **Do not delete historic resources
without first checking whether anything else uses them.**

The text AI switch is AI_ENABLED; AI_DAILY_LIMIT defaults to 36 and is enforced
globally with D1. Check /api/health: narrator should be ai-ready when the
AI text binding and D1 budget are configured; illustrations should be
client-side-svg. No image API endpoints exist.

Cloudflare's local Workers runtime may not work correctly on macOS 12.6.
The normal Vite server and SVG illustrations are unaffected.

## Safety and playtest boundaries

The project is an experimental, open, daily storytelling game, not a verified
competitive leaderboard. Progress is stored per day in localStorage. Anyone
with the URL may consume the shared text AI allowance. The model does not own
health, inventory, rolls or final canon; these are resolved in code. The game
supports original fantasy adventures and no account or group schedule is
required.

The current three-room adventure is designed for approximately five minutes,
with a satisfying stopping point rather than endless generated content.
