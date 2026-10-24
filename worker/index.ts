import { getDailyGame, getPreviewDailyGame } from "../src/game.ts";
import { startingItems, itemCatalog, unavailableItems } from "../src/inventory.ts";
import { resolveAction } from "../src/engine.ts";
import { achievementFromJudgment } from "../src/achievements.ts";
import { judgeWithAI } from "./judge.ts";
import { priorStoryContext } from "./continuity.ts";
import { storyRoom, storyGuidance, storyEnding } from "../src/story.ts";
import { artServiceStatus, handleArtRoute, makeArtTicket, type ArtEnv } from "./art.ts";

type Env = ArtEnv & {
  AI_ENABLED?: string;
  AI_DAILY_LIMIT?: string;
  PREVIEW_TOMORROW_ENABLED?: string;
  PREVIEW_STORY_ENABLED?: string;
  DAILY_BUDGET_DB?: {
    prepare: (sql: string) => {
      bind: (...values: unknown[]) => {
        first: () => Promise<{ calls: number } | null>;
      };
    };
  };
  ACTION_LIMITER: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
  AI: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

type ActionRequest = {
  day?: unknown;
  roomIndex?: unknown;
  action?: unknown;
  inventory?: unknown;
  previewTomorrow?: unknown;
  previewHollowmere?: unknown;
  priorTurns?: unknown;
};

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });

function normaliseInventory(value: unknown, daily: ReturnType<typeof getDailyGame>): string[] {
  const allowed = new Set(itemCatalog(daily.dungeon));
  if (!Array.isArray(value)) return startingItems(daily.dungeon);
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item)))].slice(0, 6);
}

async function reserveDailyBudget(env: Env, day: string): Promise<boolean> {
  if (!env.DAILY_BUDGET_DB) throw new Error("AI daily budget database is not configured");
  const setting = Number(env.AI_DAILY_LIMIT ?? "36");
  const max = Number.isInteger(setting) ? Math.max(1, Math.min(100, setting)) : 36;
  // One atomic SQL write; strict across Cloudflare locations. Reserve BEFORE inference.
  // Failed or malformed model responses still consume a slot, preventing repeated costly retries.
  const row = await env.DAILY_BUDGET_DB.prepare(
    "INSERT INTO ai_daily_budget (day, calls) VALUES (?, 1) " +
    "ON CONFLICT(day) DO UPDATE SET calls = calls + 1 WHERE calls < ? RETURNING calls"
  ).bind(day, max).first();
  return !!row;
}

