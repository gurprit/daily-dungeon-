import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Check, Crown, Dice5, Download, Flame,
  Heart, ScrollText, Share2, Shield, Skull, Sparkles, Swords
} from "lucide-react";
import { getDailyGame, getDailyChoices, getDailyGameForSlot, getPreviewDailyGame, getFreshPreviewGame, type Dungeon } from "./game";
import { FRESH_PREVIEW_MODES, freshPreviewIndex } from "./fresh-dungeons";
import { storyRoom, storyClues, storyEnding } from "./story";
import { startingItems, inventoryAfterTurn } from "./inventory";
import { resolveAction, type ActionOutcome } from "./engine";
import { fallbackAchievement, isAchievement, type Achievement } from "./achievements";
import { createCertificateImage } from "./certificate";
import IllustratedScene, { type ArtPreview } from "./IllustratedScene";
import { rollBreakdown } from "./roll-math";
import { chooseEpilogue } from "./epilogue";

// Date preview is opt-in and never overwrites genuine daily progress.
const previewTomorrow = new URLSearchParams(window.location.search).get("preview") === "tomorrow";
const previewHollowmere = new URLSearchParams(window.location.search).get("preview") === "hollowmere";
const freshIndex = freshPreviewIndex(new URLSearchParams(window.location.search).get("preview"));
const previewFresh = freshIndex !== null;
const previewMode = previewTomorrow || previewHollowmere || previewFresh;
const selectedQuest = new URLSearchParams(window.location.search).get("quest");
const dailySlot: 0 | 1 | 2 = !previewMode && (selectedQuest === "1" || selectedQuest === "2")
  ? Number(selectedQuest) as 1 | 2 : 0;
const gameForPage = () => freshIndex !== null ? getFreshPreviewGame(freshIndex)
  : previewHollowmere ? getDailyGame(new Date("2026-10-26T12:00:00Z"))
  : previewTomorrow ? getPreviewDailyGame() : getDailyGameForSlot(dailySlot);
// New namespace & edition. Never delete, rewrite or combine previous playtest saves.
type DailySource = "classic" | "generated";
const runStorageKey = (day: string, source: DailySource = "classic", slot = dailySlot) => "daily-dungeon:" +
  (previewFresh ? "nes-clean-v1:" + FRESH_PREVIEW_MODES[freshIndex!] + ":" :
   previewHollowmere ? "test-hollowmere:" : previewTomorrow ? "test-tomorrow:" :
    source === "generated" ? "ai-stories-v1:quest-" + slot + ":" :
    slot ? "daily-choice-" + slot + ":" : "") + day;

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
  edition?: number;
};

function freshRun(day: string, game = gameForPage()): Run {
  return {
    day, started: false, roomIndex: 0,
    hearts: 3, inventory: startingItems(game.dungeon),
    history: [], finished: false, edition: game.dungeon.edition ?? 1
  };
}

