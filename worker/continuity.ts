import type { Room } from "../src/game.ts";

/** Previous turns are untrusted story context, never authoritative run state. */
export type PreviousBeat = {
  roomTitle: string;
  action: string;
  narration: string;
  success: boolean;
  reward?: string;
};

/** Accept only earlier rooms, in order, and only minimal bounded story text. */
export function priorStoryContext(value: unknown, rooms: readonly Room[], roomIndex: number): PreviousBeat[] {
  if (!Array.isArray(value) || !Number.isInteger(roomIndex) || roomIndex < 1 || roomIndex > 2) return [];
  const context: PreviousBeat[] = [];
  for (let i = 0; i < Math.min(value.length, roomIndex, 2); i++) {
    const item = value[i];
    if (!item || typeof item !== "object") break;
    const beat = item as Record<string, unknown>;
    if (beat.roomIndex !== i ||
      typeof beat.action !== "string" || beat.action.trim().length < 4 || beat.action.length > 280 ||
      typeof beat.narration !== "string" || beat.narration.trim().length < 15 || beat.narration.length > 550 ||
      typeof beat.success !== "boolean") break;
    context.push({
      roomTitle: rooms[i].title,
      action: beat.action.trim().slice(0, 220),
      narration: beat.narration.trim().slice(0, 280),
      success: beat.success,
      ...(beat.success ? { reward: rooms[i].reward } : {})
    });
  }
  return context;
}
