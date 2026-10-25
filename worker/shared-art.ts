import { getDailyGame, getDailyGameForSlot, getPreviewDailyGame, getFreshPreviewGame, type Dungeon } from "../src/game.ts";
import { freshPreviewIndex, type FreshPreviewMode } from "../src/fresh-dungeons.ts";
import { ILLUSTRATION_STYLE, artEnabled, inferIllustration, type ArtEnv } from "./art.ts";
import { generatedFxLayout } from "../src/image-fx-layout.ts";
import { cachedDailyStories } from "./daily-stories.ts";

/** Fixed pictures shared by every player. User actions remain separately illustrated. */
export type SharedArtKind = "room" | "clue" | "ending";
export type SharedArtRequest = {
  day: string;
  roomIndex: number;
  dailySlot?: 0 | 1 | 2;
  dailySource?: "generated" | "classic";
  kind: SharedArtKind;
  variant?: string;
  preview?: "today" | "tomorrow" | "hollowmere" | FreshPreviewMode;
};
type SharedEnv = ArtEnv & {
  PREVIEW_TOMORROW_ENABLED?: string;
  PREVIEW_STORY_ENABLED?: string;
  PREVIEW_FRESH_ENABLED?: string;
  ACTION_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
};

const clueVisuals: Record<string, { roomIndex: number; prompt: string }> = {
  spoon: { roomIndex: 0, prompt: "An anxious tiny green goblin, Spoon, wearing an oversized rusty helmet, confides a secret to a cloaked adventurer at a shadowy bell tower gate, lantern flickering. Close-up, warm and mysterious." },
  note: { roomIndex: 0, prompt: "A crumpled warning note and tiny goblin helmet on wet cobblestones at the entrance to a vast old bell tower. Intimate mysterious still-life, no readable letters." },
  inscription: { roomIndex: 1, prompt: "A revealed magical brass inscription, worn runic plate and ornate clockwork, tiny glowing memory sparks and key-shaped socket. Intriguing collectible fantasy artefact, no readable letters." },
  "broken-gear": { roomIndex: 1, prompt: "A massive cracked bronze gear on a winding tower stair, glowing fragments of memories spilling from its teeth. Haunting magical discovery." }
};
const endingVisuals: Record<string, string> = {
  "keeper-unchained": "Elowen's ethereal ghost is free beneath a shattered bell as a gigantic shadow stirs below the village; dawn, freedom mixed with foreboding.",
  "silent-bargain": "Bell tower restored and village safe in the sunrise, but the translucent spirit Elowen remains bound by one delicate enchanted chain. Melancholy beauty.",
  "oath-remade": "Hollowmere villagers freely offering magical lights of memory to repair a golden protective ward; Elowen the ghost walking free in the first sunrise. Joyful release.",
  "borrowed-dawn": "A hopeful yet fragile new protective ward over a bell tower at dawn, held by shimmering promises, Elowen the ghost walking free, cracks glowing in the magic.",
  "another-name-lost": "A bronze bell still tolling over Hollowmere while luminous fragments of names fade into night air, a ghost holding its cracked protective ward together.",
  "last-toll": "An abandoned cloak on a ghostly tower stair, the great bell silent in the background, last memory sparks drifting away, haunting but not violent.",
  victory: "The small hooded adventurer emerges from a magical castle after a hard-earned victory; morning light and relieved villagers; triumphant original fantasy art.",
  defeat: "The weary adventurer departs an ominous fantasy fortress after a setback, night rain and haunting lanterns, evocative but gentle."
};

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

