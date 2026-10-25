import { useEffect, useRef } from "react";
import { sceneLayerShift, sceneScrollProgress } from "./parallax-math";

/**
 * Scrolling vertically pans artwork HORIZONTALLY in layered perspective.
 * Supports SVG <g> scene layers and HTML/canvas/SVG overlay planes.
 * Keep scene Y fixed: only X changes. A half-strength translation preserves
 * the gentler v0.3 motion and avoids sliding sprites outside their frames.
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
        const zoom = Number(node.getAttribute("data-parallax-scale"));
        return {
          node, depth: Number.isFinite(raw) ? Math.max(0, Math.min(raw, 1)) : 0,
          group, zoom: !group && Number.isFinite(zoom) && zoom > 1 && zoom <= 1.4 ? zoom : 1,
          baseAttribute: group ? node.getAttribute("transform") : null,
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
        // Use a gentler horizontal pan instead of the old vertical shift.
        const raw = sceneLayerShift(progress, layer.depth) * 0.5;
        if (layer.group) {
          // SVG groups use the 320x220 viewBox. A 22-unit horizontal limit
          // protects the edges while foregrounds move more than the sky.
          const shift = Math.max(-22, Math.min(22, raw));
          const move = shift === 0 ? "" : "translate(" + shift + " 0)";
          const value = [layer.baseAttribute, move].filter(Boolean).join(" ");
          if (value) layer.node.setAttribute("transform", value);
          else layer.node.removeAttribute("transform");
        } else {
          // Root SVG/canvas planes use CSS transforms. Cap movement by WIDTH,
          // not height: 7% is covered by NES overscan and legacy-scene zoom.
          const shift = Math.max(-rect.width * .07, Math.min(rect.width * .07, raw));
          const move = shift ? "translate3d(" + shift.toFixed(2) + "px,0,0)" : "";
          const zoom = layer.zoom > 1 ? "scale(" + layer.zoom + ")" : "";
          layer.node.style.transform = [layer.baseStyle, move, zoom].filter(Boolean).join(" ");
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
