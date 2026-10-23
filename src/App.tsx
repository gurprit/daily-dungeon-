import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Check, Crown, Dice5, Download, Flame,
  Heart, ScrollText, Share2, Shield, Skull, Sparkles, Swords
} from "lucide-react";
import { getDailyGame, STARTING_INVENTORY } from "./game";
import { resolveAction, type ActionOutcome } from "./engine";
import { fallbackAchievement, isAchievement, type Achievement } from "./achievements";
import { createCertificateImage } from "./certificate";

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
};

function freshRun(day: string): Run {
  return {
    day, started: false, roomIndex: 0,
    hearts: 3, inventory: [...STARTING_INVENTORY],
    history: [], finished: false
  };
}

function loadRun(day: string): Run {
  try {
    const saved = localStorage.getItem("daily-dungeon:" + day);
    if (!saved) return freshRun(day);
    const parsed = JSON.parse(saved) as Run;
    if (
      parsed.day === day &&
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
  const [daily, setDaily] = useState(getDailyGame);
  const [run, setRun] = useState<Run>(() => loadRun(getDailyGame().day));
  useEffect(() => {
    try { localStorage.setItem("daily-dungeon:" + run.day, JSON.stringify(run)); }
    catch { /* Local storage unavailable */ }
  }, [run]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = getDailyGame();
      if (next.day !== daily.day) {
        setDaily(next);
        setRun(loadRun(next.day));
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [daily.day]);
  return { daily, run, setRun };
}

function DungeonDoor() {
  return (
    <div className="dungeon-art" aria-hidden="true">
      <div className="dungeon-art__halo" />
      <div className="dungeon-art__torch dungeon-art__torch--left"><Flame size={23} /></div>
      <div className="dungeon-art__torch dungeon-art__torch--right"><Flame size={23} /></div>
      <div className="dungeon-art__arch">
        <div className="dungeon-art__keystone"><Crown size={20} /></div>
        <div className="dungeon-art__door">
          <div className="dungeon-art__star">✦</div>
          <div className="dungeon-art__knocker" />
        </div>
      </div>
      <div className="dungeon-art__mist dungeon-art__mist--one" />
      <div className="dungeon-art__mist dungeon-art__mist--two" />
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
          <img loading="lazy" src={turn.art.url} alt={"16-bit illustration of " + turn.roomTitle + " based on your adventure"} />
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [certificateNotice, setCertificateNotice] = useState("");
  const artInflight = useRef(new Set<string>());
  const room = daily.dungeon.rooms[Math.min(run.roomIndex, 2)];
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

  useEffect(() => {
    if (run.history.length === 0) return;
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
  }, [run.history.length]);

  async function submitAction() {
    const attempt = action.trim();
    if (loading || !run.started || run.finished || attempt.length < 4 || attempt.length > 280) return;
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
            inventory: run.inventory
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
      const remaining = Math.max(0, run.hearts - outcome.heartsLost);
      const nextIndex = run.roomIndex + 1;
      setRun(current => ({
        ...current,
        hearts: remaining,
        inventory: outcome.reward ? [...current.inventory, outcome.reward] : current.inventory,
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

  function start() {
    setRun(current => ({ ...current, started: true }));
    setError("");
  }

  function reset() {
    if (!window.confirm("Restart today's playtest? Your current adventure will be lost.")) return;
    setRun(freshRun(daily.day));
    setAction("");
    setError("");
    setCopied(false);
    setCertificateNotice("");
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
      "How did YOUR story end?"
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
          <span className="daily-pill"><Sparkles size={14}/> DAILY #{String(daily.number).padStart(3, "0")}</span>
          <span className="site-header__date">{new Date(daily.day + "T12:00:00Z").toLocaleDateString("en-GB", { day:"numeric", month:"short", timeZone:"UTC" })}</span>
        </div>
      </header>

      <main className="main">
        {!run.started && (
          <section className="intro">
            <div className="intro__visual">
              <div className="intro__badge"><Flame size={14}/> A NEW ADVENTURE AWAITS</div>
              <DungeonDoor/>
            </div>
            <div className="intro__copy">
              <p className="eyebrow">DUNGEON #{String(daily.number).padStart(3, "0")} · TODAY'S QUEST</p>
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
              <p className="intro__small">No account. No downloads. Just your imagination.</p>
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
                  {last.outcome.reward && <span className="last-turn__reward"><Sparkles size={14}/> Acquired: {last.outcome.reward}</span>}
                  <small>{last.outcome.mode === "ai" ? "Narrated by the AI Dungeon Master" : "Scripted narrator (AI not enabled)"}</small>
                </div>
              )}
              {last?.outcome.achievement && <AchievementUnlock achievement={last.outcome.achievement}/>}
              {last && <RoomArtwork turn={last}/> }

              <section className="encounter">
                <div className="encounter__top">
                  <span className="encounter__tag"><Flame size={14}/> {room.subtitle.toUpperCase()}</span>
                  <span className="encounter__danger"><Dice5 size={15}/> Difficulty {room.difficulty}</span>
                </div>
                <div className="encounter__art" aria-hidden="true">
                  <div className="encounter__rune">✧</div>
                  <div className="encounter__symbol">{room.icon === "dragon" ? "🐉" : room.icon === "book" ? "📚" : room.icon === "bridge" ? "🧌" : room.icon === "sphinx" ? "🦁" : room.icon === "king" ? "👑" : room.icon === "onion" ? "🧅" : room.icon === "cheese" ? "🧀" : room.icon === "wizard" ? "🧙" : "🍺"}</div>
                  <div className="encounter__rune">✧</div>
                </div>
                <div className="encounter__body">
                  <h2>{room.title}</h2>
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
                <p>Talk, bargain, improvise, use an item, or try something gloriously unexpected.</p>
                <label className="sr-only" htmlFor="player-action">Your next action</label>
                <textarea id="player-action" value={action} onChange={e => setAction(e.target.value)}
                  placeholder="I take out my potato and..." maxLength={280} rows={3}
                  disabled={loading} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void submitAction(); } }} />
                <div className="action-panel__footer">
                  <span className="action-panel__count">{action.length}/280</span>
                  <button className="button button--primary" onClick={() => void submitAction()} disabled={loading || action.trim().length < 4}>
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
                    {entry.outcome.achievement && <p className="journal-entry__award"><Crown size={14}/> {entry.outcome.achievement.title}</p>}
                  </details>
                ))}
              </div>
              <button className="reset-link" onClick={reset}>↺ Restart playtest</button>
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
            {run.history.some(turn => turn.art) && (
              <section className="room-art-gallery" aria-label="Your 16-bit adventure gallery">
                <p className="eyebrow">YOUR ADVENTURE IN PIXELS</p>
                <h2>The Illustrated Chronicle</h2>
                <p>Three moments. One entirely improbable hero.</p>
                <div className="room-art-gallery__grid">
                  {run.history.map((turn, index) => <RoomArtwork key={index} turn={turn} compact/>) }
                </div>
              </section>
            )}
            <section className="hero-certificate" aria-label="Your dungeon certificate">
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
              <p className="hero-certificate__seal">✦ ONE DUNGEON. ENDLESS POSSIBILITIES. ✦</p>
            </section>
            <div className="ending__journal">
              <h2><ScrollText size={19}/> Your Hero's Journal</h2>
              {run.history.map((entry, i) => (
                <div className="ending__entry" key={i}>
                  <div className="ending__entry-title">{entry.outcome.success ? "✦" : "✕"} {entry.roomTitle}</div>
                  <p><em>"{entry.action}"</em></p>
                  <p>{entry.outcome.narration}</p>
                  {entry.outcome.achievement && <p className="ending__award"><Crown size={16}/> {entry.outcome.achievement.title}</p>}
                </div>
              ))}
            </div>
            <div className="ending__actions">
              <button className="button button--primary button--large" onClick={() => void share()}>
                {copied ? <Check size={19}/> : <Share2 size={19}/>} {copied ? "Result ready to share" : "Share your legend"}
              </button>
              <button className="button button--secondary" onClick={() => void shareCertificate()}><Download size={18}/> Save / share certificate</button>
              <button className="button button--secondary" onClick={reset}>Replay playtest</button>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            {certificateNotice && <p className="ending__notice" role="status">{certificateNotice}</p>}
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
