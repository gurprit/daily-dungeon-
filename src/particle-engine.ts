import type { EffectPlan } from "./effect-presets.ts";
import type { VisualInput } from "./illustration-recipe.ts";

/**
 * A tiny deterministic JS particle engine. Canvas particles are graphics only:
 * they never call a network service and never change game logic.
 */
export type ParticleKind = "flame" | "ember" | "magic" | "dust" | "ghost" | "paint" | "impact";
export type Emitter = {
  kind: ParticleKind;
  x: number;
  y: number;
  count: number;
  spread: number;
  color: string;
};
export type Particle = {
  emitter: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  life: number;
  age: number;
  radius: number;
  phase: number;
  spin: number;
  wobble: number;
};
export type ParticleWorld = {
  emitters: Emitter[];
  particles: Particle[];
  state: number;
  elapsed: number;
};

const palette = {
  flame: "#fcb967", ember: "#ffe3a2", magic: "#b6e9f2", dust: "#e3c9a8",
  ghost: "#a9e7d9", paint: "#d6a2d5", impact: "#f9a6a0"
} satisfies Record<ParticleKind, string>;

function random(world: ParticleWorld): number {
  // Xorshift32 gives stable replay, and avoids expensive random allocations.
  let n = world.state || 0x1234567;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  world.state = n >>> 0;
  return world.state / 4294967296;
}

export function emittersForScene(plan: EffectPlan, input: VisualInput): Emitter[] {
  const list: Emitter[] = [];
  const add = (kind: ParticleKind, x: number, y: number, count: number, spread: number, color = palette[kind]) =>
    list.push({ kind, x, y, count, spread, color });

  if (plan.ambient.includes("fire")) {
    add("flame", 46, 132, 8, 9);
    add("ember", 46, 124, 6, 12);
    add("flame", 274, 132, 8, 9);
    add("ember", 274, 124, 6, 12);
  }
  if (plan.ambient.includes("ghost") || plan.theme === "bell-ghost") add("ghost", 166, 115, 14, 60);
  if (plan.ambient.includes("paint")) add("paint", 238, 58, 7, 35);
  if (plan.ambient.includes("curse")) add("magic", 165, 92, 15, 59, "#d9a8f5");
  if (plan.ambient.includes("gears")) add("ember", 187, 109, 9, 34);
  if (plan.ambient.includes("dust") && !plan.ambient.includes("fire")) add("dust", 170, 111, 9, 140);

  if (input.kind === "action") {
    if (plan.action.includes("runes")) add("magic", 156, 100, 17, 62);
    if (plan.action.includes("hearts")) add("magic", 171, 73, 9, 40, "#ffc0d2");
    if (plan.action.includes("notes")) add("magic", 155, 57, 12, 70, "#f9d78a");
    if (plan.action.includes("sparks") || plan.action.includes("impact")) add("impact", 200, 99, 12, 27);
    if (plan.action.includes("sound")) add("magic", 181, 93, 8, 43, "#d6c9fc");
    if (plan.result.includes("triumph")) add("ember", 159, 143, 6, 80, "#f9dfad");
    if (plan.result.includes("failure")) add("impact", 183, 98, 8, 64, "#e7889e");
  } else if (input.kind === "ending") {
    add(plan.result.includes("failure") ? "ghost" : "magic", 166, 88, 17, 91,
      plan.result.includes("failure") ? "#c2a4e5" : "#b8f0d1");
  }
  // Clue cards are small and don't need an expensive particle layer.
  if (input.kind === "clue") return [];
  // Upper bound: even overlapping presets cannot create an unbounded particle storm.
  let remaining = 62;
  return list.map(e => {
    const count = Math.max(0, Math.min(e.count, remaining));
    remaining -= count;
    return { ...e, count };
  }).filter(e => e.count > 0);
}

function resetParticle(p: Particle, world: ParticleWorld, first = false) {
  const emitter = world.emitters[p.emitter];
  const r = () => random(world);
  p.originX = emitter.x + (r() - .5) * emitter.spread;
  p.originY = emitter.y + (r() - .5) * (emitter.kind === "dust" ? 115 : emitter.spread * .35);
  p.x = p.originX;
  p.y = p.originY;
  p.radius = emitter.kind === "flame" ? 2.4 + r() * 3.8 : 1 + r() * 2.3;
  p.phase = r() * Math.PI * 2;
  p.spin = .6 + r() * 2;
  p.wobble = 1.3 + r() * 4.5;
  const rising = emitter.kind === "flame" || emitter.kind === "ember" || emitter.kind === "ghost" || emitter.kind === "magic";
  p.vx = (r() - .5) * (emitter.kind === "impact" ? 66 : 15);
  p.vy = emitter.kind === "impact" ? (r() - .5) * 75
    : emitter.kind === "paint" ? 8 + r() * 12
    : rising ? -(11 + r() * (emitter.kind === "ember" ? 34 : 20))
    : (r() - .5) * 8;
  p.life = emitter.kind === "impact" ? .65 + r() * .75 : 1.3 + r() * 2.7;
  p.age = first ? r() * p.life : 0;
}

export function createParticleWorld(emitters: Emitter[], seed: number): ParticleWorld {
  const world: ParticleWorld = {
    emitters, particles: [], state: seed || 0x1234567, elapsed: 0
  };
  emitters.forEach((emitter, emitterIndex) => {
    for (let i = 0; i < emitter.count; i++) {
      const p: Particle = {
        emitter: emitterIndex, x: 0, y: 0, vx: 0, vy: 0, originX: 0, originY: 0,
        life: 1, age: 0, radius: 1, phase: 0, spin: 0, wobble: 0
      };
      resetParticle(p, world, true);
      world.particles.push(p);
    }
  });
  return world;
}

export function advanceParticles(world: ParticleWorld, seconds: number): void {
  // Clamp to avoid giant jumps when the tab resumes from sleep.
  const dt = Math.max(0, Math.min(seconds, .045));
  world.elapsed += dt;
  for (const p of world.particles) {
    p.age += dt;
    if (p.age >= p.life) resetParticle(p, world);
    const e = world.emitters[p.emitter];
    const t = p.age;
    p.x = p.originX + p.vx * t + Math.sin(t * p.spin * 3 + p.phase) * p.wobble;
    p.y = p.originY + p.vy * t;
    if (e.kind === "magic" || e.kind === "ghost") {
      p.x += Math.cos(t * p.spin + p.phase) * 10;
      p.y += Math.sin(t * p.spin + p.phase) * 7;
    }
    // Don't keep drifting particles forever if they're already outside the frame.
    if (p.x < -25 || p.x > 345 || p.y < -35 || p.y > 245) resetParticle(p, world);
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D, world: ParticleWorld): void {
  ctx.clearRect(0, 0, 320, 220);
  for (const p of world.particles) {
    const e = world.emitters[p.emitter];
    const progress = p.age / p.life;
    const fade = Math.min(1, progress * 5, (1 - progress) * 3);
    const alpha = Math.max(0, fade * (e.kind === "dust" ? .32 : e.kind === "paint" ? .65 : .9));
    if (alpha <= 0) continue;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = e.color;
    const size = p.radius * (e.kind === "flame" ? 1.2 - progress * .65 : 1 - progress * .4);
    if (e.kind === "magic" || e.kind === "impact") {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(p.x - size * 1.4, p.y); ctx.lineTo(p.x + size * 1.4, p.y);
      ctx.moveTo(p.x, p.y - size * 1.4); ctx.lineTo(p.x, p.y + size * 1.4); ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(.35, size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
