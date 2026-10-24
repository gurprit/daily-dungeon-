import { useEffect, useState, type ReactNode } from "react";

export type SharedArtKind = "room" | "clue" | "ending";
type Job = { status: "pending" | "ready" | "failed"; url?: string };
type Props = {
  day: string;
  roomIndex: number;
  kind: SharedArtKind;
  variant?: string;
  preview: "today" | "tomorrow" | "hollowmere";
  enabled: boolean;
  alt: string;
  fallback: ReactNode;
  className?: string;
  loadingLabel?: string;
};

// The same artwork is used in the welcome screen, room and journal without
// re-fetching it or triggering a second inference in this browser session.
const images = new Map<string, string>();

export default function SharedIllustration({
  day, roomIndex, kind, variant, preview, enabled, alt, fallback,
  className = "", loadingLabel = "Illustrating this scene…"
}: Props) {
  const key = day + "/" + kind + "/" + roomIndex + "/" + (variant ?? "");
  const [state, setState] = useState<Job>(() => {
    const url = images.get(key);
    return url ? { status: "ready", url } : { status: "pending" };
  });
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    const cached = images.get(key);
    if (cached) { setState({ status: "ready", url: cached }); return; }
    setState({ status: "pending" });
    setImageFailed(false);
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/shared-art", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ day, roomIndex, kind, variant, preview })
        });
        if (!response.ok) throw new Error("Art unavailable");
        const initial = await response.json() as Job & { id?: string };
        if (cancelled) return;
        if (initial.status === "ready" && initial.url) {
          images.set(key, initial.url);
          setState({ status: "ready", url: initial.url });
          return;
        }
        if (!initial.id || initial.status === "failed") throw new Error("Art unavailable");
        for (let n = 0; n < 45 && !cancelled; n++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          if (cancelled) return;
          const poll = await fetch("/api/art-status/" + initial.id);
          if (!poll.ok) continue;
          const result = await poll.json() as Job;
          if (result.status === "ready" && result.url) {
            images.set(key, result.url);
            setState({ status: "ready", url: result.url });
            return;
          }
          if (result.status === "failed") throw new Error("Art unavailable");
        }
        if (!cancelled) setState({ status: "failed" });
      } catch {
        if (!cancelled) setState({ status: "failed" });
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [key, day, roomIndex, kind, variant, preview, enabled]);

  const visible = enabled && state.status === "ready" && state.url && !imageFailed;
  return (
    <div className={"shared-illustration " + className}>
      {visible ? (
        <img src={state.url} alt={alt} decoding="async"
          loading={kind === "room" ? "eager" : "lazy"}
          onError={() => setImageFailed(true)}/>
      ) : fallback}
      {enabled && state.status === "pending" && !images.has(key) && (
        <span className="shared-illustration__painting" role="status">{loadingLabel}</span>
      )}
    </div>
  );
}
