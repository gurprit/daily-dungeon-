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

test("judge uses Qwen without trusting result beyond validation", async () => {
  let modelName = "";
  const ai = {
    async run(name, args) {
      modelName = name;
      assert.match(args.messages[1].content, /potato/);
      assert.equal(args.max_tokens, 400);
      return { response: JSON.stringify(sample) };
    }
  };
  const judgment = await judgeWithAI(ai, "Stone bridge", "Boggle", "Pay the toll", "I show him a potato");
  assert.equal(judgment?.creativity, 5);
  assert.equal(modelName, "@cf/qwen/qwen3-30b-a3b-fp8");
});
