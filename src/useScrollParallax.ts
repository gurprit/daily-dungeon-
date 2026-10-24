import { useEffect, useRef } from "react";
import { sceneLayerShift, sceneScrollProgress } from "./parallax-math";

/**
 * Real scroll-linked multi-plane motion. Supports SVG <g> scene layers and
 * HTML/canvas/SVG overlay planes with the correct transform API.
 *
 * The old implementation capped the entire effect at 12 units; generated
 * images had depth 0.12, often giving <1 CSS px of movement on mobile.
 */
export function useScrollParallax<T extends SVGSVGElement | HTMLElement = SVGSVGElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const layers = Array.from(element.querySelectorAll<SVGElement | HTMLElement>("[data-parallax-depth]"))
      .map(node => {
        const raw = Number(node.getAttribute("data-parallax-depth"));
        const group = node instanceof SVGElement && node.localName.toLowerCase() === "g";
        return {
          node, depth: Number.isFinite(raw) ? Math.max(0, Math.min(raw, 1)) : 0,
          group, baseAttribute: group ? node.getAttribute("transform") : null,
          baseStyle: group ? "" : node.style.transform
        };
      }).filter(layer => layer.depth > 0);

    if (!layers.length) return;

    let visible = true;
    let frame = 0;
    let closed = false;

    const restore = () => {
      for (const layer of layers) {
        if (layer.group) {
          if (layer.baseAttribute === null) layer.node.removeAttribute("transform");
          else layer.node.setAttribute("transform", layer.baseAttribute);
        } else {
          layer.node.style.transform = layer.baseStyle;
        }
      }
    };
    const clear = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      restore();
    };
    const update = () => {
      frame = 0;
      if (closed || !visible || document.hidden || motion.matches) return;
      const rect = element.getBoundingClientRect();
      // Keep using layout-viewport coordinates, the same space as rect.top.
      const progress = sceneScrollProgress(rect.top, rect.height, window.innerHeight);
      for (const layer of layers) {
        const raw = sceneLayerShift(progress, layer.depth);
        if (layer.group) {
          // A group works in SVG's 320x220 viewBox units.
          const move = raw === 0 ? "" : "translate(0 " + raw + ")";
          const value = [layer.baseAttribute, move].filter(Boolean).join(" ");
          if (value) layer.node.setAttribute("transform", value);
          else layer.node.removeAttribute("transform");
        } else {
          // For root SVG overlays and canvases, SVG transform attributes are
          // unreliable across browsers. Use CSS pixels, and stay within the
          // frame's 7.5% overscan so there are no exposed image edges.
          const shift = Math.max(-rect.height * .07, Math.min(rect.height * .07, raw));
          const move = shift ? "translate3d(0," + shift.toFixed(2) + "px,0)" : "";
          layer.node.style.transform = [layer.baseStyle, move].filter(Boolean).join(" ");
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
    window.addEventListener("touchmove", request, { passive: true });
    window.addEventListener("resize", request);
    window.visualViewport?.addEventListener("scroll", request, { passive: true });
    window.visualViewport?.addEventListener("resize", request);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    request();

    return () => {
      closed = true;
      clear();
      observer?.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("touchmove", request);
      window.removeEventListener("resize", request);
      window.visualViewport?.removeEventListener("scroll", request);
      window.visualViewport?.removeEventListener("resize", request);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChange);
    };
  }, [enabled]);

  return ref;
}
