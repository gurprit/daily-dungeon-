import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Check, Crown, Dice5, Download, Flame,
  Heart, ScrollText, Share2, Shield, Skull, Sparkles, Swords, ChevronDown
} from "lucide-react";
import { getDailyGame, getPreviewDailyGame } from "./game";
import { startingItems, inventoryAfterTurn } from "./inventory";
import { resolveAction, type ActionOutcome } from "./engine";
import { fallbackAchievement, isAchievement, type Achievement } from "./achievements";
import { createCertificateImage } from "./certificate";
import PixelScene from "./PixelScene";
import { actionStarters, firstRoomTip } from "./action-help";
import PixelPortrait from "./PixelPortrait";

// Date preview is opt-in and never overwrites genuine daily progress.
const previewTomorrow = new URLSearchParams(window.location.search).get("preview") === "tomorrow";
const gameForPage = () => previewTomorrow ? getPreviewDailyGame() : getDailyGame();
const runStorageKey = (day: string) => "daily-dungeon:" + (previewTomorrow ? "test-tomorrow:" : "") + day;

type Turn = {
  roomTitle: string;
  action: string;
  outcome: ActionOutcome;
  art?: { status: "pending" | "ready" | "failed"; id?: string; url?: string };
};

type Run = {
  day: string;
  started: boolean;
  roomIndex: number;
  hearts: number;
  inventory: string[];
  history: Turn[];
  finished: boolean;
  edition?: number;
};

function freshRun(day: string): Run {
  return {
    day, started: false, roomIndex: 0,
    hearts: 3, inventory: startingItems(gameForPage().dungeon),
    history: [], finished: false, edition: gameForPage().dungeon.edition ?? 1
  };
}

function loadRun(day: string): Run {
  try {
    const saved = localStorage.getItem(runStorageKey(day));
    if (!saved) return freshRun(day);
    const parsed = JSON.parse(saved) as Run;
    if (
      parsed.day === day &&
      (parsed.edition ?? 1) === (gameForPage().dungeon.edition ?? 1) &&
      typeof parsed.started === "boolean" &&
      typeof parsed.hearts === "number" &&
      typeof parsed.roomIndex === "number" &&
      Array.isArray(parsed.inventory) && Array.isArray(parsed.history)
    ) {
      // Give existing saved heroes their due: old AI runs predate achievement objects.
      parsed.history = parsed.history.map((entry: Turn) => {
        if (!entry || !entry.outcome || typeof entry.action !== "string") return entry;
        const savedAward = isAchievement(entry.outcome.achievement) ? entry.outcome.achievement : null;
        const recovered = savedAward ?? fallbackAchievement(
          entry.action, entry.roomTitle, entry.outcome.success, entry.outcome.creativity ?? 0
        );
        return { ...entry, outcome: { ...entry.outcome, achievement: recovered } };
      });
      return parsed;
    }
  } catch { /* Local storage may be disabled */ }
  return freshRun(day);
}

