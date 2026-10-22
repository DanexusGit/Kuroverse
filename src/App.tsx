import { useCallback, useEffect, useRef, useState } from "react";
import { Engine } from "./game/engine";
import type { Hud, RunResult, Status } from "./game/engine";
import { GameHud } from "./ui/GameHud";
import { BootScreen } from "./ui/BootScreen";
import { StartScreen, ClassSelectScreen, OptionsScreen, UpgradeScreen, PauseScreen, GameOverScreen } from "./ui/Overlays";
import type { GameOptions, ScoreRow } from "./ui/Overlays";
import { CLASSES } from "./game/classes";
import { HERO_CLASSES } from "./game/heroes";
import type { ClassId } from "./game/classes";
import { sfx } from "./game/audio";

const STORAGE_KEY = "neon-void-scores-v2";
const CLASS_KEY = "neon-void-class";
const OPTIONS_KEY = "kurovoid-options-v1";

type Screen = "boot" | "menu" | "options" | "classes" | "game";

const emptyHud: Hud = {
  status: "menu", score: 0, wave: 0, hp: 100, maxHp: 100, armor: 0, combo: 1, comboPct: 0,
  weaponIdx: 0, weaponName: "PULSE-9", weaponCode: "RK-9", weaponColor: "#4ff0ff",
  ammo: -1, ammoMax: 0, owned: [true, false, false, false, false, false],
  weaponAmmo: [1, 0, 0, 0, 0, 0], dashPct: 1, enemies: 0, boss: null, kills: 0, time: 0,
  mods: [], cards: [], banner: null, touch: false, waveType: "REAGRUPAR",
  className: "MAGO", classColor: "#a37bff", abilityName: "NOVA ARCANA", abilityPct: 1, abilityActive: false,
  boostPct: 1, boosting: false, hasBoost: true,
  passName: "RUNAS",
  spec0: { name: "NOVA", full: "NOVA ARCANA", key: "E", pct: 1, cd: 6, color: "#a37bff" },
  spec1: { name: "METEORO", full: "METEORO", key: "F", pct: 1, cd: 13, color: "#ff8400" },
  specs: [
    { name: "NOVA", full: "NOVA ARCANA", key: "E", pct: 1, cd: 6, color: "#a37bff" },
    { name: "METEORO", full: "METEORO", key: "F", pct: 1, cd: 13, color: "#ff8400" },
    { name: "INVISÍVEL", full: "MANTO DO VAZIO", key: "G", pct: 1, cd: 16, color: "#d7c5ff" },
    { name: "PORTAIS", full: "PORTAIS ARCANOS", key: "H", pct: 1, cd: 14, color: "#7de6ff" },
  ],
  classId: "mago",
  biomeName: "SETOR NEON",
  slowPct: 1, slowing: false, hasSlow: false,
  slotCodes: ["RK-9", "TS-N"], slotColors: ["#4ff0ff", "#a37bff"], slotIds: ["pulse", "tesla"],
};

