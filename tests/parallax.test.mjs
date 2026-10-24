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

test("background moves less than character layer and no group ever shifts over twelve SVG pixels", () => {
  assert.equal(sceneLayerShift(0,.8),0);
  assert.ok(sceneLayerShift(1,.08)<sceneLayerShift(1,.47));
  assert.ok(sceneLayerShift(1,.47)<sceneLayerShift(1,.82));
  assert.equal(sceneLayerShift(99,1),12);
  assert.equal(sceneLayerShift(-99,1),-12);
  assert.equal(sceneLayerShift(1,99),12);
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
  assert.match(scene,/isFresh && showGenerated && ready/);
  assert.match(scene,/data-parallax-depth=\{0\.22\}/);
  assert.match(image,/data-parallax-depth=\{0\.12\}/);
  assert.match(particle,/data-parallax-depth=\{imageMode \? 0\.3/);
  assert.match(scene,/ProceduralIllustration/);
});