export default {
  async fetch(request: Request, env: Env, context?: { waitUntil: (task: Promise<unknown>) => void }): Promise<Response> {
    const url = new URL(request.url);
    const aiRequested = env.AI_ENABLED === "true";
    const aiConfigured = !!env.DAILY_BUDGET_DB && !!env.AI;
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        narrator: aiRequested ? (aiConfigured ? "ai-ready" : "setup-required") : "scripted",
        day: getDailyGame().day,
        previewTomorrowEnabled: env.PREVIEW_TOMORROW_ENABLED === "true",
        previewStoryEnabled: env.PREVIEW_STORY_ENABLED === "true",
        art: artServiceStatus(env)
      });
    }

    const artResponse = await handleArtRoute(request, env, context);
    if (artResponse) return artResponse;

    if (url.pathname === "/api/resolve") {
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
      if ((Number(request.headers.get("content-length")) || 0) > 6000) {
        return json({ error: "Request too large." }, 413);
      }
      const key = request.headers.get("cf-connecting-ip") ?? "unknown";
      const allowed = await env.ACTION_LIMITER.limit({ key });
      if (!allowed.success) return json({ error: "Even heroes need a rest. Try again in a minute." }, 429);

      if (aiRequested) {
        // AI runs publicly without a player passcode, but never without a global D1 budget.
        if (!aiConfigured) return json({ error: "The Dungeon Master is temporarily unavailable (AI budget database not configured)." }, 503);
      }

      let body: ActionRequest;
      try {
        const text = await request.text();
        if (text.length > 6000) return json({ error: "Request too large." }, 413);
        body = JSON.parse(text) as ActionRequest;
        if (!body || typeof body !== "object") throw new Error("Bad body");
      } catch { return json({ error: "Invalid JSON." }, 400); }

      const isPreview = body.previewTomorrow === true;
      const isStoryPreview = body.previewHollowmere === true;
      if (isPreview && isStoryPreview) return json({ error: "Choose one preview mode." }, 400);
      if (body.previewHollowmere !== undefined && typeof body.previewHollowmere !== "boolean") return json({ error: "Invalid story preview." }, 400);
      // A playtest preview never modifies the actual daily dungeon, clock or quotas.
      if (body.previewTomorrow !== undefined && typeof body.previewTomorrow !== "boolean") {
        return json({ error: "Invalid preview selection." }, 400);
      }
      if (isPreview && env.PREVIEW_TOMORROW_ENABLED !== "true") {
        return json({ error: "Tomorrow's playtest is not enabled." }, 403);
      }
      if (isStoryPreview && env.PREVIEW_STORY_ENABLED !== "true") return json({ error: "Story playtest is disabled." }, 403);
      const daily = isStoryPreview ? getDailyGame(new Date("2026-10-26T12:00:00Z")) : isPreview ? getPreviewDailyGame() : getDailyGame();
      if (body.day !== daily.day) return json({ error: "A new dungeon has begun. Refresh to continue." }, 409);
      if (!Number.isInteger(body.roomIndex) || Number(body.roomIndex) < 0 || Number(body.roomIndex) > 2) {
        return json({ error: "Invalid room." }, 400);
      }
      if (typeof body.action !== "string" || body.action.trim().length < 4 || body.action.length > 280) {
        return json({ error: "Use between 4 and 280 characters." }, 400);
      }

      const inventory = normaliseInventory(body.inventory, daily);
      const unavailable = unavailableItems(body.action, inventory, itemCatalog(daily.dungeon));
      if (unavailable.length) {
        return json({ error: unavailable.join(", ") + " is no longer in your inventory. Try another idea!" }, 409);
      }
      const earlierMoments = priorStoryContext(body.priorTurns, daily.dungeon.rooms, Number(body.roomIndex));
      const room = storyRoom(daily.dungeon, Number(body.roomIndex), earlierMoments);
      const die = crypto.getRandomValues(new Uint32Array(1))[0] % 20 + 1;
      let outcome = resolveAction(room, body.action, inventory, die);

      if (aiRequested) {
        try {
          // A preview consumes today's normal allowance and cannot bypass the global cap.
          if (!(await reserveDailyBudget(env, getDailyGame().day))) {
            return json({ error: "The Dungeon Master has run out of magic for today. Try again tomorrow." }, 429);
          }
        } catch (error) {
          console.error("AI budget unavailable", error instanceof Error ? error.message : "unknown");
          return json({ error: "The AI budget gate is unavailable. No model call was made." }, 503);
        }
        const isFinalRoom = Number(body.roomIndex) === daily.dungeon.rooms.length - 1;
        const judgment = await judgeWithAI(env.AI, room.scene, room.character, room.challenge, body.action, earlierMoments, inventory, isFinalRoom, storyGuidance(daily.dungeon.slug, Number(body.roomIndex)));
        if (judgment) {
          outcome = resolveAction(room, body.action, inventory, die, judgment.creativity);
          outcome.narration = outcome.success ? judgment.success : judgment.failure;
          outcome.mode = "ai";
          outcome.achievement = achievementFromJudgment(room, body.action, outcome.success, judgment.creativity, judgment.achievement);
          if (isFinalRoom) {
            const closing = outcome.success ? judgment.epilogueSuccess : judgment.epilogueFailure;
            if (closing) outcome.epilogue = closing;
          }
          if (isFinalRoom && daily.dungeon.slug === "bell-of-hollowmere") {
            const conclusion = storyEnding(daily.dungeon.slug, body.action, outcome.success, Math.max(0, 3 - earlierMoments.filter(beat => !beat.success).length - outcome.heartsLost), earlierMoments, judgment.finaleChoice);
            if (conclusion) { outcome.storyEnding = conclusion; outcome.epilogue = conclusion.epilogue; }
          }
        }
      }
      if (Number(body.roomIndex) === 2 && daily.dungeon.slug === "bell-of-hollowmere" && !outcome.storyEnding) {
        const conclusion = storyEnding(daily.dungeon.slug, body.action, outcome.success, Math.max(0, 3 - earlierMoments.filter(beat => !beat.success).length - outcome.heartsLost), earlierMoments);
        if (conclusion) { outcome.storyEnding = conclusion; outcome.epilogue = conclusion.epilogue; }
      }
      const artTicket = await makeArtTicket(env, Number(body.roomIndex), body.action, outcome.narration, outcome.success, daily.day);
      if (artTicket) outcome.artTicket = artTicket;
      return json(outcome);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
    return env.ASSETS.fetch(request);
  }
};
