/**
 * A theatrical, data-grounded fallback for saved runs and offline/scripted AI.
 * Fresh finales use a personalised epilogue from the SAME judge inference.
 * The fallback is deliberately story-led, never a second scoreboard.
 */
export function writeEpilogue(options: {
  dungeon: string;
  room: string;
  cleared: number;
  visited: number;
  hearts: number;
  lastHonour?: string;
  moments?: ReadonlyArray<{ room: string; success: boolean; action?: string }>;
}): string {
  const { dungeon, room, hearts, lastHonour, moments = [] } = options;
  const lostEarlier = moments.some(beat => !beat.success);
  const heroOfTheHour = lastHonour
    ? `And that business with “${lastHonour}”? I have entered it into the royal archives under 'Things We Are Not Encouraging'.`
    : "I shall file your exploits under 'Not a Recommended Method', right beside the exploding trousers.";

  // Even an older saved adventure deserves a callback to something the player
  // actually tried, not a generic score summary. Curated so arbitrary player
  // input is never echoed unfiltered into the Dungeon Master's voice.
  const rememberedActions = moments.map(beat => beat.action ?? "").join(" ");
  const callback = [
    [/\\bkazoo\\b/i, "That kazoo recital has been classified as a weather event. The whale insists it was not informed it would be your backing orchestra."],
    [/\\bumbrella\\b/i, "Your umbrella has been nominated for a medal. It wisely declined, citing professional embarrassment."],
    [/\\bpotato\\b/i, "The potato has lodged a formal complaint against you. I have filed it under 'Evidence', next to your common sense."],
    [/\\bcheese\\b/i, "The cheese oracle has begun charging for consultations. Your name is scribbled under 'Unpaid Debts'."],
    [/\\bpainting\\b/i, "One of the paintings has started blinking nervously whenever your name is mentioned."],
    [/\\bskeleton\\b/i, "The skeleton is still trying to convince its kneecaps that what happened was an authorised manoeuvre."],
    [/\\bdanc(?:e|ing)\\b/i, "Your dancing has been reported to the authorities as an arcane disturbance. I cannot say the witnesses are wrong."],
    [/\\bwhistle\\b/i, "The whistle is now on the museum's prohibited objects list, alongside cursed crowns and unattended adventurers."],
    [/\\bdragon\\b/i, "The dragon is claiming credit for your finest moment. I have filed an appeal, purely for entertainment."],
  ].find(([pattern]) => (pattern as RegExp).test(rememberedActions))?.[1] as string | undefined;

  const flavour: Record<string, string> = {
    "The Goblin's Toll": "Between a goblin with a clipboard, a library that files criminal charges against the moon, and a dragon running a tax office, this kingdom desperately needs new management.",
    "The Wizard's Complaint": "First the tavern forgot which way was up, then the sphinx lost interest in riddles, and finally a wizard tried to make his paperwork everybody else's problem. A perfectly ordinary Tuesday in magical administration.",
    "The Royal Pantry": "The onions have formed a union, the cheese has opinions, and the king considers impatience a substitute for seasoning. I suspect the palace's next banquet will be catered by a very frightened turnip.",
    "The Museum After Midnight": "There were moving paintings, a skeleton that needed assembly, and an exhibit that really ought to have stayed behind a locked door. The gift shop insists the screaming is part of the ambience.",
    "The Skywhale Express": "A nervous flying whale, an argumentative thundercloud and a lunar railway timetable. The transport authority has already asked whether you possess a pilot's licence. I told them not to be ridiculous."
  };

  const setting = flavour[dungeon] ?? `Even the residents of ${dungeon} have begun pretending they don't recognise you.`;

  if (hearts <= 0) {
    return `${setting} And then, at ${room}, your final shred of luck packed a suitcase and left without you. The villagers have erected a small plaque in your honour. It reads, 'We did warn them.' I, your Dungeon Master, consider this a valuable educational experience for everyone except you.`;
  }

  return [
    setting,
    lostEarlier
      ? "You escaped with your heroic reputation slightly dented, which is more than I expected after watching your earlier decisions unfold. Your confidence, however, appears completely unharmed."
      : "You somehow made it through with your dignity largely unaccounted for. The witnesses keep using the word 'genius'. I keep asking whether they were present for the same adventure.",
    ...(callback ? [callback] : []),
    heroOfTheHour
  ].join(" ");
}

/** Safe, optional text from the existing final-room AI judgment. */
export function chooseEpilogue(
  aiEpilogue: unknown,
  fallback: Parameters<typeof writeEpilogue>[0]
): string {
  if (typeof aiEpilogue === "string") {
    const cleaned = aiEpilogue.trim();
    if (cleaned.length >= 90 && cleaned.length <= 900) return cleaned;
  }
  return writeEpilogue(fallback);
}
