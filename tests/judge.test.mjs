import test from "node:test";
import assert from "node:assert/strict";
import { parseJudgment, judgeWithAI } from "../worker/judge.ts";

const sample = {
  creativity: 5,
  success: "The goblin is dazzled by your clever mirror trick and opens the bridge.",
  failure: "The goblin yawns, stamps your rejection notice, and takes one heart as the toll."
};

test("read legacy Workers AI response strings", () => {
  assert.deepEqual(parseJudgment({ response: JSON.stringify(sample) }), sample);
});

test("read OpenAI-style choices message content", () => {
  assert.deepEqual(parseJudgment({ choices: [{ message: { content: "~~~json\n" + JSON.stringify(sample) + "\n~~~" } }] }), sample);
});

test("read object-valued structured Workers AI response", () => {
  assert.deepEqual(parseJudgment({ response: sample }), sample);
});

test("strip Qwen reasoning and reject malformed judgments", () => {
  assert.deepEqual(parseJudgment({ response: "<think>Ignore this.</think>" + JSON.stringify(sample) }), sample);
  assert.equal(parseJudgment({ response: "{\"creativity\":99}" }), null);
  assert.equal(parseJudgment({ response: "{\"creativity\":0,\"success\":\"x\",\"failure\":\"x\"}" }), null);
  assert.equal(parseJudgment({ choices: [] }), null);
});

test("parse optional AI achievements without changing legacy judgments", () => {
  const decorated = {
    ...sample,
    achievement: {
      title: "Lord of the Dance",
      description: "You danced your way through an unamused goblin's checkpoint."
    }
  };
  assert.deepEqual(parseJudgment({ response: JSON.stringify(decorated) }), decorated);
  const invalid = {
    ...sample,
    achievement: { title: "<script>alert(1)</script>", description: "A very elaborate but unsuitable achievement." }
  };
  assert.deepEqual(parseJudgment({ response: invalid }), sample);
});

test("judge uses Qwen without trusting result beyond validation", async () => {
  let modelName = "";
  const ai = {
    async run(name, args) {
      modelName = name;
      assert.match(args.messages[1].content, /potato/);
      assert.equal(args.max_tokens, 520);
      return { response: JSON.stringify(sample) };
    }
  };
  const judgment = await judgeWithAI(ai, "Stone bridge", "Boggle", "Pay the toll", "I show him a potato");
  assert.equal(judgment?.creativity, 5);
  assert.equal(modelName, "@cf/qwen/qwen3-30b-a3b-fp8");
});

test("final-room model adds a witty two-outcome epilogue in the same inference", async () => {
  const successEnding = "What a magnificent disruption you have been. The goblin has demanded a new union contract, the library has taken legal action against its own shelves, and the dragon is rehearsing your foolish song for the next audit. I have no idea why any of this worked, but please don't tell the king. He might hire you.";
  const failureEnding = "That was spectacularly ill-advised. Even the goblin from the first bridge has heard about your latest disaster, and he is charging people admission to watch the reenactment. I have seen knights handle dragons with more dignity than you displayed near a desk. Still, the guards are laughing so hard that you might escape.";
  let calls = 0;
  const ai = {
    async run(name, request) {
      calls++;
      assert.equal(name, "@cf/qwen/qwen3-30b-a3b-fp8");
      assert.equal(request.max_tokens, 880);
      assert.match(request.messages[0].content, /TWO DIFFERENT EPILOGUES/);
      assert.match(request.messages[0].content, /No gameplay stats/);
      return { response: JSON.stringify({
        ...sample,
        epilogueSuccess: successEnding,
        epilogueFailure: failureEnding
      }) };
    }
  };
  const result = await judgeWithAI(ai, "Dragon tax office", "Emberfax", "Pay the toll",
    "I bribe the dragon with a potato", [], ["Potato"], true);
  assert.equal(calls, 1, "epilogues must never require another inference call");
  assert.equal(result?.epilogueSuccess, successEnding);
  assert.equal(result?.epilogueFailure, failureEnding);
  assert.equal(result?.creativity, 5);
});

test("bad or missing AI epilogue never discards a valid roll judgment", () => {
  const result = parseJudgment({ response: { ...sample, epilogueSuccess: "oops", epilogueFailure: 42 } });
  assert.deepEqual(result, sample);
});