function useDailyRun() {
  const [daily, setDaily] = useState(gameForPage);
  const [run, setRun] = useState<Run>(() => loadRun(gameForPage().day));
  useEffect(() => {
    try { localStorage.setItem(runStorageKey(run.day), JSON.stringify(run)); }
    catch { /* Local storage unavailable */ }
  }, [run]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = gameForPage();
      if (next.day !== daily.day) {
        setDaily(next);
        setRun(loadRun(next.day));
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [daily.day]);
  return { daily, run, setRun };
}

function DungeonDoor({ slug, title }: { slug: string; title: string }) {
  return (
    <div className="dungeon-art dungeon-art--pixel">
      <div className="pixel-scene__topbar"><span>✦ QUEST PREVIEW</span><span>16 BIT / 3 ROOMS</span></div>
      <div className="pixel-scene__viewport">
        <PixelScene dungeonSlug={slug} className="pixel-scene__canvas"/>
        <div className="pixel-scene__scanlines" aria-hidden="true"/>
      </div>
      <div className="pixel-scene__bottombar">
        <span><span className="pixel-scene__life">♥ ♥ ♥</span> HP:03</span>
        <span className="pixel-scene__quest-name">{title}</span>
      </div>
      <div className="pixel-scene__glimmer pixel-scene__glimmer--one" aria-hidden="true">✧</div>
      <div className="pixel-scene__glimmer pixel-scene__glimmer--two" aria-hidden="true">✦</div>
    </div>
  );
}

function Hearts({ count }: { count: number }) {
  return (
    <div className="hearts" aria-label={count + " of 3 hearts remaining"}>
      {[0, 1, 2].map(i => (
        <Heart key={i} size={21} strokeWidth={2.2}
          className={i < count ? "hearts__on" : "hearts__off"}
          fill={i < count ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

function AchievementUnlock({ achievement }: { achievement: Achievement }) {
  return (
    <div className="achievement-unlocked" role="status">
      <div className="achievement-unlocked__medal"><Crown size={25}/></div>
      <div className="achievement-unlocked__copy">
        <span className="eyebrow">✦ ACHIEVEMENT UNLOCKED</span>
        <strong>{achievement.title}</strong>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
}

function RoomArtwork({ turn, compact = false }: { turn: Turn; compact?: boolean }) {
  if (!turn.art) return null;
  return (
    <figure className={"room-artwork " + (compact ? "room-artwork--compact" : "")}>
      <div className="room-artwork__frame">
        {turn.art.status === "ready" && turn.art.url ? (
          <PixelPortrait src={turn.art.url} alt={"16-bit illustration of " + turn.roomTitle + " based on your adventure"}/>
        ) : turn.art.status === "pending" ? (
          <div className="room-artwork__loading" role="status"><Sparkles size={26}/><span>Painting your legend…</span><small>The royal portrait artist is working on it.</small></div>
        ) : (
          <div className="room-artwork__loading"><span>Portrait unavailable</span><small>Your adventure continues regardless.</small></div>
        )}
      </div>
      <figcaption><Sparkles size={15}/><span>{turn.roomTitle}</span><span className="room-artwork__chip">16-BIT CHRONICLES</span></figcaption>
    </figure>
  );
}

function Inventory({ items }: { items: string[] }) {
  return (
    <div className="inventory">
      <div className="eyebrow inventory__title"><Shield size={14} /> YOUR INVENTORY</div>
      <p className="inventory__hint">One use each. Used items disappear, even if your plan fails.</p>
      <div className="inventory__items">
        {items.length ? items.map((item, index) => (
          <span className="inventory__item" key={item + index}>{item}</span>
        )) : <span className="muted">Empty pockets. Tremendous courage.</span>}
      </div>
    </div>
  );
}

function RollBadge({ outcome }: { outcome: ActionOutcome }) {
  return (
    <div className={"roll-badge " + (outcome.success ? "roll-badge--win" : "roll-badge--loss")}>
      <Dice5 size={18}/>
      <span>Rolled <strong>{outcome.roll}{outcome.bonus ? " +" + outcome.bonus : ""}</strong></span>
      <span className="roll-badge__divider" />
      <span>Needed {outcome.difficulty}</span>
    </div>
  );
}

export default function App() {
  const { daily, run, setRun } = useDailyRun();
  const [action, setAction] = useState("");
  const actionField = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [certificateNotice, setCertificateNotice] = useState("");
  const [canPreviewTomorrow, setCanPreviewTomorrow] = useState(false);
  const [artService, setArtService] = useState<{ status: "ready" | "disabled" | "setup-required"; missing?: string[] } | null>(null);
  useEffect(() => {
    void fetch("/api/health")
      .then(response => response.json())
      .then((data: { previewTomorrowEnabled?: boolean; art?: { status: "ready" | "disabled" | "setup-required"; missing?: string[] } }) => {
        setCanPreviewTomorrow(data.previewTomorrowEnabled === true);
        setArtService(data.art ?? null);
      })
      .catch(() => setCanPreviewTomorrow(false));
  }, []);
  const artInflight = useRef(new Set<string>());
  const room = daily.dungeon.rooms[Math.min(run.roomIndex, 2)];
  const starterIdeas = actionStarters(room, run.inventory);
  const starterNeedsFinishing = starterIdeas.some(idea => action.trim() === idea.draft.trim());
  const last = run.history.at(-1);
  const wins = run.history.filter(t => t.outcome.success).length;
  const achievements = run.history
    .map(turn => turn.outcome.achievement)
    .filter((value): value is Achievement => isAchievement(value));
  const won = run.finished && run.hearts > 0;
  const title = won
    ? (wins === 3 ? "A Legend Is Born" : "The Unlikely Survivor")
    : "The Dramatic Demise";

  // Keep one art job per trusted resolution ticket; resumed jobs never double-charge.
  useEffect(() => {
    for (const entry of run.history) {
      const ticket = entry.outcome.artTicket;
      if (!ticket || entry.art?.status === "ready" || entry.art?.status === "failed" ||
          artInflight.current.has(ticket)) continue;
      artInflight.current.add(ticket);
      void (async () => {
        const updateArt = (art: Turn["art"]) => setRun(current => {
          if (current.day !== run.day || !current.history.some(item => item.outcome.artTicket === ticket)) return current;
          return {
            ...current,
            history: current.history.map(item => item.outcome.artTicket === ticket ? { ...item, art } : item)
          };
        });
        try {
          const response = await fetch("/api/generate-room-art", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token: ticket })
          });
          const job = await response.json() as { id?: string; status?: string; url?: string };
          if (!response.ok || !job.id) { updateArt({ status: "failed" }); return; }
          if (job.status === "ready" && job.url) {
            updateArt({ status: "ready", id: job.id, url: job.url });
            return;
          }
          updateArt({ status: "pending", id: job.id });
          // Image generation continues on the Worker; do not hold up the next room.
          for (let attempt = 0; attempt < 45; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusResponse = await fetch("/api/art-status/" + job.id);
            if (!statusResponse.ok) continue;
            const status = await statusResponse.json() as { status?: string; url?: string };
            if (status.status === "ready" && status.url) {
              updateArt({ status: "ready", id: job.id, url: status.url });
              return;
            }
            if (status.status === "failed") {
              updateArt({ status: "failed", id: job.id });
              return;
            }
          }
          // Leave pending in localStorage: another visit can resume polling, not re-generate.
        } catch {
          // A network failure is temporary. Preserve pending and retry on a future page load.
        } finally { artInflight.current.delete(ticket); }
      })();
    }
  }, [run.history, run.day, setRun]);

  // Starting the game and every resolved turn should display the new scene, not
  // leave a mobile player stranded beside the old action box / keyboard.
  useEffect(() => {
    if (!run.started) return;
    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(frame);
  }, [run.started, run.history.length]);

  async function submitAction() {
    const attempt = action.trim();
    if (loading || !run.started || run.finished || attempt.length < 4 || attempt.length > 280 || starterNeedsFinishing) return;
    setLoading(true);
    setError("");
    try {
      let outcome: ActionOutcome;
      try {
        const response = await fetch("/api/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            day: daily.day,
            roomIndex: run.roomIndex,
            action: attempt,
            inventory: run.inventory,
            priorTurns: run.history.map((turn, i) => ({
              roomIndex: i,
              action: turn.action,
              narration: turn.outcome.narration,
              success: turn.outcome.success
            })),
            previewTomorrow
          })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(payload.error ?? "The Dungeon Master has gone missing.");
        }
        outcome = await response.json() as ActionOutcome;
        if (typeof outcome.success !== "boolean" || typeof outcome.narration !== "string") {
          throw new Error("Invalid reply from the Dungeon Master.");
        }
      } catch (problem) {
        if (!import.meta.env.DEV || (problem instanceof Error && problem.message.includes("new dungeon"))) throw problem;
        outcome = resolveAction(room, attempt, run.inventory, Math.floor(Math.random() * 20) + 1);
      }
      actionField.current?.blur();
      const remaining = Math.max(0, run.hearts - outcome.heartsLost);
      const nextIndex = run.roomIndex + 1;
      setRun(current => ({
        ...current,
        hearts: remaining,
        inventory: inventoryAfterTurn(current.inventory, outcome.usedItems ?? [], outcome.reward),
        history: [...current.history, { roomTitle: room.title, action: attempt, outcome, ...(outcome.artTicket ? { art: { status: "pending" as const } } : {}) }],
        roomIndex: nextIndex,
        finished: nextIndex >= daily.dungeon.rooms.length || remaining === 0
      }));
      setAction("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The spell fizzled. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function useStarter(draft: string) {
    setAction(draft);
    requestAnimationFrame(() => {
      actionField.current?.focus();
      actionField.current?.setSelectionRange(draft.length, draft.length);
    });
  }

  function start() {
    setRun(current => ({ ...current, started: true }));
    setError("");
    window.scrollTo(0, 0);
  }

  function reset() {
    if (!window.confirm("Restart today's playtest? Your current adventure will be lost.")) return;
    setRun(freshRun(daily.day));
    setAction("");
    setError("");
    setCopied(false);
    setCertificateNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function shareText() {
    const rooms = run.history.map(t => t.outcome.success ? "🟩" : "🟥").join("");
    return [
      "🐉 THE DAILY DUNGEON #" + daily.number,
      daily.dungeon.title,
      rooms + " · " + wins + "/3 rooms cleared",
      won ? "🏆 " + title : "💀 " + title,
      "Hearts: " + run.hearts + "/3",
      ...(achievements.length ? ["🏅 Honours: " + achievements.map(a => a.title).join(" · ")] : []),
      "How did YOUR story end?",
      "Play: https://dailydungeon.titkok.co/"
    ].join("\n");
  }

  async function share() {
    const text = shareText();
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch { setError("Sharing is unavailable here. Try another browser."); }
    }
  }

  async function shareCertificate() {
    setCertificateNotice("");
    try {
      const file = await createCertificateImage({
        dungeon: daily.dungeon.title,
        day: daily.day,
        number: daily.number,
        resultTitle: title,
        roomsPassed: wins,
        heartsLeft: run.hearts,
        achievements
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: shareText() });
          setCertificateNotice("Certificate shared.");
          return;
        } catch (problem) {
          // Cancelling a native share is not a request to download anything.
          if (problem instanceof Error && problem.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setCertificateNotice("Certificate saved as a PNG, ready to share.");
    } catch (problem) {
      setCertificateNotice(problem instanceof Error ? problem.message : "Unable to prepare the certificate.");
    }
  }

  return (
    <div className="shell">
      <header className="site-header">
        <div className="site-header__brand">
          <span className="site-header__crest"><Swords size={23} strokeWidth={1.7}/></span>
          <div>
            <div className="site-header__name">THE DAILY <span>DUNGEON</span></div>
            <div className="site-header__tagline">ONE DUNGEON. ENDLESS POSSIBILITIES.</div>
          </div>
        </div>
        <div className="site-header__right">
          <span className="daily-pill"><Sparkles size={14}/> {previewTomorrow ? "TOMORROW · TEST" : "DAILY"} #{String(daily.number).padStart(3, "0")}</span>
          <span className="site-header__date">{new Date(daily.day + "T12:00:00Z").toLocaleDateString("en-GB", { day:"numeric", month:"short", timeZone:"UTC" })}</span>
        </div>
      </header>

      <main className="main">
        {previewTomorrow && <div className="preview-ribbon">
          <strong>⏭ Tomorrow’s dungeon · Test mode</strong>
          <span>Real date and shared AI/art budgets are unchanged.</span>
          {artService && <span className={"preview-ribbon__art " + (artService.status === "ready" ? "preview-ribbon__art--ready" : "preview-ribbon__art--warning")}>
            <Sparkles size={14}/>
            {artService.status === "ready" ? "AI portraits ready" : artService.status === "disabled"
              ? "AI portraits are disabled in the deployed Worker"
              : "AI portraits need setup: " + (artService.missing?.join(", ") ?? "check Worker bindings")}
          </span>}
          <a href={window.location.pathname}>Return to today</a>
        </div>}
        {!run.started && (
          <section className="intro">
            <div className="intro__visual">
              <div className="intro__badge"><Flame size={14}/> THE GATES ARE OPEN</div>
              <DungeonDoor slug={daily.dungeon.slug} title={daily.dungeon.title}/>
            </div>
            <div className="intro__copy">
              <p className="eyebrow">DUNGEON #{String(daily.number).padStart(3, "0")} · {previewTomorrow ? "TOMORROW'S QUEST · PREVIEW" : "TODAY'S QUEST"}</p>
              <h1>{daily.dungeon.title}</h1>
              <p className="intro__subtitle">{daily.dungeon.subtitle}</p>
              <p className="intro__description">{daily.dungeon.intro}</p>
              <div className="intro__facts">
                <span><BookOpen size={17}/> 3 rooms</span>
                <span><Heart size={17}/> 3 hearts</span>
                <span><Dice5 size={17}/> ~5 minutes</span>
              </div>
              <button className="button button--primary button--large" onClick={start}>
                Enter the dungeon <ArrowRight size={19}/>
              </button>
              <p className="intro__small">No account. No downloads. Just your imagination. Your three starting items are single-use.</p>
              {!previewTomorrow && canPreviewTomorrow && <a className="preview-link" href="?preview=tomorrow">⏭ Pretend it’s tomorrow · Playtest next dungeon</a>}
            </div>
          </section>
        )}

        {run.started && !run.finished && (
          <div className="game-layout">
            <div className="game-main">
              <div className="game-heading">
                <div>
                  <p className="eyebrow">TODAY'S ADVENTURE</p>
                  <h1>{daily.dungeon.title}</h1>
                </div>
                <Hearts count={run.hearts}/>
              </div>

              <div className="progress" aria-label={"Room " + (run.roomIndex + 1) + " of 3"}>
                {daily.dungeon.rooms.map((r, i) => (
                  <div className={"progress__step " + (i < run.roomIndex ? "progress__step--done" : i === run.roomIndex ? "progress__step--active" : "")} key={r.title}>
                    <span className="progress__circle">{i < run.roomIndex ? <Check size={15}/> : i+1}</span>
                    <span className="progress__label">{i === 0 ? "THE TRIAL" : i === 1 ? "THE TWIST" : "THE FINALE"}</span>
                  </div>
                ))}
              </div>

              {last && (
                <div className={"last-turn " + (last.outcome.success ? "last-turn--win" : "last-turn--loss")} aria-live="polite">
                  <div className="last-turn__heading">
                    <span>{last.outcome.success ? "✦ YOUR PLAN WORKED" : "✦ AN UNFORTUNATE SETBACK"}</span>
                    <RollBadge outcome={last.outcome}/>
                  </div>
                  <p>{last.outcome.narration}</p>
                  {last.outcome.masterstroke && <span className="last-turn__reward"><Crown size={14}/> MASTERSTROKE! Your idea beats the dice.</span>}
                  {last.outcome.creativity > 0 && <span className="last-turn__reward"><Sparkles size={14}/> Creativity: {last.outcome.creativity}/5 (+{last.outcome.creativity})</span>}
                  {(last.outcome.usedItems?.length ?? 0) > 0 && <span className="last-turn__spent"><Shield size={14}/> Used up: {last.outcome.usedItems.join(", ")}</span>}
                  {last.outcome.reward && <span className="last-turn__reward"><Sparkles size={14}/> Acquired: {last.outcome.reward}</span>}
                  <small>{last.outcome.mode === "ai" ? "Narrated by the AI Dungeon Master" : "Scripted narrator (AI not enabled)"}</small>
                </div>
              )}
              {last?.outcome.achievement && <AchievementUnlock achievement={last.outcome.achievement}/>}
              {previewTomorrow && artService && !last?.outcome.artTicket && last && <p className="art-debug-note">
                <Sparkles size={16}/> No personalised image was requested for this turn.
                {artService.status === "ready" ? " Please check the deployed /api/resolve artwork ticket." : " " + (artService.status === "disabled"
                  ? "AI portraits are disabled on the server." : "Missing: " + (artService.missing?.join(", ") ?? "Worker setup"))}
              </p>}
              {last && <RoomArtwork turn={last}/> }

              <section className="encounter">
                <div className="encounter__top">
                  <span className="encounter__tag"><Flame size={14}/> {room.subtitle.toUpperCase()}</span>
                  <span className="encounter__danger"><Dice5 size={15}/> Difficulty {room.difficulty}</span>
                </div>
                <div className="encounter__art encounter__art--pixel">
                  <PixelScene dungeonSlug={daily.dungeon.slug} roomIndex={run.roomIndex} className="encounter__pixel-scene"/>
                  <span className="encounter__scene-label">{room.subtitle}</span>
                </div>
                <div className="encounter__body">
                  <h2>{room.title}</h2>
                  {room.arrival && <p className="encounter__arrival"><Sparkles size={14}/>{room.arrival}</p>}
                  <p>{room.scene}</p>
                  <div className="dm-quote">
                    <span className="dm-quote__avatar"><Crown size={18}/></span>
                    <div>
                      <div className="dm-quote__name">{room.character}</div>
                      <p>{room.challenge}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="action-panel">
                <div className="action-panel__heading">
                  <h3>What do you do, adventurer?</h3>
                  <span>BE CREATIVE</span>
                </div>
                {run.roomIndex === 0 ? (
                  <div className="action-help action-help--intro">
                    <p><Sparkles size={16}/>{firstRoomTip()}</p>
                    <span className="action-help__label">NEED A STARTING IDEA? TAP ONE AND FINISH THE SENTENCE.</span>
                    <div className="action-help__chips">
                      {starterIdeas.map(idea => (
                        <button key={idea.label} type="button" className="action-help__chip"
                          title={idea.tip} disabled={loading} onClick={() => useStarter(idea.draft)}>
                          {idea.label}<ArrowRight size={13}/>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="action-help action-help--later">
                    <p>Try anything. There is no single correct solution.</p>
                    <details><summary>Need inspiration?</summary>
                      <div className="action-help__chips">
                        {starterIdeas.map(idea => (
                          <button key={idea.label} type="button" className="action-help__chip"
                            title={idea.tip} disabled={loading} onClick={() => useStarter(idea.draft)}>
                            {idea.label}<ArrowRight size={13}/>
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
                <label className="sr-only" htmlFor="player-action">Your next action</label>
                <textarea ref={actionField} id="player-action" value={action} onChange={e => setAction(e.target.value)}
                  placeholder={run.roomIndex === 0 ? "What would YOU try? There are no wrong kinds of ideas..." : "I take out my potato and..."} maxLength={280} rows={3}
                  disabled={loading} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void submitAction(); } }} />
                {starterNeedsFinishing && <p className="action-help__finish">✦ Finish this idea in your own words before rolling.</p>}
                <div className="action-panel__footer">
                  <span className="action-panel__count">{action.length}/280</span>
                  <button className="button button--primary" onClick={() => void submitAction()} disabled={loading || action.trim().length < 4 || starterNeedsFinishing}>
                    {loading ? "The dice are rolling…" : "Take your chance"} <Dice5 size={18}/>
                  </button>
                </div>
                {error && <p className="error" role="alert">{error}</p>}
              </section>
            </div>

            <aside className="sidebar">
              <div className="sidebar__section">
                <p className="eyebrow">YOUR HERO</p>
                <div className="hero-card">
                  <div className="hero-card__portrait"><Shield size={37}/></div>
                  <div><strong>The Unlikely Hero</strong><span>Level 1 · Questionable bravery</span></div>
                </div>
                <div className="sidebar__hearts"><span>HEALTH</span><Hearts count={run.hearts}/></div>
              </div>
              <div className="sidebar__section"><Inventory items={run.inventory}/></div>
              <div className="sidebar__section">
                <div className="eyebrow"><ScrollText size={14}/> ADVENTURE JOURNAL</div>
                {run.history.length === 0 ? (
                  <p className="sidebar__hint">Your legend has yet to be written.</p>
                ) : run.history.map((entry, i) => (
                  <details className="journal-entry" key={i}>
                    <summary><span>{entry.outcome.success ? "✦" : "✕"} {entry.roomTitle}</span><span>{entry.outcome.success ? "Passed" : "Lost a heart"}</span></summary>
                    <p><strong>You tried:</strong> {entry.action}</p>
                    <p>{entry.outcome.narration}</p>
                    {(entry.outcome.usedItems?.length ?? 0) > 0 && <p><strong>Used up:</strong> {entry.outcome.usedItems?.join(", ")}</p>}
                    {entry.outcome.achievement && <p className="journal-entry__award"><Crown size={14}/> {entry.outcome.achievement.title}</p>}
                  </details>
                ))}
              </div>
              <button className="reset-link" onClick={reset}>↺ Restart playtest</button>
              {!previewTomorrow && canPreviewTomorrow && <a className="preview-link" href="?preview=tomorrow">⏭ Test tomorrow’s dungeon</a>}
            </aside>
          </div>
        )}

        {run.started && run.finished && (
          <div className="ending">
            <div className={"ending__icon " + (won ? "ending__icon--win" : "ending__icon--loss")}>{won ? <Crown size={42}/> : <Skull size={42}/>}</div>
            <p className="eyebrow">{won ? "QUEST COMPLETE" : "YOUR ADVENTURE ENDS HERE"}</p>
            <h1>{title}</h1>
            <p className="ending__lead">
              {won ? "Through a combination of wit, audacity and highly suspicious luck, you've made it out alive." :
                "Your courage was unquestionable. Your decision-making, less so. The Dungeon Master will remember this."}
            </p>
            <div className="ending__stats">
              <div><strong>{run.history.length}/3</strong><span>ROOMS VISITED</span></div>
              <div><strong>{wins}/3</strong><span>TRIALS PASSED</span></div>
              <div><strong>{run.hearts}/3</strong><span>HEARTS LEFT</span></div>
            </div>
            {previewTomorrow && artService && !run.history.some(turn => turn.art) && <p className="art-debug-note">
              <Sparkles size={16}/> No AI portraits were requested during this playtest.
              {artService.status === "ready" ? " The portrait service reports ready, so check /api/resolve." : " " + (artService.status === "disabled"
                ? "The deployed ART_ENABLED flag is off." : "Server setup needed: " + (artService.missing?.join(", ") ?? "check bindings"))}
            </p>}
            <section className="hero-certificate hero-chronicle" aria-label="Your certificate and illustrated adventure">
              <div className="hero-certificate__ornament">✦</div>
              <p className="hero-certificate__eyebrow">THE DAILY DUNGEON PRESENTS</p>
              <h2>Certificate of Questionable Heroism</h2>
              <p className="hero-certificate__intro">Officially bestowed upon a most improbable adventurer</p>
              <strong className="hero-certificate__name">{title}</strong>
              <p className="hero-certificate__dungeon">{daily.dungeon.title} · Dungeon #{String(daily.number).padStart(3, "0")}</p>
              <div className="hero-certificate__awards">
                <span className="eyebrow">{achievements.length ? "HONOURS BESTOWED" : "OFFICIAL VERDICT"}</span>
                {achievements.length ? achievements.map((award, i) => (
                  <div className="hero-certificate__award" key={i}>
                    <Crown size={20}/>
                    <div><strong>{award.title}</strong><p>{award.description}</p></div>
                  </div>
                )) : <p>The Dungeon Master remains undecided about your greatness.</p>}
              </div>
              {run.history.some(turn => turn.art) && (
                <div className="hero-chronicle__gallery" aria-label="Your three illustrated moments">
                  <p className="eyebrow">✦ YOUR ADVENTURE IN PIXELS ✦</p>
                  <div className="hero-chronicle__gallery-grid">
                    {run.history.filter(turn => turn.art).map((turn, i) => (
                      <RoomArtwork key={turn.roomTitle + i} turn={turn} compact/>
                    ))}
                  </div>
                </div>
              )}
              <p className="hero-certificate__seal">✦ ONE DUNGEON. ENDLESS POSSIBILITIES. ✦</p>

              <div className="hero-chronicle__actions">
                <button className="button button--primary" onClick={() => void share()}>
                  {copied ? <Check size={18}/> : <Share2 size={18}/>}
                  {copied ? "Result ready to share" : "Share your legend"}
                </button>
                <button className="button button--secondary" onClick={() => void shareCertificate()}>
                  <Download size={17}/> Save certificate
                </button>
              </div>
              {certificateNotice && <p className="hero-chronicle__notice" role="status">{certificateNotice}</p>}

              <details className="hero-chronicle__journal">
                <summary>
                  <ScrollText size={21}/>
                  <span>
                    <strong>Read your hero's journal</strong>
                    <small>{run.history.length} room{run.history.length === 1 ? "" : "s"} · Your decisions and the Dungeon Master's story</small>
                  </span>
                  <ChevronDown size={19} className="hero-chronicle__chevron"/>
                </summary>
                <div className="hero-chronicle__journal-body">
                  {run.history.map((entry, i) => (
                    <article className="ending__entry" key={i}>
                      <div className="ending__entry-title">
                        <span className="ending__entry-number">{String(i + 1).padStart(2, "0")}</span>
                        <span>{entry.outcome.success ? "✦" : "✕"} {entry.roomTitle}</span>
                      </div>
                      <div className="ending__entry-action">
                        <span className="ending__entry-label">YOU TRIED</span>
                        <p><em>"{entry.action}"</em></p>
                      </div>
                      {(entry.outcome.usedItems?.length ?? 0) > 0 && <p className="ending__entry-spent">Used up: {entry.outcome.usedItems?.join(", ")}</p>}
                      <RoomArtwork turn={entry} compact/>
                      <div className="ending__entry-response">
                        <span className="ending__entry-label">THE DUNGEON MASTER</span>
                        <p>{entry.outcome.narration}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            </section>
            <div className="ending__actions">
              <button className="button button--secondary" onClick={reset}>Replay playtest</button>
              {!previewTomorrow && canPreviewTomorrow && <a className="button button--secondary" href="?preview=tomorrow">⏭ Test tomorrow’s dungeon</a>}
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="ending__tomorrow"><Sparkles size={17}/> A new dungeon opens tomorrow at midnight UTC.</div>
          </div>
        )}
      </main>
      <footer className="footer">
        <span><Swords size={16}/> THE DAILY DUNGEON</span>
        <span>Crafted for creative heroes, terrible decisions & excellent stories.</span>
        <span className="footer__playtest">FOUNDATION PLAYTEST · NOT YET A COMPETITIVE GAME</span>
      </footer>
    </div>
  );
}
