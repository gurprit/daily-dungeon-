import type { ActionOutcome } from "./engine.ts";

/** Read the result produced by the existing D20 rules. No rerolls or new AI calls. */
export function rollBreakdown(outcome: ActionOutcome) {
  const itemBonus = Math.max(0, outcome.bonus - outcome.creativity);
  const total = outcome.roll + outcome.bonus;
  const beatsDifficulty = total >= outcome.difficulty;
  return {
    die: outcome.roll,
    creativity: outcome.creativity,
    itemBonus,
    total,
    target: outcome.difficulty,
    // A creativity 5/5 masterstroke automatically succeeds even if the roll is low.
    automaticSuccess: outcome.masterstroke && !beatsDifficulty,
    success: outcome.success,
  };
}
