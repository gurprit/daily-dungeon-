import type { Room } from "./game";

export type Achievement = {
  title: string;
  description: string;
};

/**
 * Cheap, predictable awards for the scripted playtest and for saved runs created
 * before the AI started returning achievements. Live AI can invent better titles.
 */
/** Deterministic variation: refreshing a saved run never rerolls award copy. */
function stableChoice(value: string, length: number): number {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % length;
}

export function fallbackAchievement(
  action: string,
  roomTitle: string,
  success: boolean,
  creativity = 0
): Achievement | null {
  if (!success) return null;
  const text = action.toLowerCase();
  const matches: Array<{ pattern: RegExp; title: string; description: string }> = [
    {
      pattern: /\b(danc(?:e|es|ed|ing)|disco|moonwalk|twerk(?:s|ed|ing)?|ballet|tap.danc(?:e|ing)|boog(?:ie|ying))\b/i,
      title: "Lord of the Dance",
      description: "You danced through danger and somehow made it look like a plan."
    },
    {
      pattern: /\b(potato|spud|tater)\b/i,
      title: "The Spud Diplomat",
      description: "You gave an ordinary potato an extraordinary role in your negotiations."
    },
    {
      pattern: /\b(sing|sang|song|lullaby|serenad(?:e|ing))\b/i,
      title: "The Ballad of Bad Decisions",
      description: "You trusted your singing voice more than your survival instincts."
    },
    {
      pattern: /\b(brib(?:e|ed|ing)|pay(?:ing)? off|tip(?:ped|ping)?|offer.*coin)\b/i,
      title: "Coin-Operated Diplomacy",
      description: "You discovered that almost every problem has a suspiciously convenient price."
    },
    {
      pattern: /\b(spoon)\b/i,
      title: "Spoon of Destiny",
      description: "You turned humble cutlery into the hero of the story."
    },
    {
      pattern: /\b(union|strike|collective bargain|workers.rights)\b/i,
      title: "Goblin Union Representative",
      description: "You brought collective bargaining to a deeply unprepared dungeon."
    },
    {
      pattern: /\b(reflect(?:ion)?|mirror|polish.*shield)\b/i,
      title: "Master of Reflections",
      description: "You used a little perspective to escape a very large problem."
    }
  ];
  if (/\b(thimble|kiss)\b/i.test(text) && roomTitle === "The Frightened Guard") {
    return { title: "Thimble Diplomacy", description: "A kiss, a promise, and one deeply confused goblin." };
  }
  if (/\b(key|unlock|plate|inscription)\b/i.test(text) && roomTitle === "The Whispering Stair") {
    return { title: "Namekeeper's Key", description: "One turn of a key, and oblivion lost its footing." };
  }
  const matching = matches.find(award => award.pattern.test(text));
  if (matching) {
    // A few light, room-sensitive quips give familiar actions distinct payoffs.
    // The initial bridge badge stays unchanged for compatibility with old saves.
    const dance = matches[0].pattern.test(text);
    if (dance && roomTitle !== "The Old Stone Bridge") {
      const variants: Achievement[] = roomTitle === "The Bell and the Keeper"
        ? [
            { title: "The Ward Waltz", description: "The bell survived your choreography. Your dignity is still missing." },
            { title: "Promise in Motion", description: "An ancient ward accepted a dance as legally binding." },
            { title: "Rhythm of the Realm", description: "You danced at destiny. Destiny blinked first." }
          ]
        : [
            { title: "Unexpected Choreography", description: "An unusual obstacle met a spectacularly unusual shuffle." },
            { title: "The Diplomatic Two-Step", description: "Apparently diplomacy has a rhythm. Yours was alarming." },
            { title: "Dancefloor Diplomacy", description: "You danced through trouble without a single sensible step." }
          ];
      return variants[stableChoice(action + roomTitle, variants.length)];
    }
    if (/\b(key|unlock|plate|inscription)\b/i.test(text) && roomTitle === "The Whispering Stair") {
      return { title: "Namekeeper's Key", description: "One turn of a key, and oblivion lost its footing." };
    }
    if (/\b(thimble|kiss|promise)\b/i.test(text) && roomTitle === "The Frightened Guard") {
      return { title: "Thimble Diplomacy", description: "A kiss, a promise, and one deeply confused goblin." };
    }
    const alternate: Record<string, Achievement[]> = {
      "The Spud Diplomat": [
        { title: "Spud Negotiator", description: "The potato now has diplomatic immunity. Don't ask." },
        { title: "Tater Tactics", description: "Your vegetable strategy was somehow the least dangerous option." }
      ],
      "The Ballad of Bad Decisions": [
        { title: "The Unlikely Bard", description: "Nobody requested an encore. The door opened anyway." },
        { title: "Singing for Survival", description: "A performance best remembered from a safe distance." }
      ],
      "Spoon of Destiny": [
        { title: "Cutlery of Courage", description: "The humble spoon has asked for its own legend." },
        { title: "Utensil Genius", description: "History will remember the spoon. Possibly not you." }
      ]
    };
    const variants = alternate[matching.title];
    if (variants && roomTitle !== "The Old Stone Bridge") {
      return variants[stableChoice(action + roomTitle, variants.length)];
    }
    return { title: matching.title, description: matching.description };
  }
  if (creativity < 4) return null;
  const roomTitles: Record<string, string> = {
    "The Old Stone Bridge": "Bridge of Questionable Genius",
    "The Library of Accusations": "Defender of the Moon",
    "The Dragon's Tax Office": "Royal Tax Loophole",
    "The Upside-Down Tavern": "Gravity's Least Favourite",
    "The Sphinx's Day Off": "Certified Sphinx Surprise",
    "The Wizard's Return": "Accidental Archmage",
    "The Onion Rebellion": "Champion of the Shallots",
    "The Cheese Oracle": "The Prophecy Whisperer",
    "The Hungry King": "Banquet of the Bold"
  };
  return {
    title: roomTitles[roomTitle] ?? "Hero of Unlikely Schemes",
    description: [
      "An audacious solution. The rulebook is considering retirement.",
      "The Dungeon Master approves. Quietly, to avoid encouraging you.",
      "Surprisingly brilliant. Please refrain from making it a habit.",
      "The witnesses are confused. I call that a success."
    ][stableChoice(action + roomTitle, 4)]
  };
}

