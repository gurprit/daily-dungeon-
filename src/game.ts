export type Room = {
  title: string;
  subtitle: string;
  scene: string;
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
        scene: "The entire tavern is floating upside down. The bartender is standing on the ceiling, refusing to serve gravity-defying customers.",
        character: "Mira, Annoyed Bartender",
        challenge: '"Put this tavern the right way up. Without breaking my glasses."',
        difficulty: 10,
        reward: "Gravity voucher",
        icon: "tavern"
      },
      {
        title: "The Sphinx's Day Off",
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

const EPOCH_UTC = Date.UTC(2026, 9, 23);
const DAY_MS = 24 * 60 * 60 * 1000;

export function getDailyGame(now: Date = new Date()) {
  const dayIndex = Math.max(0, Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - EPOCH_UTC) / DAY_MS));
  const dungeon = DUNGEONS[dayIndex % DUNGEONS.length];
  return { day: now.toISOString().slice(0, 10), number: dayIndex + 1, dungeon };
}

/** Developer-only date preview: use the next UTC dungeon without advancing real clocks. */
export function getPreviewDailyGame(now: Date = new Date()) {
  return getDailyGame(new Date(now.getTime() + DAY_MS));
}

export const STARTING_INVENTORY = ["Potato", "String", "Rusty spoon"] as const;
