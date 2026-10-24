import { useEffect, useMemo, useState } from "react";
import ProceduralIllustration from "./ProceduralIllustration";
import ProceduralEffects from "./ProceduralEffects";
import ParticleCanvas from "./ParticleCanvas";
import { makeVisualRecipe, type VisualInput } from "./illustration-recipe";

export type ArtPreview = "today" | "tomorrow" | "hollowmere";
type ArtJob = { id?: string; status?: "pending" | "ready" | "failed"; url?: string };
type Props = VisualInput & {
  day: string;
  preview: ArtPreview;
  enabled: boolean;
  alt: string;
  variant?: string;
  ticket?: string;
  className?: string;
};

const readyImages = new Map<string, string>();
/**
 * An illustrated scene: model artwork in the background, animated SVG + JS
 * particles in the foreground. The old procedural image appears immediately
 * until the art exists, or permanently in offline/scripted mode.
 *
 * Shared room/clue/ending illustrations have one stable cache key per day.
 * Action portraits require a signed ticket minted by /api/resolve; browser
 * prose never becomes an unbounded user-supplied generation request.
 */
export default function IllustratedScene(props: Props) {
  const {
    kind, dungeonSlug, roomIndex, day, preview, enabled, alt, variant,
    ticket, className = ""
  } = props;
  const key = kind === "action" ? (ticket ? "action:" + ticket : "") :
    [day, preview, kind, roomIndex, variant ?? ""].join("|");
  const [result, setResult] = useState<ArtJob>(() => ({
    status: "pending", url: key ? readyImages.get(key) : undefined
  }));
  const [broken, setBroken] = useState(false);
  const [ready, setReady] = useState(false);
  const recipe = useMemo(() => makeVisualRecipe(props), [
    kind, dungeonSlug, roomIndex, props.action, props.narration,
    props.success, props.clueId, props.endingId
  ]);

  useEffect(() => {
    const cache = key && readyImages.get(key);
    setResult(cache ? { status: "ready", url: cache } : { status: "pending" });
    setBroken(false);
    setReady(false);
    if (!enabled || !key) return;
    let alive = true;
    const run = async () => {
      try {
        const shared = kind !== "action";
        const response = await fetch(shared ? "/api/shared-art" : "/api/generate-room-art", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(shared
            ? { day, roomIndex, kind, variant, preview }
            : { token: ticket })
        });
        if (!response.ok) throw new Error("Artwork unavailable");
        const start = await response.json() as ArtJob;
        if (!alive) return;
        if (start.status === "ready" && start.url) {
          readyImages.set(key, start.url);
          setResult(start);
          return;
        }
        if (!start.id || start.status === "failed") throw new Error("Artwork unavailable");
        // Cloudflare inference may take several seconds; stop polling when
        // unmounted, never request a duplicate generation while checking.
        for (let attempt = 0; attempt < 45 && alive; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          if (!alive) return;
          const status = await fetch("/api/art-status/" + start.id);
          if (!status.ok) continue;
          const job = await status.json() as ArtJob;
          if (job.status === "ready" && job.url) {
            readyImages.set(key, job.url);
            setResult(job);
            return;
          }
          if (job.status === "failed") throw new Error("Artwork unavailable");
        }
        if (alive) setResult({ status: "failed" });
      } catch {
        if (alive) setResult({ status: "failed" });
      }
    };
    // A cached image needs no other API call.
    if (!cache) void run();
    return () => { alive = false; };
  }, [key, enabled, day, roomIndex, kind, variant, preview, ticket]);

  const showGenerated = enabled && !!result.url && !broken;
  const visualClass = "hybrid-art " + className;
  return <div className={visualClass}>
    {showGenerated ? <>
      <img className={"hybrid-art__image " + (ready ? "hybrid-art__image--ready" : "")}
        src={result.url} alt={alt}
        loading={kind === "room" ? "eager" : "lazy"}
        decoding="async" onLoad={() => setReady(true)} onError={() => setBroken(true)}/>
      <svg className="hybrid-art__svgfx" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet"
        aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <ProceduralEffects input={props} recipe={recipe}/>
      </svg>
      <ParticleCanvas input={props} recipe={recipe}/>
    </> : <>
      <ProceduralIllustration {...props} label={alt}/>
      {enabled && !!key && result.status === "pending" &&
        <span className="hybrid-art__painting" role="status">Painting this moment…</span>}
    </>}
  </div>;
}
