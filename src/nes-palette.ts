/**
 * NES-inspired restricted 8-bit palette. Every generated portrait is
 * downsampled and quantised locally so a model cannot silently change the
 * game into a painting, 16-bit screenshot or glossy modern illustration.
 * 192×128 virtual resolution, scaled with nearest-neighbour pixels.
 */
export const NES_WIDTH = 192;
export const NES_HEIGHT = 128;
export const NES_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [15, 13, 32], [28, 26, 52], [43, 38, 70], [73, 52, 93],
  [99, 73, 118], [144, 106, 155], [190, 152, 191], [225, 191, 208],
  [47, 32, 40], [77, 45, 51], [113, 61, 63], [169, 81, 76],
  [216, 124, 90], [245, 175, 110], [254, 220, 151], [254, 245, 201],
  [23, 47, 71], [35, 78, 107], [53, 114, 142], [78, 153, 178],
  [132, 195, 206], [199, 226, 220], [24, 65, 57], [39, 96, 68],
  [73, 135, 80], [118, 174, 91], [180, 201, 127], [43, 54, 102],
  [65, 82, 152], [109, 129, 188], [167, 173, 208], [192, 158, 108]
] as const;

/** Weighted RGB distance, no gradients, blur or novel in-between colours. */
export function closestNesColour(r: number, g: number, b: number): readonly [number, number, number] {
  let best = NES_PALETTE[0], score = Infinity;
  for (const colour of NES_PALETTE) {
    const dr = r - colour[0], dg = g - colour[1], db = b - colour[2];
    const delta = dr * dr * .30 + dg * dg * .59 + db * db * .11;
    if (delta < score) { score = delta; best = colour; }
  }
  return best;
}

export function quantiseNesPixels(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] === 0) continue;
    const [r, g, b] = closestNesColour(data[i], data[i+1], data[i+2]);
    data[i] = r; data[i+1] = g; data[i+2] = b;
  }
}