export function validateSharedArt(value: unknown, env: SharedEnv, now: Date = new Date()):
  { request: SharedArtRequest; dungeon: Dungeon } | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<SharedArtRequest>;
  if (body.preview !== "today" && body.preview !== "tomorrow" && body.preview !== "hollowmere" &&
      freshPreviewIndex(body.preview) === null) return null;
  if (!Number.isInteger(body.roomIndex) || body.roomIndex! < 0 || body.roomIndex! > 2) return null;
  if (body.kind !== "room" && body.kind !== "clue" && body.kind !== "ending") return null;
  const freshIndex = freshPreviewIndex(body.preview);
  const dailySlot = body.dailySlot === undefined ? 0 : body.dailySlot;
  // Synchronous validation is for the authored rotation; the generated
  // story is loaded and validated asynchronously in the request handler.
  if (body.dailySource !== undefined && body.dailySource !== "classic") return null;
  if (dailySlot !== 0 && dailySlot !== 1 && dailySlot !== 2) return null;
  if (body.preview !== "today" && dailySlot !== 0) return null;
  const daily = freshIndex !== null
    ? env.PREVIEW_FRESH_ENABLED === "true" ? getFreshPreviewGame(freshIndex) : null
    : body.preview === "hollowmere"
      ? env.PREVIEW_STORY_ENABLED === "true" ? getDailyGame(new Date("2026-10-26T12:00:00Z")) : null
      : body.preview === "tomorrow"
        ? env.PREVIEW_TOMORROW_ENABLED === "true" ? getPreviewDailyGame(now) : null
        : getDailyGameForSlot(dailySlot, now);
  if (!daily || daily.day !== body.day) return null;
  if (body.kind === "room" && body.variant !== undefined && body.variant !== "") return null;
  if (body.kind === "clue") {
    if (daily.dungeon.slug !== "bell-of-hollowmere" ||
      typeof body.variant !== "string" || !Object.hasOwn(clueVisuals, body.variant) ||
      clueVisuals[body.variant].roomIndex !== body.roomIndex) return null;
  }
  if (body.kind === "ending") {
    if (body.roomIndex !== 2 || typeof body.variant !== "string" ||
      !Object.hasOwn(endingVisuals, body.variant)) return null;
    const isGeneric = body.variant === "victory" || body.variant === "defeat";
    if (daily.dungeon.slug === "bell-of-hollowmere" ? isGeneric : !isGeneric) return null;
  }
  return { request: body as SharedArtRequest, dungeon: daily.dungeon };
}

export function createSharedArtPrompt(dungeon: Dungeon, data: SharedArtRequest): string {
  const room = dungeon.rooms[data.roomIndex];
  const setting = ILLUSTRATION_STYLE + " Setting: " + dungeon.title + ". " + dungeon.intro + ". " +
    generatedFxLayout({ kind: data.kind, dungeonSlug: dungeon.slug, roomIndex: data.roomIndex, endingId: data.variant, clueId: data.variant }).caption + " ";
  if (data.kind === "room") return (
    setting + " Establishing scene BEFORE the player acts. Simple 8-bit tile background, one memorable focal sprite, no spoilers. " +
    "Room: " + room.title + ". " + room.scene + " Character: " + room.character
  ).slice(0, 3100);
  if (data.kind === "clue") return (
    setting + " Pixel sprite discovery close-up, ONE large readable object or face, plain background. " +
    clueVisuals[data.variant!].prompt
  ).slice(0, 3000);
  return (
    setting + " 8-bit game ending scene, simple distinct silhouette, clearly show the consequence. " +
    endingVisuals[data.variant!]
  ).slice(0, 3100);
}

/* First 128 bits of SHA256, with UUIDv4 version bits, form a stable job ID. */
export async function sharedArtId(data: SharedArtRequest): Promise<string> {
  const key = "v4-nes8/" + data.day + "/" + data.kind + "/" + data.roomIndex + "/" + (data.variant ?? "") +
    (data.dailySlot ? "/daily-slot-" + data.dailySlot : "") +
    (data.dailySource === "generated" ? "/generated" : "");
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
  const bytes = hash.slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const x = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return x.slice(0,8) + "-" + x.slice(8,12) + "-" + x.slice(12,16) + "-" + x.slice(16,20) + "-" + x.slice(20);
}