export function achievementFromJudgment(
  room: Room,
  action: string,
  success: boolean,
  creativity: number,
  generated: Achievement | null | undefined
): Achievement | null {
  if (!success || creativity < 4) return null;
  // Retire repetitive stock titles outside their original encounter.
  if (generated?.title === "Lord of the Dance" && room.title !== "The Old Stone Bridge") {
    return fallbackAchievement(action, room.title, success, creativity);
  }
  return generated ?? fallbackAchievement(action, room.title, success, creativity);
}

export function isAchievement(value: unknown): value is Achievement {
  if (!value || typeof value !== "object") return false;
  const award = value as Partial<Achievement>;
  return typeof award.title === "string" && award.title.trim().length >= 3 &&
    award.title.length <= 60 && typeof award.description === "string" &&
    award.description.trim().length >= 12 && award.description.length <= 180;
}

export function cleanGeneratedAchievement(value: unknown): Achievement | null {
  if (!isAchievement(value)) return null;
  const raw = value as Achievement;
  // Keep AI-generated titles short, single-line and free of markup/URLs.
  if (/[<>{}\r\n]/.test(raw.title + raw.description) ||
      /https?:\/\/|www\./i.test(raw.title + raw.description)) return null;
  // Award descriptions should feel like a quick Dungeon Master aside, not an
  // additional paragraph. Keep the whole first sentence or cap long prose.
  const description = raw.description.trim();
  const sentence = description.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? description;
  const brief = sentence.split(/\s+/).slice(0, 18).join(" ");
  return { title: raw.title.trim(), description: brief };
}