function loadOptions(): GameOptions {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    if (raw) return { muted: false, lowFx: false, dmgFlash: true, dlc: false, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { muted: false, lowFx: false, dmgFlash: true, dlc: false };
}

/** The HeroWave roster has no Jedi. */
const rosterFor = (dlc: boolean) => (dlc ? HERO_CLASSES : CLASSES).filter((c) => !dlc || c.id !== "jedi");

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const classRef = useRef<ClassId>("mago");
  const [screen, setScreen] = useState<Screen>("boot");
  const [hud, setHud] = useState<Hud>(emptyHud);
  const [status, setStatus] = useState<Status>("menu");
  const [result, setResult] = useState<RunResult | null>(null);
  const [record, setRecord] = useState(false);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [selClass, setSelClass] = useState<ClassId>("mago");
  const [options, setOptions] = useState<GameOptions>(() => loadOptions());
  const [booting, setBooting] = useState(true);

  /* ---------- stored data ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setScores(JSON.parse(raw) as ScoreRow[]);
      const c = localStorage.getItem(CLASS_KEY) as ClassId | null;
      const dlcOn = loadOptions().dlc;
      if (c && rosterFor(dlcOn).some((x) => x.id === c)) { setSelClass(c); classRef.current = c; }
      else if (dlcOn && classRef.current === "jedi") { setSelClass("mago"); classRef.current = "mago"; }
    } catch { /* ignore */ }
  }, []);

  /* ---------- engine boot ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Engine(canvas, {
      onHud: (h) => setHud(h),
      onStatus: (s) => setStatus(s),
      onGameOver: (r) => {
        setResult(r);
        setScores((prev) => {
          const isRecord = prev.length === 0 || r.score > (prev[0]?.score ?? 0);
          setRecord(isRecord && r.score > 0);
          const row: ScoreRow = {
            score: r.score, wave: r.wave, kills: r.kills, time: r.time,
            date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          };
          const next = [...prev, row].sort((a, b) => b.score - a.score).slice(0, 8);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      },
    });
    engineRef.current = engine;
    const opts = loadOptions();
    sfx.setEnabled(!opts.muted);
    engine.setQualityLock(opts.lowFx);
    engine.dmgFlashEnabled = opts.dmgFlash;
    engine.setDlc(opts.dlc);
    engine.cls = rosterFor(opts.dlc).find((c) => c.id === classRef.current) ?? rosterFor(opts.dlc)[0];

    let resizeRaf = 0;
    const resize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        engine.resize(rect.width || window.innerWidth, rect.height || window.innerHeight, window.devicePixelRatio || 1);
      });
    };
    resize();
    engine.start();
    const t = window.setTimeout(() => setBooting(false), 260);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    const onVis = () => { if (document.hidden) engine.pause(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      document.removeEventListener("visibilitychange", onVis);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  /* demo gameplay starts whenever the menu is shown */
  useEffect(() => {
    if (screen === "menu") engineRef.current?.startDemo();
    // Pre-bake the sector art while the player is still choosing, so the first
    // combat frame never pays for building the background plate.
    if (screen === "classes") engineRef.current?.prewarm();
  }, [screen, options.dlc]);

  /* apply options live */
  useEffect(() => {
    try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(options)); } catch { /* ignore */ }
    sfx.setEnabled(!options.muted);
    const engine = engineRef.current;
    if (engine) {
      engine.setQualityLock(options.lowFx);
      engine.dmgFlashEnabled = options.dmgFlash;
      engine.setDlc(options.dlc);
    }
    // The Jedi does not exist in HeroWave: move the selection to a valid hero.
    const allowed = rosterFor(options.dlc);
    if (!allowed.some((c) => c.id === selClass)) {
      const fallback = allowed[0].id;
      setSelClass(fallback);
      classRef.current = fallback;
    }
  }, [options, selClass]);

  const start = useCallback((cls?: ClassId) => {
    const allowed = rosterFor(options.dlc);
    const wanted = cls ?? classRef.current;
    const id = allowed.some((c) => c.id === wanted) ? wanted : allowed[0].id;
    classRef.current = id;
    try { localStorage.setItem(CLASS_KEY, id); } catch { /* ignore */ }
    setResult(null);
    setScreen("game");
    engineRef.current?.startRun(id);
  }, [options.dlc]);

  const goMenu = useCallback(() => {
    engineRef.current?.toMenu();
    setResult(null);
    setScreen("menu");
  }, []);

  const pause = useCallback(() => engineRef.current?.pause(), []);
  const resume = useCallback(() => engineRef.current?.resume(), []);
  const choose = useCallback((i: number) => engineRef.current?.chooseUpgrade(i), []);
  const weapon = useCallback((i: number) => engineRef.current?.setWeapon(i), []);
  const pickClass = useCallback((id: ClassId) => {
    setSelClass(id);
    classRef.current = id;
    sfx.ui();
  }, []);
  const clearScores = useCallback(() => {
    setScores([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    sfx.ui();
  }, []);

  const isTouch = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
  const inRun = screen === "game" && (status === "playing" || status === "paused" || status === "upgrade");

  return (
    <div className="fixed inset-0 overflow-hidden bg-void" data-dlc={options.dlc ? "1" : "0"}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none transition-opacity duration-300 ${
          status === "playing" && screen === "game" && !isTouch ? "game-cursor" : ""
        } ${booting ? "opacity-0" : "opacity-100"}`}
      />

      {inRun && (
        <GameHud
          hud={hud}
          muted={options.muted}
          onPause={pause}
          onResume={resume}
          onToggleMute={() => setOptions((o) => ({ ...o, muted: !o.muted }))}
          onWeapon={weapon}
        />
      )}

      {screen === "boot" && <BootScreen onDone={() => setScreen("menu")} dlc={options.dlc} />}

      {screen === "menu" && (
        <StartScreen
          hud={hud}
          best={scores[0]?.score ?? 0}
          onPlay={() => setScreen("classes")}
          onOptions={() => setScreen("options")}
          dlc={options.dlc}
        />
      )}

      {screen === "options" && (
        <OptionsScreen
          options={options}
          onChange={setOptions}
          onClearScores={clearScores}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "classes" && (
        <ClassSelectScreen
          sel={selClass}
          onPick={pickClass}
          onStart={() => start(selClass)}
          onBack={() => setScreen("menu")}
          dlc={options.dlc}
        />
      )}

      {screen === "game" && status === "upgrade" && (
        <UpgradeScreen wave={hud.wave} cards={hud.cards} onChoose={choose} hud={hud} />
      )}

      {screen === "game" && status === "paused" && (
        <PauseScreen hud={hud} onResume={resume} onRestart={() => start()} onMenu={goMenu} />
      )}

      {screen === "game" && status === "gameover" && result && (
        <GameOverScreen
          result={result}
          scores={scores}
          record={record}
          onRestart={() => start()}
          onMenu={goMenu}
          onPickClass={(id) => { pickClass(id); start(id); }}
          selClass={selClass}
          dlc={options.dlc}
        />
      )}
    </div>
  );
}
