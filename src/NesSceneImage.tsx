import { useEffect, useRef } from "react";
import { NES_WIDTH, NES_HEIGHT, quantiseNesPixels } from "./nes-palette.ts";

type Props = { src: string; alt: string; onReady(): void; onError(): void; ready: boolean };

/** Use the real model image as source, but show only NES-grid colour-quantised
 * pixels. The hidden original never flashes on screen. No separate image API. */
export default function NesSceneImage({ src, alt, onReady, onError, ready }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    // A cached image can still stall on a slow connection or decoding failure.
    // After 20 seconds the SVG fallback becomes the final artwork for this view.
    const timeout = window.setTimeout(() => { if (!cancelled) onError(); }, 20_000);
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      window.clearTimeout(timeout);
      try {
        const target = canvas.current;
        const ctx = target?.getContext("2d", { willReadFrequently: true });
        if (!target || !ctx) throw new Error("Pixel graphics unavailable");
        target.width = NES_WIDTH; target.height = NES_HEIGHT;
        // Fit the model's 3:2 canvas exactly to a tiny hardware-like screen.
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(image, 0, 0, NES_WIDTH, NES_HEIGHT);
        const pixels = ctx.getImageData(0, 0, NES_WIDTH, NES_HEIGHT);
        quantiseNesPixels(pixels.data);
        ctx.putImageData(pixels, 0, 0);
        onReady();
      } catch {
        if (!cancelled) onError();
      }
    };
    image.onerror = () => { window.clearTimeout(timeout); if (!cancelled) onError(); };
    image.src = src;
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);
  return <canvas ref={canvas} width={NES_WIDTH} height={NES_HEIGHT}
    role="img" aria-label={alt}
    className={"hybrid-art__image hybrid-art__nes " + (ready ? "hybrid-art__image--ready" : "")}
    data-parallax-depth={0.55} data-parallax-scale={1.10}/>;
}
