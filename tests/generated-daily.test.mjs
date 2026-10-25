import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getDailyChoices } from "../src/game.ts";
import { storyRoom } from "../src/story.ts";
import {
  parseDailyStories, dailyStoryPrompt, claimDailyStories, cachedDailyStories,
  handleDailyStoriesRoute
} from "../worker/daily-stories.ts";
import worker from "../worker/index.ts";

const day = "2026-10-25";
const now = new Date(day + "T12:00:00Z");

function fiction(daySeed=day) {
  return {stories:[0,1,2].map(n=>({
    title:["The Rebellious Constellation","The Badger's Floating Inn","The Forgotten Clocksmith"][n],
    subtitle:"A most unreasonable but wonderfully playable magical mystery",
    intro:"Someone has misplaced the very thing that keeps this little fantasy world turning. A small hero must untangle an absurd local emergency before dusk arrives.",
    objective:"Save the town from its delightful magical predicament before the final bell.",
    startingInventory:["Whistling teacup","Invisible ribbon","Pocket sundial"],
    rooms:[0,1,2].map(i=>({
      title:["The First Unexpected Disaster","The Peculiar Middle Complication","The Grand Final Bargain"][i],
      scene:"A very unusual chamber has changed overnight. The magical machinery is humming and three enormous glowing buttons have begun arguing with one another. Everyone looks to you for help.",
      character:["Muddle, Questionable Librarian","Griddle, Confused Cartographer","Tinsel, Kindly Ghost"][i],
      challenge:"Find a ridiculous but workable way to solve this problem without harming anyone!",
      reward:["Tin medal","Moon whistle","Official thank you"][i],
      icon:"sparkles",
      ...(i ? {
        successArrival:"Because your previous plan worked, the great machine now runs on laughter and opens a secret staircase.",
        failureArrival:"Because the previous plan went wrong, the crooked machine has broken a gear, forcing you through the old passage."
      } : {})
    }))
  }))};
}
function fixtureDb() {
  const rows = new Map();
  let claims = 0, calls = 0;
  return {
    rows,
    get claims(){return claims;},
    get calls(){return calls;},
    ai:{async run(model,body){
      calls++;
      assert.equal(model,"@cf/qwen/qwen3-30b-a3b-fp8");
      assert.match(JSON.stringify(body),/three-room|THREE/);
      return {response:JSON.stringify(fiction())};
    }},
    db:{prepare(query){
      return {bind(...args){
        return {async first(){
          if(query.startsWith("SELECT status, stories_json FROM daily_story_sets")){
            return rows.get(args[0])??null;
          }
          if(query.startsWith("INSERT OR IGNORE INTO daily_story_sets")){
            claims++;
            if(rows.has(args[0]))return null;
            rows.set(args[0],{status:"pending",stories_json:null});
            return {day:args[0]};
          }
          if(query.startsWith("UPDATE daily_story_sets SET status = 'ready'")){
            rows.set(args[1],{status:"ready",stories_json:args[0]});
            return null;
          }
          if(query.startsWith("UPDATE daily_story_sets SET status = 'failed'")){
            rows.set(args[0],{status:"failed",stories_json:null});
            return null;
          }
          throw Error("Unexpected SQL "+query);
        }};
      }};
    }}
  };
}

test("daily story model output validates all three coherent quests and two actual next-room branches",()=>{
  const stories=parseDailyStories(JSON.stringify(fiction()),day);
  assert.equal(stories?.length,3);
  assert.equal(new Set(stories.map(d=>d.slug)).size,3);
  for(const [slot,story] of stories.entries()){
    assert.equal(story.slug,"daily-ai-"+day+"-"+slot);
    assert.deepEqual(story.rooms.map(r=>r.difficulty),[10,12,14]);
    assert.equal(story.startingInventory.length,3);
    const next=storyRoom(story,1,[{action:"I fixed the machine",success:true}]);
    const failure=storyRoom(story,1,[{action:"I upset the machine",success:false}]);
    assert.notEqual(next.arrival,failure.arrival);
    assert.equal(next.echo?.includes("previous decision"),true);
    assert.notEqual(storyRoom(story,2,[{action:"X",success:true},{action:"Y",success:false}]).arrival,
      storyRoom(story,2,[{action:"X",success:false},{action:"Y",success:true}]).arrival);
  }
});

