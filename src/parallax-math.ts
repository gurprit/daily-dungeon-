/** Pure parallax math shared by the browser hook and regression tests. */
export function clampSceneProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

/** -1 as scene enters bottom of viewport, +1 as it leaves through top. */
export function sceneScrollProgress(top: number, height: number, viewportHeight: number): number {
  if (![top, height, viewportHeight].every(Number.isFinite) || height <= 0 || viewportHeight <= 0) return 0;
  const center = top + height / 2;
  return clampSceneProgress((viewportHeight / 2 - center) / ((viewportHeight + height) / 2));
}

/** Pixel-space translation in SVG viewBox coordinates. Maximum 36 viewBox units at depth 1. Noticeable during normal mobile scrolling. */
export function sceneLayerShift(progress: number, depth: number): number {
  const safeDepth = Number.isFinite(depth) ? Math.max(0, Math.min(1, depth)) : 0;
  return Math.round(clampSceneProgress(progress) * safeDepth * 36 * 100) / 100;
}
