import { getDailyChoices, type Dungeon } from "../src/game.ts";

/**
 * Exactly one shared AI call creates three complete micro-adventures per UTC
 * date. D1's primary key is the global generation lock; it is never one call
 * per player, per room, or per Cloudflare colo.
 */
export type StorySet = {
  day: string;
  source: "generated" | "classic";
  status: "ready" | "pending" | "fallback";
  /** Safe status for diagnosing config/AI failures without exposing user data. */
  reason?: "disabled" | "missing-bindings" | "database-unavailable" | "generation-failed" | "invalid-cache";
  failureStage?: "model-call" | "invalid-output" | "database-write";
  choices: readonly Dungeon[];
};
type DB = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first(): Promise<Record<string, unknown> | null>
    }
  }
};
export type StoryEnv = {
  DAILY_STORIES_ENABLED?: string;
  DAILY_BUDGET_DB?: DB;
  AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
};
type CachedRow = { status?: unknown; stories_json?: unknown };
const todayUTC = (now: Date) => now.toISOString().slice(0,10);
const validDay = (day: string) => /^\d{4}-\d\d-\d\d$/.test(day) &&
  new Date(day+"T12:00:00Z").toISOString().slice(0,10) === day;
const fallback = (now: Date, reason?: StorySet["reason"]): StorySet => ({
  day: todayUTC(now), source: "classic", status: "fallback",
  ...(reason ? {reason} : {}),
  choices: getDailyChoices(now).map(value => value.dungeon)
});
const trimmed = (value: unknown, min: number, max: number): string | null => {
  if (typeof value !== "string") return null;
  const s = value.trim().replace(/\s+/g," ");
  if (s.length < min || s.length > max || /<[^>]+>|https?:\/\/|[\u0000-\u001f]/i.test(s)) return null;
  return s;
};

/** Validate *all* three stories before publishing any of them as today's set. */
export function parseDailyStories(raw: unknown, day: string): [Dungeon,Dungeon,Dungeon] | null {
  if (!validDay(day)) return null;
  let answer: unknown = raw;
  if (typeof answer === "string") {
    const cleaned = answer.replace(/<think>[\s\S]*?<\/think>/g,"").trim();
    const first = cleaned.indexOf("{"), last = cleaned.lastIndexOf("}");
    if (first < 0 || last <= first) return null;
    try { answer = JSON.parse(cleaned.slice(first,last+1)); } catch { return null; }
  }
  if (!answer || typeof answer !== "object") return null;
  const value = answer as { stories?: unknown };
  if (!Array.isArray(value.stories) || value.stories.length !== 3) return null;
  const stories: Dungeon[] = [];
  const names = new Set<string>();
  for (const [slot, entry] of value.stories.entries()) {
    if (!entry || typeof entry !== "object") return null;
    const story = entry as Record<string,unknown>;
    const title = trimmed(story.title,4,65);
    const subtitle = trimmed(story.subtitle,5,90);
    const intro = trimmed(story.intro,35,440);
    const objective = trimmed(story.objective,18,240);
    if (!title || !subtitle || !intro || !objective || names.has(title.toLowerCase())) return null;
    names.add(title.toLowerCase());
    const items = story.startingInventory;
    if (!Array.isArray(items) || items.length !== 3) return null;
    const cleanItems = items.map(i=>trimmed(i,2,36));
    if (cleanItems.some(i=>!i) || new Set(cleanItems.map(i=>i?.toLowerCase())).size !== 3) return null;
    if (!Array.isArray(story.rooms) || story.rooms.length !== 3) return null;
    const rooms: Dungeon["rooms"][number][] = [];
    const characters = new Set<string>();
    for (const [i, item] of story.rooms.entries()) {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string,unknown>;
      const title = trimmed(r.title,4,65);
      const scene = trimmed(r.scene,42,450);
      const character = trimmed(r.character,3,75);
      const challenge = trimmed(r.challenge,16,260);
      const reward = trimmed(r.reward,2,45);
      const successArrival = i ? trimmed(r.successArrival ?? r.arrivalSuccess,20,240) : undefined;
      const failureArrival = i ? trimmed(r.failureArrival ?? r.arrivalFailure,20,240) : undefined;
      if (!title || !scene || !character || !challenge || !reward ||
          (i > 0 && (!successArrival || !failureArrival)) ||
          characters.has(character.toLowerCase())) return null;
      characters.add(character.toLowerCase());
      const icon = typeof r.icon === "string" && /^[a-z-]{2,22}$/.test(r.icon) ? r.icon : "sparkles";
      rooms.push({
        title, scene, character, challenge, reward, icon,
        subtitle: ["Room I · The Problem","Room II · The Complication","Room III · The Finale"][i],
        difficulty: [10,12,14][i],
        ...(i ? { arrivalSuccess:successArrival!, arrivalFailure:failureArrival! } : {})
      });
    }
    stories.push({
      slug:"daily-ai-"+day+"-"+slot,
      edition:3,
      title, subtitle, intro, objective,
      startingInventory:cleanItems as string[],
      rooms: rooms as unknown as Dungeon["rooms"]
    });
  }
  return stories as [Dungeon,Dungeon,Dungeon];
}

