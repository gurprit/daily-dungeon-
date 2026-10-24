import type { Dungeon, Room } from "./game";

/**
 * A miniature authored adventure: code owns the truth and consequences; the
 * Dungeon Master is free to improvise HOW the hero attempts each obstacle.
 * These helpers are deliberately pure so the Worker, UI and tests agree.
 */
export const HOLLOWMERE_DUNGEON: Dungeon = {
  slug: "bell-of-hollowmere",
  edition: 1,
  title: "The Bell of Hollowmere",
  subtitle: "Some secrets ought to stay asleep",
  intro: "Every midnight, Hollowmere's bell steals a villager's name. Tonight it has begun ringing early. The mayor offers twenty gold if you silence it before the final chime. The town is already forgetting who hired you.",
  objective: "Stop the bell stealing names before midnight, and discover why it rings.",
  startingInventory: ["Silver thimble", "Chalk", "Apple"],
  rooms: [
    {
      title: "The Frightened Guard",
      subtitle: "Room I · The Bell Tower Gate",
      scene: "A shivering goblin blocks the bell tower door. His oversized helmet keeps sliding over his eyes. He points his rusty sword at you, but keeps glancing at the door as though something inside frightens him more.",
      character: "Spoon, Reluctant Goblin Guard",
      challenge: "\"No one goes in! Unless... you can prove you're not here to make the ringing worse.\"",
      difficulty: 10,
      reward: "Spoon's brass key",
      icon: "goblin"
    },
    {
      title: "The Whispering Stair",
      subtitle: "Room II · The Missing Names",
      arrival: "The tower door opens onto a staircase where every step whispers somebody else's name.",
      scene: "Inside the tower, bronze gears turn around dozens of engraved names. One gear is cracked; each turn erases another letter. The machinery is connected to a bell hanging high above you.",
      character: "The Memory Mechanism",
      challenge: "\"Find a way to understand or stabilise these stolen names before the gears erase them.\"",
      difficulty: 12,
      reward: "Keeper's inscription",
      icon: "book"
    },
    {
      title: "The Bell and the Keeper",
      subtitle: "Room III · The Choice",
      arrival: "Beyond the broken gears, a spiral stair climbs into the bell chamber.",
      scene: "A pale ghost named Elowen is chained beneath the great bell. She confesses that stolen memories power a ward keeping an ancient sleeper under the village from waking. The bell is failing, but smashing it will break the ward.",
      character: "Elowen, Keeper of Hollowmere",
      challenge: "\"The bell must be dealt with now. Will you renew its ward, free Elowen and risk waking the sleeper, or invent a third way? Tell me what you do.\"",
      difficulty: 14,
      reward: "Hollowmere's remembrance",
      icon: "bell"
    }
  ]
};

export type StoryBeat = { action: string; success: boolean };
export type StoryClue = { id: string; title: string; text: string };
export type FinaleChoice = "renew" | "release" | "reconcile";
export type StoryEnding = {
  id: string;
  title: string;
  consequence: string;
  epilogue: string;
};

const violent = /\b(attack|stab|slash|kill|murder|hit|punch|fight|shoot|threaten|intimidate|strike|smash)\b/i;

function spoonAllied(beats: readonly StoryBeat[]): boolean {
  return !!beats[0]?.success && !violent.test(beats[0].action);
}

export function storyClues(dungeonSlug: string, beats: readonly StoryBeat[]): StoryClue[] {
  if (dungeonSlug !== HOLLOWMERE_DUNGEON.slug) return [];
  const clues: StoryClue[] = [];
  if (beats.length >= 1) {
    clues.push(spoonAllied(beats)
      ? { id: "spoon", title: "Spoon's warning", text: "Spoon trusts you. He heard someone beneath the bell whisper: 'Keep the sleeper dreaming.'" }
      : { id: "note", title: "A dropped warning", text: "At the gate you found a crumpled note: 'Do not let the sleeper wake.' Spoon has disappeared." });
  }
  if (beats.length >= 2) {
    clues.push(beats[1].success
      ? { id: "inscription", title: "The Keeper's inscription", text: "The names are not merely stolen: they hold a sleeping creature beneath Hollowmere. A willing promise might power the ward instead." }
      : { id: "broken-gear", title: "The cracked mechanism", text: "A broken gear reveals why the names vanished: the bell spends memories to keep something sleeping under the village." });
  }
  return clues;
}

export function storyRoom(dungeon: Dungeon, roomIndex: number, beats: readonly StoryBeat[]): Room {
  const room = dungeon.rooms[Math.min(2, Math.max(0, roomIndex))];
  if (dungeon.slug !== HOLLOWMERE_DUNGEON.slug || roomIndex === 0) return room;
  if (roomIndex === 1) {
    return {
      ...room,
      arrival: spoonAllied(beats)
        ? "Spoon unlocks the tower and presses a brass key into your hand. 'Don't let the thing downstairs wake,' he whispers. He follows at a safe distance."
        : "You get past Spoon, but he vanishes into the fog. A dropped note at the threshold reads: 'Do not let the sleeper wake.'",
      scene: room.scene + (spoonAllied(beats)
        ? " Spoon points out a loose plate engraved with the same symbol as his key."
        : " Without Spoon's help, you must decipher the damaged gears yourself.")
    };
  }
  return {
    ...room,
    arrival: beats[1]?.success
      ? "The deciphered inscription reveals the tower's terrible bargain. Upstairs, Elowen waits beside the bell, hoping you will choose better than her predecessors."
      : "The mechanism breaks apart and the tower trembles. You reach Elowen with only a partial warning, but there is still time to act.",
    scene: room.scene + (spoonAllied(beats)
      ? " Spoon peers around the doorway, ready to help if you call on him."
      : " Outside, Spoon has fled and the bell begins its final toll.")
      + (beats[1]?.success ? " You remember the inscription: a promise freely given can renew the magic." : ""),
  };
}

