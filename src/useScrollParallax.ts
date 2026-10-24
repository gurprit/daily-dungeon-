import { useEffect, useRef } from "react";
import { sceneLayerShift, sceneScrollProgress } from "./parallax-math";

/** CSS and SVG only; parallax is applied to existing SVG groups in one RAF.
 * No React state updates while scrolling, no dependency on paid artwork.
 * Runs only when scene is on screen and never when reduced motion is requested.
 */
export function useScrollParallax<T extends SVGSVGElement | HTMLElement = SVGSVGElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const layers = Array.from(element.querySelectorAll<SVGElement | HTMLElement>("[data-parallax-depth]"))
      .map(node => ({ node, depth: Number(node.getAttribute("data-parallax-depth")) }));
    let visible = true;
    let frame = 0;
    let closed = false;

    const clear = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      for (const { node } of layers) {
        if (node instanceof SVGElement) node.removeAttribute("transform");
        else node.style.removeProperty("transform");
      }
    };
    const update = () => {
      frame = 0;
      if (closed || !visible || document.hidden || motion.matches) return;
      const rect = element.getBoundingClientRect();
      const progress = sceneScrollProgress(rect.top, rect.height, window.innerHeight);
      for (const { node, depth } of layers) {
        const shift = sceneLayerShift(progress, depth);
        if (node instanceof SVGElement) {
          if (shift === 0) node.removeAttribute("transform");
          else node.setAttribute("transform", "translate(0 " + shift + ")");
        } else {
          if (shift === 0) node.style.removeProperty("transform");
          else node.style.transform = "translate3d(0," + shift + "px,0)";
        }
      }
    };
    const request = () => {
      if (closed || !visible || document.hidden || motion.matches || frame) return;
      frame = window.requestAnimationFrame(update);
    };
    const visibility = () => { if (document.hidden) clear(); else request(); };
    const motionChange = () => { if (motion.matches) clear(); else request(); };
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(entries => {
          visible = !!entries[0]?.isIntersecting;
          if (visible) request();
          else clear();
        }, { threshold: 0 })
      : null;
    observer?.observe(element);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    if (motion.matches) clear();
    else request();
    return () => {
      closed = true;
      clear();
      observer?.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChange);
    };
  }, [enabled]);

  return ref;
}