function loadRun(day: string, game = gameForPage(), source: DailySource = "classic"): Run {
  try {
    const saved = localStorage.getItem(runStorageKey(day, source));
    if (!saved) return freshRun(day,game);
    const parsed = JSON.parse(saved) as Run;
    if (
      parsed.day === day &&
      (parsed.edition ?? 1) === (game.dungeon.edition ?? 1) &&
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
  return freshRun(day,game);
}

function useDailyRun() {
  const [daily, setDaily] = useState(gameForPage);
  const [source, setSource] = useState<DailySource>("classic");
  const [choices, setChoices] = useState<readonly Dungeon[]>(() => getDailyChoices().map(c=>c.dungeon));
  const [preparing, setPreparing] = useState(false);
  const [run, setRun] = useState<Run>(()=>loadRun(gameForPage().day));
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    try { localStorage.setItem(runStorageKey(run.day,source),JSON.stringify(run)); }
    catch { /* Local storage unavailable */ }
  },[run,source]);

  useEffect(() => {
    if (previewMode) return;
    let active=true, retries=0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync=async()=>{
      try {
        const response=await fetch("/api/daily-stories",{cache:"no-store"});
        const data=await response.json() as {
          day?:string; status?:string; source?:DailySource; choices?:Dungeon[];
        };
        if(!active || data.day!==getDailyGame().day)return;
        if(data.source==="generated" && data.status==="ready" &&
           Array.isArray(data.choices) && data.choices.length===3) {
          setPreparing(false);
          // An active run is pinned; the player cannot change dungeon mid-quest.
          if(runRef.current.started) return;
          const next={day:data.day!,number:getDailyGame().number,dungeon:data.choices[dailySlot]};
          setChoices(data.choices);
          setDaily(next);
          setSource("generated");
          setRun(loadRun(next.day,next,"generated"));
        } else if(data.status==="pending" && retries++<40){
          setPreparing(true);
          timer=setTimeout(()=>{if(active)void sync();},2500);
        } else setPreparing(false);
      }catch{if(active)setPreparing(false);}
    };
    void sync();
    return ()=>{active=false;if(timer)clearTimeout(timer);};
  },[daily.day]);

  useEffect(()=>{
    const interval=window.setInterval(()=>{
      const next=gameForPage();
      if(next.day!==daily.day){
        setSource("classic");
        setChoices(getDailyChoices().map(c=>c.dungeon));
        setPreparing(false);
        setDaily(next);
        setRun(loadRun(next.day,next,"classic"));
      }
    },60_000);
    return ()=>window.clearInterval(interval);
  },[daily.day]);

  return {daily,run,setRun,source,choices,preparing};
}

