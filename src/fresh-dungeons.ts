import type { Dungeon } from "./game.ts";

/**
 * A genuinely fresh batch for NES artwork testing. Different locations,
 * silhouettes, items and effects; every dungeon has one connected objective.
 * Each date is also a future real daily so preview and published canon agree.
 */
export const FRESH_DUNGEON_DATES = ["2026-10-27", "2026-10-28", "2026-10-29"] as const;
export const FRESH_PREVIEW_MODES = ["fresh-1", "fresh-2", "fresh-3"] as const;
export type FreshPreviewMode = (typeof FRESH_PREVIEW_MODES)[number];

export function freshPreviewIndex(value: unknown): 0 | 1 | 2 | null {
  if (value === "fresh-1" || value === 1) return 0;
  if (value === "fresh-2" || value === 2) return 1;
  if (value === "fresh-3" || value === 3) return 2;
  return null;
}

export const FRESH_DUNGEONS: readonly [Dungeon, Dungeon, Dungeon] = [
  {
    slug: "lighthouse-lost-dawn",
    edition: 1,
    title: "The Lighthouse of Lost Dawn",
    subtitle: "Someone has misplaced the sunrise",
    intro: "Morning has failed to arrive at Brinewatch. The village lighthouse shines with stolen starlight, and ships are sailing in circles. Restore the dawn before the sea decides it owns the town.",
    objective: "Recover the missing sunrise and relight Brinewatch lighthouse before the tide covers the harbour.",
    startingInventory: ["Jar of fireflies", "Copper bell", "Polished seashell"],
    rooms: [
      {
        title: "The Drowsy Harbour",
        subtitle: "Room I · The Lantern",
        scene: "A little blue lighthouse rises above a moonlit harbour. Keeper Pip, a sleepy otter in a yellow raincoat, has lost the flame that guides ships past the rocks. Its empty lantern swings in the salty wind.",
        character: "Keeper Pip, Raincoat-Wearing Otter",
        challenge: "\"Help me light the lantern without setting the fishing boats on fire!\"",
        difficulty: 10, reward: "Lantern prism", icon: "lantern"
      },
      {
        title: "The Singing Spiral Stair",
        arrival: "With the lantern shining, Pip unlocks a narrow stair that coils through the heart of the lighthouse.",
        subtitle: "Room II · The Echo",
        scene: "Every stair is a shell that repeats a different voice. A giant pink moon-moth guards the final landing and refuses passage unless you find the true voice of morning hidden among the echoes.",
        character: "Mallow, Moon-Moth of the Stair",
        challenge: "\"Show me the sound that belongs to the sunrise, not the midnight sea.\"",
        difficulty: 12, reward: "Morning chime", icon: "moth"
      },
      {
        title: "The Sunrise Lens",
        arrival: "A pure morning note resonates through the stairwell, revealing a doorway into the lighthouse's glass heart.",
        subtitle: "Room III · The Dawn",
        scene: "At the top, a gold-rimmed crystal lens traps a tiny orange sun inside it. The impatient sea has begun swallowing the harbour below. The lens will release dawn only for a clever, heartfelt promise.",
        character: "Solbit, Pocket-Sized Sunrise",
        challenge: "\"Convince me that the world deserves another morning!\"",
        difficulty: 14, reward: "Dawnkeeper's badge", icon: "sun"
      }
    ]
  },
  {
    slug: "clockwork-orchard",
    edition: 1,
    title: "The Clockwork Orchard",
    subtitle: "Fruit has developed a mechanical fault",
    intro: "The royal orchard grows brass apples and ticking pears. Today the clockwork bees have gone on strike, and its great tree has begun counting backwards toward winter.",
    objective: "Restart the orchard's heart before the last brass apple falls and the valley freezes.",
    startingInventory: ["Wind-up mouse", "Silver ribbon", "Acorn whistle"],
    rooms: [
      {
        title: "The Beekeeper's Workshop",
        subtitle: "Room I · The Hive",
        scene: "A small robot gardener in green overalls watches copper bees circle a silent mechanical hive. Its giant wind-up key is missing; the bees refuse to pollinate even one flower.",
        character: "Tock, Tinplate Beekeeper",
        challenge: "\"Find a wonderfully ridiculous way to restart my bees!\"",
        difficulty: 10, reward: "Copper bee", icon: "bee"
      },
      {
        title: "The Upside-Down Apple",
        arrival: "The grateful bees reveal a hidden path between trees of clicking copper leaves.",
        subtitle: "Room II · The Branches",
        scene: "A huge red mechanical apple hangs upside down from a tree of golden gears. A squirrel with a tiny wrench clings to the branch, shouting that every turn of its gears moves winter closer.",
        character: "Nutmeg, Inventor Squirrel",
        challenge: "\"Stop that backwards-turning apple before the orchard freezes!\"",
        difficulty: 12, reward: "Golden gear", icon: "apple"
      },
      {
        title: "The Heartwood Clock",
        arrival: "The apple's mechanism reveals a brass door deep inside the oldest tree.",
        subtitle: "Room III · Spring",
        scene: "At the heart of the orchard stands a huge sleeping sunflower made of brass petals. Its central clock has stopped one tick before spring. A blue iron crow sits on the clock, refusing to move.",
        character: "Professor Caw, Iron Crow",
        challenge: "\"Give the orchard one good reason to keep time moving forward!\"",
        difficulty: 14, reward: "Springtime cog", icon: "flower"
      }
    ]
  },
  {
    slug: "dragon-bakery",
    edition: 1,
    title: "The Dragon's Last Bakery",
    subtitle: "One final loaf to save the kingdom",
    intro: "The kingdom's smallest dragon runs its largest bakery. Its magical oven has gone cold just before the Festival of First Bread, and an enormous hungry shadow is approaching from the hills.",
    objective: "Bake a legendary loaf and feed the approaching giant before the village becomes its breakfast.",
    startingInventory: ["Sack of cinnamon", "Wooden rolling pin", "Golden raisin"],
    rooms: [
      {
        title: "The Cold Dragon Oven",
        subtitle: "Room I · The Kitchen",
        scene: "An orange baby dragon in a tall chef's hat stands beside a stone oven with a tiny dark firebox. The bakery is piled with uncooked dough; the dragon has sneezed out its last spark.",
        character: "Crumpet, Apprentice Baker Dragon",
        challenge: "\"Help me relight this oven without burning down my bakery!\"",
        difficulty: 10, reward: "Warm ember", icon: "oven"
      },
      {
        title: "The Runaway Dough",
        arrival: "A small happy flame returns to the oven. Immediately, the dough notices and tries to escape.",
        subtitle: "Room II · The Kneading",
        scene: "A giant ball of living bread dough bounces through the flour-filled kitchen on stubby legs. Crumpet waves a spoon while the dough steals the yeast and heads for the pantry.",
        character: "Doughbert, Runaway Loaf",
        challenge: "\"Catch or persuade this loaf before it eats our last yeast!\"",
        difficulty: 12, reward: "Yeast charm", icon: "bread"
      },
      {
        title: "The Hungry Hill",
        arrival: "With the dough finally under control, you hurry out to meet the shadow looming beyond the bakery.",
        subtitle: "Room III · The Feast",
        scene: "A friendly-looking stone giant with a long beard sits outside the tiny bakery. Its stomach rumbles like thunder. In its enormous hands is a plate no bigger than a coin.",
        character: "Grumble, Gentle Hungry Giant",
        challenge: "\"Present a feast worthy of my appetite before I mistake the village for a biscuit!\"",
        difficulty: 14, reward: "Legendary bread medal", icon: "giant"
      }
    ]
  }
];
