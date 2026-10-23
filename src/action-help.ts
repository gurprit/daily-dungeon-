import type { Room } from "./game";

export type ActionStarter = { label: string; draft: string; tip: string };

/**
 * Editable beginnings rather than auto-solved answers.
 * Nobody needs to know what D&D is to play.
 */
export function actionStarters(room: Room, inventory: readonly string[]): ActionStarter[] {
  const character = room.character.split(",")[0];
  const item = inventory.find(value => value.toLowerCase() !== "potato") ?? inventory[0] ?? "a clever trick";
  return [
    {
      label: "Use an item",
      draft: `I use my ${item.toLowerCase()} to `,
      tip: "What could this item do in the room?"
    },
    {
      label: "Talk it out",
      draft: `I try to persuade ${character} by `,
      tip: "Make an offer, tell a story, or negotiate."
    },
    {
      label: "Be ridiculous",
      draft: "My completely ridiculous plan is to ",
      tip: "Surprising ideas are welcome. Explain your plan!"
    }
  ];
}

export function firstRoomTip(): string {
  return "There's no single right answer. Type what YOU would try. The Dungeon Master reacts to your idea and the dice decide what happens.";
}