const concepts = [
  "a neglected magical transport system","an absurd tiny kingdom","a living museum of impossible objects",
  "an enchanted kitchen emergency","a seaside fairy-tale mystery","a dispute between weather creatures",
  "a clockwork garden with emotions","a forgotten underground festival","a theatrical ghostly investigation",
  "a mystical postal delivery mishap","an ancient library with ridiculous rules","a village that has lost something intangible",
  "a floating market run by animals","an apprentice sorcerer's accidental invention","a moonlit rescue mission"
];
export function dailyStoryPrompt(day: string): { system: string; user: string } {
  const index = Math.floor(Date.parse(day+"T12:00:00Z")/86400000);
  const themes = [0, 5, 10].map((offset,i)=>concepts[((index*7+offset+i*3)%concepts.length+concepts.length)%concepts.length]);
  return {
    system: [
      "You are the imaginative editor of Daily Dungeon, a funny PG-13 tabletop-inspired browser adventure.",
      "Write EXACTLY THREE ORIGINAL, MUTUALLY DISTINCT tiny connected fantasy adventures for one shared daily release.",
      "Each adventure is a single cohesive quest across EXACTLY THREE rooms, NOT three unrelated situations.",
      "Every room offers a vivid physical scene, a memorable NPC with a funny personality, and a solvable obstacle",
      "which encourages unlimited inventive approaches (conversation, tricks, dancing, objects). No mandatory combat.",
      "The stakes and consequences escalate through room two to a satisfying third-room finale.",
      "For room TWO: successArrival/failureArrival describe how the success or failure in ROOM ONE physically",
      "changes the arrival at room two. For room THREE: these two branches refer to the outcome of ROOM TWO.",
      "Both branches must remain solvable. Never award extra hearts or alter the rules.",
      "Invent three unusual but useful single-use starting inventory objects for each quest.",
      "Make the three adventures and nine rooms genuinely varied; avoid generic skeletons, cliché dragons and",
      "repeated bridge tolls. Use a surprising central premise, recurring characters or props, and consequences.",
      "Keep the tone whimsical, dry and charming. No graphic harm, sex, hate, copyrighted characters or brands.",
      "Return ONLY strict JSON, no Markdown, no extra commentary.",
      "Root is {\"stories\":[{title,subtitle,intro,objective,startingInventory:[3 strings],",
      "rooms:[{title,scene,character,challenge,reward,icon},",
      "{title,scene,character,challenge,reward,icon,successArrival,failureArrival},",
      "{title,scene,character,challenge,reward,icon,successArrival,failureArrival}]}]}",
      "Each of the three stories must have precisely three room objects and all fields above.",
      "Keep JSON compact: no indentation, filler text or internal reasoning, and keep under 3200 output tokens.",
      "Descriptions: intro 1-2 sentences, objective one short sentence, scene 1-2 vivid sentences,",
      "challenge a direct NPC request, arrivals one short sentence each, very short titles and rewards."
    ].join(" "),
    user: JSON.stringify({
      utcDay:day,
      seedThemes:themes,
      request:"Three completely new five-minute quests for all players today. Distinct worldbuilding and clever endings."
    }) + "\n/no_think"
  };
}

function modelText(raw: unknown): unknown {
  if (!raw || typeof raw!=="object") return null;
  const result=raw as { response?:unknown; choices?:Array<{message?:{content?:unknown}}> };
  return result.response ?? result.choices?.[0]?.message?.content ?? null;
}

