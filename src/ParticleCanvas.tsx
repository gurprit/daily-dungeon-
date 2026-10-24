import { useEffect, useRef } from "react";
import { makeEffectPlan } from "./effect-presets";
import { advanceParticles, createParticleWorld, emittersForScene, renderParticles } from "./particle-engine";
import type { VisualInput, VisualRecipe } from "./illustration-recipe";

type Props = { input: VisualInput; recipe: VisualRecipe; imageMode?: boolean };

/**
 * Transparent per-scene 2D Canvas particle layer.
 * Runs only while visible, respects reduced-motion and pauses in hidden tabs.
 * All geometry is computed in JS on the client. No assets or network requests.
 */
export default function ParticleCanvas({ input, recipe, imageMode = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plan = makeEffectPlan(input, recipe);
  const theme = plan.theme;
  const action = input.action ?? "";
  const kind = input.kind;
  const success = input.success;
  const seed = plan.seed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const scene: VisualInput = {
      kind, dungeonSlug: input.dungeonSlug, roomIndex: input.roomIndex,
      action, success, narration: input.narration, clueId: input.clueId,
      endingId: input.endingId
    };
    const activePlan = makeEffectPlan(scene, recipe);
    const emitters = emittersForScene(activePlan, scene, imageMode);
    if (emitters.length === 0) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const resolution = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(320 * resolution);
    canvas.height = Math.round(220 * resolution);
    ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
    const world = createParticleWorld(emitters, seed);
    // Render the initial frame even before the first animation callback.
    renderParticles(ctx, world);

    let visible = false;
    let frame = 0;
    let previousTime = 0;
    let disposed = false;
    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };
    const tick = (now: number) => {
      if (disposed || !visible || document.hidden || media.matches) {
        stop();
        return;
      }
      const delta = previousTime ? (now - previousTime) / 1000 : 1 / 60;
      previousTime = now;
      advanceParticles(world, delta);
      renderParticles(ctx, world);
      frame = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (disposed || frame || !visible || document.hidden || media.matches) return;
      frame = window.requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onMotionChange = () => {
      if (media.matches) {
        stop();
        ctx.clearRect(0, 0, 320, 220);
      } else {
        renderParticles(ctx, world);
        start();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: .02 });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onMotionChange);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", onMotionChange);
    };
  }, [theme, action, kind, success, seed, input.dungeonSlug, input.roomIndex, input.narration, input.clueId, input.endingId, imageMode]);

  return <canvas ref={canvasRef} className="procedural-art__particles" aria-hidden="true"/>;
}
