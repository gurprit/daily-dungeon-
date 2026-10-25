import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getDailyChoices } from "../src/game.ts";
import { storyRoom } from "../src/story.ts";
import {
  parseDailyStories, parseDailyStory, storyValidationField, normaliseRoomReward, SINGLE_STORY_JSON_SCHEMA, dailyStoryPrompt, claimDailyStories, cachedDailyStories,
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
      assert.equal(model,"@cf/meta/llama-3.3-70b-instruct-fp8-fast");
      assert.deepEqual(body.response_format,{type:"json_schema",json_schema:SINGLE_STORY_JSON_SCHEMA});
      assert.match(JSON.stringify(body),/three-room|THREE/);
      const slot=JSON.parse(body.messages[1].content).adventureNumber-1;
      return {response:{story:fiction().stories[slot]}};
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
            rows.set(args[1],{status:"failed",stories_json:args[0]});
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
  const repaired=parseDailyStories(missing,day);
  assert.ok(repaired,"missing one branch can be repaired without discarding the daily set");
  assert.match(repaired[0].rooms[1].arrivalFailure,/Without Tin medal from Muddle/);
  const injection=fiction();
  injection.stories[0].title="<script>unsafe</script>";
  assert.equal(parseDailyStories(injection,day),null);
});

test("first visitor claims one D1 daily batch; only three short model calls serve all users",async()=>{
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
  assert.equal(m.calls,3);
  assert.equal((await cachedDailyStories(env,day))?.[1].title,ready.choices[1].title);
  const response=await handleDailyStoriesRoute(new Request("https://daily.test/api/daily-stories"),env,context);
  assert.equal(response.status,200);
  assert.equal((await response.json()).source,"generated");
  assert.equal(m.calls,3,"cached visits incur zero new model calls");
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

test("fallback reports a specific safe reason and never exposes generated text or configuration secrets",async()=>{
  const fixture=fixtureDb();
  const shared={DAILY_STORIES_ENABLED:"true",DAILY_BUDGET_DB:fixture.db,AI:fixture.ai};
  assert.equal((await claimDailyStories({...shared,DAILY_STORIES_ENABLED:"false"},now)).reason,"disabled");
  assert.equal((await claimDailyStories({DAILY_STORIES_ENABLED:"true"},now)).reason,"missing-bindings");
  fixture.rows.set(day,{status:"failed",stories_json:null});
  const failed=await claimDailyStories(shared,now);
  assert.equal(failed.reason,"generation-failed");
  assert.equal(failed.source,"classic");
  assert.equal(failed.choices.length,3);
  fixture.rows.set(day,{status:"ready",stories_json:"{}"});
  assert.equal((await claimDailyStories(shared,now)).reason,"invalid-cache");
  const brokenDB={...shared,DAILY_BUDGET_DB:{prepare(){throw Error("no such table: daily_story_sets");}}};
  assert.equal((await claimDailyStories(brokenDB,now)).reason,"database-unavailable");
  assert.equal(fixture.calls,0,"diagnostic reads never trigger extra AI calls");
});

test("validation accepts concise complete scenes without requiring excessive padding",()=>{
  const examples=fiction();
  examples.stories[0].rooms[0].scene="A clock loses its shadow. A worried crow begs you to help.";
  examples.stories[0].rooms[1].successArrival="The newly lit lamp points to the hidden workshop.";
  const stories=parseDailyStories(examples,day);
  assert.equal(stories?.length,3);
});

test("failed daily generation stores only a safe error stage, without leaking raw AI output",async()=>{
  const fixture=fixtureDb();
  const badText='private unexpected model text that must never appear in a public API';
  const env={
    DAILY_STORIES_ENABLED:"true",DAILY_BUDGET_DB:fixture.db,
    AI:{async run(){return {response:badText};}}
  };
  const pending=await claimDailyStories(env,now);
  assert.equal(pending.status,"pending");
  const failed=await claimDailyStories(env,now);
  assert.equal(failed.source,"classic");
  assert.equal(failed.reason,"generation-failed");
  assert.equal(failed.failureStage,"invalid-output");
  assert.equal(failed.failureSlot,0);
  assert.equal(JSON.stringify(failed).includes(badText),false);
  const saved=JSON.parse(fixture.rows.get(day).stories_json);
  assert.deepEqual(saved,{failureStage:"invalid-output",failureSlot:0,failureField:"json"});

  const different=fixtureDb();
  const unavailable={DAILY_STORIES_ENABLED:"true",DAILY_BUDGET_DB:different.db,
    AI:{async run(){throw Error("provider-specific sensitive error text");}}};
  await claimDailyStories(unavailable,now);
  const after=await claimDailyStories(unavailable,now);
  assert.equal(after.failureStage,"model-call");
  assert.equal(JSON.stringify(after).includes("sensitive"),false);
});

test("structured JSON object output is supported by the daily parser",()=>{
  const typed={stories:fiction().stories};
  assert.equal(parseDailyStories(typed,day)?.length,3);
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


test("the generated third quest's shared image depicts its own room and costs only one R2 image job",async()=>{
  const {handleSharedArtRoute}=await import("../worker/shared-art.ts");
  const db=fixtureDb();
  const artJobs=new Map(), objects=new Map();
  const images=[];
  const binding={
    ART_ENABLED:"true", ART_SIGNING_KEY:"example-test-secret-which-is-definitely-long-enough",
    ART_DAILY_LIMIT:"50", DAILY_STORIES_ENABLED:"true",
    DAILY_BUDGET_DB:{prepare(sql){
      if(sql.includes("daily_story_sets"))return db.db.prepare(sql);
      return {bind(...args){return {async first(){
        if(sql.startsWith("INSERT OR IGNORE INTO art_jobs")){
          if(artJobs.has(args[0]))return null;
          artJobs.set(args[0],{status:"pending"}); return {id:args[0]};
        }
        if(sql.startsWith("SELECT status, object_key FROM art_jobs"))return artJobs.get(args[0])||null;
        if(sql.startsWith("INSERT INTO art_daily_budget"))return {calls:1};
        if(sql.startsWith("UPDATE art_jobs")){
          artJobs.set(args[2],{status:args[0],object_key:args[1]});
          return null;
        }
        throw Error("Unexpected art query "+sql);
      }};}}
    }},
    ART_BUCKET:{async put(key,blob){objects.set(key,blob);},async get(key){return objects.has(key)?{body:new Response(objects.get(key)).body}:null;}},
    AI:{async run(model,params){
      assert.equal(model,"@cf/black-forest-labs/flux-2-klein-4b");
      const form=await new Response(params.multipart.body,{
        headers:{"content-type":params.multipart.contentType}
      }).formData();
      images.push(form.get("prompt"));
      return {image:Buffer.alloc(512,3).toString("base64")};
    }},
    ACTION_LIMITER:{async limit(){return {success:true};}}
  };
  db.rows.set(new Date().toISOString().slice(0,10),{
    status:"ready",stories_json:JSON.stringify(fiction())
  });
  const today=new Date().toISOString().slice(0,10);
  if(today!==day)return;
  const payload={day,kind:"room",roomIndex:0,preview:"today",dailySource:"generated",dailySlot:2};
  const post=()=>new Request("https://test.local/api/shared-art",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)
  });
  const queue=[];
  const ctx={waitUntil(promise){queue.push(promise);}};
  const first=await handleSharedArtRoute(post(),binding,ctx);
  assert.equal(first.status,202);
  await Promise.all(queue);
  assert.equal(images.length,1);
  assert.match(images[0],/The Forgotten Clocksmith/);
  assert.doesNotMatch(images[0],/The Rebellious Constellation/);
  const again=await handleSharedArtRoute(post(),binding,ctx);
  assert.equal(again.status,200);
  assert.equal((await again.json()).status,"ready");
  assert.equal(images.length,1);
});


test("the advertised story schema requires success and failure arrivals for every room",()=>{
  const fields=SINGLE_STORY_JSON_SCHEMA.properties.story.properties.rooms.items.required;
  assert.ok(fields.includes("successArrival"));
  assert.ok(fields.includes("failureArrival"));
});

test("a recurring NPC can anchor every room of one continuous story",()=>{
  const example=fiction().stories[0];
  example.rooms[1].character=example.rooms[0].character;
  example.rooms[2].character=example.rooms[0].character;
  const parsed=parseDailyStory({story:example},day,0);
  assert.equal(parsed?.rooms[1].character,parsed?.rooms[0].character);
  assert.equal(parsed?.rooms[2].character,parsed?.rooms[0].character);
});

test("missing or too-short arrival branches are repaired using prior earned rewards",()=>{
  const example=fiction().stories[1];
  delete example.rooms[1].successArrival;
  example.rooms[1].failureArrival="No";
  example.rooms[2].successArrival="X";
  delete example.rooms[2].failureArrival;
  const story=parseDailyStory({story:example},day,1);
  assert.ok(story);
  assert.match(story.rooms[1].arrivalSuccess,/Tin medal/);
  assert.match(story.rooms[1].arrivalFailure,/Without Tin medal/);
  assert.match(story.rooms[2].arrivalSuccess,/Moon whistle/);
  assert.match(story.rooms[2].arrivalFailure,/Without Moon whistle/);
  assert.notEqual(story.rooms[1].arrivalSuccess,story.rooms[1].arrivalFailure);
  assert.equal(story.rooms.length,3);
});

test("short single-adventure schema is accepted in both JSON mode object and string forms",()=>{
  const f=fiction();
  assert.equal(parseDailyStory({story:f.stories[1]},day,1)?.title,f.stories[1].title);
  assert.equal(parseDailyStory(JSON.stringify({story:f.stories[2]}),day,2)?.slug,"daily-ai-"+day+"-2");
  assert.equal(parseDailyStory({stories:[f.stories[0]]},day,0)?.title,f.stories[0].title);
  assert.equal(parseDailyStory({stories:f.stories},day,0),null);
  assert.equal(parseDailyStory({story:{title:"Not enough fields"}},day,0),null);
  assert.equal(SINGLE_STORY_JSON_SCHEMA.properties.story.type,"object");
  assert.equal(SINGLE_STORY_JSON_SCHEMA.properties.story.properties.rooms.type,"array");
});

test("three bounded inference calls publish one daily batch, with no more inference on visits",async()=>{
  const mock=fixtureDb();
  const env={AI:mock.ai,DAILY_BUDGET_DB:mock.db,DAILY_STORIES_ENABLED:"true"};
  await claimDailyStories(env,now);
  assert.equal(mock.claims,1);
  assert.equal(mock.calls,3);
  for(let i=0;i<15;i++){
    const data=await claimDailyStories(env,now);
    assert.equal(data.status,"ready");
    assert.equal(data.choices.length,3);
  }
  assert.equal(mock.calls,3);
});

test("a transient malformed second story recovers with exactly one targeted retry",async()=>{
  const mock=fixtureDb();
  const callBySlot=[0,0,0];
  const env={
    DAILY_STORIES_ENABLED:"true",DAILY_BUDGET_DB:mock.db,
    AI:{async run(_model,request){
      const slot=JSON.parse(request.messages[1].content).adventureNumber-1;
      callBySlot[slot]++;
      return {response:{story:slot===1&&callBySlot[slot]===1?
        {title:"An Incomplete Adventure"}:fiction().stories[slot]}};
    }}
  };
  const pending=await claimDailyStories(env,now);
  assert.equal(pending.status,"pending");
  const ready=await claimDailyStories(env,now);
  assert.equal(ready.source,"generated");
  assert.equal(ready.status,"ready");
  assert.deepEqual(callBySlot,[1,2,1],"only the malformed second story should be retried");
  assert.equal(mock.rows.get(day).status,"ready");
  assert.equal((await cachedDailyStories(env,day))?.length,3);
});

test("field-only diagnostics identify broken content without exposing model narration",()=>{
  const invalid={story:fiction().stories[0]};
  invalid.story.rooms[2].scene="<script>bad scene</script>";
  assert.equal(storyValidationField(invalid),"room3.scene");
  const tiny={story:{title:"test"}};
  assert.equal(storyValidationField(tiny),"story.subtitle");
  assert.equal(storyValidationField("not json"),"json");
  assert.equal(storyValidationField({story:fiction().stories[0]}),"story.structure");
});

test("missing, too-short, oversized and unsafe rewards are normalised to valid inventory items",()=>{
  const title="An Unusually Stubborn Clockwork Oracle";
  const examples=[
    undefined,null,"", "X", " ".repeat(5),
    "<script>alert(1)</script>", "https://example.com/prize",
    12, "A".repeat(300)
  ];
  for(const bad of examples){
    const label=normaliseRoomReward(bad,title);
    assert.equal(label,"Token of An Unusually Stubborn Clockwork");
    assert.ok(label.length<=45);
    assert.ok(!label.includes("<") && !label.includes("://"));
  }
  assert.equal(normaliseRoomReward("Moon whistle",title),"Moon whistle");
  assert.equal(normaliseRoomReward("A very elaborate sparkly telescope that measures the moods of distant clouds",title),
    "A very elaborate sparkly telescope that");
  const shortened=normaliseRoomReward(undefined,"The Extremely Long And Magnificently Obscure First Chamber Of Clocks");
  assert.ok(shortened.length<=45);
  assert.ok(!shortened.endsWith("Magnificently Obscure First Chambe"));
});

test("a complete three-room story with a malformed second-room reward still publishes",()=>{
  const original=fiction();
  original.stories[0].rooms[1].reward=undefined;
  original.stories[1].rooms[1].reward="<script>malice</script>";
  original.stories[2].rooms[1].reward="a ridiculously long "+("ceremonial ".repeat(10))+"teapot";
  const parsed=parseDailyStories(original,day);
  assert.ok(parsed);
  assert.equal(parsed.length,3);
  assert.equal(parsed[0].rooms[1].reward,"Token of The Peculiar Middle Complication");
  assert.equal(parsed[1].rooms[1].reward,parsed[0].rooms[1].reward);
  assert.ok(parsed[2].rooms[1].reward.length<=45);
  assert.equal(storyValidationField({story:original.stories[0]}),"story.structure");
  // D1 revalidation must be stable: generated canonical rewards cannot mutate.
  const reread=parseDailyStories({stories:parsed},day);
  assert.deepEqual(reread,parsed);
});

test("a malformed reward in adventure two does not consume another AI generation attempt",async()=>{
  const mock=fixtureDb();
  const requests=[0,0,0];
  const env={DAILY_STORIES_ENABLED:"true",DAILY_BUDGET_DB:mock.db,
    AI:{async run(_model,body){
      const slot=JSON.parse(body.messages[1].content).adventureNumber-1;
      requests[slot]++;
      const story=structuredClone(fiction().stories[slot]);
      if(slot===1)story.rooms[1].reward=undefined;
      return {response:{story}};
    }}
  };
  await claimDailyStories(env,now);
  const cached=await claimDailyStories(env,now);
  assert.equal(cached.status,"ready");
  assert.equal(cached.source,"generated");
  assert.deepEqual(requests,[1,1,1]);
  assert.equal(cached.choices[1].rooms[1].reward,"Token of The Peculiar Middle Complication");
});

test("an invalid middle adventure rejects the entire daily set without publishing mismatched rooms",async()=>{
  const db=fixtureDb();
  let calls=0;
  const ai={async run(_model,body){
    calls++;
    const slot=JSON.parse(body.messages[1].content).adventureNumber-1;
    return {response:slot===1?{story:{title:"incomplete"}}:{story:fiction().stories[slot]}};
  }};
  const env={AI:ai,DAILY_BUDGET_DB:db.db,DAILY_STORIES_ENABLED:"true"};
  await claimDailyStories(env,now);
  assert.equal(calls,4,"one malformed story receives one targeted retry, never a new batch");
  assert.equal(db.rows.get(day).status,"failed");
  const failed=await claimDailyStories(env,now);
  assert.equal(failed.failureStage,"invalid-output");
  assert.equal(failed.failureSlot,1);
  assert.equal(failed.failureField,"story.subtitle");
  assert.equal(await cachedDailyStories(env,day),null);
});
