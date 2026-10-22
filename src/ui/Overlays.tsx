import type { Hud, RunResult, UpgradeCard } from "../game/engine";
import { WEAPONS, weaponsForClass, weaponById } from "../game/weapons";
import { CLASSES } from "../game/classes";
import { HERO_CLASSES, HEROES } from "../game/heroes";
import { heroWeaponsFor } from "../game/heroes";
import type { ClassId } from "../game/classes";
import {
  Play, Pause, RotateCcw, Trophy,
  Swords, Timer, Skull, ChevronRight, Zap, Radio, Home,
  Settings, ArrowLeft, Volume2, VolumeX, Trash2, Gauge, HeartPulse,
  Wand2, Crosshair, Shield, Bot, Sword, Wrench, FlaskConical, Eye, Sparkles, Brain, Snowflake,
} from "lucide-react";

const CLASS_ICONS: Record<ClassId, typeof Wand2> = {
  mago: Wand2,
  atirador: Crosshair,
  velocista: Zap,
  bruto: Shield,
  robo: Bot,
  samurai: Sword,
  engenheira: Wrench,
  alquimista: FlaskConical,
  oraculo: Eye,
  necromante: Skull,
  ilusionista: Sparkles,
  telepata: Brain,
  jedi: Sword,
  criomante: Snowflake,
};

export interface ScoreRow {
  score: number;
  wave: number;
  kills: number;
  time: number;
  date: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* Decorative corners — cheap, static, no full-screen blur */
function Corners() {
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-2 border-t-2 border-neon/40" />
      <div className="pointer-events-none absolute right-3 top-3 h-7 w-7 border-r-2 border-t-2 border-neon/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-7 w-7 border-b-2 border-l-2 border-neon/40" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-2 border-r-2 border-neon/40" />
    </>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="notch-sm flex items-center gap-2.5 bg-white/4 px-3 py-2">
      <span style={{ color: color ?? "#4ff0ff" }}>{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-[9px] tracking-[0.2em] text-white/40">{label}</div>
        <div className="font-num text-base font-bold leading-tight" style={{ color: color ?? "#ffffff" }}>{value}</div>
      </div>
    </div>
  );
}

function Bar({ v, color }: { v: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px]">
      {[0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
        <span
          key={i}
          className="block w-[3px] transition-all duration-200"
          style={{ height: 5 + i * 3, background: v >= t ? color : "rgba(255,255,255,.14)" }}
        />
      ))}
    </div>
  );
}

/* ================= CLASS PICKER ================= */

