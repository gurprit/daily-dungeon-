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


## Scroll parallax for the three fresh NES adventures

The **Lighthouse**, **Clockwork Orchard** and **Dragon Bakery** fallback scenes
now contain real individually movable SVG layers. Their backgrounds, distant
scenery, architecture, NPCs, hero and foreground details respond to page scroll
at different speeds (a maximum of 12 viewBox pixels). The movement is bounded,
does not require a React render every frame, and the backdrop extends past the
viewport edges to prevent gaps.

Every room also has unique idle animation: lighthouse beam/sea/mist; orchard
clockwork/gears/bees/pollen; and bakery oven/fire/flour/dough. These animate
independently of scroll.

Once a generated NES picture loads, its single flattened image receives just
a tiny scroll offset, with the existing SVG magic and Canvas particles moving
a little more. The genuine layered depth remains in our local SVG fallback;
a single AI painting cannot provide physically separate scenery layers.

Implementation:
- \`src/parallax-math.ts\`: deterministic, clamped position and depth formulas
- \`src/useScrollParallax.ts\`: one requestAnimationFrame per visible scene;
  passive scroll listener, IntersectionObserver, hidden-tab pause and
  prefers-reduced-motion support
- \`src/FreshPixelScene.tsx\`: named, independently animated SVG planes
- \`src/IllustratedScene.tsx\`: gentler parallax for flattened model art and FX
- \`tests/parallax.test.mjs\`: scroll bounds, layer coverage and accessibility

The artwork remains clickable only where the existing game UI is clickable;
parallax layers do not intercept player inputs. No new libraries, paid effects,
image inference calls or Worker endpoints are required for parallax.


## Gameplay continuity and illustration fallback (v0.3)

The artwork stays deliberately mixed: generated NES-style portraits alongside the handmade SVG/CSS sketches. A procedural sketch is a valid completed fallback, not necessarily a broken game.

**Five authored adventure branches** now carry resolved room outcomes forward into the next physical scene: Lighthouse of Lost Dawn, Clockwork Orchard, Dragon's Last Bakery, Museum After Midnight and Skywhale Express. The successful and unsuccessful paths have different arrivals, environmental details and an explicitly labelled **"Your earlier choice changed this room"** note. They do **not** silently alter d20 difficulty, hearts or rewards. Hollowmere keeps its existing deeper, multi-ending authored story.

The narration model is now instructed to respect changed world state and to reference a real prior consequence when available. If inference is unavailable, the nine rooms across the three fresh NES adventures have character-specific scripted reactions instead of generic replies, with the deterministic consequence echoed after them. No additional AI call is required.

Illustration fallback status is explicit: pending art shows **"Painting this moment…"**; a failed request shows **"Artist unavailable · pixel sketch shown"**; a long-running request shows **"Taking too long · keeping the sketch"**. Decoding an image also has a 20-second safety timeout. The familiar SVG illustration stays visible and all game actions remain usable in every case.

This increment is an unmerged feature branch until reviewed. Automated tests cover success/failure branches, unchanged dice rules, contextual scripted replies, bounded art loading and the existing game behaviour.


### More visible scroll parallax

The v0.3 scroll effect now reaches its full depth change over roughly half a viewport, rather than requiring the scene to travel across the whole screen. Near and far SVG layers separate substantially during a normal mobile swipe. Flattened generated NES images receive a stronger, overscanned 14% camera zoom and vertical pan, with the action effects following at a nearby depth to preserve alignment. Reduced-motion settings continue to disable scroll-driven effects. The browser result should be checked on the actual device after deploy.


### Side-to-side scroll parallax (v0.3 refinement)
Vertical page scrolling now pans illustration layers **horizontally only**. Scene Y remains fixed. NES-generated images, particles, SVG effect overlays, all three multi-layer fresh SVG environments, and older procedural illustrations share the change. Far backgrounds move less than nearby props. Generated canvas images retain their 8% bleed and 10% scale; older static SVG backgrounds gain 16% zoom to hide their side edges. Horizontal pan is limited to 7% of image width for root planes and 22 viewBox units for SVG groups, at half-strength. Independent flames and idle animations are unchanged. The reduced-motion preference still disables scroll parallax.


## Three daily adventures (v0.3)

The public home page now offers **three independent adventures every UTC day**, each a complete three-room, ~five-minute quest. Everyone sees the same daily choices. The default featured adventure remains the first option, preserving existing player progress and earlier date-specific story assignments. The other two choices use query parameters \`?quest=1\` and \`?quest=2\`; each has separate localStorage progress. You can play all three on the same day, and the selection refreshes at midnight UTC.

The initial pool contains **nine fully authored adventures** (the original three, the museum, the skywhale, Hollowmere, lighthouse, orchard and bakery). A deterministic date-based rotation chooses three different titles every day. **This does not create three brand-new AI-written campaigns every night**: authored plots eventually reappear. Expanding the story library or implementing reviewed server-side daily story creation is future work. Rotating the existing stories incurs no extra overnight inference. Artwork is generated only when needed, within the existing R2/D1 daily inference budget.

Daily slots are validated against the same calendar-day selection by the Cloudflare Worker, including their shared illustration cache keys and signed personalised art prompts. Preview modes remain separate and cannot be combined with extra public daily slots. Each choice keeps its own inventory, hearts, choices and hero journal.


### Public launch UI polish
The player-facing interface presents only today's three short adventures and links between the current day's choices. The old links to preview tomorrow, Hollowmere v0.2 and fresh NES QA scenarios, their test ribbon, and the foundation-playtest footer badge are removed from the regular game. Developer preview handlers remain available to maintainers via explicit query strings, but are no longer exposed in public navigation. No existing saves, authored adventures or development scenarios are deleted.
