/** A short, deterministic final word. Never spends an extra Dungeon Master AI call. */
export function writeEpilogue(options: {
  dungeon: string;
  room: string;
  cleared: number;
  visited: number;
  hearts: number;
  lastHonour?: string;
}): string {
  const { dungeon, room, cleared, visited, hearts, lastHonour } = options;
  const trials = `${cleared} of ${visited} trials`;
  const accolade = lastHonour
    ? `The Dungeon Master records your achievement, “${lastHonour}”, for future generations to question.`
    : "The Dungeon Master makes a note in the archives, although the handwriting looks suspiciously like a shrug.";

  if (hearts <= 0) {
    return `Your adventure through ${dungeon} came to an end in ${room}. You cleared ${trials} before your final heart gave out. ${accolade}`;
  }
  return `You emerged from ${dungeon} with ${trials} cleared and ${hearts} heart${hearts === 1 ? "" : "s"} remaining. ${accolade}`;
}
