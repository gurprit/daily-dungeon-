import type { Room } from "./game";

export type ActionOutcome = {
  success: boolean;
  roll: number;
  bonus: number;
  creativity: number;
  difficulty: number;
  heartsLost: number;
  reward: string | null;
  narration: string;
  mode: "ai" | "scripted";
};

function bonusForAction(action: string, inventory: readonly string[]): number {
  const lower = action.toLowerCase();
  const usesItem = inventory.some((item) => lower.includes(item.toLowerCase()));
  return (usesItem ? 2 : 0) + (action.trim().length >= 75 ? 1 : 0);
}

export function resolveAction(room: Room, action: string, inventory: readonly string[], roll: number, creativity = 0): ActionOutcome {
  const safeRoll = Math.max(1, Math.min(20, Math.floor(roll)));
  const wit = Math.max(0, Math.min(3, Math.floor(creativity)));
  const bonus = bonusForAction(action, inventory) + wit;
  const success = safeRoll + bonus >= room.difficulty;
  return {
    success,
    roll: safeRoll,
    bonus,
    creativity: wit,
    difficulty: room.difficulty,
    heartsLost: success ? 0 : 1,
    reward: success ? room.reward : null,
    narration: fallbackNarration(room, success),
    mode: "scripted"
  };
}

export function fallbackNarration(room: Room, success: boolean): string {
  const happy: Record<string, string> = {
    "The Old Stone Bridge": "Boggle blinks, checks a rulebook that is clearly blank, and stamps your imaginary paperwork. 'Regrettably, that counts. You may pass.'",
    "The Library of Accusations": "The books argue furiously among themselves. Madame Index declares your case 'disturbingly persuasive' and waves you onward.",
    "The Dragon's Tax Office": "Emberfax sighs so hard the furniture smoulders. 'A technically valid exemption. Disgusting.' You escape with the treasure.",
    "The Upside-Down Tavern": "Against all reasonable expectations, your plan works. The bartender reluctantly offers you a gravity voucher.",
    "The Sphinx's Day Off": "The sphinx laughs despite herself. 'Fine. That was new.' She lets you through with a theatrical bow.",
    "The Wizard's Return": "Grumble tries to look displeased, but hands over a medal. He insists it is a clerical error.",
    "The Onion Rebellion": "The onion delegates confer in tears. A peace treaty is signed, and passage is yours.",
    "The Cheese Oracle": "Brie pauses, impressed. 'That is annoyingly insightful.' A cheesy prophecy is bestowed.",
    "The Hungry King": "The king stares, takes a bite, then demands that your masterpiece be entered into the royal archives."
  };
  const sad: Record<string, string> = {
    "The Old Stone Bridge": "Boggle is unmoved. He charges you a toll in dignity instead. You squeeze past, one heart lighter.",
    "The Library of Accusations": "The books shout 'OBJECTION!' in unison. A heavy dictionary strikes your foot as you escape.",
    "The Dragon's Tax Office": "The dragon issues a fiery penalty notice. Your escape is technically successful, but painfully expensive.",
    "The Upside-Down Tavern": "The room spins. A flying tankard clips your shoulder. The bartender adds your name to the complaints book.",
    "The Sphinx's Day Off": "The sphinx yawns. 'I've seen better from a sleeping turnip.' A trapdoor drops you into the next room.",
    "The Wizard's Return": "Grumble turns your eyebrows purple. It is mostly harmless, except to your pride and one heart.",
    "The Onion Rebellion": "The onions boo in several dialects. You retreat through a cloud of weaponised tears.",
    "The Cheese Oracle": "Brie offers only a cryptic snort. A wheel of cheddar rolls over your foot on the way out.",
    "The Hungry King": "The king declares the dinner a national embarrassment. The royal guards usher you away with a stern look."
  };
  return (success ? happy[room.title] : sad[room.title]) ?? (success ? "Somehow, your audacity works. The path opens." : "Your attempt goes sideways. You stagger onward, minus one heart.");
}
