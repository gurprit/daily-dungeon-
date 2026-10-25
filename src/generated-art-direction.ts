/**
 * Stable, zero-inference art direction for an AI-written dungeon.
 * The model invents rooms every day, so a hand-authored fixed slug switch
 * cannot represent them. Choose themes from the actual generated scene canon.
 */
export type GeneratedSceneTheme =
  | "market" | "magic" | "weather" | "clockwork" | "forest"
  | "sea" | "library" | "kitchen" | "ghost" | "crystal";

const clues: readonly [GeneratedSceneTheme, RegExp][] = [
  ["market", /market|bazaar|merchant|stall|menagerie|trader|auction|shopkeeper|caravan|floating inn/i],
  ["weather", /weather|storm|sirens?|sunny|sunlight|solar|cloud|lightning|thunder|rainbow|wind|rain|sky/i],
  ["magic", /sorcer|wizard|apprentice|spell|cauldron|potion|alchemy|witch|laboratory|mystic|enchant/i],
  ["clockwork", /clock|mechanis|gear|timekeeper|hourglass|tick|automaton|machine|workshop/i],
  ["sea", /ocean|sea|reef|harbor|harbour|shore|sail|underwater|coral|mermaid|pirate/i],
  ["forest", /forest|woodland|grove|tree|mushroom|garden|orchard|root|vine|faerie|fairy/i],
  ["library", /library|archive|book|page|scroll|librarian|ink|riddle|museum|gallery/i],
  ["kitchen", /bakery|kitchen|oven|baker|chef|recipe|banquet|feast|tavern|cooking/i],
  ["ghost", /ghost|haunt|spirit|grave|crypt|moonlight|cemetery|haunted|spectre|shade/i]
];

export function generatedSceneTheme(
  storyTitle: string, roomTitle: string, sceneText: string
): GeneratedSceneTheme {
  // A room's physical surroundings take precedence over the wider quest title,
  // so moving through the quest actually changes the illustrated environment.
  const local = roomTitle + " " + sceneText;
  for (const [theme, match] of clues) if (match.test(local)) return theme;
  for (const [theme, match] of clues) if (match.test(storyTitle)) return theme;
  return "crystal";
}

export function generatedArtSeed(slug: string, room: number): number {
  let hash = 2166136261;
  for (const char of slug + "|" + room) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}
