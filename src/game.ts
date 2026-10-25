import { HOLLOWMERE_DUNGEON } from "./story.ts";
import { FRESH_DUNGEONS, FRESH_DUNGEON_DATES } from "./fresh-dungeons.ts";

export type Room = {
  title: string;
  subtitle: string;
  scene: string;
  arrival?: string;
  /** Fresh daily stories provide two authored world-state branches for prior outcomes. */
  arrivalSuccess?: string;
  arrivalFailure?: string;
  /** Deterministic echo of an earlier player choice, visible in the next room. */
  echo?: string;
  character: string;
  challenge: string;
  difficulty: number;
  reward: string;
  icon: string;
};

export type Dungeon = {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  objective?: string;
  startingInventory?: readonly string[];
  edition?: number;
  rooms: readonly [Room, Room, Room];
};

export const DUNGEONS: readonly Dungeon[] = [
  {
    slug: "goblins-toll",
    title: "The Goblin's Toll",
    subtitle: "A deeply unreasonable bridge policy",
    intro: "You arrive armed with little more than optimism, questionable utensils, and three precious hearts. Somewhere beyond this bridge sits a treasure no one has ever managed to keep.",
    rooms: [
      {
        title: "The Old Stone Bridge",
        subtitle: "Room I · The Tollkeeper",
        scene: "A goblin blocks a narrow bridge over a bottomless gorge. His hat is taller than he is, and his clipboard is terrifyingly official.",
        character: "Boggle, Deputy Toll Collector",
        challenge: '"To cross, give me something I have NEVER seen before!"',
        difficulty: 10,
        reward: "Goblin stamp",
        icon: "bridge"
      },
      {
        title: "The Library of Accusations",
        arrival: "Beyond Boggle’s bridge, a dusty passage brings you to a library that already knows your name.",
        subtitle: "Room II · The Witness",
        scene: "Thousands of books whisper your name. The biggest book slams shut and accuses you of stealing the moon last Tuesday.",
        character: "Madame Index, Sentient Encyclopedia",
        challenge: '"Explain yourself, moon thief! I expect evidence, not excuses."',
        difficulty: 12,
        reward: "Moon alibi",
        icon: "book"
      },
      {
        title: "The Dragon's Tax Office",
        arrival: "A door at the far end of the library leads straight into the kingdom’s treasure department.",
        subtitle: "Room III · The Finale",
        scene: "An enormous dragon sleeps beside a tiny desk. On it lies an unsigned receipt marked TREASURE DUTY: 100%. One eye opens.",
        character: "Emberfax, Dragon of Revenue",
        challenge: '"Pay your treasure tax or convince me you are exempt."',
        difficulty: 14,
        reward: "Unreasonably shiny crown",
        icon: "dragon"
      }
    ]
  },
  {
    slug: "wizard-complaint",
    title: "The Wizard's Complaint",
    subtitle: "Magic is mostly administrative",
    intro: "The local wizard has vanished, leaving three magical emergencies, seven angry complaints and a rather intimidating paper trail.",
    rooms: [
      {
        title: "The Upside-Down Tavern",
        subtitle: "Room I · The Welcome",
        scene: "The tavern has flipped upside down, sending glasses floating toward the ceiling. The bartender needs you to turn the whole place upright without breaking a single glass.",
        character: "Mira, Annoyed Bartender",
        challenge: '"Put this tavern the right way up. Without breaking my glasses."',
        difficulty: 10,
        reward: "Gravity voucher",
        icon: "tavern"
      },
      {
        title: "The Sphinx's Day Off",
        arrival: "Leaving Mira’s chaotic tavern behind, you follow the wizard’s trail to a guarded tower passage.",
        subtitle: "Room II · The Interrogation",
        scene: "A bored sphinx guards the passage. She has heard every riddle in existence, and now demands entertainment instead.",
        character: "Saffron, Tired Sphinx",
        challenge: '"Surprise me. One more conventional riddle and I scream."',
        difficulty: 12,
        reward: "Sphinx applause",
        icon: "sphinx"
      },
      {
        title: "The Wizard's Return",
        arrival: "Beyond the sphinx’s passage, your search finally ends: the missing wizard has returned.",
        subtitle: "Room III · The Finale",
        scene: "The wizard appears from a puff of glitter and immediately blames you for every problem in the kingdom.",
        character: "Archmage Grumble",
        challenge: '"Convince me you deserve a reward rather than a curse."',
        difficulty: 14,
        reward: "Apprentice's medal",
        icon: "wizard"
      }
    ]
  },
  {
    slug: "royal-pantry",
    title: "The Royal Pantry",
    subtitle: "A kingdom in culinary crisis",
    intro: "The royal feast is tonight. The chef has fled, the vegetables are organising, and the king insists this is somehow your responsibility.",
    rooms: [
      {
        title: "The Onion Rebellion",
        subtitle: "Room I · The Negotiation",
        scene: "A battalion of onions has barricaded the pantry. Their leader is holding a tiny flag and demanding safer chopping conditions.",
        character: "Captain Shallot",
        challenge: '"Persuade our vegetable union to let you through."',
        difficulty: 10,
        reward: "Onion treaty",
        icon: "onion"
      },
      {
        title: "The Cheese Oracle",
        arrival: "Past the protesting onions, you find the only creature who claims to know how the royal feast will end.",
        subtitle: "Room II · The Prophecy",
        scene: "A talking wheel of cheese predicts a terrible future for your dinner. It will only help if you ask the right question.",
        character: "Brie, Oracle of Dairy",
        challenge: '"Ask me one question that could save tonight\'s feast."',
        difficulty: 12,
        reward: "Cheesy prophecy",
        icon: "cheese"
      },
      {
        title: "The Hungry King",
        arrival: "The oracle’s chamber opens onto the royal dining hall, where the final, hungriest problem awaits.",
        subtitle: "Room III · The Finale",
        scene: "The king sits before an empty golden plate. He has the patience of a wasp and the appetite of a small nation.",
        character: "King Crumb the Unfed",
        challenge: '"Serve me a banquet worthy of the crown. Explain your masterpiece."',
        difficulty: 14,
        reward: "Royal ladle",
        icon: "king"
      }
    ]
  }
];

