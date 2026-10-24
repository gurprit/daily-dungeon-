import type { Dungeon } from "./game.ts";

/** Each equipped prop is single-use in the current five-minute ruleset. */
export function startingItems(dungeon: Dungeon): string[] {
  return [...(dungeon.startingInventory ?? ["Potato", "String", "Rusty spoon"])];
}

export function itemCatalog(dungeon: Dungeon): string[] {
  return [...new Set([...startingItems(dungeon), ...dungeon.rooms.map(room => room.reward)])];
}

function mentionsItem(action: string, item: string): boolean {
  const quote = item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp("(^|[^a-z0-9])" + quote + "(?=$|[^a-z0-9])", "i").test(action);
}

/** Deterministic inventory handling. An item disappears when mentioned in an action,
 * even if the roll fails. Rewards are only granted for successes. */
export function itemsUsed(action: string, inventory: readonly string[]): string[] {
  return inventory.filter(item => mentionsItem(action, item));
}

export function unavailableItems(action: string, inventory: readonly string[], catalog: readonly string[]): string[] {
  const owned = new Set(inventory);
  return catalog.filter(item => !owned.has(item) && mentionsItem(action, item));
}

export function inventoryAfterTurn(inventory: readonly string[], usedItems: readonly string[], reward: string | null): string[] {
  const spent = new Set(usedItems);
  const result = inventory.filter(item => !spent.has(item));
  if (reward && !result.includes(reward)) result.push(reward);
  return result;
}
