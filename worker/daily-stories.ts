import { getDailyChoices, type Dungeon } from "../src/game.ts";

/**
 * One global D1 claim generates and caches three complete adventures daily.
 * Each adventure gets its own short JSON-mode model call, for three bounded
 * calls per UTC day rather than one oversized nine-room request.
 * Not one call per player, room, or Cloudflare colo.
 */
export type StorySet = {
  day: string;
  source: "generated" | "classic";
  status: "ready" | "pending" | "fallback";
  /** Safe status for diagnosing config/AI failures without exposing user data. */
  reason?: "disabled" | "missing-bindings" | "database-unavailable" | "generation-failed" | "invalid-cache";
  failureStage?: "model-call" | "invalid-output" | "database-write";
  /** Zero-based adventure slot that failed, if one specific model call did. */
  failureSlot?: 0 | 1 | 2;
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

/** Structured output may be a direct object, a JSON string, or a wrapper
 * around a single story. Never trust it as a gameplay or HTML instruction. */
function decodedJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g,"").trim();
  const begin = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
  if (begin < 0 || end <= begin) return null;
  try { return JSON.parse(cleaned.slice(begin,end+1)); }
  catch { return null; }
}

function parseStoryEntry(entry: unknown, day: string, slot: number): Dungeon | null {
  if (!validDay(day) || !Number.isInteger(slot) || slot < 0 || slot > 2 ||
      !entry || typeof entry !== "object") return null;
  const story=entry as Record<string,unknown>;
  const title=trimmed(story.title,4,65);
  const subtitle=trimmed(story.subtitle,5,90);
  const intro=trimmed(story.intro,35,440);
  const objective=trimmed(story.objective,18,240);
  if (!title || !subtitle || !intro || !objective) return null;
  const items=story.startingInventory;
  if (!Array.isArray(items) || items.length!==3) return null;
  const inventory=items.map(i=>trimmed(i,2,36));
  if(inventory.some(i=>!i) || new Set(inventory.map(i=>i?.toLowerCase())).size!==3) return null;
  if(!Array.isArray(story.rooms) || story.rooms.length!==3) return null;
  const rooms: Dungeon["rooms"][number][]=[];
  const characters=new Set<string>();
  for(const [i,item] of story.rooms.entries()){
    if(!item || typeof item!=="object") return null;
    const r=item as Record<string,unknown>;
    const title=trimmed(r.title,4,65);
    const scene=trimmed(r.scene,42,450);
    const character=trimmed(r.character,3,75);
    const challenge=trimmed(r.challenge,16,260);
    const reward=trimmed(r.reward,2,45);
    const success=i?trimmed(r.successArrival??r.arrivalSuccess,20,240):undefined;
    const failure=i?trimmed(r.failureArrival??r.arrivalFailure,20,240):undefined;
    if(!title || !scene || !character || !challenge || !reward ||
       (i>0 && (!success || !failure)) || characters.has(character.toLowerCase()))return null;
    characters.add(character.toLowerCase());
    const icon=typeof r.icon==="string" && /^[a-z-]{2,22}$/.test(r.icon)?r.icon:"sparkles";
    rooms.push({
      title,scene,character,challenge,reward,icon,
      subtitle:["Room I · The Problem","Room II · The Complication","Room III · The Finale"][i],
      difficulty:[10,12,14][i],
      ...(i?{arrivalSuccess:success!,arrivalFailure:failure!}:{})
    });
  }
  return {
    slug:"daily-ai-"+day+"-"+slot,edition:3,
    title,subtitle,intro,objective,startingInventory:inventory as string[],
    rooms:rooms as unknown as Dungeon["rooms"]
  };
}

/** One compact model response per adventure; accepts {story}, {stories:[x]},
 * and a direct story object. */
export function parseDailyStory(raw: unknown, day: string, slot: number): Dungeon | null {
  const value=decodedJson(raw);
  if (!value || typeof value!=="object") return null;
  const answer=value as { story?:unknown; stories?:unknown };
  const entry=answer.story ??
    (Array.isArray(answer.stories) && answer.stories.length===1 ? answer.stories[0] : value);
  return parseStoryEntry(entry,day,slot);
}