/** Brand-new daily QA stories. Previous authored adventures remain available in the archive/rotation. */
export const NEW_DAILY_DUNGEONS: readonly Dungeon[] = [
  {
    slug: "midnight-museum",
    edition: 2,
    title: "The Museum After Midnight",
    subtitle: "Please do not feed the exhibits",
    intro: "At midnight the museum comes alive. The paintings have escaped, the skeletons are unionising, and you're the only visitor foolish enough to stay.",
    startingInventory: ["Pocket mirror", "Paper crown", "Tin whistle"],
    rooms: [
      {
        title: "The Escaped Painting",
        subtitle: "Room I · The Gallery",
        scene: "A portrait has climbed out of its frame and is hiding behind a marble statue. The museum doors are locked until you coax it back.",
        character: "Lady Varnish, Runaway Portrait",
        challenge: '"Get me back into my frame without smudging my masterpiece!"',
        difficulty: 10, reward: "Gilded brush", icon: "painting"
      },
      {
        title: "The Clockwork Skeleton",
        arrival: "With the portrait safely hung, a corridor of dinosaur bones starts rattling in perfect rhythm.",
        subtitle: "Room II · The Fossil Hall",
        scene: "A clockwork skeleton has mixed up all its bones and refuses to let anyone past until someone helps it stand up straight.",
        character: "Percy, Assembly-Required Skeleton",
        challenge: '"Sort my bones into the right order, preferably before my head rolls away."',
        difficulty: 12, reward: "Spare rib", icon: "skeleton"
      },
      {
        title: "The Forbidden Exhibit",
        arrival: "The final display case opens by itself. Inside is an empty pedestal and a very worried museum curator.",
        subtitle: "Room III · The Grand Finale",
        scene: "The legendary Crown of Echoes has begun copying everything anyone says, threatening to wake the whole city.",
        character: "Curator Nocturne",
        challenge: '"Silence this enchanted crown and save my museum before the bells strike one!"',
        difficulty: 14, reward: "Midnight museum pass", icon: "crown"
      }
    ]
  },
  {
    slug: "skywhale-express",
    edition: 2,
    title: "The Skywhale Express",
    subtitle: "All aboard the impossible",
    intro: "Your train to the moon is a gigantic flying whale. Unfortunately, it has stage fright, storm clouds are demanding tickets, and the moon station closes at dawn.",
    startingInventory: ["Feather umbrella", "Bottle of bubbles", "Copper kazoo"],
    rooms: [
      {
        title: "A Whale with Stage Fright",
        subtitle: "Room I · The Departure",
        scene: "A vast blue skywhale floats beside a cloud platform. It refuses to take off because everyone is staring at its enormous fins.",
        character: "Nimbus, Nervous Skywhale",
        challenge: '"Help me feel brave enough to carry the passengers into the sky!"',
        difficulty: 10, reward: "Skywhale ticket", icon: "whale"
      },
      {
        title: "The Thundercloud Tollbooth",
        arrival: "The whale finally rises above the rooftops, where a stern thundercloud blocks the route to the moon.",
        subtitle: "Room II · The Storm",
        scene: "A grumbling thundercloud refuses to let the skywhale through unless somebody pays a toll in something more original than money.",
        character: "Inspector Thunderpuff",
        challenge: '"Pay my impossible toll or find a clever way through my storm!"',
        difficulty: 12, reward: "Storm button", icon: "cloud"
      },
      {
        title: "The Moon Station",
        arrival: "Beyond the storm, the moon station glows. The final train platform is drifting away into the stars.",
        subtitle: "Room III · Last Call",
        scene: "A sleepy moon conductor announces that the platform has broken loose from the station. The last train departs in moments.",
        character: "Conductor Crescent",
        challenge: '"Get every passenger safely onto this drifting platform before the doors close!"',
        difficulty: 14, reward: "Moonlight medal", icon: "moon"
      }
    ]
  }
];