function ClassPicker({ sel, onPick, compact, dlc }: { sel: ClassId; onPick: (id: ClassId) => void; compact?: boolean; dlc?: boolean }) {
  const roster = (dlc ? HERO_CLASSES : CLASSES).filter((c) => !dlc || c.id !== "jedi");
  const active = roster.find((c) => c.id === sel) ?? roster[0];
  const heroOf = (id: ClassId) => (dlc ? HEROES.find((h) => h.id === id) : undefined);
  return (
    <div className={compact ? "" : "panel notch-r p-3"}>
      {!compact && (
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-display text-[10px] font-bold tracking-[0.3em] text-white/55">ESCOLHA SUA CLASSE</span>
          <span className="font-num text-[10px] text-white/30">{roster.length} {dlc ? "HERÓIS" : "CLASSES"} DISPONÍVEIS</span>
        </div>
      )}
      <div className={`grid gap-1.5 ${compact ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {roster.map((c) => {
          const on = c.id === sel;
          const hero = heroOf(c.id);
          const Icon = CLASS_ICONS[c.id] ?? Wand2;
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className={`notch-sm group relative overflow-hidden px-2.5 py-2 text-left transition-all duration-150 border press
                ${on ? "bg-white/10" : "bg-black/40 hover:bg-white/6"}`}
              style={{
                borderColor: on ? c.color : "rgba(255,255,255,.1)",
                boxShadow: on ? `0 0 22px ${c.color}44, inset 0 0 20px ${c.color}18` : "none",
                transform: on ? "translateY(-2px)" : "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-sm transition-transform group-hover:scale-105"
                  style={{ background: `${c.color}22`, border: `1px solid ${c.color}77` }}
                >
                  <Icon size={14} style={{ color: c.color, filter: on ? `drop-shadow(0 0 6px ${c.color})` : "none" }} />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-[12px] font-bold italic leading-none" style={{ color: on ? "#fff" : "rgba(231,236,255,.72)" }}>
                    {c.name}
                  </div>
                  <div className="mt-0.5 font-num text-[8px] tracking-wider text-white/30 truncate">{hero ? hero.alias : c.title}</div>
                </div>
              </div>
              {!compact && (
                <div className={`grid transition-all duration-200 ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="mt-2 text-[11px] leading-snug text-white/55">{c.blurb}</div>
                    {hero && (
                      <div className="mt-1.5 border-l-2 pl-2 text-[10px] leading-snug text-white/45" style={{ borderColor: c.color }}>
                        <b className="font-display tracking-wide" style={{ color: c.color }}>{hero.alias}</b> — {hero.role}
                      </div>
                    )}
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-num text-[8px] tracking-wider text-white/35">VIDA</span>
                        <Bar v={c.hp / 175} color={c.color} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-num text-[8px] tracking-wider text-white/35">DANO</span>
                        <Bar v={c.dmg / 1.3} color={c.color} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-num text-[8px] tracking-wider text-white/35">VELOC</span>
                        <Bar v={c.speed / 1.35} color={c.color} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-3 border-t border-white/8 pt-2.5">
          {/* passive */}
          <div className="flex items-start gap-2">
            <span className="notch-sm mt-0.5 shrink-0 bg-white/8 px-1.5 py-0.5 font-num text-[8px] font-bold tracking-[0.14em] text-white/50">
              PASSIVA
            </span>
            <div className="min-w-0">
              <span className="font-display text-[12px] font-bold italic" style={{ color: active.color }}>
                {active.passiveName}
              </span>
              <span className="ml-2 text-[11px] leading-snug text-white/50">{active.passiveDesc}</span>
            </div>
          </div>
          {/* the two special abilities */}
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {active.specials.map((sp) => (
              <div
                key={sp.name}
                className="notch-sm border p-2"
                style={{ borderColor: `${sp.color}44`, background: `${sp.color}0d` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center font-num text-[10px] font-bold text-void"
                    style={{ background: sp.color }}
                  >
                    {sp.key}
                  </span>
                  <span className="font-display text-[12px] font-bold italic" style={{ color: sp.color }}>
                    {sp.name}
                  </span>
                  <span className="ml-auto font-num text-[9px] text-white/30">{sp.cd}s</span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-white/55">{sp.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(dlc ? heroWeaponsFor(active.id) : weaponsForClass(active.id)).map((wd, i) => (
              <span
                key={wd.id}
                className="notch-sm border px-2 py-1 font-num text-[10px] font-bold"
                style={{ borderColor: `${wd.color}55`, background: `${wd.color}12`, color: wd.color }}
              >
                {i + 1} · {wd.name}
                <span className="ml-1 text-white/35">{wd.ammoClip > 0 ? `(${wd.ammoClip})` : "(∞)"}</span>
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-num text-[10px] text-white/40">
            <span>ARMA PRINCIPAL: <b style={{ color: weaponById(active.weapon).color }}>{weaponById(active.weapon).name}</b></span>
            <span>HP <b className="text-white/70">{active.hp}</b></span>
            <span>ARMADURA <b className="text-white/70">{active.armor}</b></span>
            <span>CRÍTICO <b className="text-white/70">{Math.round(active.crit * 100)}%</b></span>
            <span
              className="notch-sm px-1.5 py-0.5"
              style={{
                background: active.id === "velocista" ? "rgba(183,255,60,0.12)" : "rgba(255,210,60,0.12)",
                color: active.id === "velocista" ? "#b7ff3c" : "#ffd23c",
              }}
            >
              {active.id === "velocista" ? "TEMPO LENTO [SHIFT]" : "TURBO 1.8× [SHIFT]"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== START ==================== */

export interface GameOptions {
  muted: boolean;
  lowFx: boolean;
  dmgFlash: boolean;
  dlc: boolean;
}

/* ============ MENU: sidebar + predefined gameplay demos behind it ============ */

export function StartScreen({
  hud, best, onPlay, onOptions, dlc,
}: {
  hud: Hud; best: number; onPlay: () => void; onOptions: () => void; dlc: boolean;
}) {
  const roster = (dlc ? HERO_CLASSES : CLASSES).filter((c) => !dlc || c.id !== "jedi");
  const demoIdx = Math.max(0, roster.findIndex((c) => c.name === hud.className));
  const demoCls = roster[demoIdx] ?? roster[0];

  return (
    <div className={`absolute inset-0 z-30 flex flex-col sm:flex-row ${dlc ? "halftone" : ""}`}>
      {/* ---------- sidebar ---------- */}
      <aside
        className="relative z-20 flex w-full shrink-0 flex-col px-6 py-6 sm:h-full sm:w-[300px] sm:px-7 sm:py-9"
        style={{ background: dlc ? "#12040a" : "#080b13" }}
      >
        <div>
          <h1 className="font-display text-[36px] font-bold italic leading-[0.9] tracking-tight text-white">
            {dlc ? <>HERO<span className="text-neon">WAVE</span></> : <>KURO<span className="text-neon">VOID</span></>}
          </h1>
          <div className="mt-2 font-num text-[9px] tracking-[0.34em] text-white/35">
            {dlc ? "DLC · LEGADO DOS HERÓIS" : "ARENA PROTOCOL · ElecOS"}
          </div>
        </div>

        <nav className="mt-7 flex flex-row gap-2.5 sm:mt-14 sm:flex-col">
          <button
            onClick={onPlay}
            className="flex flex-1 items-center justify-center gap-2.5 bg-neon px-5 py-3.5 font-display text-[17px] font-bold italic tracking-wide text-void transition hover:brightness-110 press sm:justify-start"
          >
            <Play size={18} fill="currentColor" /> JOGAR
          </button>
          <button
            onClick={onOptions}
            className="flex flex-1 items-center justify-center gap-2.5 border border-white/15 px-5 py-3.5 font-display text-[17px] font-bold italic tracking-wide text-white/75 transition hover:border-white/40 hover:text-white press sm:justify-start"
          >
            <Settings size={17} /> OPÇÕES
          </button>
        </nav>

        <div className="mt-auto hidden sm:block">
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 font-num text-[10px] tracking-[0.2em] text-white/35">
              <Trophy size={12} className="text-solar" /> MELHOR PONTUAÇÃO
            </div>
            <div className="mt-1 font-num text-2xl font-bold text-white/90">{fmt(best)}</div>
            <p className="mt-3 text-[11px] leading-relaxed text-white/35">
              {dlc
                ? `${roster.length} heróis, 2 armas próprias cada, 52 poderes. Sem rifle padrão.`
                : `${CLASSES.length} classes únicas, ${WEAPONS.length} armas, ondas infinitas.`}{" "}
              A demonstração ao lado joga sozinha — cada {dlc ? "herói" : "classe"} por vez.
            </p>
          </div>
        </div>
      </aside>

      {/* gradient shadow spilling from the sidebar into the demo */}
      <div
        className="pointer-events-none absolute inset-0 z-10 hidden sm:block"
        style={{ background: dlc
          ? "linear-gradient(90deg, rgba(18,4,10,0.94) 0%, rgba(18,4,10,0.5) 26%, rgba(18,4,10,0) 48%)"
          : "linear-gradient(90deg, rgba(8,11,19,0.92) 0%, rgba(8,11,19,0.45) 26%, rgba(8,11,19,0) 48%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 sm:hidden"
        style={{ background: dlc
          ? "linear-gradient(180deg, rgba(18,4,10,0.88) 0%, rgba(18,4,10,0) 30%)"
          : "linear-gradient(180deg, rgba(8,11,19,0.85) 0%, rgba(8,11,19,0) 30%)" }}
      />

      {/* demo caption */}
      <div className="pointer-events-none absolute bottom-0 right-0 z-20 p-4 text-right sm:p-6">
        <div className="font-num text-[9px] tracking-[0.32em] text-white/40">DEMONSTRAÇÃO</div>
        <div className="font-display text-[26px] font-bold italic leading-tight" style={{ color: demoCls.color }}>
          {demoCls.name}
        </div>
        <div className="font-num text-[10px] tracking-[0.14em] text-white/45">
          {demoCls.role.toUpperCase()} · ONDA {String(Math.max(1, hud.wave)).padStart(2, "0")}
        </div>
        <div className="mt-2.5 flex justify-end gap-1.5">
          {roster.map((c, i) => (
            <span
              key={c.id}
              className="h-[5px] transition-all duration-500"
              style={{ width: i === demoIdx ? 24 : 10, background: i === demoIdx ? c.color : "rgba(255,255,255,.25)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ CLASS SELECT ============ */

export function ClassSelectScreen({
  sel, onPick, onStart, onBack, dlc,
}: {
  sel: ClassId; onPick: (id: ClassId) => void; onStart: () => void; onBack: () => void; dlc: boolean;
}) {
  const roster = (dlc ? HERO_CLASSES : CLASSES).filter((c) => !dlc || c.id !== "jedi");
  const active = roster.find((c) => c.id === sel) ?? roster[0];
  const hero = dlc ? HEROES.find((h) => h.id === active.id) : undefined;
  return (
    <div className="scroll-y absolute inset-0 z-30">
      <div className="pointer-events-none absolute inset-0 bg-void/75" />
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-6 sm:px-6">
        <button
          onClick={onBack}
          className="mb-4 flex w-fit items-center gap-1.5 font-num text-[11px] tracking-[0.18em] text-white/50 transition hover:text-white press"
        >
          <ArrowLeft size={13} /> VOLTAR
        </button>
        <h2 className="font-display text-3xl font-bold italic tracking-tight text-white sm:text-4xl">
          {dlc ? "ESCOLHA SEU HERÓI" : "ESCOLHA SUA CLASSE"}
        </h2>
        <p className="mt-1 text-[13px] text-white/45">
          {dlc
            ? "Cada herói tem duas armas próprias e quatro poderes originais. Sem rifle padrão."
            : "Cada classe tem arma, passiva e especiais próprios. Selecione para ver os detalhes."}
        </p>
        <div className="mt-5">
          <ClassPicker sel={sel} onPick={onPick} dlc={dlc} />
        </div>
        <button
          onClick={onStart}
          className="mt-5 flex items-center justify-center gap-2.5 bg-neon px-6 py-3.5 font-display text-lg font-bold italic tracking-wide text-void transition hover:brightness-110 press"
        >
          <Play size={18} fill="currentColor" /> COMEÇAR COM {hero ? hero.name : active.name}
        </button>
        <div className="mt-3 text-center font-num text-[10px] leading-relaxed tracking-[0.08em] text-white/35">
          WASD mover · MOUSE atirar ·{" "}
          <span style={{ color: active.id === "velocista" ? "#b7ff3c" : "#ffd23c" }}>
            SHIFT {active.id === "velocista" ? "tempo lento" : "turbo"}
          </span>{" "}
          · ESPAÇO dash ·{" "}
          <span style={{ color: active.specials[0].color }}>{active.specials[0].key}</span> {active.specials[0].name} ·{" "}
          <span style={{ color: active.specials[1].color }}>{active.specials[1].key}</span> {active.specials[1].name}
        </div>
      </div>
    </div>
  );
}

/* ============ OPTIONS ============ */

function OptRow({
  icon, label, value, onToggle,
}: {
  icon: React.ReactNode; label: string; value: string; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 border-b border-white/8 px-1 py-3 text-left transition hover:bg-white/4 press"
    >
      <span className="text-neon">{icon}</span>
      <span className="flex-1 text-[13px] text-white/75">{label}</span>
      <span className="font-num text-[11px] font-bold tracking-[0.14em] text-white/90">{value}</span>
    </button>
  );
}

export function OptionsScreen({
  options, onChange, onClearScores, onBack,
}: {
  options: GameOptions;
  onChange: (o: GameOptions) => void;
  onClearScores: () => void;
  onBack: () => void;
}) {
  return (
    <div className="scroll-y absolute inset-0 z-30 flex items-center justify-center px-4 py-6">
      <div className="pointer-events-none absolute inset-0 bg-void/78" />
      <div className="panel notch relative w-full max-w-md p-5 sm:p-6">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 font-num text-[11px] tracking-[0.18em] text-white/50 transition hover:text-white press"
        >
          <ArrowLeft size={13} /> VOLTAR
        </button>
        <h2 className="font-display text-3xl font-bold italic tracking-tight text-white">OPÇÕES</h2>

        <div className="mt-4">
          <OptRow
            icon={options.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            label="Som"
            value={options.muted ? "DESLIGADO" : "LIGADO"}
            onToggle={() => onChange({ ...options, muted: !options.muted })}
          />
          <OptRow
            icon={<Swords size={16} />}
            label="Versão do jogo (DLC HeroWave)"
            value={options.dlc ? "HEROWAVE" : "BASE"}
            onToggle={() => onChange({ ...options, dlc: !options.dlc })}
          />
          <OptRow
            icon={<Gauge size={16} />}
            label="Efeitos visuais (desempenho)"
            value={options.lowFx ? "BAIXOS" : "ALTOS"}
            onToggle={() => onChange({ ...options, lowFx: !options.lowFx })}
          />
          <OptRow
            icon={<HeartPulse size={16} />}
            label="Flash vermelho ao levar dano"
            value={options.dmgFlash ? "LIGADO" : "DESLIGADO"}
            onToggle={() => onChange({ ...options, dmgFlash: !options.dmgFlash })}
          />
        </div>

        <button
          onClick={onClearScores}
          className="mt-5 flex items-center gap-2 border border-fuse/40 px-4 py-2.5 font-display text-[13px] font-bold italic tracking-wide text-fuse transition hover:bg-fuse/10 press"
        >
          <Trash2 size={14} /> APAGAR RECORDES
        </button>
        <div className="mt-4 border-t border-white/8 pt-3">
          <div className="font-display text-[10px] font-bold tracking-[0.28em]" style={{ color: options.dlc ? "#ff4d5e" : "#4ff0ff" }}>
            {options.dlc ? "HEROWAVE ATIVO" : "VERSÃO BASE"}
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
            {options.dlc
              ? "Treze heróis com poderes próprios, duas armas cada e setores vermelho-sangue. O Jedi e o rifle universal não existem nesta versão."
              : "Doze classes originais mais o Jedi, três armas por classe e setores neon."}
          </p>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/35">
          Efeitos em BAIXO fixa a qualidade reduzida: recomendado se o jogo travar.
          A arena é maior que a tela — use o minimapa. O setor muda a cada 3 ondas.
        </p>
      </div>
    </div>
  );
}

/* ==================== UPGRADE ==================== */

export function UpgradeScreen({ wave, cards, onChoose, hud }: { wave: number; cards: UpgradeCard[]; onChoose: (i: number) => void; hud: Hud }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-4 py-6">
      <div className="pointer-events-none absolute inset-0 bg-void/72" />
      <div className="relative text-center sweep">
        <div className="font-display text-[10px] font-bold tracking-[0.36em] text-neon/80">
          ONDA {String(wave).padStart(2, "0")} CONCLUÍDA · NÚCLEO DISPONÍVEL
        </div>
        <h2 className="font-display text-4xl font-bold italic tracking-tight text-white text-glow sm:text-5xl">
          INSTALE UM MÓDULO
        </h2>
      </div>
      <div className="relative grid w-full max-w-4xl gap-2.5 sm:grid-cols-3">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onChoose(i)}
            className="notch group relative overflow-hidden border bg-void-2/95 p-4 text-left transition-all duration-200 hover:-translate-y-1.5 press pop sm:p-5"
            style={{ animationDelay: `${i * 70}ms`, borderColor: `${c.color}55` }}
          >
            <div className="absolute inset-x-0 -top-16 h-28 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-50" style={{ background: c.color }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="font-display text-[9px] font-bold tracking-[0.24em]" style={{ color: c.color }}>{c.tag}</span>
                <span className="font-num text-[10px] text-white/30">LV {c.level}/{c.max}</span>
              </div>
              <div className="mt-2.5 font-display text-xl font-bold italic leading-none text-white sm:text-2xl">{c.name}</div>
              <p className="mt-2 text-[12px] leading-snug text-white/55 sm:text-[13px]">{c.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: c.max }).map((_, k) => (
                    <span key={k} className="block h-1.5 w-3.5" style={{ background: k < c.level ? c.color : "rgba(255,255,255,.14)" }} />
                  ))}
                </div>
                <span className="flex items-center gap-1 font-num text-[10px] text-white/40 group-hover:text-white">
                  {i + 1} <ChevronRight size={11} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="relative flex items-center gap-4 font-num text-[11px] text-white/35">
        <span className="flex items-center gap-1.5"><Swords size={12} className="text-neon" />{hud.kills} abates</span>
        <span className="flex items-center gap-1.5"><Zap size={12} className="text-solar" />{fmt(hud.score)} pts</span>
        <span className="hidden items-center gap-1.5 sm:flex"><Timer size={12} className="text-fuse" />{fmtTime(hud.time)}</span>
      </div>
    </div>
  );
}

/* ==================== PAUSE ==================== */

export function PauseScreen({ hud, onResume, onRestart, onMenu }: {
  hud: Hud; onResume: () => void; onRestart: () => void; onMenu: () => void;
}) {
  return (
    <div className="scroll-y absolute inset-0 z-30 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-label="Jogo pausado">
      <div className="pointer-events-none absolute inset-0 bg-void/78" />
      <div className="panel notch relative w-full max-w-lg p-5 rise sm:p-6">
        <div className="flex items-center gap-2">
          <Pause size={14} className="text-neon" />
          <span className="font-display text-[10px] font-bold tracking-[0.32em] text-neon/80">SISTEMA EM ESPERA</span>
        </div>
        <h2 className="mt-1 font-display text-5xl font-bold italic tracking-tight text-white">PAUSA</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={<Zap size={15} />} label="PONTOS" value={fmt(hud.score)} />
          <Stat icon={<Radio size={15} />} label="ONDA" value={String(hud.wave).padStart(2, "0")} color="#ff3ce0" />
          <Stat icon={<Skull size={15} />} label="ABATES" value={String(hud.kills)} color="#ff3b5c" />
          <Stat icon={<Swords size={15} />} label="CLASSE" value={hud.className} color={hud.classColor} />
        </div>
        {hud.mods.length > 0 && (
          <div className="mt-4">
            <div className="font-display text-[10px] tracking-[0.24em] text-white/35">MÓDULOS ATIVOS</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hud.mods.map((m) => (
                <span key={m.id} className="notch-sm flex items-center gap-1.5 bg-white/6 px-2 py-1 font-num text-[11px] font-bold" style={{ color: m.color }}>
                  {m.name} <span className="text-white/35">Lv{m.level}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            onClick={onResume}
            className="notch-sm flex items-center gap-2 bg-neon px-5 py-2.5 font-display font-bold italic tracking-wide text-void transition hover:brightness-110 press"
          >
            <Play size={16} fill="currentColor" /> CONTINUAR
          </button>
          <button
            onClick={onRestart}
            className="notch-sm flex items-center gap-2 border border-white/15 px-4 py-2.5 font-display font-bold italic tracking-wide text-white/70 transition-colors hover:border-fuse/60 hover:text-fuse press"
          >
            <RotateCcw size={15} /> REINICIAR
          </button>
          <span className="ml-auto self-center font-num text-[11px] text-white/25">ESC / P retoma</span>
        </div>
        <div className="mt-3 border-t border-white/10 pt-3">
          <button
            onClick={onMenu}
            className="notch-sm flex min-h-11 w-full items-center justify-center gap-2 border border-white/20 px-4 py-2.5 font-display font-bold tracking-wide text-white/80 transition-colors hover:border-neon/60 hover:bg-neon/10 hover:text-neon press"
          >
            <Home size={16} /> VOLTAR AO MENU
          </button>
          <p className="mt-2 text-center text-[11px] text-white/40">Encerra esta partida e retorna às demonstrações.</p>
        </div>
      </div>
    </div>
  );
}

/* ==================== GAME OVER ==================== */

export function GameOverScreen({
  result, scores, record, onRestart, onMenu, onPickClass, selClass, dlc,
}: {
  result: RunResult; scores: ScoreRow[]; record: boolean;
  onRestart: () => void; onMenu: () => void; onPickClass: (id: ClassId) => void; selClass: ClassId; dlc: boolean;
}) {
  const rank = scores.findIndex((s) => s.score === result.score);
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto px-3 py-5 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fuse/14 via-void/88 to-void/94" />
      <Corners />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="rise">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-fuse blink" />
              <span className="font-display text-[10px] font-bold tracking-[0.36em] text-fuse">SINAL INTERROMPIDO</span>
            </div>
            <h2 className="font-display text-[clamp(2.4rem,8vw,4.8rem)] font-bold italic leading-[0.85] tracking-tighter text-white">
              VOCÊ CAIU
            </h2>
            {record && (
              <div className="notch-sm mt-2 inline-flex items-center gap-2 bg-solar px-3 py-1 font-display text-[11px] font-bold tracking-widest text-void pop">
                <Trophy size={13} /> NOVO RECORDE PESSOAL
              </div>
            )}
          </div>
          <div className="text-right rise" style={{ animationDelay: "0.06s" }}>
            <div className="font-display text-[10px] tracking-[0.28em] text-white/40">PONTUAÇÃO FINAL</div>
            <div className="font-num text-4xl font-bold italic leading-none text-neon text-glow sm:text-5xl">{fmt(result.score)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-4">
          <Stat icon={<Radio size={15} />} label="ONDA" value={String(result.wave).padStart(2, "0")} color="#ff3ce0" />
          <Stat icon={<Skull size={15} />} label="ABATES" value={String(result.kills)} color="#ff3b5c" />
          <Stat icon={<Timer size={15} />} label="TEMPO" value={fmtTime(result.time)} />
          <Stat icon={<Trophy size={15} />} label="RECORDE" value={fmt(scores[0]?.score ?? 0)} color="#ffb020" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="panel notch p-3.5 rise" style={{ animationDelay: "0.1s" }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold tracking-[0.28em] text-white/50">{dlc ? "TROQUE DE HERÓI" : "TROQUE DE CLASSE"}</span>
              <Swords size={13} className="text-white/35" />
            </div>
            <ClassPicker sel={selClass} onPick={onPickClass} compact dlc={dlc} />
            <button
              onClick={onRestart}
              className="notch-sm mt-3 flex w-full items-center justify-center gap-2 bg-fuse px-5 py-3 font-display text-lg font-bold italic tracking-wide text-white shadow-[0_0_36px_rgba(255,59,92,0.3)] transition-all hover:brightness-110 press"
            >
              <RotateCcw size={18} /> TENTAR NOVAMENTE
            </button>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={onMenu}
                className="notch-sm flex items-center gap-1.5 border border-white/12 px-3 py-1.5 font-num text-[11px] text-white/55 transition-colors hover:border-neon/50 hover:text-neon press"
              >
                <Home size={12} /> MENU
              </button>
              <span className="font-num text-[10px] tracking-widest text-white/25">TECLA <span className="text-white/60">R</span></span>
            </div>
          </div>

          <div className="panel notch p-3.5 rise" style={{ animationDelay: "0.16s" }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold tracking-[0.28em] text-solar/80">QUADRO DE RECORDES</span>
              <Trophy size={13} className="text-solar/60" />
            </div>
            {scores.length === 0 ? (
              <div className="py-3 text-center text-[11px] tracking-[0.18em] text-white/25">SEM REGISTROS</div>
            ) : (
              scores.slice(0, 6).map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 border-b border-white/5 px-1.5 py-1.5 text-sm last:border-0 ${i === rank ? "bg-neon/10" : ""}`}
                >
                  <span className={`w-5 font-num text-xs font-bold ${i === 0 ? "text-solar" : "text-white/28"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-num font-bold text-white/90">{fmt(s.score)}</span>
                  <span className="font-num text-[10px] text-white/30">ONDA {s.wave}</span>
                  <span className="font-num text-[10px] text-white/30">{s.kills}✕</span>
                </div>
              ))
            )}
            <p className="mt-3 border-t border-white/8 pt-2.5 text-[12px] leading-relaxed text-white/45">
              {result.wave >= 13
                ? "Extração quase alcançada. Os Ômega anotaram seu nome."
                : result.wave >= 8
                  ? "Você fez a Hidra suar. O Monólito ainda lembra."
                  : result.wave >= 4
                    ? "Promissor — a arena devora os impacientes."
                    : "A ARENA 07 NÃO FOI FEITA PARA TURISTAS."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