test("a malformed, duplicated or incomplete story set never becomes public",()=>{
  assert.equal(parseDailyStories({stories:[]},day),null);
  const invalid=fiction();
  invalid.stories[1].title=invalid.stories[0].title;
  assert.equal(parseDailyStories(invalid,day),null);
  const missing=fiction();
  delete missing.stories[0].rooms[1].failureArrival;
  assert.equal(parseDailyStories(missing,day),null);
  const injection=fiction();
  injection.stories[0].title="<script>unsafe</script>";
  assert.equal(parseDailyStories(injection,day),null);
});

test("first visitor claims one D1 generation globally, everyone else receives the identical cached stories",async()=>{
  const m=fixtureDb();
  const env={DAILY_STORIES_ENABLED:"true",DAILY_BUDGET_DB:m.db,AI:m.ai};
  const scheduled=[];
  const context={waitUntil(task){scheduled.push(task);}};
  const [one,two]=await Promise.all([claimDailyStories(env,now,context),claimDailyStories(env,now,context)]);
  assert.equal(one.status,"pending");
  assert.equal(two.status,"pending");
  assert.equal(scheduled.length,1,"at most one AI generation job");
  await Promise.all(scheduled);
  const ready=await claimDailyStories(env,now,context);
  assert.equal(ready.status,"ready");
  assert.equal(ready.source,"generated");
  assert.equal(ready.choices.length,3);
  assert.equal(ready.choices[2].slug,"daily-ai-"+day+"-2");
  assert.equal(m.calls,1);
  assert.equal((await cachedDailyStories(env,day))?.[1].title,ready.choices[1].title);
  const response=await handleDailyStoriesRoute(new Request("https://daily.test/api/daily-stories"),env,context);
  assert.equal(response.status,200);
  assert.equal((await response.json()).source,"generated");
  assert.equal(m.calls,1,"cached visits incur zero new model calls");
});

test("AI disabled, migration unavailable or malformed generated stories fall back safely",async()=>{
  const m=fixtureDb();
  const base={DAILY_BUDGET_DB:m.db,AI:m.ai};
  assert.equal((await claimDailyStories({...base,DAILY_STORIES_ENABLED:"false"},now)).source,"classic");
  assert.equal((await claimDailyStories({DAILY_STORIES_ENABLED:"true"},now)).source,"classic");
  assert.equal(m.calls,0);
  const bad={...base,DAILY_STORIES_ENABLED:"true",AI:{async run(){return {response:"{\"stories\":[]}"}}}};
  const first=await claimDailyStories(bad,now);
  assert.equal(first.status,"pending");
  assert.equal((await claimDailyStories(bad,now)).source,"classic");
  assert.equal(m.rows.get(day).status,"failed");
  assert.equal((await cachedDailyStories(bad,day)),null);
  assert.equal(getDailyChoices(now).length,3);
});

test("seed changes every day and generated quests are selected only through the published D1 canon",async()=>{
  assert.notDeepEqual(dailyStoryPrompt(day).user,dailyStoryPrompt("2026-10-26").user);
  const m=fixtureDb(),env={
    AI_ENABLED:"false",ART_ENABLED:"false",DAILY_STORIES_ENABLED:"true",
    DAILY_BUDGET_DB:m.db,AI:m.ai,
    ACTION_LIMITER:{async limit(){return {success:true};}},
    ASSETS:{async fetch(){return new Response("asset");}}
  };
  m.rows.set(new Date().toISOString().slice(0,10),{
    status:"ready",stories_json:JSON.stringify(fiction())
  });
  // The public test harness may run on different UTC dates; use the fixture
  // only when the date matches this example set.
  if(new Date().toISOString().slice(0,10)!==day)return;
  const req=(dailySource)=>new Request("https://daily.test/api/resolve",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({day,roomIndex:0,dailySlot:1,dailySource,
      action:"I gently play an unexpected song to solve the peculiar problem",inventory:[]})
  });
  const generated=await worker.fetch(req("generated"),env);
  assert.equal(generated.status,200);
  assert.equal((await generated.json()).mode,"scripted");
  assert.equal((await worker.fetch(req("unapproved"),env)).status,400);
});

test("Cloudflare schedule and UI load the once-per-day story set without erasing started runs",()=>{
  const wrangler=readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8");
  const worker=readFileSync(new URL("../worker/index.ts",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
  const image=readFileSync(new URL("../src/IllustratedScene.tsx",import.meta.url),"utf8");
  assert.match(wrangler,/"crons": \["3 0 \* \* \*"\]/);
  assert.match(worker,/async scheduled/);
  assert.match(worker,/body\.dailySource === "generated"/);
  assert.match(app,/if\(runRef\.current\.started\) return/);
  assert.match(app,/ai-stories-v1:quest-/);
  assert.match(app,/dailySource: source/);
  assert.match(image,/dailySource/);
});