/** Existing D1 story sets are validated independently of the model format.
 * All three must be correct before the day's generated set can be published. */
export function parseDailyStories(raw: unknown, day: string): [Dungeon,Dungeon,Dungeon] | null {
  const answer=decodedJson(raw);
  if(!answer || typeof answer!=="object")return null;
  const value=answer as { stories?:unknown };
  if(!Array.isArray(value.stories) || value.stories.length!==3)return null;
  const stories=value.stories.map((entry,i)=>parseStoryEntry(entry,day,i));
  if(stories.some(s=>!s))return null;
  const titles=stories.map(s=>s!.title.toLowerCase());
  if(new Set(titles).size!==3)return null;
  return stories as [Dungeon,Dungeon,Dungeon];
}

const concepts = [
  "a neglected magical transport system","an absurd tiny kingdom","a living museum of impossible objects",
  "an enchanted kitchen emergency","a seaside fairy-tale mystery","a dispute between weather creatures",
  "a clockwork garden with emotions","a forgotten underground festival","a theatrical ghostly investigation",
  "a mystical postal delivery mishap","an ancient library with ridiculous rules","a village that has lost something intangible",
  "a floating market run by animals","an apprentice sorcerer's accidental invention","a moonlit rescue mission"
];
// A deliberately small schema: three rooms are generated separately, not
// nine rooms with dozens of constraints in one huge completion.
export const SINGLE_STORY_JSON_SCHEMA = {
  type:"object",
  properties:{
    story:{
      type:"object",
      properties:{
        title:{type:"string"},subtitle:{type:"string"},
        intro:{type:"string"},objective:{type:"string"},
        startingInventory:{type:"array",items:{type:"string"}},
        rooms:{type:"array",items:{
          type:"object",
          properties:{
            title:{type:"string"},scene:{type:"string"},
            character:{type:"string"},challenge:{type:"string"},
            reward:{type:"string"},icon:{type:"string"},
            successArrival:{type:"string"},failureArrival:{type:"string"}
          },
          required:["title","scene","character","challenge","reward","icon"]
        }}
      },
      required:["title","subtitle","intro","objective","startingInventory","rooms"]
    }
  },
  required:["story"]
} as const;

export function dailyStoryPrompt(day: string, slot: 0|1|2 = 0): { system: string; user: string } {
  const index=Math.floor(Date.parse(day+"T12:00:00Z")/86400000);
  const theme=concepts[((index*7+slot*5+slot*3)%concepts.length+concepts.length)%concepts.length];
  return {
    system:[
      "You create ONE original, fun, PG-13 fantasy micro-adventure for Daily Dungeon.",
      "Exactly three linked rooms, one compelling mission and a satisfying conclusion.",
      "Invent a unique setting, recurring mystery, vivid NPCs, and obstacles open to freeform player solutions.",
      "The player can dance, negotiate, improvise, use items or attempt noncombat plans.",
      "Keep stakes funny and meaningful, with an escalating complication in room 2 and finale in room 3.",
      "Return JSON with exactly ONE 'story' object, NOT three stories.",
      "Story needs title,subtitle,intro,objective, startingInventory (three distinct named items),",
      "and rooms (EXACTLY THREE room objects).",
      "Each room has title,scene,character,challenge,reward,icon.",
      "Rooms 2 and 3 MUST also include successArrival and failureArrival.",
      "Those describe how the previous room's success or failure physically changes the NEXT scene.",
      "Keep each branch solvable and never decide the dice or add/remove health.",
      "Use two or three lively sentences for scenes, one short sentence for arrivals.",
      "Be creative, weird and witty. Use simple descriptive nouns instead of existing fictional franchises.",
      "Keep fields concise but meaningful; return only well-formed JSON."
    ].join(" "),
    user:JSON.stringify({
      utcDay:day,adventureNumber:slot+1,corePremise:theme,
      avoid:"generic dragons, bridge tolls, wizard paperwork, repetitive medieval clichés",
      request:"ONE complete, original 3-room adventure and its consequence branches."
    })
  };
}

