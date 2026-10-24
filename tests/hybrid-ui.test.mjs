import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("generated art has SVG and Canvas magical effects as its foreground", () => {
  const scene = readFileSync(new URL("../src/IllustratedScene.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.scss", import.meta.url), "utf8");
  assert.match(scene, /import ProceduralIllustration/);
  assert.match(scene, /<ProceduralIllustration/);
  assert.match(scene, /<GeneratedEffects input=\{props\}/);
  assert.match(scene, /<ParticleCanvas input=\{props\}/);
  assert.match(scene, /NesSceneImage/);
  assert.match(css, /hybrid-art__svgfx/);
  assert.match(css, /hybrid-art__image--ready/);
});

test("rooms, actions, clues and endings use generated art when available", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const scene = readFileSync(new URL("../src/IllustratedScene.tsx", import.meta.url), "utf8");
  for (const kind of ["room", "action", "clue", "ending"]) {
    assert.match(app, new RegExp('kind="' + kind + '"'));
  }
  assert.match(scene, /\/api\/shared-art/);
  assert.match(scene, /\/api\/generate-room-art/);
  assert.match(scene, /\/api\/art-status\//);
  assert.match(scene, /ticket \? ART_STYLE/);
  assert.match(scene, /readyImages\.set/);
});
