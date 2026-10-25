import type { Dungeon, Room } from "./game.ts";

export type ConsequenceBeat = { action: string; success: boolean };
export type RoomConsequence = {
  /** Actual physical state for the NEXT room, not merely a remembered anecdote. */
  arrival: string;
  scene: string;
  /** A short player-facing acknowledgement of their earlier result. */
  summary: string;
};

type Fork = { success: RoomConsequence; failure: RoomConsequence };
type Chapter = { second: Fork; third: Fork; opening?: Fork };

const chapters: Record<string, Chapter> = {
  "lighthouse-lost-dawn": {
    second: {
      success: {
        arrival: "Pip's lantern now guides boats through the fog. Gratefully, the little keeper unlocks a spiral stair for you.",
        scene: "Light from the repaired lantern follows you up the steps. Mallow can see by its glow, but still demands the true voice of morning.",
        summary: "You restored Pip's lantern. Its light reaches the stair and helps Mallow see you."
      },
      failure: {
        arrival: "The lantern sputters and the harbour remains perilous. Pip opens an emergency hatch into the lighthouse and begs you to try again upstairs.",
        scene: "Without a steady lantern, the singing steps are dim. Mallow must listen more closely to decide whether your voice is truly morning.",
        summary: "The lantern is still weak. You're entering the stair in near-darkness, but Mallow may help."
      }
    },
    third: {
      success: {
        arrival: "Mallow releases the genuine morning chime. Its clear note travels to the crystal lens and the little sun begins to wake.",
        scene: "The lens trembles in time with Mallow's chime, though Solbit still wants a heartfelt reason to let dawn go.",
        summary: "Your success on the stair carried a morning chime to the sun."
      },
      failure: {
        arrival: "The staircase keeps repeating the wrong tune. You reach the lens by a maintenance hatch while Mallow calls warnings after you.",
        scene: "The lens vibrates with confused night-song instead of morning. Solbit still listens, waiting for a promise that makes sense.",
        summary: "Mallow's echo remains unresolved. The sun will need convincing without its song."
      }
    }
  },
  "clockwork-orchard": {
    second: {
      success: {
        arrival: "Tock's bees buzz through the orchard again, lighting a safe route through the clicking branches.",
        scene: "The freed copper bees gather around Nutmeg's backwards-turning apple. They have not fixed it, but they make its gears visible.",
        summary: "The bees you rescued now illuminate the apple's dangerous machinery."
      },
      failure: {
        arrival: "The hive remains stubbornly silent. Tock points you down an old service path so the orchard can still be saved.",
        scene: "Nutmeg has no helpful copper bees to inspect the giant apple; the backwards-turning gears must be handled another way.",
        summary: "The bees are still on strike, so Nutmeg has to solve the apple problem without them."
      }
    },
    third: {
      success: {
        arrival: "The apple's gears stop reversing and reveal a brass hatch into the oldest tree. A hopeful tick travels through the roots.",
        scene: "A freed golden gear spins beside the sunflower clock. Professor Caw hears the sound of time trying to move forward.",
        summary: "The repaired apple sends a hopeful tick to the heartwood clock."
      },
      failure: {
        arrival: "The apple keeps counting backwards. Nutmeg digs a last-minute tunnel into the tree's heart before the frost arrives.",
        scene: "The sunflower clock is rimed with frost from the faulty apple. Professor Caw watches the hands reverse, but there is still one chance to restart spring.",
        summary: "Winter is creeping closer because the apple is still reversing time."
      }
    }
  },
  "dragon-bakery": {
    second: {
      success: {
        arrival: "Crumpet's oven roars to life. The warm dough promptly grows legs and tries to escape before the Festival of First Bread.",
        scene: "Heat makes Doughbert springier and faster, but it also fills the bakery with the wonderful smell of bread.",
        summary: "Your restored oven has woken Doughbert. Now the runaway loaf has energy to spare."
      },
      failure: {
        arrival: "The oven only coughs out a little smoke. Before you can repair it, the half-risen dough steals the last yeast.",
        scene: "Doughbert is a cold, stubborn lump with legs. Crumpet needs the stolen yeast back if the village is to be fed.",
        summary: "The oven remains cold. Catching Doughbert is now the bakery's last hope."
      }
    },
    third: {
      success: {
        arrival: "Doughbert stops fleeing and allows the bakers to prepare a feast. You hurry out as the hungry giant reaches the village.",
        scene: "Crumpet has a loaf ready to serve, though Grumble is still far too hungry to be satisfied by an ordinary offering.",
        summary: "Doughbert cooperated. You've brought actual bread to the giant's feast."
      },
      failure: {
        arrival: "Doughbert escapes with the last yeast. You reach the giant with a nearly empty serving plate and very little time.",
        scene: "Crumpet arrives out of breath with no proper loaf. Grumble is friendly for now, but his stomach can be heard across the valley.",
        summary: "Doughbert got away. You'll need a feast idea that doesn't depend on the missing loaf."
      }
    }
  },
  "midnight-museum": {
    second: {
      success: {
        arrival: "Lady Varnish finally settles into her frame. A distant clatter from the fossil gallery interrupts her triumphant bow.",
        scene: "The re-hung portrait watches Percy with stern disapproval, making the skeleton unexpectedly self-conscious.",
        summary: "Lady Varnish is back in her frame, and she's keeping an eye on the skeleton."
      },
      failure: {
        arrival: "Lady Varnish slips into another painting while you flee through the unlocked staff corridor.",
        scene: "Percy's bones are scattered across the gallery while the runaway portrait creates a second commotion behind you.",
        summary: "The escaped portrait is still roaming. Percy now has an extra distraction."
      }
    },
    third: {
      success: {
        arrival: "Percy's bones click into place. He follows you into the final gallery just as the Crown of Echoes begins to shout.",
        scene: "Percy stands nearby, able to assist if you devise a plan that involves his clockwork rhythm.",
        summary: "You helped Percy stand. He is here to support your final plan."
      },
      failure: {
        arrival: "Percy remains a heap of rattling bones, but points you toward a maintenance passage beneath the last exhibit.",
        scene: "The curator faces the Crown of Echoes without Percy's help, while loose bones keep clattering in the adjacent gallery.",
        summary: "Percy couldn't be reassembled. His rattling bones are adding to the noise."
      }
    }
  },
  "skywhale-express": {
    second: {
      success: {
        arrival: "Nimbus gathers courage and lifts the train full of passengers into the clouds, where Thunderpuff blocks the route.",
        scene: "Nimbus stays airborne, though the storm inspector is unimpressed by the whale's newfound confidence.",
        summary: "Nimbus trusts you enough to fly. Now Thunderpuff must be dealt with."
      },
      failure: {
        arrival: "Nimbus manages a shaky take-off through sheer panic. Everyone reaches the storm with their luggage scattered.",
        scene: "Thunderpuff sees a trembling whale and nervous passengers. Your next plan must get the journey moving again.",
        summary: "Nimbus took off shakily. The passengers are frightened as the storm approaches."
      }
    },
    third: {
      success: {
        arrival: "Thunderpuff begrudgingly opens a clear skyway. Nimbus reaches the drifting moon station with time to help the passengers.",
        scene: "The clouds have parted behind the train, leaving the conductor a clearer view of the loose platform.",
        summary: "Your bargain cleared the storm, buying the passengers breathing room."
      },
      failure: {
        arrival: "The storm throws everyone off course. Nimbus reaches the moon station at the last possible moment, soaked and shaken.",
        scene: "A bank of thunderclouds still obscures the drifting platform. Crescent must guide the passengers through poor visibility.",
        summary: "The storm is still raging. The final boarding attempt will be harder to coordinate."
      }
    }
  }
};

/** Pure authored branches, keyed only to resolved earlier outcomes.
 * Neither the model nor a new API call decides the physical continuity. */
export function roomConsequence(dungeonSlug: string, roomIndex: number, beats: readonly ConsequenceBeat[]): RoomConsequence | null {
  const chapter = chapters[dungeonSlug];
  if (!chapter || roomIndex < 1 || roomIndex > 2 || beats.length < roomIndex) return null;
  const last = beats[roomIndex - 1];
  if (typeof last?.success !== "boolean") return null;
  const fork = roomIndex === 1 ? chapter.second : chapter.third;
  return fork[last.success ? "success" : "failure"];
}

export function applyRoomConsequence(dungeon: Dungeon, roomIndex: number, beats: readonly ConsequenceBeat[], original: Room): Room {
  const consequence = roomConsequence(dungeon.slug, roomIndex, beats);
  return consequence ? {
    ...original,
    arrival: consequence.arrival,
    scene: original.scene + " " + consequence.scene,
    echo: consequence.summary
  } : original;
}
