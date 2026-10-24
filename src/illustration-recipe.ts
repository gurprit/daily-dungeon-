/** Deterministic visual storytelling. Pure rules; no image model, API or assets. */
export type VisualKind = "room" | "action" | "clue" | "ending";
export type VisualGesture = "dance" | "kiss" | "offer" | "unlock" | "spell" | "fight" | "sneak" | "talk" | "inspect" | "misc";
export type VisualProp = "key" | "thimble" | "apple" | "scroll" | "sword" | "gear" | "mirror" | "wand" | "heart" | "none";
export type VisualMood = "triumph" | "setback" | "mystery" | "hope" | "danger" | "melancholy";
export type VisualRecipe = {
  gesture: VisualGesture;
  prop: VisualProp;
  mood: VisualMood;
  seed: number;
  accent: string;
  ending: string;
  variant: number;
};
export type VisualInput = {
  kind: VisualKind;
  dungeonSlug: string;
  roomIndex: number;
  action?: string;
  narration?: string;
  success?: boolean;
  clueId?: string;
  endingId?: string;
};

export function illustrationHash(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  }
  return result >>> 0;
}

export function makeVisualRecipe(input: VisualInput): VisualRecipe {
  // The narrative is not an instruction source; we only look for known visual motifs.
  const action = (input.action ?? "").toLowerCase().slice(0, 280);
  const context = (input.narration ?? "").toLowerCase().slice(0, 550);
  const gesture: VisualGesture =
    /\b(danc\w*|waltz|twirl|disco|boogie|twerk\w*|pirouette)\b/.test(action) ? "dance" :
    /\b(kiss\w*|smooch\w*|hug\w*)\b/.test(action) ? "kiss" :
    /\b(unlock\w*|open\w*|turn.*key|use.*key|insert\w*)\b/.test(action) ? "unlock" :
    /\b(offer\w*|give|gift\w*|brib\w*|hand\w*|trade\w*)\b/.test(action) ? "offer" :
    /\b(spell\w*|magic\w*|cast\w*|enchant\w*|summon\w*|ward\w*)\b/.test(action) ? "spell" :
    /\b(attack\w*|threaten\w*|stab\w*|fight\w*|punch\w*|hit|slash\w*|kick\w*)\b/.test(action) ? "fight" :
    /\b(sneak\w*|hide|creep\w*|tiptoe|invisible)\b/.test(action) ? "sneak" :
    /\b(talk\w*|persuad\w*|ask|tell|promise\w*|convinc\w*|negotia\w*)\b/.test(action) ? "talk" :
    /\b(read\w*|inspect\w*|study|look|investigat\w*|search\w*|deciph\w*)\b/.test(action) ? "inspect" : "misc";
  const prop: VisualProp =
    /\bthimble\b/.test(action) ? "thimble" :
    /\b(key|unlock)\b/.test(action) ? "key" :
    /\b(apple|fruit)\b/.test(action) ? "apple" :
    /\b(mirror|reflection)\b/.test(action) ? "mirror" :
    /\b(scroll|letter|note|book|inscription|plate)\b/.test(action) ? "scroll" :
    /\b(sword|dagger|knife|blade)\b/.test(action) ? "sword" :
    /\b(gear|clock|mechanism)\b/.test(action) ? "gear" :
    /\b(wand|staff|spell)\b/.test(action) ? "wand" :
    /\b(heart|love|kiss)\b/.test(action) ? "heart" : "none";
  const ending = input.endingId ?? "unwritten";
  const mood: VisualMood = input.kind === "ending"
    ? /unchained|defeat|last-toll/.test(ending) ? "danger"
      : /silent-bargain|another-name-lost/.test(ending) ? "melancholy" : "hope"
    : input.kind === "clue" || input.kind === "room" ? "mystery"
      : input.success === false ? "setback" : "triumph";
  const seed = illustrationHash([
    input.dungeonSlug, input.roomIndex, input.kind, action,
    context, input.clueId ?? "", ending, String(input.success)
  ].join("|"));
  const accent = mood === "danger" ? "#e8868c" : mood === "setback" ? "#e0a18c"
    : mood === "melancholy" ? "#b6aed6" : mood === "hope" ? "#bce6c3"
      : mood === "triumph" ? "#edc682" : "#a6ccca";
  return { gesture, prop, mood, seed, accent, ending, variant: seed % 5 };
}

export function visualSeedPoints(seed: number, count: number): Array<{ x: number; y: number; size: number; delay: number }> {
  let state = seed || 1;
  const rand = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: 15 + rand() * 290,
    y: 14 + rand() * 173,
    size: 1.3 + rand() * 3.5,
    delay: rand() * 3
  }));
}