export async function handleSharedArtRoute(
  request: Request, env: SharedEnv, context?: { waitUntil(task: Promise<unknown>): void }
): Promise<Response | null> {
  if (new URL(request.url).pathname !== "/api/shared-art") return null;
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!artEnabled(env)) return json({ error: "Illustrations are not configured." }, 503);
  if ((Number(request.headers.get("content-length")) || 0) > 900) return json({ error: "Request too large." }, 413);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 900) return json({ error: "Request too large." }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: "Invalid request." }, 400); }
  let valid = validateSharedArt(body, env);
  const dailyRequest = body && typeof body === "object" ? body as Partial<SharedArtRequest> : null;
  if (!valid && dailyRequest?.dailySource === "generated" && dailyRequest.preview === "today" &&
      Number.isInteger(dailyRequest.dailySlot) && [0,1,2].includes(dailyRequest.dailySlot!) &&
      dailyRequest.day === getDailyGame().day &&
      Number.isInteger(dailyRequest.roomIndex) && dailyRequest.roomIndex! >= 0 && dailyRequest.roomIndex! <= 2 &&
      (dailyRequest.kind === "room" || dailyRequest.kind === "ending") &&
      (dailyRequest.kind !== "room" || !dailyRequest.variant) &&
      (dailyRequest.kind !== "ending" || (dailyRequest.roomIndex === 2 &&
        (dailyRequest.variant === "victory" || dailyRequest.variant === "defeat")))) {
    const stories = await cachedDailyStories(env, dailyRequest.day);
    if (stories) valid = {request: dailyRequest as SharedArtRequest,dungeon:stories[dailyRequest.dailySlot!]};
  }
  if (!valid) return json({ error: "Unknown illustration." }, 400);

  if (env.ACTION_LIMITER) {
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const throttle = await env.ACTION_LIMITER.limit({ key: "shared-art:" + ip });
    if (!throttle.success) return json({ error: "Illustrations are busy." }, 429);
  }
  const db = env.DAILY_BUDGET_DB!;
  const { request: scene, dungeon } = valid;
  const id = await sharedArtId(scene);
  // D1 PRIMARY KEY makes a single job for all visitors, even concurrently.
  const inserted = await db.prepare(
    "INSERT OR IGNORE INTO art_jobs (id, day, room_index, status) VALUES (?, ?, ?, 'pending') RETURNING id"
  ).bind(id, scene.day, scene.roomIndex).first();
  if (!inserted) {
    const row = await db.prepare("SELECT status, object_key FROM art_jobs WHERE id = ?").bind(id).first();
    return json({
      id, status: row?.status ?? "pending",
      ...(row?.status === "ready" ? { url: "/api/art/" + id } : {})
    }, row?.status === "ready" ? 200 : 202);
  }

  // Same atomic daily image budget as personalised result portraits.
  const setting = Number(env.ART_DAILY_LIMIT ?? "600");
  const max = Number.isInteger(setting) ? Math.max(1, Math.min(setting, 5000)) : 600;
  try {
    const budget = await db.prepare(
      "INSERT INTO art_daily_budget (day, calls) VALUES (?, 1) " +
      "ON CONFLICT(day) DO UPDATE SET calls = calls + 1 WHERE calls < ? RETURNING calls"
    ).bind(getDailyGame().day, max).first();
    if (!budget) {
      await db.prepare("UPDATE art_jobs SET status = ?, object_key = ? WHERE id = ?")
        .bind("failed", null, id).first();
      return json({ error: "Illustration budget exhausted." }, 429);
    }
  } catch {
    await db.prepare("UPDATE art_jobs SET status = ?, object_key = ? WHERE id = ?")
      .bind("failed", null, id).first();
    return json({ error: "Illustration budget unavailable." }, 503);
  }

  const job = (async () => {
    try {
      const image = await inferIllustration(env, createSharedArtPrompt(dungeon, scene));
      const key = "shared/v3/" + scene.day + "/" + id + ".png";
      await env.ART_BUCKET!.put(key, image, { httpMetadata: { contentType: "image/png" } });
      await db.prepare("UPDATE art_jobs SET status = ?, object_key = ? WHERE id = ?")
        .bind("ready", key, id).first();
    } catch (error) {
      console.error("Shared art generation failed", error instanceof Error ? error.message : "unknown");
      await db.prepare("UPDATE art_jobs SET status = ?, object_key = ? WHERE id = ?")
        .bind("failed", null, id).first();
    }
  })();
  if (context) context.waitUntil(job);
  else await job;
  return json({ id, status: "pending" }, 202);
}
