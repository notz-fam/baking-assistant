"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoverButton } from "@/components/block/discover-button";
import { scaleRatio, scaledAmount, type Recipe } from "@/lib/recipe";
import { sampleRecipe } from "@/lib/sample";

type Screen = "import" | "scale" | "check" | "cook";
type Scale = { baseIdx: number; amount: string };

export default function Page() {
  const [screen, setScreen] = useState<Screen>("import");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  // 分量換算の状態。調理モードでも換算後の量を出すのでここで持つ
  const [scale, setScale] = useState<Scale>({ baseIdx: 0, amount: "" });

  const load = (r: Recipe) => {
    const baseIdx = Math.max(0, r.ingredients.findIndex((i) => i.grams));
    setRecipe(r);
    setScale({ baseIdx, amount: String(r.ingredients[baseIdx]?.grams ?? "") });
    setScreen("scale");
  };

  const ratio = recipe ? scaleRatio(recipe.ingredients[scale.baseIdx], Number(scale.amount)) : 1;

  return (
    <div className="stage">
      <Decorations />
      <main className="app">
        {screen === "import" && <ImportScreen onLoad={load} />}
        {screen === "scale" && recipe && (
          <ScaleScreen
            recipe={recipe}
            scale={scale}
            onScale={setScale}
            ratio={ratio}
            onBack={() => setScreen("import")} onNext={() => setScreen("check")} />
        )}
        {screen === "check" && recipe && (
          <CheckScreen recipe={recipe} onBack={() => setScreen("scale")} onStart={() => setScreen("cook")} />
        )}
        {screen === "cook" && recipe && <CookScreen recipe={recipe} ratio={ratio} onExit={() => setScreen("check")} />}
      </main>
    </div>
  );
}

/* PC 幅のときだけ左右の余白に見えるパン */
function Decorations() {
  return (
    <div className="deco" aria-hidden="true">
      <img src="/illustrations/croissant.png" alt="" className="deco-1" />
      <img src="/illustrations/loaf.png" alt="" className="deco-2" />
      <img src="/illustrations/donut.png" alt="" className="deco-3" />
      <img src="/illustrations/baguette.png" alt="" className="deco-4" />
      <img src="/illustrations/muffin.png" alt="" className="deco-5" />
    </div>
  );
}

function Ribbon({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="ribbon">
      <span>{children}</span>
    </h2>
  );
}

/* ① 取り込み */
function ImportScreen({ onLoad }: { onLoad: (r: Recipe) => void }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok || !data.recipe) throw new Error(data.error || "レシピを読み取れませんでした");
      onLoad(data.recipe);
    } catch (e) {
      setError(e instanceof Error ? e.message : "レシピを読み取れませんでした");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="screen">
      <header className="brand">
        <img src="/illustrations/bagel.png" alt="" className="brand-pic" />
        <div>
          <h1>こねながらレシピ</h1>
          <p className="brand-sub">手が粉だらけでも、最後まで。</p>
        </div>
      </header>

      <div className="card">
        <label htmlFor="src" className="label">
          レシピのURL か 本文
        </label>
        <textarea
          id="src"
          className="input"
          rows={5}
          placeholder="https://www.cotta.jp/recipe/..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <p className="hint">URL を貼るとページを読みます。うまくいかないときは、レシピの文章をそのまま貼ってください。</p>
        {error && <p className="error">{error}</p>}
      </div>

      {loading && (
        <div className="loading">
          <img src="/illustrations/melonpan.png" alt="" />
          <p>レシピを読んでいます</p>
        </div>
      )}

      <button type="button" className="link-btn" onClick={() => onLoad(sampleRecipe)}>
        サンプル（ベーグル）を読み込む
      </button>

      <div className="bottom-bar">
        <DiscoverButton
          label={loading ? "読んでいます…" : "取り込む"}
          onClick={submit}
          disabled={loading || !input.trim()}
          className="main-btn"
        />
      </div>
    </section>
  );
}