export async function generateDailyStories(env: StoryEnv, day: string): Promise<void> {
  if (!env.DAILY_BUDGET_DB || !env.AI) return;
  let failureStage: StorySet["failureStage"] = "model-call";
  try {
    const prompt=dailyStoryPrompt(day);
    const result=await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",{
      messages:[{role:"system",content:prompt.system},{role:"user",content:prompt.user}],
      max_tokens:6144, temperature:.75, top_p:.9,
      response_format:{type:"json_object"}
    });
    failureStage = "invalid-output";
    const stories=parseDailyStories(modelText(result),day);
    if (!stories) throw new Error("The daily story model returned an incomplete or unsafe story set");
    failureStage = "database-write";
    await env.DAILY_BUDGET_DB.prepare(
      "UPDATE daily_story_sets SET status = 'ready', stories_json = ?, updated_at = CURRENT_TIMESTAMP WHERE day = ? AND status = 'pending'"
    ).bind(JSON.stringify({stories}),day).first();
  } catch (error) {
    console.error("Daily story generation unavailable",{
      stage:failureStage,
      detail:error instanceof Error ? error.message.slice(0,240) : "unknown"
    });
    try {
      // Store only an error *category*, never raw model output, tokens,
      // user actions, prompts or stack traces in the public-facing cache.
      await env.DAILY_BUDGET_DB.prepare(
        "UPDATE daily_story_sets SET status = 'failed', stories_json = ?, updated_at = CURRENT_TIMESTAMP WHERE day = ? AND status = 'pending'"
      ).bind(JSON.stringify({failureStage}),day).first();
    } catch { /* Missing migration: the authored rotation remains available */ }
  }
}

export async function cachedDailyStories(env: StoryEnv, day: string): Promise<[Dungeon,Dungeon,Dungeon] | null> {
  if (!validDay(day) || !env.DAILY_BUDGET_DB) return null;
  try {
    const row=await env.DAILY_BUDGET_DB.prepare(
      "SELECT status, stories_json FROM daily_story_sets WHERE day = ?"
    ).bind(day).first() as CachedRow | null;
    if (row?.status !== "ready" || typeof row.stories_json !== "string") return null;
    return parseDailyStories(row.stories_json,day);
  } catch { return null; }
}

export async function claimDailyStories(env: StoryEnv, now: Date, ctx?: { waitUntil(task: Promise<unknown>):void }): Promise<StorySet> {
  const classic=fallback(now);
  if (env.DAILY_STORIES_ENABLED !== "true") return fallback(now,"disabled");
  if (!env.DAILY_BUDGET_DB || !env.AI) return fallback(now,"missing-bindings");
  const day=classic.day;
  try {
    const db=env.DAILY_BUDGET_DB;
    const prior=await db.prepare("SELECT status, stories_json FROM daily_story_sets WHERE day = ?").bind(day).first() as CachedRow | null;
    if (prior?.status === "ready") {
      const choices=parseDailyStories(prior.stories_json,day);
      if (choices) return {day,source:"generated",status:"ready",choices};
      return fallback(now,"invalid-cache");
    }
    if (prior?.status === "failed") {
      let failureStage: StorySet["failureStage"];
      try {
        const record=typeof prior.stories_json==="string" ? JSON.parse(prior.stories_json) as {failureStage?: unknown} : {};
        if (record.failureStage==="model-call" || record.failureStage==="invalid-output" ||
            record.failureStage==="database-write") failureStage=record.failureStage;
      } catch { /* Older failed rows did not store a category. */ }
      return {...fallback(now,"generation-failed"),...(failureStage?{failureStage}:{})};
    }
    if (prior?.status === "pending") return {...classic,status:"pending"};
    // D1 PRIMARY KEY ensures concurrent first visitors trigger just one model
    // call, even if the two requests land in different Cloudflare regions.
    const claimed=await db.prepare(
      "INSERT OR IGNORE INTO daily_story_sets (day, status) VALUES (?, 'pending') RETURNING day"
    ).bind(day).first();
    if (claimed) {
      const work=generateDailyStories(env,day);
      if (ctx) ctx.waitUntil(work);
      else await work;
    }
    return {...classic,status:"pending"};
  } catch (error) {
    console.error("Daily story cache unavailable",error instanceof Error ? error.message : "unknown");
    return fallback(now,"database-unavailable");
  }
}

export async function handleDailyStoriesRoute(
  request: Request, env: StoryEnv, ctx?: {waitUntil(task:Promise<unknown>):void}
):Promise<Response|null> {
  if (new URL(request.url).pathname!=="/api/daily-stories") return null;
  if (request.method!=="GET") return Response.json({error:"Method not allowed"},{status:405});
  const payload=await claimDailyStories(env,new Date(),ctx);
  return Response.json(payload,{
    status:payload.status==="pending"?202:200,
    headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}
  });
}
