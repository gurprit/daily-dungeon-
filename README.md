# The Daily Dungeon

**Five minutes. One adventure. Your story.**

A short, daily, D&D-inspired fantasy adventure. Everyone gets the same three-room challenge each day. Write any action and let the AI Dungeon Master judge and narrate what happens. Health, dice, inventory and the core story consequences remain deterministic code.

## Hybrid illustrated adventures

The main illustrations are **AI-generated fantasy storybook artwork**. We keep the existing animated **CSS/SVG effects and JavaScript Canvas particles**, layered over images.

- **Opening and room scenes:** one shared image per room, per day.
- **Action outcomes:** personal generated pictures based on what the player actually did, the DM narration and the roll's success/failure.
- **Discoveries:** collectible illustrations for the Hollowmere clues.
- **Final outcomes:** images corresponding to each authored ending.
- **Hero's Journey:** keeps each action image with the player's story.
- **Loading, disabled or failed image service:** the previous hand-authored SVG illustration stays visible. The game still works without image generation.
- **FX overlay after artwork loads:** embers, looping flame, magic runes, ghost mist, soundwaves, paint effects, success/failure accents and the JS particle system remain over the finished painting.

The FX renderer is deterministic and capped at 62 particles per visible illustration. It pauses in background tabs, limits pixel ratio, and respects reduced-motion settings. The old yellow opaque success glow was replaced with gentle outlined halos.

The app uses a Cloudflare Workers AI image model (`@cf/black-forest-labs/flux-2-klein-4b`) at 768 × 512. Generation calls are billed separately from the AI Dungeon Master's **text** inference. The image budget is set to 600 requests per UTC day by default and enforced atomically through D1. Shared images are created lazily just once per dungeon/date/room/clue/ending and cached in R2. The browser can only request personal images with a signed token minted after a trusted /api/resolve result. These protections help control usage, but the actual image costs will depend on traffic and model pricing.

### Key modules

- `src/IllustratedScene.tsx`: model image, generated-image polling, SVG fallback and layered FX
- `src/ProceduralIllustration.tsx`, `src/PixelScene.tsx`, `src/ClueSketch.tsx`: original fallback artwork
- `src/ProceduralEffects.tsx`, `src/effect-presets.ts`: animated SVG effects
- `src/ParticleCanvas.tsx`, `src/particle-engine.ts`: capped JavaScript Canvas particles
- `worker/art.ts`: signed per-action tickets, image generation, gallery service
- `worker/shared-art.ts`: validated shared scenes, clues and ending illustrations
- `worker/index.ts`: API routes, story rules, dice, daily AI budgets

## Hollowmere (v0.2)

The Bell of Hollowmere is an authored three-room story featuring Spoon the goblin, the memory-stealing mechanism and Elowen the ghost. Actions have connected consequences and discoverable secrets; the finale can change based on the information and alliances earned earlier. Playtest mode: `?preview=hollowmere`, if enabled.

## Development

Requires Node.js 22+ and npm:

```bash
npm install
npm run dev
npm test
npm run build
```

Local Vite development works in scripted-narrator and SVG-fallback mode when the Worker bindings aren't connected. Cloudflare's local Workers runtime can be problematic on macOS 12.6.

## Cloudflare setup and deployment

The Worker uses Cloudflare Workers AI, a D1 database named `daily-dungeon-playtest`, an R2 bucket named `daily-dungeon-art`, and a rate limiter. Wrangler config contains the bindings and daily budget settings. Ensure the existing migrations, **including `0002_room_art.sql`**, have been applied:

```bash
npx wrangler d1 migrations apply daily-dungeon-playtest --remote
npx wrangler secret put ART_SIGNING_KEY
npm run deploy
```

`ART_SIGNING_KEY` must be at least 32 characters. Verify `/api/health` reports `art.status: "ready"` and `narrator: "ai-ready"` for full functionality. Without the image configuration or if `ART_ENABLED=false`, the game retains the instant SVG fallback and the Dungeon Master can continue using text AI independently.

Cloudflare image resources used by earlier deployments may still exist; this PR does not delete production data or R2 files. Art will be generated on the first request and reused thereafter. The feature branch has **not** been automatically merged or deployed by these commits.

## Tests and product direction

Run `npm test` and `npm run build` before deployment. Test the mobile visuals, especially image composition plus particle overlays, and the loading/failure fallback. This daily game aims to offer a satisfying five-minute alternative to doomscrolling, not an endless feed.
