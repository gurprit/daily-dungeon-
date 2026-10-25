/** Pure parallax math shared by the browser hook and regression tests. */
export function clampSceneProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

/** -1 as scene enters bottom of viewport, +1 as it leaves through top. */
export function sceneScrollProgress(top: number, height: number, viewportHeight: number): number {
  if (![top, height, viewportHeight].every(Number.isFinite) || height <= 0 || viewportHeight <= 0) return 0;
  const center = top + height / 2;
  // Complete the near/far depth change over roughly half a viewport.
  // The previous full-viewport normalization was imperceptible on a phone.
  return clampSceneProgress(2.1 * (viewportHeight / 2 - center) / ((viewportHeight + height) / 2));
}

/** Pixel-space translation in SVG viewBox coordinates. Maximum 96 virtual scene units at depth 1; DOM layers are clipped to their own safe bleed. */
export function sceneLayerShift(progress: number, depth: number): number {
  const safeDepth = Number.isFinite(depth) ? Math.max(0, Math.min(1, depth)) : 0;
  return Math.round(clampSceneProgress(progress) * safeDepth * 96 * 100) / 100;
}
