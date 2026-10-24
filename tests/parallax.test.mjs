import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clampSceneProgress, sceneScrollProgress, sceneLayerShift } from "../src/parallax-math.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("scroll progress is centred and bounded for mobile viewports", () => {
  assert.equal(sceneScrollProgress(300,200,800), 0);
  assert.equal(sceneScrollProgress(800,200,800), -1);
  assert.equal(sceneScrollProgress(-200,200,800), 1);
  assert.equal(sceneScrollProgress(100000,200,800), -1);
  assert.equal(clampSceneProgress(NaN),0);
  assert.equal(sceneScrollProgress(NaN,200,800), 0);
  assert.equal(sceneScrollProgress(100,0,800),0);
  assert.equal(sceneScrollProgress(100,200,0),0);
});

test("background moves less than character layer and no group ever shifts over thirty-six SVG units", () => {
  assert.equal(sceneLayerShift(0,.8),0);
  assert.ok(sceneLayerShift(1,.08)<sceneLayerShift(1,.47));
  assert.ok(sceneLayerShift(1,.47)<sceneLayerShift(1,.82));
  assert.equal(sceneLayerShift(99,1),36);
  assert.equal(sceneLayerShift(-99,1),-36);
  assert.equal(sceneLayerShift(1,99),36);
  assert.equal(sceneLayerShift(1,-1),0);
  assert.equal(sceneLayerShift(Infinity,.5),0);
});

test("all three fresh dungeons have real multi-plane SVG layers and distinct animation hooks", () => {
  const source = read("src/FreshPixelScene.tsx");
  assert.match(source,/useScrollParallax/);
  for (const name of ["far-stars","hero"]) assert.match(source,new RegExp('name="' + name + '"'));
  for (const name of ["distant-sea","lighthouse-architecture","lighthouse-characters","lighthouse-front-waves"]) {
    assert.match(source,new RegExp('name="' + name + '"'));
  }
  for (const name of ["orchard-far-trees","orchard-main-trees","orchard-clockwork","orchard-near-plants"]) {
    assert.match(source,new RegExp('name="' + name + '"'));
  }
  for (const name of ["bakery-rear-wall","bakery-oven","bakery-characters","bakery-flour-front"]) {
    assert.match(source,new RegExp('name="' + name + '"'));
  }
  for (const animation of ["fresh-scene__beam","fresh-scene__waves","fresh-scene__gear",
                           "fresh-scene__oven-glow","fresh-scene__flour"]) assert.match(source,new RegExp(animation));
});

test("parallax is RAF throttled, visibility-aware and motion-accessible", () => {
  const hook = read("src/useScrollParallax.ts");
  const css = read("src/styles.scss");
  assert.match(hook,/requestAnimationFrame/);
  assert.match(hook,/cancelAnimationFrame/);
  assert.match(hook,/passive: true/);
  assert.match(hook,/IntersectionObserver/);
  assert.match(hook,/visibilitychange/);
  assert.match(hook,/prefers-reduced-motion/);
  assert.match(hook,/motion\.addEventListener/);
  assert.match(hook,/removeEventListener/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css,/\.fresh-scene \*/);
});

test("hybrid generated images and their particles have smaller, separate scroll depths", () => {
  const scene = read("src/IllustratedScene.tsx");
  const image = read("src/NesSceneImage.tsx");
  const particle = read("src/ParticleCanvas.tsx");
  assert.match(scene,/useScrollParallax<HTMLDivElement>/);
  assert.match(scene,/showGenerated && ready/);
  assert.match(scene,/data-parallax-depth=\{0\.95\}/);
  assert.match(image,/data-parallax-depth=\{0\.6\}/);
  assert.match(particle,/data-parallax-depth=\{imageMode \? 1/);
  assert.match(scene,/ProceduralIllustration/);
});


test("a normal mobile scroll produces perceptible movement, not subpixel motion", () => {
  // A 220px tall illustration in an 800px viewport travels up by 240px.
  const atTop = sceneScrollProgress(430, 220, 800);
  const atBottom = sceneScrollProgress(190, 220, 800);
  const backgroundTravel = sceneLayerShift(atBottom, .2) - sceneLayerShift(atTop, .2);
  const foregroundTravel = sceneLayerShift(atBottom, .95) - sceneLayerShift(atTop, .95);
  assert.ok(Math.abs(foregroundTravel) >= 10, "foreground must noticeably move during ordinary scrolling");
  assert.ok(Math.abs(foregroundTravel - backgroundTravel) >= 8, "foreground and background must separate");
});

test("parallax works for all generated dungeons and legacy SVG scenes", () => {
  const scene = read("src/IllustratedScene.tsx");
  const procedural = read("src/ProceduralIllustration.tsx");
  const fallback = read("src/PixelScene.tsx");
  const hook = read("src/useScrollParallax.ts");
  assert.doesNotMatch(scene, /isFresh && showGenerated/);
  assert.match(procedural, /parallaxDepth=\{!fresh/);
  assert.match(fallback, /data-parallax-depth=\{parallaxDepth\}/);
  assert.match(hook, /window\.visualViewport/);
  assert.match(hook, /touchmove/);
  assert.match(hook, /localName\.toLowerCase\(\) === "g"/);
  assert.match(hook, /node\.style\.transform/);
  assert.match(hook, /window\.requestAnimationFrame/);
});
