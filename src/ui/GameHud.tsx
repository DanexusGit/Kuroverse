import { memo } from "react";
import type { Hud, SpecHud } from "../game/engine";
import { weaponById } from "../game/weapons";
import {
  Pause, Play, Volume2, VolumeX, Skull, Timer, Zap, Shield,
  Swords, Crosshair, Flame, Gauge, CloudLightning, Rocket, Activity, Sparkles, Flashlight, Sword, Sun, Brain, Snowflake,
} from "lucide-react";

export const WEAPON_ICONS = [Crosshair, Activity, Flame, Zap, Rocket, CloudLightning, Flashlight, Sword];
const ICON_BY_ID: Record<string, typeof Crosshair> = {
  pulse: Crosshair, tesla: CloudLightning, rune: Sparkles, rail: Zap, needle: Activity,
  smg: Activity, shuriken: Swords, scatter: Flame, rocket: Rocket, beam: Flashlight,
  ion: Gauge, katana: Sword, wave: Sword, coil: Activity, mine: Flame,
  flask: Flame, bile: Activity, oracle: Sparkles, halo: Sun,
  soul: Skull, reaper: Sword, mirror: Sparkles, prism: Zap,
  psi: Brain, synapse: Brain, lightsaber: Sword, saberThrow: Swords,
  frostNeedle: Snowflake, iceMortar: Snowflake,
};

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

