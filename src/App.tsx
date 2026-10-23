import { useEffect, useState } from "react";
import {
  ArrowRight, BookOpen, Check, Copy, Crown, Dice5, Flame,
  Heart, ScrollText, Share2, Shield, Skull, Sparkles, Swords
} from "lucide-react";
import { getDailyGame, STARTING_INVENTORY } from "./game";
import { resolveAction, type ActionOutcome } from "./engine";

type Turn = {
  roomTitle: string;
  action: string;
  outcome: ActionOutcome;
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
    ) return parsed;
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

  const room = daily.dungeon.rooms[Math.min(run.roomIndex, 2)];
  const last = run.history.at(-1);
  const wins = run.history.filter(t => t.outcome.success).length;
  const won = run.finished && run.hearts > 0;
  const title = won
    ? (wins === 3 ? "A Legend Is Born" : "The Unlikely Survivor")
    : "The Dramatic Demise";

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
        history: [...current.history, { roomTitle: room.title, action: attempt, outcome }],
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
  }

  function shareText() {
    const rooms = run.history.map(t => t.outcome.success ? "🟩" : "🟥").join("");
    return [
      "🐉 THE DAILY DUNGEON #" + daily.number,
      daily.dungeon.title,
      rooms + " · " + wins + "/3 rooms cleared",
      won ? "🏆 " + title : "💀 " + title,
      "Hearts: " + run.hearts + "/3",
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
                  {last.outcome.reward && <span className="last-turn__reward"><Sparkles size={14}/> Acquired: {last.outcome.reward}</span>}
                  <small>{last.outcome.mode === "ai" ? "Narrated by the AI Dungeon Master" : "Scripted narrator (AI not enabled)"}</small>
                </div>
              )}

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
            <div className="ending__journal">
              <h2><ScrollText size={19}/> Your Hero's Journal</h2>
              {run.history.map((entry, i) => (
                <div className="ending__entry" key={i}>
                  <div className="ending__entry-title">{entry.outcome.success ? "✦" : "✕"} {entry.roomTitle}</div>
                  <p><em>"{entry.action}"</em></p>
                  <p>{entry.outcome.narration}</p>
                </div>
              ))}
            </div>
            <div className="ending__actions">
              <button className="button button--primary button--large" onClick={() => void share()}>
                {copied ? <Check size={19}/> : <Share2 size={19}/>} {copied ? "Result ready to share" : "Share your legend"}
              </button>
              <button className="button button--secondary" onClick={reset}>Replay playtest</button>
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