function DungeonDoor({ dungeon, day, preview, enabled, dailySource }: {
  dungeon: Dungeon; day: string; preview: ArtPreview; enabled: boolean; dailySource: DailySource
}) {
  return (
    <div className="dungeon-art dungeon-art--pixel">
      <div className="pixel-scene__topbar"><span>✦ QUEST PREVIEW</span><span>3-ROOM ADVENTURE</span></div>
      <div className="pixel-scene__viewport">
        <IllustratedScene dailySource={dailySource} dailySlot={dailySlot} dungeonSlug={dungeon.slug}
          storyTitle={dungeon.title} roomTitle={dungeon.rooms[0].title} sceneText={dungeon.rooms[0].scene}
          roomIndex={0} kind="room" day={day}
          preview={preview} enabled={enabled} alt={"Illustration of " + dungeon.title}
          className="procedural-art--welcome"/>
        <div className="pixel-scene__scanlines" aria-hidden="true"/>
      </div>
      <div className="pixel-scene__bottombar">
        <span><span className="pixel-scene__life">♥ ♥ ♥</span> HP:03</span>
        <span className="pixel-scene__quest-name">{dungeon.title}</span>
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

function RoomArtwork({ turn, dungeon, roomIndex, day, preview, enabled, dailySource, compact = false }: {
  turn: Turn; dungeon: Dungeon; roomIndex: number; day: string;
  preview: ArtPreview; enabled: boolean; dailySource: DailySource; compact?: boolean;
}) {
  return (
    <figure className={"room-artwork " + (compact ? "room-artwork--compact" : "")}>
      <div className="room-artwork__frame">
        <IllustratedScene dailySource={dailySource} dailySlot={dailySlot} kind="action" dungeonSlug={dungeon.slug}
          storyTitle={dungeon.title} roomTitle={dungeon.rooms[roomIndex].title}
          sceneText={dungeon.rooms[roomIndex].scene} roomIndex={roomIndex}
          day={day} preview={preview} enabled={enabled} ticket={turn.outcome.artTicket}
          action={turn.action} narration={turn.outcome.narration}
          success={turn.outcome.success}
          alt={"Illustration of " + turn.action}/>
      </div>
      <figcaption><Sparkles size={15}/><span>{turn.roomTitle}</span>
        <span className="room-artwork__chip">YOUR MOMENT, ILLUSTRATED</span></figcaption>
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
  const roll = rollBreakdown(outcome);
  return (
    <div className={"roll-badge " + (outcome.success ? "roll-badge--win" : "roll-badge--loss")}
      aria-label={`D20 rolled ${roll.die}, plus ${roll.creativity} creativity and ${roll.itemBonus} item bonus, total ${roll.total}, difficulty ${roll.target}. ${outcome.success ? "Success" : "Failure"}.`}>
      <div className="roll-badge__die" aria-hidden="true">
        <span>D20</span><strong>{roll.die}</strong>
      </div>
      <div className="roll-badge__details">
        <span className="roll-badge__label">YOUR DICE ROLL</span>
        <div className="roll-badge__formula">
          <strong>{roll.die}</strong>
          <span>+ {roll.creativity} creativity</span>
          {roll.itemBonus > 0 && <span>+ {roll.itemBonus} item</span>}
          <span>= <strong>{roll.total}</strong></span>
        </div>
        <div className="roll-badge__verdict">
          <span>Total <strong>{roll.total}</strong> vs DC <strong>{roll.target}</strong></span>
          <b>{roll.automaticSuccess ? "MASTERSTROKE! Automatic success" : outcome.success ? "SUCCESS" : "FAILED ROLL"}</b>
        </div>
      </div>
    </div>
  );
}

function JourneyRoll({ outcome }: { outcome: ActionOutcome }) {
  const roll = rollBreakdown(outcome);
  return (
    <div className="ending__entry-roll">
      <Dice5 size={15}/>
      <span>D20 <strong>{roll.die}</strong> + {roll.creativity} creativity{roll.itemBonus > 0 ? ` + ${roll.itemBonus} item` : ""}
        {" = "}<strong>{roll.total}</strong> vs DC <strong>{roll.target}</strong>
      </span>
      <b className={outcome.success ? "ending__entry-roll--success" : "ending__entry-roll--failed"}>
        {roll.automaticSuccess ? "MASTERSTROKE" : outcome.success ? "PASS" : "FAIL"}
      </b>
    </div>
  );
}

export default function App() {
  const { daily, run, setRun, source, choices, preparing } = useDailyRun();
  const [action, setAction] = useState("");
  const actionField = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [certificateNotice, setCertificateNotice] = useState("");
  const [artService, setArtService] = useState<"ready" | "disabled" | "setup-required">("disabled");
  const artEnabled = artService === "ready";
  const artPreview: ArtPreview = freshIndex !== null ? FRESH_PREVIEW_MODES[freshIndex] : previewHollowmere ? "hollowmere" : previewTomorrow ? "tomorrow" : "today";
  useEffect(() => {
    void fetch("/api/health")
      .then(response => response.json())
      .then((data: { art?: { status?: "ready" | "disabled" | "setup-required" } }) => {
        setArtService(data.art?.status ?? "disabled");
      })
      .catch(() => setArtService("disabled"));
  }, []);
  const storyBeats = run.history.map(turn => ({ action: turn.action, success: turn.outcome.success }));
  const room = storyRoom(daily.dungeon, run.roomIndex, storyBeats);
  const clues = storyClues(daily.dungeon.slug, storyBeats);
  const last = run.history.at(-1);
  const finalFate = last?.outcome.storyEnding ?? (run.finished && run.hearts === 0
    ? storyEnding(daily.dungeon.slug, last?.action ?? "", false, 0, storyBeats)
    : null);
  const wins = run.history.filter(t => t.outcome.success).length;
  const achievements = run.history
    .map(turn => turn.outcome.achievement)
    .filter((value): value is Achievement => isAchievement(value));
  const won = run.finished && run.hearts > 0;
  const title = finalFate?.title ?? (won
    ? (wins === 3 ? "A Legend Is Born" : "The Unlikely Survivor")
    : "The Dramatic Demise");

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
            inventory: run.inventory,
            priorTurns: run.history.map((turn, i) => ({
              roomIndex: i,
              action: turn.action,
              narration: turn.outcome.narration,
              success: turn.outcome.success
            })),
            previewTomorrow,
            previewHollowmere,
            ...(!previewMode ? { dailySlot, dailySource: source } : {}),
            ...(freshIndex !== null ? { previewFresh: freshIndex + 1 } : {})
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
    window.scrollTo(0, 0);
  }

  function reset() {
    if (!window.confirm("Restart this adventure? Your progress in this quest will be lost.")) return;
    setRun(freshRun(daily.day,daily));
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
            <div className="site-header__tagline">THREE QUESTS. ONE DAY.</div>
          </div>
        </div>
        <div className="site-header__right">
          <span className="daily-pill"><Sparkles size={14}/> DAILY #{String(daily.number).padStart(3, "0")}</span>
          <span className="site-header__date">{new Date(daily.day + "T12:00:00Z").toLocaleDateString("en-GB", { day:"numeric", month:"short", timeZone:"UTC" })}</span>
        </div>
      </header>

      <main className="main">
        {!previewMode && !run.started && <section className="daily-quests" aria-label="Choose one of today's three adventures">
          <div className="daily-quests__heading">
            <div><span className="eyebrow">THREE SHORT QUESTS · ONE DAY</span>
              <h2>Choose today's adventure</h2></div>
            <p>Three new shared quests are prepared daily. Each takes about five minutes, with three rooms. Play one or all three.</p>
          </div>
          <nav className="daily-quests__grid" aria-label="Daily adventures">
            {choices.map((dungeon, index) => {
              const entry={dungeon};
              const storage=runStorageKey(daily.day,source,index as 0 | 1 | 2);
              let label = "READY";
              try {
                const saved = localStorage.getItem(storage);
                const progress = saved ? JSON.parse(saved) as Partial<Run> : null;
                if (progress?.finished) label = "COMPLETED";
                else if (progress?.started) label = "CONTINUE";
              } catch { /* Browser storage may be unavailable */ }
              return <a key={entry.dungeon.slug}
                className={"daily-quests__choice" + (index === dailySlot ? " daily-quests__choice--active" : "")}
                aria-current={index === dailySlot ? "page" : undefined}
                href={index ? "?quest=" + index : window.location.pathname}>
                <span className="daily-quests__number">ADVENTURE {String(index + 1).padStart(2, "0")}</span>
                <strong>{entry.dungeon.title}</strong>
                <span className="daily-quests__subtitle">{entry.dungeon.subtitle}</span>
                <span className="daily-quests__status">{index === dailySlot ? "SELECTED · " : ""}{label}</span>
              </a>;
            })}
          </nav>
          {preparing && <p className="daily-quests__preparing" role="status">✨ The Dungeon Master is creating today's new adventures. Classic quests are playable while the ink dries.</p>}
        </section>}
        {!run.started && (
          <section className="intro">
            <div className="intro__visual">
              <div className="intro__badge"><Flame size={14}/> THE GATES ARE OPEN</div>
              <DungeonDoor dungeon={daily.dungeon} day={daily.day} preview={artPreview} enabled={artEnabled} dailySource={source}/>
            </div>
            <div className="intro__copy">
              <p className="eyebrow">ADVENTURE {String(dailySlot + 1).padStart(2, "0")} · THREE-ROOM QUEST</p>
              <h1>{daily.dungeon.title}</h1>
              <p className="intro__subtitle">{daily.dungeon.subtitle}</p>
              <p className="intro__description">{daily.dungeon.intro}</p>
               {daily.dungeon.objective && <div className="story-objective"><ScrollText size={19}/><div><strong>YOUR MISSION</strong><p>{daily.dungeon.objective}</p></div></div>}
              <div className="intro__facts">
                <span><BookOpen size={17}/> 3 rooms</span>
                <span><Heart size={17}/> 3 hearts</span>
                <span><Dice5 size={17}/> ~5 minutes</span>
              </div>
              <button className="button button--primary button--large" onClick={start}>
                Enter the dungeon <ArrowRight size={19}/>
              </button>
              <p className="intro__small">No account. No downloads. Just your imagination. Your three starting items are single-use.</p>
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

              {daily.dungeon.objective && <div className="story-objective story-objective--active"><ScrollText size={18}/><div><strong>YOUR MISSION</strong><p>{daily.dungeon.objective}</p></div></div>}
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
                  </div>
                  <RollBadge outcome={last.outcome}/>
                  <p>{last.outcome.narration}</p>
                  {last.outcome.masterstroke && <span className="last-turn__reward"><Crown size={14}/> MASTERSTROKE! Your idea beats the dice.</span>}
                  {(last.outcome.usedItems?.length ?? 0) > 0 && <span className="last-turn__spent"><Shield size={14}/> Used up: {last.outcome.usedItems.join(", ")}</span>}
                  {last.outcome.reward && <span className="last-turn__reward"><Sparkles size={14}/> Acquired: {last.outcome.reward}</span>}
                  <small>{last.outcome.mode === "ai" ? "Narrated by the AI Dungeon Master" : "Scripted narrator (AI not enabled)"}</small>
                </div>
              )}
              {last && <RoomArtwork turn={last} dungeon={daily.dungeon} roomIndex={run.history.length-1} day={daily.day} preview={artPreview} enabled={artEnabled} dailySource={source}/>}
              {last?.outcome.achievement && <AchievementUnlock achievement={last.outcome.achievement}/>}


              {clues.length > 0 && <section className="story-clues" aria-label="Clues discovered">
                <h2><BookOpen size={18}/> What you’ve discovered</h2>
                {clues.map((clue, i) => <div className="story-clues__entry" key={clue.id}>
                  <IllustratedScene dailySource={source} dailySlot={dailySlot} dungeonSlug={daily.dungeon.slug} roomIndex={i}
                    storyTitle={daily.dungeon.title} roomTitle={daily.dungeon.rooms[i].title}
                    sceneText={daily.dungeon.rooms[i].scene} kind="clue" clueId={clue.id} variant={clue.id} day={daily.day}
                    preview={artPreview} enabled={artEnabled} alt={"Discovery: " + clue.title}
                    className="procedural-art--clue"/>
                  <div className="story-clues__copy"><strong>{clue.title}</strong><p>{clue.text}</p></div>
                </div>)}
              </section>}
               <section className="encounter">
                <div className="encounter__top">
                  <span className="encounter__tag"><Flame size={14}/> {room.subtitle.toUpperCase()}</span>
                  <span className="encounter__danger"><Dice5 size={15}/> Difficulty {room.difficulty}</span>
                </div>
                <div className="encounter__art encounter__art--illustrated">
                  <IllustratedScene dailySource={source} dailySlot={dailySlot} dungeonSlug={daily.dungeon.slug} roomIndex={run.roomIndex}
                    storyTitle={daily.dungeon.title} roomTitle={room.title} sceneText={room.scene} kind="room" day={daily.day} preview={artPreview} enabled={artEnabled}
                    alt={"Room illustration: " + room.title}
                    className="procedural-art--room"/>
                  <span className="encounter__scene-label">{room.subtitle}</span>
                </div>
                <div className="encounter__body">
                  <h2>{room.title}</h2>
                  {room.arrival && <p className="encounter__arrival"><Sparkles size={14}/>{room.arrival}</p>}
                   {room.echo && <div className="story-echo"><span>YOUR EARLIER CHOICE CHANGED THIS ROOM</span><p>{room.echo}</p></div>}
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
                </div>
                <label className="sr-only" htmlFor="player-action">Your next action</label>
                <textarea ref={actionField} id="player-action" value={action} onChange={e => setAction(e.target.value)}
                  placeholder="Tell the Dungeon Master what you would like to do…" maxLength={280} rows={3}
                  disabled={loading} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void submitAction(); } }} />
                <div className="action-panel__footer">
                  <span className="action-panel__count">{action.length}/280</span>
                  <button className="button button--primary" onClick={() => void submitAction()} disabled={loading || action.trim().length < 4}>
                    {loading ? "Rolling the dice…" : "Roll the dice"} <Dice5 size={18}/>
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
              <button className="reset-link" onClick={reset}>↺ Restart this adventure</button>
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
            <IllustratedScene dailySource={source} dailySlot={dailySlot} dungeonSlug={daily.dungeon.slug} roomIndex={2}
              storyTitle={daily.dungeon.title} roomTitle={daily.dungeon.rooms[2].title}
              sceneText={daily.dungeon.rooms[2].scene} kind="ending" day={daily.day} preview={artPreview} enabled={artEnabled}
              variant={finalFate?.id ?? (won ? "victory" : "defeat")}
              endingId={finalFate?.id ?? (won ? "victory" : "defeat")}
              alt={"Illustrated ending: " + title} className="procedural-art--ending"/>
            {finalFate && <section className="story-fate" aria-label="Your story ending"><strong>THE FATE OF HOLLOWMERE</strong><p>{finalFate.consequence}</p></section>}
             <div className="ending__stats">
              <div><strong>{run.history.length}/3</strong><span>ROOMS VISITED</span></div>
              <div><strong>{wins}/3</strong><span>TRIALS PASSED</span></div>
              <div><strong>{run.hearts}/3</strong><span>HEARTS LEFT</span></div>
            </div>
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

              <section className="hero-chronicle__journal" aria-label="Hero's Journey">
                <h3 className="hero-chronicle__journal-title"><ScrollText size={21}/> Hero's Journey</h3>
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
                      <JourneyRoll outcome={entry.outcome}/>
                      {(entry.outcome.usedItems?.length ?? 0) > 0 && <p className="ending__entry-spent">Used up: {entry.outcome.usedItems?.join(", ")}</p>}
                      <RoomArtwork turn={entry} dungeon={daily.dungeon} roomIndex={i} day={daily.day} preview={artPreview} enabled={artEnabled} dailySource={source} compact/>
                      <div className="ending__entry-response">
                        <span className="ending__entry-label">THE DUNGEON MASTER</span>
                        <p>{entry.outcome.narration}</p>
                      </div>
                    </article>
                  ))}

                </div>
                <div className="hero-chronicle__epilogue" aria-label="The Dungeon Master's farewell">
                  <p className="hero-chronicle__epilogue-story">{chooseEpilogue(finalFate?.epilogue ?? last?.outcome.epilogue, {
                    dungeon: daily.dungeon.title,
                    room: last?.roomTitle ?? "the final chamber",
                    cleared: wins,
                    visited: run.history.length,
                    hearts: run.hearts,
                    lastHonour: achievements.at(-1)?.title,
                    moments: run.history.map(entry => ({ room: entry.roomTitle, success: entry.outcome.success, action: entry.action }))
                  })}</p>
                  <p className="hero-chronicle__return"><Sparkles size={18}/> Your story is written, but there may be more quests to explore today. <span>Three new adventures arrive each day, with classics as backup.</span></p>
                </div>
              </section>
            </section>
            <div className="ending__actions">
              <button className="button button--secondary" onClick={reset}>Replay this adventure</button>
              {!previewMode && choices.map((dungeon, index) =>
                index !== dailySlot ? <a className="button button--secondary" key={dungeon.slug}
                  href={index ? "?quest=" + index : window.location.pathname}>
                  <Swords size={15}/> Play {dungeon.title}
                </a> : null
              )}
            </div>
            {error && <p className="error" role="alert">{error}</p>}
          </div>
        )}
      </main>
      <footer className="footer">
        <span><Swords size={16}/> THE DAILY DUNGEON</span>
        <span>Crafted for creative heroes, terrible decisions & excellent stories.</span>
      </footer>
    </div>
  );
}