function SpecSlot({ spec }: { spec: SpecHud }) {
  const ready = spec.pct >= 1;
  const left = Math.ceil((1 - spec.pct) * spec.cd);
  return (
    <div
      className="relative grid h-10 w-10 place-items-center sm:h-11 sm:w-11"
      title={spec.full}
      style={{
        background: `conic-gradient(${spec.color} ${spec.pct * 360}deg, rgba(255,255,255,.07) 0deg)`,
        clipPath: "polygon(22% 0, 78% 0, 100% 22%, 100% 78%, 78% 100%, 22% 100%, 0 78%, 0 22%)",
        boxShadow: ready ? `0 0 14px ${spec.color}66` : "none",
        opacity: ready ? 1 : 0.8,
      }}
    >
      <div
        className="absolute inset-[3px] grid place-items-center bg-[#07080f]"
        style={{ clipPath: "polygon(22% 0, 78% 0, 100% 22%, 100% 78%, 78% 100%, 22% 100%, 0 78%, 0 22%)" }}
      >
        <span
          className="font-display text-[14px] font-bold italic leading-none"
          style={{ color: ready ? spec.color : "rgba(255,255,255,.35)" }}
        >
          {spec.key}
        </span>
        {!ready && (
          <span className="absolute bottom-[2px] font-num text-[8px] font-bold leading-none text-white/60">{left}</span>
        )}
      </div>
      {ready && (
        <span className="pointer-events-none absolute -bottom-3 whitespace-nowrap font-num text-[7px] tracking-[0.12em] text-white/45">
          {spec.name.length > 9 ? spec.name.slice(0, 8) + "." : spec.name}
        </span>
      )}
    </div>
  );
}
/** pill vertical pequena: ícone + anel de progresso, sem texto */
function MiniRing({ pct, color, label, glow }: { pct: number; color: string; label: string; glow?: boolean }) {
  return (
    <div className="relative grid h-7 w-7 place-items-center" title={label}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="4" />
        <circle
          cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${pct * 88} 88`}
          style={{ filter: glow ? `drop-shadow(0 0 4px ${color})` : "none" }}
        />
      </svg>
      <span className="font-display text-[9px] font-bold italic leading-none" style={{ color }}>{label}</span>
    </div>
  );
}

function DashPill({ pct, color }: { pct: number; paused?: boolean; color: string }) {
  const ready = pct >= 1;
  return <MiniRing pct={pct} color={ready ? color : "#6b7a9a"} label="⇢" glow={ready} />;
}

function BoostMeter({ hud }: { hud: Hud }) {
  if (!hud.hasBoost) return null;
  const col = hud.boosting ? "#ffd23c" : hud.boostPct < 0.02 ? "#ff3b5c" : hud.classColor;
  return <MiniRing pct={hud.boostPct} color={col} label="»" glow={hud.boosting} />;
}

function SlowMeter({ hud }: { hud: Hud }) {
  if (!hud.hasSlow) return null;
  const col = hud.slowing ? "#b7ff3c" : hud.slowPct < 0.05 ? "#ff3b5c" : "#d8ff8a";
  return <MiniRing pct={hud.slowPct} color={col} label="◷" glow={hud.slowing} />;
}
function WeaponRail({ hud, onWeapon }: { hud: Hud; onWeapon: (i: number) => void }) {
  return (
    <div className="pointer-events-auto flex items-end gap-1.5">
      {hud.slotIds.map((id, i) => {
        const w = weaponById(id);
        const active = hud.weaponIdx === i;
        const ammoPct = hud.weaponAmmo[i] ?? 1;
        const Icon = ICON_BY_ID[w.id] ?? Crosshair;
        return (
          <button
            key={w.id}
            onClick={() => onWeapon(i)}
            title={w.name}
            className={`notch-sm relative grid h-10 w-10 place-items-center border transition-all duration-150 sm:h-11 sm:w-11 ${
              active ? "bg-white/12" : "bg-black/45 hover:bg-white/8"
            }`}
            style={{
              borderColor: active ? w.color : "rgba(255,255,255,0.12)",
              boxShadow: active ? `0 0 14px ${w.color}55` : "none",
              transform: active ? "translateY(-3px)" : "none",
            }}
          >
            <Icon size={16} style={{ color: active ? w.color : "rgba(231,236,255,0.6)" }} />
            <span className="absolute left-1 top-0.5 font-num text-[8px] text-white/40">{i + 1}</span>
            {w.ammoClip > 0 && (
              <div className="absolute inset-x-1 bottom-[3px] h-[2px] bg-white/10">
                <div className="h-full" style={{ width: `${ammoPct * 100}%`, background: ammoPct < 0.2 ? "#ff3b5c" : w.color }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
export const GameHud = memo(function GameHud({
  hud, muted, onPause, onResume, onToggleMute, onWeapon,
}: {
  hud: Hud;
  muted: boolean;
  onPause: () => void;
  onResume: () => void;
  onToggleMute: () => void;
  onWeapon: (i: number) => void;
}) {
  const playing = hud.status === "playing";
  const hpPct = Math.max(0, Math.min(1, hud.hp / hud.maxHp));
  const danger = hpPct < 0.34;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* ---------- top-left: um único painel com onda · pontos · vida ---------- */}
      <div className="absolute left-0 top-0 p-2 sm:p-3">
        <div className="panel notch-r min-w-[200px] px-3 py-2 sm:min-w-[250px]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[11px] font-bold tracking-[0.2em]" style={{ color: hud.classColor }}>
              ONDA {String(hud.wave).padStart(2, "0")}
            </span>
            <span className="font-num text-[10px] text-white/40">{hud.biomeName}</span>
          </div>
          <div className="mt-0.5 flex items-end justify-between gap-3">
            <div className="font-num text-[26px] font-bold italic leading-none text-white sm:text-[30px]">{fmt(hud.score)}</div>
            <div className="flex items-center gap-2 pb-0.5 font-num text-[10px] font-semibold text-white/50">
              <span className="flex items-center gap-1"><Skull size={10} className="text-fuse" />{hud.kills}</span>
              <span className="flex items-center gap-1"><Timer size={10} className="text-neon/70" />{fmtTime(hud.time)}</span>
              {hud.combo > 1.5 && (
                <span className="font-bold" style={{ color: hud.combo > 3 ? "#ffb020" : "#e7ecff" }}>×{hud.combo.toFixed(1)}</span>
              )}
            </div>
          </div>
          {/* vida: barra contínua, sem segmentos */}
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-[9px] flex-1 bar-track overflow-hidden">
              <div
                className="h-full transition-[width] duration-150"
                style={{
                  width: `${hpPct * 100}%`,
                  background: danger ? "#ff3b5c" : `linear-gradient(90deg, #3cff8f, ${hud.classColor})`,
                  boxShadow: danger ? "0 0 10px #ff3b5c" : "none",
                }}
              />
            </div>
            <span className={`font-num text-[11px] font-bold tabular-nums ${danger ? "text-fuse" : "text-white/80"}`}>
              {fmt(hud.hp)}
            </span>
            {hud.armor > 0 && (
              <span className="flex items-center gap-0.5 font-num text-[10px] text-neon"><Shield size={10} />{hud.armor}</span>
            )}
          </div>
        </div>
      </div>

      {/* ---------- top-right: só pausa e som ---------- */}
      <div className="absolute right-0 top-0 flex items-center gap-1.5 p-2 sm:p-3">
        <button
          onClick={onToggleMute}
          className="pointer-events-auto panel notch-sm grid h-8 w-8 place-items-center text-white/60 transition-colors hover:text-neon press"
          aria-label="Som"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <button
          onClick={playing ? onPause : onResume}
          className="pointer-events-auto panel notch-sm grid h-8 w-8 place-items-center text-white/60 transition-colors hover:text-neon press"
          aria-label="Pausar"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {/* ---------- boss bar ---------- */}
      {hud.boss && (
        <div className="absolute left-1/2 top-2 w-[min(520px,86vw)] -translate-x-1/2 rise sm:top-3">
          <div className="panel panel-hot notch px-3 py-1.5">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-base font-bold italic leading-none text-white sm:text-lg">{hud.boss.name}</div>
              <div className="font-num text-[11px] font-bold" style={{ color: hud.boss.color }}>{fmt(hud.boss.hp)}</div>
            </div>
            <div className="relative mt-1 h-2 bar-track overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-100"
                style={{
                  width: `${(hud.boss.hp / hud.boss.max) * 100}%`,
                  background: `linear-gradient(90deg, ${hud.boss.color}, #ffffff)`,
                  boxShadow: `0 0 12px ${hud.boss.color}`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------- bottom: armas à esquerda · habilidades + dash/turbo à direita ---------- */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 p-2 sm:p-3">
        <WeaponRail hud={hud} onWeapon={onWeapon} />
        <div className="flex items-end gap-2.5 pb-3 sm:gap-3">
          <div className="flex items-end gap-1.5 sm:gap-2">
            {hud.specs.map((spec) => <SpecSlot key={spec.key} spec={spec} />)}
          </div>
          <div className="mb-[2px] flex flex-col items-center gap-1.5">
            <DashPill pct={hud.dashPct} paused={!playing} color={hud.classColor} />
            {hud.hasSlow ? <SlowMeter hud={hud} /> : <BoostMeter hud={hud} />}
          </div>
        </div>
      </div>

      {/* ---------- contador de hostis (discreto) ---------- */}
      {hud.enemies > 0 && !hud.boss && (
        <div className="absolute right-2 top-12 sm:right-3 sm:top-14">
          <div className="flex items-center gap-1 font-num text-[11px] font-bold text-fuse/80">
            <span className="h-1.5 w-1.5 rounded-full bg-fuse" />{hud.enemies}
          </div>
        </div>
      )}
    </div>
  );
});
