import type { Room } from "./game";

export type Achievement = {
  title: string;
  description: string;
};

/**
 * Cheap, predictable awards for the scripted playtest and for saved runs created
 * before the AI started returning achievements. Live AI can invent better titles.
 */
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
  const matching = matches.find(award => award.pattern.test(text));
  if (matching) return { title: matching.title, description: matching.description };
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
    description: "The Dungeon Master grudgingly admits your solution was surprisingly inventive."
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
  return { title: raw.title.trim(), description: raw.description.trim() };
}