function modelText(raw: unknown): unknown {
  if (!raw || typeof raw!=="object") return null;
  const result=raw as { response?:unknown; choices?:Array<{message?:{content?:unknown}}> };
  return result.response ?? result.choices?.[0]?.message?.content ?? null;
}

export async function generateDailyStories(env: StoryEnv, day: string): Promise<void> {
  if(!env.DAILY_BUDGET_DB || !env.AI)return;
  let failureStage:StorySet["failureStage"]="model-call";
  let failureSlot:StorySet["failureSlot"];
  try {
    // Three small independent completions are much more robust than one
    // oversized, frequently malformed nine-room JSON completion.
    // The D1 daily claim still allows exactly one set-generation attempt.
    const attempts=await Promise.allSettled(([0,1,2] as const).map(async slot=>{
      const prompt=dailyStoryPrompt(day,slot);
      const result=await env.AI!.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",{
        messages:[{role:"system",content:prompt.system},{role:"user",content:prompt.user}],
        max_tokens:2600,temperature:.72,top_p:.9,
        response_format:{type:"json_schema",json_schema:SINGLE_STORY_JSON_SCHEMA}
      });
      const story=parseDailyStory(modelText(result),day,slot);
      if(!story)throw new Error("invalid-output");
      return story;
    }));
    const failedIndex=attempts.findIndex(outcome=>outcome.status==="rejected");
    if(failedIndex>=0)failureSlot=failedIndex as 0|1|2;
    const invalid=attempts.some(outcome=>outcome.status==="rejected" &&
      outcome.reason instanceof Error && outcome.reason.message==="invalid-output");
    if(attempts.some(outcome=>outcome.status==="rejected")){
      failureStage=invalid?"invalid-output":"model-call";
      throw new Error("A daily adventure could not be validated");
    }
    const stories=attempts.map(outcome=>(outcome as PromiseFulfilledResult<Dungeon>).value);
    if(new Set(stories.map(story=>story.title.toLowerCase())).size!==3){
      failureStage="invalid-output";
      throw new Error("Duplicate daily adventure titles");
    }
    // Validate the exact persisted schema before publishing the shared set.
    if(!parseDailyStories({stories},day)){
      failureStage="invalid-output";
      throw new Error("Daily story set did not pass final validation");
    }
    failureStage="database-write";
    await env.DAILY_BUDGET_DB.prepare(
      "UPDATE daily_story_sets SET status = 'ready', stories_json = ?, updated_at = CURRENT_TIMESTAMP WHERE day = ? AND status = 'pending'"
    ).bind(JSON.stringify({stories}),day).first();
  }catch(error){
    console.error("Daily story generation unavailable",{
      stage:failureStage,
      ...(failureSlot!==undefined?{slot:failureSlot}:{}),
      detail:error instanceof Error?error.message.slice(0,240):"unknown"
    });
    try{
      await env.DAILY_BUDGET_DB.prepare(
        "UPDATE daily_story_sets SET status = 'failed', stories_json = ?, updated_at = CURRENT_TIMESTAMP WHERE day = ? AND status = 'pending'"
      ).bind(JSON.stringify({failureStage,...(failureSlot!==undefined?{failureSlot}:{})}),day).first();
    }catch{ /* Existing authored rotation remains playable. */ }
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
      let failureSlot: StorySet["failureSlot"];
      try {
        const record=typeof prior.stories_json==="string" ? JSON.parse(prior.stories_json) as {failureStage?: unknown; failureSlot?:unknown} : {};
        if (record.failureStage==="model-call" || record.failureStage==="invalid-output" ||
            record.failureStage==="database-write") failureStage=record.failureStage;
        if(record.failureSlot===0||record.failureSlot===1||record.failureSlot===2)failureSlot=record.failureSlot;
      } catch { /* Older failed rows did not store a category. */ }
      return {...fallback(now,"generation-failed"),...(failureStage?{failureStage}:{}),
        ...(failureSlot!==undefined?{failureSlot}:{})};
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