export function storyGuidance(dungeonSlug: string, roomIndex: number): string | undefined {
  if (dungeonSlug !== HOLLOWMERE_DUNGEON.slug) return undefined;
  const rules = [
    "Spoon is frightened of the bell, not evil. His goal is to keep the ancient sleeper quiet. On nonviolent success he trusts the hero; on violent success he flees but the hero enters. On failure he also flees and the hero enters at a cost. Do not reveal the ghost or full mystery yet.",
    "The machinery consumes villagers' names to sustain a sleeping ward. This clue must remain true whatever the player's method. A successful investigation reveals a willing promise could replace the stolen names.",
    "Elowen is trapped inside the bell; the ward protects the village by stealing memories. There are three morally different solutions: renew the ward while Elowen stays, free her and jeopardise the ward, or replace its fuel with willing promises. Do not declare the village's fate yourself: the authored ending decides it."
  ];
  return rules[roomIndex];
}

export function inferFinaleChoice(action: string): FinaleChoice {
  if (/\b(free|release|unbind|unshackle|destroy|break|shatter|smash|cut.*chain)\b/i.test(action)) return "release";
  if (/\b(repair|restore|renew|reseal|strengthen|keep|mend|protect|rebuild)\b/i.test(action)) return "renew";
  if (/\b(bargain|promise|volunteer|trade|offer|persuade|negotiate|convince|talk|share|transfer|replace|third way|other way)\b/i.test(action)) return "reconcile";
  // Without an intelligible attempt at a new bargain, never invent the best ending.
  return "renew";
}

export function storyEnding(
  dungeonSlug: string,
  action: string,
  success: boolean,
  remainingHearts: number,
  previous: readonly StoryBeat[],
  aiChoice?: FinaleChoice
): StoryEnding | null {
  if (dungeonSlug !== HOLLOWMERE_DUNGEON.slug) return null;
  const ally = spoonAllied(previous);
  const deciphered = !!previous[1]?.success;
  const callback = ally
    ? "Spoon salutes with a helmet that still does not fit."
    : "Spoon watches from a distant rooftop, prepared to deny knowing you.";
  if (remainingHearts <= 0) return {
    id: "last-toll",
    title: "The Last Toll",
    consequence: "The bell still rings. Your name is among those the village cannot remember.",
    epilogue: "Hollowmere does not forget you because you lacked courage. It forgets you because the failing ward took the last of your luck. The bell carries your name into the dark, and beneath the village something turns in its sleep. " + callback
  };
  if (!success) return {
    id: "another-name-lost",
    title: "Another Name Lost",
    consequence: "Your attempt faltered. The bell takes another memory, and the mystery survives.",
    epilogue: "You reach the top of the tower, but the ancient magic refuses your solution. Another stolen name disappears from a brass gear. Elowen holds the failing ward together for one more night, and you escape knowing Hollowmere is still in danger. " + callback
  };
  const choice = aiChoice ?? inferFinaleChoice(action);
  if (choice === "release") return {
    id: "keeper-unchained",
    title: "The Keeper Unchained",
    consequence: "Elowen is free, but the sleeping creature beneath Hollowmere begins to stir.",
    epilogue: "You break the ghost's chains and the bell falls silent. Elowen weeps with relief as the villagers remember their names. Then the earth answers with a slow, dreadful heartbeat. You saved one soul, but the village will need a new protection very soon. " + callback
  };
  if (choice === "renew") return {
    id: "silent-bargain",
    title: "The Silent Bargain",
    consequence: "The village is safe for now, but Elowen remains bound to the bell.",
    epilogue: "The bell falls quiet beneath your repaired ward, and the stolen memories stop draining away. Hollowmere celebrates. Only you and Elowen know the price: she must remain its lonely keeper. Perhaps the next adventure will bring a kinder solution. " + callback
  };
  return deciphered
    ? {
        id: "oath-remade",
        title: "The Oath Remade",
        consequence: "Freely offered memories power a new ward. Elowen walks free and Hollowmere survives.",
        epilogue: "You use the inscription to replace stolen names with a promise freely given. The bell rings once, not in hunger but in thanks. Elowen walks into dawn, and the sleeper below remains quiet. The villagers remember you as the stranger who found a third way. " + callback
      }
    : {
        id: "borrowed-dawn",
        title: "A Borrowed Dawn",
        consequence: "Your improvised bargain saves tonight, but the new ward needs tending.",
        epilogue: "You persuade the magic to accept a new promise in place of stolen names. Elowen can finally leave the tower, but without the full inscription the ward is fragile. Hollowmere wins a dawn, not an eternity. Someone must return to finish what you began. " + callback
      };
}