/** Date-scoped replacement: keeps earlier achievements intact but refreshes 24/25 Oct. */
const DAILY_OVERRIDE: Record<string, Dungeon> = {
  "2026-10-24": NEW_DAILY_DUNGEONS[0],
  "2026-10-25": NEW_DAILY_DUNGEONS[1],
  "2026-10-26": HOLLOWMERE_DUNGEON,
  [FRESH_DUNGEON_DATES[0]]: FRESH_DUNGEONS[0],
  [FRESH_DUNGEON_DATES[1]]: FRESH_DUNGEONS[1],
  [FRESH_DUNGEON_DATES[2]]: FRESH_DUNGEONS[2]
};

const EPOCH_UTC = Date.UTC(2026, 9, 23);
const DAY_MS = 24 * 60 * 60 * 1000;

export function getDailyGame(now: Date = new Date()) {
  const dayIndex = Math.max(0, Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - EPOCH_UTC) / DAY_MS));
  const day = now.toISOString().slice(0, 10);
  const dungeon = DAILY_OVERRIDE[day] ?? DUNGEONS[dayIndex % DUNGEONS.length];
  return { day, number: dayIndex + 1, dungeon };
}

/** Today's shared three-quest menu. Every quest is its own three-room story.
 * The authored pool is finite: titles do reappear, but the selection changes
 * with the UTC day. The featured quest remains slot 0 for old saved runs. */
export type DailyChoice = ReturnType<typeof getDailyGame>;
const dailyPool: readonly Dungeon[] = [
  ...DUNGEONS, ...NEW_DAILY_DUNGEONS, HOLLOWMERE_DUNGEON, ...FRESH_DUNGEONS
];

export function getDailyChoices(now: Date = new Date()): readonly [DailyChoice, DailyChoice, DailyChoice] {
  const featured = getDailyGame(now);
  const index = featured.number - 1;
  const result: Dungeon[] = [featured.dungeon];
  // A non-unit stride through nine stories produces a changing daily slate.
  // Exclude the featured story and favour something other than yesterday's
  // featured quest when we have spare options.
  const yesterday = getDailyGame(new Date(now.getTime() - DAY_MS)).dungeon.slug;
  const start = (index * 5 + 1) % dailyPool.length;
  for (let pass = 0; pass < 2 && result.length < 3; pass++) {
    for (let step = 0; step < dailyPool.length && result.length < 3; step++) {
      const candidate = dailyPool[(start + step) % dailyPool.length];
      if (result.some(dungeon => dungeon.slug === candidate.slug)) continue;
      if (pass === 0 && candidate.slug === yesterday) continue;
      result.push(candidate);
    }
  }
  return result.map(dungeon => ({
    day: featured.day, number: featured.number, dungeon
  })) as [DailyChoice, DailyChoice, DailyChoice];
}

/** The slot is validated at the API boundary before any game rules are run. */
export function getDailyGameForSlot(slot: 0 | 1 | 2, now: Date = new Date()): DailyChoice {
  return getDailyChoices(now)[slot];
}

/** Dedicated fresh playtest dates. Old live/daily entries remain untouched. */
export function getFreshPreviewGame(index: 0 | 1 | 2) {
  return getDailyGame(new Date(FRESH_DUNGEON_DATES[index] + "T12:00:00Z"));
}

/** Developer-only date preview: use the next UTC dungeon without advancing real clocks. */
export function getPreviewDailyGame(now: Date = new Date()) {
  return getDailyGame(new Date(now.getTime() + DAY_MS));
}

export const STARTING_INVENTORY = ["Potato", "String", "Rusty spoon"] as const;