/* ② 分量換算 */
function ScaleScreen({
  recipe,
  scale,
  onScale,
  ratio,
  onBack,
  onNext,
}: {
  recipe: Recipe;
  scale: Scale;
  onScale: (s: Scale) => void;
  ratio: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const { baseIdx, amount } = scale;
  const base = recipe.ingredients[baseIdx];

  const pickBase = (idx: number) => {
    const ing = recipe.ingredients[idx];
    if (!ing.grams) return;
    onScale({ baseIdx: idx, amount: String(ing.grams) });
  };

  return (
    <section className="screen">
      <TopBar onBack={onBack} />
      <h1 className="recipe-title">{recipe.title}</h1>
      {recipe.yield?.servings && <p className="yield">{recipe.yield.servings}{ratio !== 1 && `（×${ratio.toFixed(2)}）`}</p>}
      {recipe.sourceUrl && (
        <a className="source" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
          元のレシピを見る
        </a>
      )}

      <Ribbon>材料</Ribbon>
      <div className="card base-card">
        <p className="label">基準：{base?.name}</p>
        <div className="base-row">
          <input
            className="input base-input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onScale({ baseIdx, amount: e.target.value })}
          />
          <span className="unit">g</span>
        </div>
        <p className="hint">材料をタップすると基準を変えられます</p>
      </div>

      <ul className="ingredients">
        {recipe.ingredients.map((ing, idx) => {
          const amt = scaledAmount(ing, ratio);
          // グループ（A・☆など）が変わる所に見出しを出す
          const prevGroup = idx > 0 ? recipe.ingredients[idx - 1].group ?? null : null;
          const showGroup = ing.group && ing.group !== prevGroup;
          return (
            <li key={idx} className={ing.group ? "in-group" : undefined}>
              {showGroup && <p className="ing-group">{ing.group}</p>}
              <button
                type="button"
                className={`ing ${idx === baseIdx ? "is-base" : ""}`}
                onClick={() => pickBase(idx)}
                disabled={ing.grams == null}
              >
                <span className="ing-name">{ing.name}</span>
                <span className="ing-amount">
                  {ing.grams != null ? (
                    <>
                      <span key={amt.text} className="num">
                        {amt.approx && <small>約</small>}
                        {amt.text}
                      </span>
                      {ing.estimated && <span className="orig">{ing.original}</span>}
                    </>
                  ) : (
                    <span className="num">{ing.original}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Ribbon>手順</Ribbon>
      <ol className="steps-preview">
        {recipe.steps.map((s, i) => (
          <li key={i}>
            {s.text}
            {s.note && <span className="step-note">{s.note}</span>}
            {s.image && <img className="step-thumb" src={s.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
          </li>
        ))}
      </ol>

      <div className="bottom-bar">
        <DiscoverButton label="始める前の準備へ" onClick={onNext} className="main-btn" />
      </div>
    </section>
  );
}

/* 事前の段取りが1つもないレシピのときの一言 */
const NO_PREP_LINES = [
  "段取りはゼロ。手を洗ったら、それが準備です。",
  "予熱も、常温待ちもなし。思い立ったが焼きどきです。",
  "このレシピ、あなたを待たせません。",
  "先にやることは何もありません。エプロンだけ、お忘れなく。",
  "準備いらずの、気が利くレシピです。",
];

/* ③ 始める前チェックリスト */
function CheckScreen({ recipe, onBack, onStart }: { recipe: Recipe; onBack: () => void; onStart: () => void }) {
  const [done, setDone] = useState<boolean[]>(() => recipe.prepTasks.map(() => false));
  const allDone = done.every(Boolean);
  const noPrep = recipe.prepTasks.length === 0;
  const [noPrepLine] = useState(() => NO_PREP_LINES[Math.floor(Math.random() * NO_PREP_LINES.length)]);

  if (noPrep) {
    return (
      <section className="screen">
        <TopBar onBack={onBack} />
        <Ribbon>始める前に</Ribbon>
        <div className="no-prep">
          <img src="/illustrations/kaiser.png" alt="" />
          <p>{noPrepLine}</p>
        </div>
        <div className="bottom-bar">
          <DiscoverButton label="スタート" onClick={onStart} className="main-btn" />
        </div>
      </section>
    );
  }

  return (
    <section className="screen">
      <TopBar onBack={onBack} />
      <Ribbon>始める前に</Ribbon>
      <p className="lead">レシピの途中で出てくる準備を、先にまとめました。</p>

      <ul className="checklist">
        {recipe.prepTasks.map((t, i) => (
          <li key={i}>
            <label className={`check ${done[i] ? "is-done" : ""}`}>
              <input
                type="checkbox"
                checked={done[i]}
                onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              />
              <span className="box" aria-hidden="true" />
              <span className="check-body">
                <span className="check-text">{t.text}</span>
                <span className="check-timing">{t.timing}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {allDone && (
        <div className="ready">
          <img src="/illustrations/croissant.png" alt="" />
          <p>準備ができました</p>
        </div>
      )}

      <div className="bottom-bar">
        <DiscoverButton
          label={allDone ? "スタート" : `あと${done.filter((d) => !d).length}つ`}
          onClick={onStart}
          disabled={!allDone}
          className="main-btn"
        />
      </div>
    </section>
  );
}

/* ④ 調理モード */
function CookScreen({ recipe, ratio, onExit }: { recipe: Recipe; ratio: number; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const total = recipe.steps.length;
  const finished = idx >= total;

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, total)), [total]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  // キーボード：→ / Space で次へ、← で戻る
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onExit]);

  // Wake Lock：画面を消さない（非対応なら何もしない）
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* 非対応・拒否は無視 */
      }
    };
    request();
    const onVis = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  const voice = useVoiceCommands(next, prev);
  const step = recipe.steps[idx];
  const uses = (step?.uses ?? []).filter((i) => recipe.ingredients[i]);

  return (
    <section className="cook">
      <div className="cook-tap" onClick={finished ? undefined : next}>
        <div className="cook-progress">
          {finished ? "おつかれさまでした" : `${idx + 1} / ${total}`}
        </div>
        <div className="cook-bar">
          <span style={{ width: `${(Math.min(idx + 1, total) / total) * 100}%` }} />
        </div>
        {finished ? (
          <div className="cook-done">
            <img src="/illustrations/loaf.png" alt="" />
            <p>できあがり</p>
          </div>
        ) : (
          <div key={idx} className="cook-step">
            <p className={`cook-text ${step.text.length > 45 ? "is-long" : ""}`}>{step.text}</p>
            {step.note && <p className="cook-note">{step.note}</p>}
            {step.image && (
              <img className="cook-photo" src={step.image} alt="" referrerPolicy="no-referrer" />
            )}
            {uses.length > 0 && (
              <ul className="cook-uses">
                {uses.map((i) => {
                  const ing = recipe.ingredients[i];
                  const amt = scaledAmount(ing, ratio);
                  return (
                    <li key={i}>
                      <span>
                        {ing.group && <span className="cook-uses-group">{ing.group}</span>}
                        {ing.name}
                      </span>
                      <span className="cook-uses-amt">
                        {amt.approx && "約"}
                        {amt.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {step.timerSec ? <p className="cook-timer">目安 {formatDuration(step.timerSec)}</p> : null}
            {step.alerts?.map((a, i) => (
              <p key={i} className="cook-alert">
                {formatDuration(a.atSec)}で：{a.text}
              </p>
            ))}
          </div>
        )}
        {!finished && (
          <p className="cook-hint">
            {voice.on ? "「つぎ」「もどる」と話しても操作できます" : "画面のどこをタップしても次へ"}
          </p>
        )}
      </div>
      <div className="cook-nav">
        <button type="button" onClick={prev} disabled={idx === 0}>
          ← 戻る
        </button>
        {voice.supported && (
          <button
            type="button"
            className={`voice-btn ${voice.on ? "is-on" : ""}`}
            onClick={voice.toggle}
            aria-pressed={voice.on}
          >
            {voice.on ? (voice.heard ? `「${voice.heard}」` : "聞いています") : "声で操作"}
          </button>
        )}
        <button type="button" onClick={onExit}>
          やめる
        </button>
      </div>
    </section>
  );
}

/* 音声操作：「つぎ」「もどる」でステップ送り（Web Speech API。非対応なら出さない） */
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

// 「つぎ」は「注ぎ」「継ぎ」と聞き取られることもある
const COMMAND_WORDS =
  /(次|つぎ|ツギ|注ぎ|継ぎ|接ぎ|すすむ|進む|進んで|ネクスト|next|オッケー|ok)|(戻|もど|モド|まえ|前|バック|back)/gi;

// 発話の中のコマンドを順番に取り出す。「次々」「つぎつぎ」は2回と数える
function parseCommands(text: string): ("next" | "prev")[] {
  const expanded = text.replace(/(.)々/g, "$1$1");
  return [...expanded.matchAll(COMMAND_WORDS)].map((m) => (m[1] ? "next" : "prev"));
}

function useVoiceCommands(next: () => void, prev: () => void) {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [heard, setHeard] = useState("");
  const handlers = useRef({ next, prev });
  handlers.current = { next, prev };

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!on) return;
    const w = window as unknown as Record<string, new () => Recognition>;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "ja-JP";
    rec.continuous = true;
    rec.interimResults = true;
    let active = true;
    // 発話ごとに、すでに実行したコマンドの数。途中経過で同じ「次」を二重に実行しないため
    const done = new Map<number, number>();
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.trim();
        if (!text) continue;
        setHeard(text.slice(-12));
        const cmds = parseCommands(text);
        const already = done.get(i) ?? 0;
        // 「次 次 次」とまとめて聞き取られたら、増えた分だけ実行する
        for (const c of cmds.slice(already)) {
          if (c === "next") handlers.current.next();
          else handlers.current.prev();
        }
        done.set(i, Math.max(already, cmds.length));
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        active = false;
        setOn(false);
      }
    };
    // ブラウザが勝手に止めたら聞き直す
    rec.onend = () => {
      if (!active) return;
      done.clear();
      try {
        rec.start();
      } catch {
        /* 二重 start は無視 */
      }
    };
    try {
      rec.start();
    } catch {
      setOn(false);
    }
    return () => {
      active = false;
      rec.onend = null;
      rec.stop();
      setHeard("");
    };
  }, [on]);

  return { supported, on, heard, toggle: () => setOn((v) => !v) };
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="topbar">
      <button type="button" className="back" onClick={onBack}>
        ← もどる
      </button>
    </div>
  );
}

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}秒`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ""}`;
  return s ? `${m}分${s}秒` : `${m}分`;
}
