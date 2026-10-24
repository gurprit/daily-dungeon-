import { useEffect, useRef, useState } from "react";

/**
 * Presentation-only pixel filter for AI scene portraits.
 * One browser canvas pass, no image generation or Cloudflare AI usage.
 * Original cached R2 image stays untouched.
 */
const PIXEL_RESOLUTION = 160;
const CHANNEL_STEP = 24;

export default function PixelPortrait({ src, alt }: { src: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let disposed = false;
    setFallback(false);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (disposed) return;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !context) { setFallback(true); return; }
      context.clearRect(0, 0, PIXEL_RESOLUTION, PIXEL_RESOLUTION);
      // Sample the original at a true 160x160 pixel grid, then display it
      // enlarged with nearest-neighbour sampling (CSS image-rendering).
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, PIXEL_RESOLUTION, PIXEL_RESOLUTION);
      try {
        const pixels = context.getImageData(0, 0, PIXEL_RESOLUTION, PIXEL_RESOLUTION);
        for (let i = 0; i < pixels.data.length; i += 4) {
          for (let channel = 0; channel < 3; channel++) {
            const value = pixels.data[i + channel];
            pixels.data[i + channel] = Math.min(255, Math.round(value / CHANNEL_STEP) * CHANNEL_STEP);
          }
        }
        context.putImageData(pixels, 0, 0);
      } catch {
        // Canvas pixel operations can be restricted by browser permissions.
        setFallback(true);
      }
    };
    image.onerror = () => { if (!disposed) setFallback(true); };
    image.src = src;
    return () => { disposed = true; image.onload = null; image.onerror = null; };
  }, [src]);

  if (fallback) return <img loading="lazy" src={src} alt={alt}/>;
  return <canvas ref={canvasRef} width={PIXEL_RESOLUTION} height={PIXEL_RESOLUTION}
    role="img" aria-label={alt} className="room-artwork__pixel-canvas"/>;
}
