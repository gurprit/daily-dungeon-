# The Daily Dungeon

**Five minutes. One adventure. Your story.**

A short, daily, D&D-inspired fantasy adventure. Everyone gets the same three-room challenge each day. Write any action and let the AI Dungeon Master judge and narrate what happens. Health, dice, inventory and the core story consequences remain deterministic code.

## Hybrid illustrated adventures

The main illustrations are **AI-generated early-NES-era 8-bit fantasy pixel scenes**, rendered into an enforced **192×128 virtual screen with 32 fixed NES-inspired colours**. This is not just a prompt: every model image is downscaled and colour-quantised in the browser so painterly/16-bit outputs cannot dominate the final presentation. We keep the existing animated **CSS/SVG effects and JavaScript Canvas particles**, layered over images.

- **Opening and room scenes:** one shared image per room, per day.
- **Action outcomes:** personal generated pictures based on what the player actually did, the DM narration and the roll's success/failure.
- **Discoveries:** collectible illustrations for the Hollowmere clues.
- **Final outcomes:** images corresponding to each authored ending.
- **Hero's Journey:** keeps each action image with the player's story.
- **Loading, disabled or failed image service:** the previous hand-authored SVG illustration stays visible. The game still works without image generation.
- **FX overlay after artwork loads:** deliberately placed embers, looping flame, magic runes, ghost motes, music, soundwaves and small success/failure accents over the 8-bit pixel art. Unlike the SVG fallback, the generated artwork uses a subdued, scene-aware overlay; no giant gears, rings or misplaced flames obstruct the characters.

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

## Three clean NES art playtests (24 October 2026)

The previous museum, skywhale and Hollowmere previews accumulated imagery from
different experimental art styles. For a controlled **fresh-start** visual test,
there are three brand-new original mini-campaigns, each with its own three linked
rooms, distinct palette, NPCs, inventory and final objective:

1. **The Lighthouse of Lost Dawn**: a sleepy otter, a moon-moth and a pocket sunrise.
   Test URL: `/?preview=fresh-1`
2. **The Clockwork Orchard**: a robot beekeeper, brass apples and a sunflower clock.
   Test URL: `/?preview=fresh-2`
3. **The Dragon's Last Bakery**: a baby dragon chef, runaway living dough and a giant.
   Test URL: `/?preview=fresh-3`

These are also the scheduled public adventures for 27, 28 and 29 October 2026,
but previewing them now **does not change the real daily date**. The preview
routes are enabled with `PREVIEW_FRESH_ENABLED=true`, gated server-side for
text action resolution and shared image generation. The preview banner includes
links to switch freely between all three dungeons.

**Reset scope:** all three use fresh dates, distinct dungeon slugs, separate
`daily-dungeon:nes-clean-v1:` localStorage keys and unique shared-art D1 job
IDs. Previous saved achievements and stories are not deleted. This is a new
isolated playtest, not a destructive wipe of the live game or Cloudflare R2.
Fresh rooms/ending art is generated lazily on first request; that spends from
the same existing *global* daily image budget. Action pictures have their own
signed tokens. New SVG loading fallbacks are specific to each quest, too, so
old goblin/ghost art should not appear while these dungeons generate.

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

Cloudflare image resources used by earlier deployments may still exist; this PR does not delete production data or R2 files. The shared image cache key has moved to `v4-nes8`, so existing painterly images are not reused as new shared artwork. **This causes new image-inference calls as scenes are first requested**; the daily budget still applies. New personal action portraits follow the updated prompt. Previously saved personal portraits are displayed through the new pixel palette as well. The feature branch has **not** been automatically merged or deployed by these commits.

## Tests and product direction

Run `npm test` and `npm run build` before deployment. Test the mobile visuals, especially image composition plus particle overlays, and the loading/failure fallback. This daily game aims to offer a satisfying five-minute alternative to doomscrolling, not an endless feed.

## NES illustration and image-aware FX

`worker/art.ts` and `worker/shared-art.ts` now share a strict NES art direction: simple sprite silhouettes, block pixels, tile backgrounds, 2D side-view, no gradients, painterly shading, SNES detail or modern 3D. `src/nes-palette.ts` forces the result into an intentionally tiny palette, and `src/NesSceneImage.tsx` renders nearest-neighbour pixels.

`src/image-fx-layout.ts` provides a layout contract to both the prompt and animation layer: the purple hero stays to the left, the challenge on the right, and interactive effects originate from the relevant prop or character. Flame emitters are allowed only in torch-bearing rooms; dance/voice/charm particles come from the hero and magical object effects stay toward the object's lower-right side. `src/GeneratedEffects.tsx` contains small overlays for generated art; the richer procedural effects remain in SVG fallback mode. The JavaScript particle engine keeps its existing mobile limits and reduced-motion behaviour.
