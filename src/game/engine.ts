import { WEAPONS, MODS, baseStats, weaponById, weaponsForClass } from "./weapons";
import type { WeaponDef, ModDef, PlayerStats } from "./weapons";
import { ENEMY_DEFS, BOSS_DEFS } from "./enemies";
import type { EnemyKind } from "./enemies";
import { CLASSES, classById } from "./classes";
import { HEROES, HERO_BIOMES, HERO_CLASSES, heroClassDef, heroWeaponsFor } from "./heroes";
import type { HeroDef } from "./heroes";
import type { SpecialDef } from "./classes";
import type { ClassDef, ClassId } from "./classes";
import { sfx } from "./audio";
import { drawExpansionCharacter } from "./expansion-art";

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** One biome every three waves. Palette + prop style only — no gameplay change. */
export const BIOMES = [
  { name: "SETOR NEON",     sky: "#07060f", floor: "#0b0a1c", grid: "110,150,255", accent: "#4ff0ff", blob: "#2b1a6b", blob2: "#083a52", prop: "hex" },
  { name: "FORJA CRIMSON",  sky: "#0f0607", floor: "#1a0a0c", grid: "255,110,90",  accent: "#ff6a2e", blob: "#4a1010", blob2: "#3d1a06", prop: "ring" },
  { name: "JARDIM CRIPTA",  sky: "#050b09", floor: "#08160f", grid: "120,255,190", accent: "#3cff8f", blob: "#0d3a2a", blob2: "#123a12", prop: "flower" },
  { name: "NÚCLEO GLACIAL", sky: "#04080f", floor: "#081426", grid: "150,210,255", accent: "#7bffd6", blob: "#0b2a4a", blob2: "#123a52", prop: "crystal" },
  { name: "TEMPLO DOURADO", sky: "#0d0a04", floor: "#1a1408", grid: "255,205,110", accent: "#ffd23c", blob: "#3a2a08", blob2: "#4a1a3a", prop: "pillar" },
] as const;
type Biome = (typeof BIOMES)[number];
const HERO_BIOME_LIST = HERO_BIOMES as unknown as readonly Biome[];
const hyp = (a: number, b: number) => Math.sqrt(a * a + b * b);
const dist2 = (ax: number, ay: number, bx: number, by: number) => {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[(Math.random() * arr.length) | 0];

export type Status = "menu" | "playing" | "paused" | "gameover" | "upgrade";

export interface UpgradeCard {
  id: string;
  name: string;
  tag: string;
  color: string;
  desc: string;
  level: number;
  max: number;
}

export interface Hud {
  status: Status;
  score: number;
  wave: number;
  hp: number;
  maxHp: number;
  armor: number;
  combo: number;
  comboPct: number;
  weaponIdx: number;
  weaponName: string;
  weaponCode: string;
  weaponColor: string;
  ammo: number;
  ammoMax: number;
  owned: boolean[];
  weaponAmmo: number[];
  dashPct: number;
  enemies: number;
  boss: { name: string; title: string; hp: number; max: number; color: string } | null;
  kills: number;
  time: number;
  mods: { id: string; name: string; color: string; level: number }[];
  cards: UpgradeCard[];
  banner: { big: string; small: string; color: string } | null;
  touch: boolean;
  waveType: string;
  className: string;
  classId: ClassId;
  classColor: string;
  abilityName: string;
  abilityPct: number;
  abilityActive: boolean;
  boostPct: number;
  boosting: boolean;
  hasBoost: boolean;
  slowPct: number;
  slowing: boolean;
  hasSlow: boolean;
  slotCodes: string[];
  slotColors: string[];
  slotIds: string[];
  passName: string;
  spec0: SpecHud;
  spec1: SpecHud;
  specs: SpecHud[];
  biomeName: string;
}

export interface SpecHud {
  name: string; full: string; key: string; pct: number; cd: number; color: string;
}

export interface RunResult {
  score: number;
  wave: number;
  kills: number;
  time: number;
}

interface Enemy {
  id: number;
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; r: number; kind: EnemyKind;
  speed: number; contact: number; score: number;
  rot: number; spin: number; t: number; fireT: number; charge: number;
  hitFlash: number; spawnT: number; squash: number; dead: boolean;
  aim: number; orbitDir: number; dist: number; elite: boolean; shield: number;
  tele: number;
  curseT: number;
  stunT: number;
  markT: number;
  chillT: number;
  controlledT: number;
  controlFireT: number;
}

interface Boss {
  def: (typeof BOSS_DEFS)[number]; idx: number;
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; r: number; t: number; phase: number;
  atk: number; atkT: number; tele: number; hitFlash: number; ang: number;
  entering: number; dead: boolean; spin: number; sub: number;
}

interface PBullet {
  on: boolean; x: number; y: number; px: number; py: number; vx: number; vy: number;
  dmg: number; pierce: number; life: number; r: number; w: WeaponDef; crit: boolean;
  hitIds: number[]; owner: number; returning: boolean;
}

type EBulletKind = "dot" | "ring" | "shard" | "spike";
interface EBullet {
  on: boolean; x: number; y: number; vx: number; vy: number; r: number;
  dmg: number; life: number; color: string; kind: EBulletKind; grow: number;
  rot: number; homing: number; pool: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; color: string; drag: number; kind: number; rot: number; spin: number;
  grav: number; glow: number;
}

interface Floater {
  x: number; y: number; vy: number; life: number; max: number;
  text: string; color: string; size: number;
}

interface Decal { x: number; y: number; r: number; life: number; max: number; color: string; rot: number; kind: number }
interface Ripple { x: number; y: number; r: number; maxR: number; life: number; max: number; color: string; w: number }
interface Pickup {
  x: number; y: number; vx: number; vy: number; life: number; kind: "ammo" | "hp" | "weapon" | "core";
  weapon: number; color: string; t: number;
}
interface Beam {
  x: number; y: number; ang: number; len: number; w: number; tele: number; fire: number;
  color: string; dmg: number; fromBoss: boolean; spin: number;
}
interface SpawnMark { x: number; y: number; t: number; kind: EnemyKind; elite: boolean }
interface PortalPair { ax: number; ay: number; bx: number; by: number; life: number; cooldown: number }
interface Nuke { x: number; y: number; t: number; r: number; dmg: number; color?: string }
interface Grenade { x: number; y: number; vx: number; vy: number; t: number; r: number; dmg: number; spin: number }
interface Turret { x: number; y: number; t: number; cd: number; ang: number }
interface Mine { x: number; y: number; t: number; r: number; dmg: number; color: string }
interface HistoryFrame { x: number; y: number; hp: number; ang: number }
interface Hazard { x: number; y: number; r: number; life: number; max: number; dps: number; color: string; owner?: "enemy" | "player"; tick?: number }
interface ClassField {
  kind: "psi" | "snow" | "fire" | "dark" | "smoke";
  x: number; y: number; r: number; life: number; max: number; tick: number; damage: number;
}
interface ForceArc { x: number; y: number; angle: number; halfAngle: number; life: number; max: number; r: number; color: string }

export interface EngineCallbacks {
  onHud: (h: Hud) => void;
  onStatus: (s: Status) => void;
  onGameOver: (r: RunResult) => void;
}

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  W = 800; H = 600; dpr = 1;
  /* arena larger than the viewport, scrolled by a camera */
  worldW = 2000; worldH = 1400; camX = 0; camY = 0; biomeIdx = 0;
  renderScale = 1;
  pxScale = 1;
  scaleHold = 0;
  scaleSteps = [1, 0.8, 0.62];
  idleSkip = 0;
  cb: EngineCallbacks;

  status: Status = "menu";
  time = 0;
  raf = 0;
  last = 0;
  acc = 0;
  running = true;

  quality = 1; // 1 = full, lower = reduce effects
  private frameAvg = 16;

  /* ---------- entities ---------- */
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  pBullets: PBullet[] = [];
  eBullets: EBullet[] = [];
  particles: Particle[] = [];
  nParts = 0;
  floaters: Floater[] = [];
  decals: Decal[] = [];
  ripples: Ripple[] = [];
  pickups: Pickup[] = [];
  beams: Beam[] = [];
  marks: SpawnMark[] = [];
  scheduled: {
    t: number; bullet?: boolean; sp?: number; ang?: number; dmg?: number;
    color?: string; owner?: Boss | null; x?: number; y?: number; r?: number;
  }[] = [];
  /* attract mode (title screen only) */
  menuFx: { x: number; y: number; vx: number; vy: number; r: number; rot: number; spin: number; color: string; sides: number }[] = [];
  ghost = { x: 0, y: 0, ang: 0, color: "#4ff0ff", accent: "#c9f7ff" };
  ghostTrail: number[] = [];
  ghostShots: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  ghostCd = 0;
  /* summoned / delayed class entities */
  drones: { a: number; d: number; t: number; cd: number; x: number; y: number; ang: number; color?: string; dmg?: number }[] = [];
  meteors: { x: number; y: number; t: number; r: number; dmg: number }[] = [];
  pIdx = 0;
  eIdx = 0;
  enemySeq = 0;

  player = {
    x: 400, y: 300, vx: 0, vy: 0, r: 14, ang: -Math.PI / 2, hp: 100, maxHp: 100,
    dashT: 0, dashCd: 0, inv: 0, recoil: 0, fireT: 0, alive: true, trail: [] as number[],
    walkT: 0, muzzle: 0, hurtT: 0, safeT: 0, dashAng: 0,
  };

  stats: PlayerStats = baseStats();
  modLevels: Record<string, number> = {};
  cls: ClassDef = CLASSES[0];
  abilityT = 0;         // cooldown remaining
  abilityOn = 0;        // active window remaining
  abilityCharge = 0;    // legacy
  specT: number[] = [];
  specFlash: number[] = [];
  perfectShot = 0;      // marksman: next shot is a piercing crit
  danceT = 0; danceFx = 0;              // samurai blade dance
  eyeBeamT = 0; eyeBeamX = 0; eyeBeamY = 0; beamBoostT = 0;
  slowT = 0; slowMeter = 1; slowFx = 0;    // velocista bullet time
  timeStopT = 0;
  rewindFrames: HistoryFrame[] = [];
  rewindCursor = -1;
  invisT = 0;
  flightT = 0;
  titanT = 0;
  parryT = 0;
  shieldT = 0;
  refractionT = 0;
  alchemistBuffT = 0;
  portal: PortalPair | null = null;
  nukes: Nuke[] = [];
  grenades: Grenade[] = [];
  turrets: Turret[] = [];
  mines: Mine[] = [];
  hazards: Hazard[] = [];
  acidT = 0;
  goShown = false; goT = 0; waveFlashT = 0;
  toasts: { text: string; color: string; t: number }[] = [];
  repairT = 0;
  decoyX = 0; decoyY = 0; decoyT = 0;
  mindGuardT = 0;
  jediGuardT = 0;
  deflectCd = 0;
  cryoArmorT = 0;
  rageZoneTick = 0;
  storedKinetic = 0;
  classFields: ClassField[] = [];
  forceArcs: ForceArc[] = [];
  classWeapons: typeof WEAPONS = [];
  demoActive = false; demoT = 0; demoIdx = 0;               // menu attract demo
  dmgFlashEnabled = true;
  /* ---------- HEROWAVE DLC ---------- */
  dlc = false;
  buffT = 0; buffDmg = 1; buffSpeed = 1; buffRate = 1; buffArmor = 0; buffBeam = 1; buffFly = false;
  rageT = 0; rageDmg = 1; rageArmor = 0; rageRegen = 0; rageZoneDps = 0;
  shieldReduce = 0.3;
  markCrits = 0;
  powerCdFlash = 0;
  qualityLocked = false;
  bladeT = 0;           // veloz: blade storm window
  bladeSpin = 0;
  /* boost / sprint */
  boost = 1;
  boosting = false;
  boostLock = 0;
  boostFx = 0;
  eyeAng = [0, 0];      // robot eye beam angles
  eyeOn = 0;
  novaR = 0;
  weaponIdx = 0;
  owned: boolean[] = WEAPONS.map((_, i) => i === 0);
  ammo: number[] = WEAPONS.map((w) => w.ammoClip);

  score = 0; kills = 0; wave = 0; runTime = 0;
  streak = 0; streakT = 0;
  waveActive = false; waveRestT = 0; spawnBudget = 0; spawnT = 0;
  cards: UpgradeCard[] = [];
  banner: { big: string; small: string; color: string; t: number; dur: number; kind: "wave" | "info" } | null = null;

  /* ---------- fx ---------- */
  shake = 0; shakeAng = 0; hitStop = 0; flash = 0; flashColor = "#ffffff";
  zoom = 1; timeScale = 1; dmgVig = 0; lowHpPulse = 0;

  /* ---------- input ---------- */
  keys: Record<string, boolean> = {};
  mouse = { x: 400, y: 300, down: false };
  touchMode = false;
  stickMove = { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 };
  stickAim = { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 };
  dashBtn = { x: 0, y: 0, r: 34 };
  boostBtn = { x: 0, y: 0, r: 30 };
  specBtn = Array.from({ length: 4 }, () => ({ x: 0, y: 0, r: 27 }));
  boostBtnHeld = false;
  boostId = -1;
  aimAngle = -Math.PI / 2;
  autoFire = false;

  private hudT = 0;
  private bgPlate: HTMLCanvasElement | null = null;
  private bgCache = new Map<string, HTMLCanvasElement>();
  private scanTile: HTMLCanvasElement | null = null;
  private starTile: HTMLCanvasElement | null = null;
  private starPattern: CanvasPattern | null = null;
  private prebakePending = false;
  private dmgGrad: CanvasGradient | null = null;
  private glowBudget = 0;
  private glowCache = new Map<string, HTMLCanvasElement>();
  private keyHandler!: (e: KeyboardEvent) => void;
  private keyUpHandler!: (e: KeyboardEvent) => void;
  private pdHandler!: (e: PointerEvent) => void;
  private pmHandler!: (e: PointerEvent) => void;
  private puHandler!: (e: PointerEvent) => void;
  private ctxHandler!: (e: Event) => void;
  private wheelHandler!: (e: WheelEvent) => void;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.cb = cb;
    for (let i = 0; i < 420; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: "#fff",
        drag: 0.9, kind: 0, rot: 0, spin: 0, grav: 0, glow: 1,
      });
    }
    for (let i = 0; i < 260; i++) {
      this.pBullets.push({
        on: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, dmg: 0, pierce: 0,
        life: 0, r: 4, w: WEAPONS[0], crit: false, hitIds: [], owner: 0, returning: false,
      });
    }
    for (let i = 0; i < 520; i++) {
      this.eBullets.push({
        on: false, x: 0, y: 0, vx: 0, vy: 0, r: 6, dmg: 0, life: 0,
        color: "#f0f", kind: "dot", grow: 0, rot: 0, homing: 0, pool: false,
      });
    }
    this.bindInput();
  }

  /* ================= lifecycle ================= */

  resize(w: number, h: number, dpr: number) {
    this.W = Math.max(320, Math.floor(w));
    this.H = Math.max(320, Math.floor(h));
    // Cap the backing store by total pixels. Fill-rate — not logic — is what
    // actually kills frame time on integrated/mobile GPUs.
    this.touchMode = this.touchMode || window.matchMedia?.("(pointer: coarse)").matches === true;
    const budget = this.touchMode ? 1_200_000 : 2_400_000;
    this.dpr = clamp(Math.min(dpr, Math.sqrt(budget / (this.W * this.H))), 0.75, 2);
    this.renderScale = this.scaleSteps[this.touchMode ? 1 : 0];
    this.applyResolution();
    this.ctx.setTransform(this.pxScale, 0, 0, this.pxScale, 0, 0);
    // action buttons hug the bottom-right, clear of the weapon rail on phones
    // vertical stack, bottom-right: SPECIAL 2 / SPECIAL 1 / DASH / BOOST
    // grade 2x2 compacta de habilidades; dash e boost embaixo, lado a lado
    for (let i = 0; i < this.specBtn.length; i++) {
      this.specBtn[i].x = this.W - 132 + (i % 2) * 66;
      this.specBtn[i].y = this.H - 206 + Math.floor(i / 2) * 66;
    }
    this.dashBtn.x = this.W - 132;
    this.dashBtn.y = this.H - 64;
    this.boostBtn.x = this.W - 66;
    this.boostBtn.y = this.H - 64;
    const prevW = this.worldW, prevH = this.worldH;
    // só cresce, em passos de 100px: oscilações típicas da barra de endereço
    // no mobile não disparam mais um bake do mundo no meio do combate
    const q = (v: number) => Math.ceil(v / 100) * 100;
    this.worldW = Math.max(this.worldW, q(this.W * 2.4), 2300);
    this.worldH = Math.max(this.worldH, q(this.H * 2.4), 1500);
    if (this.worldW !== prevW || this.worldH !== prevH) this.buildBackground();
    this.player.x = clamp(this.player.x, 40, this.worldW - 40);
    this.player.y = clamp(this.player.y, 40, this.worldH - 40);
    this.updateCamera(1);
  }

  /** backing-store size follows renderScale (dynamic resolution) */
  private applyResolution() {
    this.pxScale = this.dpr * this.renderScale;
    const w = Math.max(2, Math.floor(this.W * this.pxScale));
    const h = Math.max(2, Math.floor(this.H * this.pxScale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    // NOTE: nunca rebake o fundo aqui. O plate usa escala fixa e cache por
    // bioma — antes, cada queda de resolução re-assava o mundo inteiro no
    // meio do combate e causava exatamente os travamentos intermitentes.
    this.rebuildScreenGrad();
  }

  /** gradientes em espaço de tela (independem do mundo e da resolução) */
  private rebuildScreenGrad() {
    const vg = this.ctx.createRadialGradient(
      this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.22,
      this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.72,
    );
    vg.addColorStop(0, "rgba(255,20,60,0)");
    vg.addColorStop(1, "rgba(255,20,60,1)");
    this.dmgGrad = vg;
  }

  private plateKey(biome: number, scale: number) {
    return `${this.dlc ? "hero" : "base"}:${biome}:${this.worldW}x${this.worldH}:${scale.toFixed(3)}`;
  }

  /** monta (ou recupera do cache) o plate de um bioma, sem tocar em bgPlate */
  private bakePlate(biome: number) {
    const B = this.biome(biome);
    // escala FIXA do plate (independe da resolução dinâmica) — senão qualquer
    // queda de fps custaria um rebake do mundo inteiro.
    const plateScale = Math.min(0.75, Math.sqrt(1_300_000 / Math.max(1, this.worldW * this.worldH)));
    const key = this.plateKey(biome, plateScale);
    const cached = this.bgCache.get(key);
    if (cached) return cached;

    const plate = document.createElement("canvas");
    plate.width = Math.max(2, Math.floor(this.worldW * plateScale));
    plate.height = Math.max(2, Math.floor(this.worldH * plateScale));
    const pc = plate.getContext("2d")!;
    pc.setTransform(plateScale, 0, 0, plateScale, 0, 0);

    const g = pc.createLinearGradient(0, 0, this.worldW * 0.35, this.worldH);
    g.addColorStop(0, B.floor);
    g.addColorStop(0.5, B.sky);
    g.addColorStop(1, B.floor);
    pc.fillStyle = g;
    pc.fillRect(0, 0, this.worldW, this.worldH);

    // nebula washes (fill apenas da área do blob, não do mundo inteiro)
    pc.globalCompositeOperation = "lighter";
    const R = Math.max(this.worldW, this.worldH);
    const blobs: [number, number, number, string, number][] = [
      [this.worldW * 0.28, this.worldH * 0.3, R * 0.3, B.blob, 0.3],
      [this.worldW * 0.78, this.worldH * 0.72, R * 0.26, B.blob2, 0.28],
      [this.worldW * 0.5, this.worldH * 0.98, R * 0.24, B.blob, 0.22],
      [this.worldW * 0.92, this.worldH * 0.1, R * 0.18, B.blob2, 0.18],
    ];
    for (const [x, y, r, c, a] of blobs) {
      const rg = pc.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, this.hexA(c, a));
      rg.addColorStop(0.55, this.hexA(c, a * 0.35));
      rg.addColorStop(1, this.hexA(c, 0));
      pc.fillStyle = rg;
      pc.fillRect(x - r, y - r, r * 2, r * 2);
    }
    pc.globalCompositeOperation = "source-over";

    // floor grid — um único path para linhas verticais e outro para horizontais
    pc.strokeStyle = `rgba(${B.grid},0.085)`;
    pc.lineWidth = 1;
    pc.beginPath();
    for (let i = 0; i <= this.worldW + 64; i += 64) { pc.moveTo(i + 0.5, 0); pc.lineTo(i + 0.5, this.worldH); }
    for (let j = 0; j <= this.worldH + 64; j += 64) { pc.moveTo(0, j + 0.5); pc.lineTo(this.worldW, j + 0.5); }
    pc.stroke();

    this.bakeProps(pc, B);

    // scanlines: UM tile de 8x4 repetido, em vez de worldH/4 fillRects
    if (!this.scanTile) {
      const t = document.createElement("canvas");
      t.width = 8; t.height = 4;
      const tc = t.getContext("2d")!;
      tc.fillStyle = "rgba(143,216,255,0.05)";
      tc.fillRect(0, 0, 8, 1);
      this.scanTile = t;
    }
    const pat = pc.createPattern(this.scanTile, "repeat");
    if (pat) { pc.fillStyle = pat; pc.fillRect(0, 0, this.worldW, this.worldH); }

    // vignette do mundo (1 gradiente)
    const vig = pc.createRadialGradient(
      this.worldW / 2, this.worldH / 2, Math.min(this.worldW, this.worldH) * 0.3,
      this.worldW / 2, this.worldH / 2, Math.max(this.worldW, this.worldH) * 0.62,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(2,1,8,0.7)");
    pc.fillStyle = vig;
    pc.fillRect(0, 0, this.worldW, this.worldH);

    // cache limitado (últimos 3) — nunca mais que ~3 plates na memória
    if (this.bgCache.size > 2) {
      const firstKey = this.bgCache.keys().next().value;
      if (firstKey !== undefined) this.bgCache.delete(firstKey);
    }
    this.bgCache.set(key, plate);
    return plate;
  }

  private buildBackground() {
    this.bgPlate = this.bakePlate(this.biomeIdx);
    this.rebuildScreenGrad();
    this.prebakeNextBiome();
  }

  /**
   * Cozinha o próximo bioma fora do caminho crítico. Sem isso a troca de
   * setor a cada 3 ondas cuspiu um bake de ~10ms exatamente no meio do combate.
   */
  private prebakeNextBiome() {
    if (this.prebakePending) return;
    this.prebakePending = true;
    const run = () => {
      this.prebakePending = false;
      try { this.bakePlate((this.biomeIdx + 1) % (this.dlc ? HERO_BIOME_LIST.length : BIOMES.length)); } catch { /* ignora falha de canvas */ }
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback;
    if (typeof ric === "function") ric(run, { timeout: 2500 });
    else setTimeout(run, 500);
  }

  /** decorative biome props stamped into the plate */
  /** cenário do bioma, cozido no plate: estradas, estruturas, luzes, detritos */
  private bakeProps(pc: CanvasRenderingContext2D, B: Biome) {
    const W = this.worldW, H = this.worldH;
    // PRNG determinístico por bioma: o cenário é sempre o mesmo para o mesmo setor
    let seed = 1234567 + this.biomeIdx * 7919;
    const rnd01 = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const R = (a: number, b: number) => a + rnd01() * (b - a);
    pc.save();
    pc.lineJoin = "round";

    // 1) "estradas"/trilhos de energia cruzando o mapa
    pc.globalAlpha = 0.16;
    pc.strokeStyle = B.accent;
    for (let k = 0; k < 3; k++) {
      const y0 = R(H * 0.15, H * 0.85), y1 = y0 + R(-H * 0.3, H * 0.3);
      pc.lineWidth = 14;
      pc.beginPath(); pc.moveTo(-50, y0); pc.bezierCurveTo(W * 0.3, y0 + R(-200, 200), W * 0.7, y1 + R(-200, 200), W + 50, y1); pc.stroke();
      pc.lineWidth = 2;
      pc.globalAlpha = 0.35;
      pc.stroke();
      pc.globalAlpha = 0.16;
    }
    // 2) grandes placas/zonas de piso (retângulos com borda) — dão escala ao mapa
    for (let k = 0; k < 9; k++) {
      const x = R(0, W), y = R(0, H), w = R(180, 420), h = R(120, 300);
      pc.globalAlpha = 0.07;
      pc.fillStyle = B.accent;
      pc.fillRect(x, y, w, h);
      pc.globalAlpha = 0.22;
      pc.strokeStyle = B.accent;
      pc.lineWidth = 2;
      pc.strokeRect(x + 0.5, y + 0.5, w, h);
      // marcações internas
      pc.globalAlpha = 0.12;
      pc.beginPath();
      for (let m = 1; m < 4; m++) { pc.moveTo(x + (w * m) / 4, y); pc.lineTo(x + (w * m) / 4, y + h); }
      pc.stroke();
    }
    // 3) estruturas grandes do bioma (silhuetas) com sombra projetada
    const bigN = 14;
    for (let k = 0; k < bigN; k++) {
      const x = R(80, W - 80), y = R(80, H - 80), r = R(46, 110);
      // sombra
      pc.globalAlpha = 0.28;
      pc.fillStyle = "#000000";
      pc.beginPath(); pc.ellipse(x + r * 0.25, y + r * 0.45, r * 1.05, r * 0.5, 0, 0, TAU); pc.fill();
      pc.globalAlpha = 0.5;
      pc.fillStyle = `rgba(${B.grid},0.16)`;
      pc.strokeStyle = B.accent;
      pc.lineWidth = 2.5;
      pc.beginPath();
      if (B.prop === "hex") {
        for (let q = 0; q < 6; q++) { const a = (q / 6) * TAU; pc[q ? "lineTo" : "moveTo"](x + Math.cos(a) * r, y + Math.sin(a) * r); }
        pc.closePath(); pc.fill(); pc.stroke();
        // núcleo luminoso
        pc.globalAlpha = 0.6; pc.fillStyle = B.accent;
        pc.beginPath(); pc.arc(x, y, r * 0.18, 0, TAU); pc.fill();
      } else if (B.prop === "ring") {
        pc.arc(x, y, r, 0, TAU); pc.fill(); pc.stroke();
        pc.beginPath(); pc.arc(x, y, r * 0.55, 0, TAU); pc.stroke();
        // brasas
        pc.globalAlpha = 0.7; pc.fillStyle = "#ff8a3a";
        for (let q = 0; q < 5; q++) { const a = R(0, TAU), d = R(0, r * 0.5); pc.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 3, 3); }
      } else if (B.prop === "flower") {
        for (let q = 0; q < 7; q++) {
          const a = (q / 7) * TAU;
          pc.moveTo(x, y);
          pc.quadraticCurveTo(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a + 0.45) * r * 0.75, y + Math.sin(a + 0.45) * r * 0.75);
        }
        pc.fill(); pc.stroke();
        pc.globalAlpha = 0.75; pc.fillStyle = "#e8ffd0";
        pc.beginPath(); pc.arc(x, y, r * 0.14, 0, TAU); pc.fill();
      } else if (B.prop === "crystal") {
        // cristais em cluster
        for (let q = 0; q < 3; q++) {
          const a = R(0, TAU), rr = r * R(0.5, 1);
          const cx = x + Math.cos(a) * r * 0.35, cy = y + Math.sin(a) * r * 0.35;
          pc.beginPath();
          pc.moveTo(cx, cy - rr); pc.lineTo(cx + rr * 0.45, cy); pc.lineTo(cx, cy + rr * 0.6); pc.lineTo(cx - rr * 0.45, cy);
          pc.closePath(); pc.fill(); pc.stroke();
        }
      } else {
        // pilares retangulares com capitel
        pc.rect(x - r * 0.3, y - r, r * 0.6, r * 2); pc.fill(); pc.stroke();
        pc.fillStyle = B.accent; pc.globalAlpha = 0.5;
        pc.fillRect(x - r * 0.42, y - r - 8, r * 0.84, 8);
        pc.fillRect(x - r * 0.42, y + r, r * 0.84, 8);
      }
    }
    // 4) detritos pequenos espalhados (muitos, baratos)
    pc.globalAlpha = 0.3;
    pc.fillStyle = B.accent;
    for (let k = 0; k < 160; k++) {
      const x = R(0, W), y = R(0, H), sz = R(1.5, 4);
      pc.fillRect(x, y, sz, sz);
    }
    // 5) pontos de luz (lamps) com halo
    for (let k = 0; k < 18; k++) {
      const x = R(40, W - 40), y = R(40, H - 40), r = R(40, 90);
      const g = pc.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, this.hexA(B.accent, 0.28));
      g.addColorStop(1, this.hexA(B.accent, 0));
      pc.globalAlpha = 1;
      pc.fillStyle = g;
      pc.fillRect(x - r, y - r, r * 2, r * 2);
      pc.fillStyle = "#ffffff";
      pc.globalAlpha = 0.9;
      pc.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    pc.restore();
    pc.globalAlpha = 1;
  }
  setBiome(idx: number) {
    const len = this.dlc ? HERO_BIOME_LIST.length : BIOMES.length;
    const next = ((idx % len) + len) % len;
    if (next === this.biomeIdx) return;
    this.biomeIdx = next;
    this.buildBackground();
  }

  private updateCamera(snap = 0) {
    const tx = clamp(this.player.x - this.W / 2, 0, Math.max(0, this.worldW - this.W));
    const ty = clamp(this.player.y - this.H / 2, 0, Math.max(0, this.worldH - this.H));
    if (snap >= 1) { this.camX = tx; this.camY = ty; return; }
    const k = Math.min(1, snap || 0.14);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
  }

  private wx(x: number) { return x + this.camX; }
  private wy(y: number) { return y + this.camY; }
  start() {
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      let dt = (t - this.last) / 1000;
      this.last = t;
      if (dt > 0.05) dt = 0.05;
      this.frameAvg = this.frameAvg * 0.93 + dt * 1000 * 0.07;
      if (!this.qualityLocked) {
        if (this.frameAvg > 23 && this.quality > 0.55) this.quality = Math.max(0.55, this.quality - 0.05);
        else if (this.frameAvg < 15 && this.quality < 1) this.quality = Math.min(1, this.quality + 0.02);
        // Resolução dinâmica em degraus grossos e raramente: realocar
      // canvas.width custa (novo buffer GPU), então mudamos no máximo
      // a cada 12s e apenas entre 3 níveis fixos.
        if (this.scaleHold > 0) this.scaleHold -= dt;
        else if (this.frameAvg > 27 && this.renderScale > this.scaleSteps[2]) {
          this.renderScale = this.scaleSteps[2];
          this.scaleHold = 12;
          this.applyResolution();
        } else if (this.frameAvg > 24 && this.renderScale > this.scaleSteps[1]) {
          this.renderScale = this.scaleSteps[1];
          this.scaleHold = 12;
          this.applyResolution();
        } else if (this.frameAvg < 14 && this.renderScale < this.scaleSteps[0]) {
          this.renderScale = this.scaleSteps[0];
          this.scaleHold = 12;
          this.applyResolution();
        }
      }
      // frozen screens (pause / upgrade) don't need 60 renders per second
      this.idleSkip = (this.status === "paused" || this.status === "upgrade") ? this.idleSkip + 1 : 0;
      if (this.idleSkip % 2 === 1) return;

      this.acc += dt;
      const step = 1 / 60;
      let guard = 0;
      while (this.acc >= step && guard < 4) {
        this.tick(step);
        this.acc -= step;
        guard++;
      }
      if (guard >= 4) this.acc = 0;
      this.render(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.keyHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
    this.canvas.removeEventListener("pointerdown", this.pdHandler);
    window.removeEventListener("pointermove", this.pmHandler);
    window.removeEventListener("pointerup", this.puHandler);
    window.removeEventListener("pointercancel", this.puHandler);
    this.canvas.removeEventListener("contextmenu", this.ctxHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
  }

  private bindInput() {
    this.keyHandler = (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) e.preventDefault();
      this.keys[e.code] = true;
      if (e.repeat) return;
      if (this.status === "playing" && (e.code === "Escape" || e.code === "KeyP")) this.pause();
      else if (this.status === "paused" && (e.code === "Escape" || e.code === "KeyP" || e.code === "Space" || e.code === "Enter")) this.resume();
      else if (this.status === "gameover" && (e.code === "KeyR" || e.code === "Enter" || e.code === "Space")) this.startRun();
      else if (this.status === "upgrade") {
        const n = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
        if (n !== undefined && this.cards[n]) this.chooseUpgrade(n);
      }
      if (this.status === "playing") {
        if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") this.tryDash();
        if (e.code === "KeyQ") this.cycleWeapon(-1);
        const specialKey = e.code.replace("Key", "");
        const specialSlot = this.cls.specials.findIndex((s) => s.key === specialKey);
        if (specialSlot >= 0) this.castSpecial(specialSlot);
        if (e.code === "KeyR") this.cycleWeapon(1);
        const d = /^Digit([1-3])$/.exec(e.code);
        if (d) {
          const i = +d[1] - 1;
          if (this.owned[i]) this.setWeapon(i);
        }
      }
    };
    this.keyUpHandler = (e) => { this.keys[e.code] = false; };
    window.addEventListener("keydown", this.keyHandler);
    window.addEventListener("keyup", this.keyUpHandler);

    this.pdHandler = (e: PointerEvent) => {
      this.canvas.setPointerCapture?.(e.pointerId);
      const x = e.clientX, y = e.clientY;
      if (e.pointerType === "touch") {
        this.touchMode = true;
        for (let si = this.cls.specials.length - 1; si >= 0; si--) {
          const b = this.specBtn[si];
          if ((x - b.x) ** 2 + (y - b.y) ** 2 < 44 * 44) { this.castSpecial(si); return; }
        }
        const bd = (x - this.boostBtn.x) ** 2 + (y - this.boostBtn.y) ** 2;
        if (bd < 58 * 58) { this.boostBtnHeld = true; this.boostId = e.pointerId; return; }
        const d2 = (x - this.dashBtn.x) ** 2 + (y - this.dashBtn.y) ** 2;
        if (d2 < 56 * 56) { this.tryDash(); return; }
        if (x < this.W * 0.5 && !this.stickMove.active) {
          Object.assign(this.stickMove, { active: true, id: e.pointerId, ox: x, oy: y, x, y, dx: 0, dy: 0 });
        } else if (!this.stickAim.active) {
          Object.assign(this.stickAim, { active: true, id: e.pointerId, ox: x, oy: y, x, y, dx: 0, dy: 0 });
          this.autoFire = true;
        }
      } else {
        if (e.button === 0) this.mouse.down = true;
        if (e.button === 2) { this.tryDash(); }
        sfx.resume();
      }
    };
    this.pmHandler = (e: PointerEvent) => {
      this.mouse.x = e.clientX; this.mouse.y = e.clientY;
      const s = e.pointerId === this.stickMove.id ? this.stickMove : e.pointerId === this.stickAim.id ? this.stickAim : null;
      if (s && s.active) {
        s.x = e.clientX; s.y = e.clientY;
        const R = 62;
        let dx = s.x - s.ox, dy = s.y - s.oy;
        const d = hyp(dx, dy);
        if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
        s.dx = dx / R; s.dy = dy / R;
      }
    };
    this.puHandler = (e: PointerEvent) => {
      if (e.pointerId === this.boostId) { this.boostId = -1; this.boostBtnHeld = false; }
      if (e.pointerId === this.stickMove.id) Object.assign(this.stickMove, { active: false, id: -1, dx: 0, dy: 0 });
      if (e.pointerId === this.stickAim.id) {
        Object.assign(this.stickAim, { active: false, id: -1, dx: 0, dy: 0 });
        this.autoFire = false;
      }
      if (e.pointerType !== "touch") {
        if (e.button === 0) this.mouse.down = false;
      }
    };
    this.ctxHandler = (e: Event) => e.preventDefault();
    this.wheelHandler = (e: WheelEvent) => { if (this.status === "playing") this.cycleWeapon(e.deltaY > 0 ? 1 : -1); };

    this.canvas.addEventListener("pointerdown", this.pdHandler);
    window.addEventListener("pointermove", this.pmHandler);
    window.addEventListener("pointerup", this.puHandler);
    window.addEventListener("pointercancel", this.puHandler);
    this.canvas.addEventListener("contextmenu", this.ctxHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler, { passive: true });
  }

  /* ================= roster (base game / HeroWave DLC) ================= */

  private roster(): ClassDef[] { return this.dlc ? HERO_CLASSES : CLASSES; }
  private biome(i = this.biomeIdx): Biome {
    const list = this.dlc ? HERO_BIOME_LIST : BIOMES;
    return list[((i % list.length) + list.length) % list.length];
  }
  private resolveClass(id: ClassId): ClassDef {
    if (this.dlc && id === "jedi") return heroClassDef("mago");
    return this.dlc ? heroClassDef(id) : classById(id);
  }
  private heroDef(): HeroDef | undefined { return this.dlc ? HEROES.find((h) => h.id === this.cls.id) : undefined; }
  /** damage multiplier including HeroWave buffs */
  private powerMul() { return this.stats.dmgMul * this.buffDmg * this.rageDmg * this.hulkRage(); }
  private hulkRage() {
    if (!this.dlc || this.cls.id !== "bruto") return 1;
    const frac = this.player.hp / Math.max(1, this.player.maxHp);
    return frac < 0.4 ? 1.45 : frac < 0.7 ? 1.18 : 1;
  }

  setDlc(on: boolean) {
    if (this.dlc === on) return;
    this.dlc = on;
    this.bgCache.clear();
    this.biomeIdx = 0;
    this.buildBackground();
    const id: ClassId = on && this.cls.id === "jedi" ? "mago" : this.cls.id;
    this.cls = this.resolveClass(id);
    this.classWeapons = on ? heroWeaponsFor(id) : weaponsForClass(id);
    this.owned = this.classWeapons.map(() => true);
    this.ammo = this.classWeapons.map((w) => w.ammoClip);
    this.weaponIdx = 0;
    this.specT = this.cls.specials.map(() => 0);
    this.specFlash = this.cls.specials.map(() => 0);
    this.player.maxHp = this.cls.hp; this.player.hp = this.cls.hp;
    if (this.demoActive) this.startDemo();
    this.publish(true);
  }

  /* ================= run control ================= */

  private resetInput() {
    this.keys = {};
    this.mouse.down = false;
    this.autoFire = false;
    this.boostBtnHeld = false; this.boostId = -1;
    Object.assign(this.stickMove, { active: false, id: -1, dx: 0, dy: 0 });
    Object.assign(this.stickAim, { active: false, id: -1, dx: 0, dy: 0 });
  }

  // Class changes must not carry summoned objects or defensive buffs into a new run.
  private resetClassPowers() {
    this.resetInput();
    this.mindGuardT = 0; this.jediGuardT = 0; this.deflectCd = 0; this.cryoArmorT = 0;
    this.classFields.length = 0; this.forceArcs.length = 0;
    this.invisT = 0; this.flightT = 0; this.titanT = 0; this.parryT = 0; this.shieldT = 0;
    this.refractionT = 0; this.alchemistBuffT = 0; this.decoyT = 0;
    this.slowT = 0; this.slowMeter = 1; this.slowFx = 0; this.timeStopT = 0;
    this.rewindFrames.length = 0; this.rewindCursor = -1;
    this.portal = null;
    this.nukes.length = 0; this.grenades.length = 0; this.turrets.length = 0;
    this.mines.length = 0; this.hazards.length = 0; this.drones.length = 0; this.meteors.length = 0;
    this.scheduled.length = 0;
    this.specT = this.cls.specials.map(() => 0);
    this.specFlash = this.cls.specials.map(() => 0);
    this.perfectShot = 0; this.bladeT = 0; this.danceT = 0; this.abilityOn = 0;
    this.eyeBeamT = 0; this.beamBoostT = 0; this.novaR = 0;
    this.boost = 1; this.boosting = false; this.boostFx = 0; this.boostLock = 0;
    this.player.fireT = 0; this.player.dashT = 0; this.player.dashCd = 0;
    this.player.inv = 0; this.player.muzzle = 0; this.player.hurtT = 0; this.player.safeT = 0;
    this.player.recoil = 0; this.player.vx = 0; this.player.vy = 0;
    this.shake = 0; this.flash = 0; this.dmgVig = 0; this.hitStop = 0; this.timeScale = 1; this.zoom = 1;
    this.banner = null; this.toasts.length = 0; this.goShown = false; this.goT = 0; this.waveFlashT = 0;
    this.nParts = 0; this.floaters.length = 0; this.decals.length = 0; this.ripples.length = 0;
  }

  startRun(classId?: ClassId) {
    sfx.resume();
    this.cls = classId ? this.resolveClass(classId) : this.cls;
    this.resetClassPowers();
    this.setBiome(0);
    const c = this.cls;
    this.enemies = []; this.boss = null; this.marks = []; this.beams = [];
    this.pickups = []; this.floaters = []; this.decals = []; this.ripples = []; this.scheduled = [];
    this.pBullets.forEach((b) => (b.on = false));
    this.eBullets.forEach((b) => (b.on = false));
    this.nParts = 0;
    this.pIdx = 0; this.eIdx = 0; this.enemySeq = 0;
    this.abilityT = 0; this.abilityOn = 0; this.abilityCharge = 0; this.novaR = 0; this.eyeOn = 0;
    this.boost = 1; this.boosting = false; this.boostLock = 0; this.boostFx = 0; this.boostBtnHeld = false; this.boostId = -1;
    this.specT = Array(this.cls.specials.length).fill(0);
    this.specFlash = Array(this.cls.specials.length).fill(0);
    this.perfectShot = 0; this.bladeT = 0; this.bladeSpin = 0;
    this.timeStopT = 0; this.rewindFrames = []; this.rewindCursor = -1;
    this.invisT = 0; this.flightT = 0; this.titanT = 0; this.parryT = 0;
    this.refractionT = 0; this.alchemistBuffT = 0;
    this.decoyT = 0; this.decoyX = 0; this.decoyY = 0;
    this.portal = null; this.nukes = []; this.grenades = []; this.turrets = []; this.mines = []; this.hazards = [];
    this.drones = []; this.meteors = [];
    this.danceT = 0; this.beamBoostT = 0; this.eyeBeamT = 0; this.demoActive = false; this.toasts = [];
    this.keys = {}; this.mouse.down = false; this.autoFire = false;
    this.stats = baseStats(); this.modLevels = {};
    // ---- class modifiers ----
    this.stats.dmgMul *= c.dmg;
    this.stats.speedMul *= c.speed;
    this.stats.fireRateMul *= c.fireRate;
    this.stats.dashCdMul *= c.dashCd;
    this.stats.armor += c.armor;
    this.stats.critChance += c.crit;
    if (c.stats.critMul) this.stats.critMul = c.stats.critMul;
    if (c.stats.pierce) this.stats.pierceAdd += c.stats.pierce;
    if (c.stats.boomRadius) this.stats.boomRadius *= c.stats.boomRadius;
    if (c.stats.chain) this.stats.chainBonus = c.stats.chain;
    if (c.stats.lifesteal) this.stats.lifesteal += c.stats.lifesteal;
    if (c.stats.hpRegen) this.stats.hpRegen += c.stats.hpRegen;
    this.classWeapons = this.dlc ? heroWeaponsFor(c.id) : weaponsForClass(c.id);
    this.owned = this.classWeapons.map(() => true);
    this.ammo = this.classWeapons.map((w) => w.ammoClip);
    this.weaponIdx = 0;
    this.resetHeroBuffs();
    this.score = 0; this.kills = 0; this.wave = 0; this.runTime = 0;
    this.streak = 0; this.streakT = 0;
    this.player.x = this.W / 2; this.player.y = this.H / 2;
    this.player.vx = 0; this.player.vy = 0;
    this.player.maxHp = c.hp + this.stats.maxHpAdd; this.player.hp = this.player.maxHp; this.player.alive = true;
    this.player.inv = 0.6; this.player.dashCd = 0; this.player.dashT = 0; this.player.trail = [];
    this.player.r = c.shape === "brute" ? 18 : c.shape === "mech" ? 16 : c.shape === "blade" ? 15 : 14;
    this.shake = 0; this.flash = 0; this.hitStop = 0; this.timeScale = 1; this.zoom = 1;
    this.waveActive = false; this.waveRestT = 0.75; this.spawnBudget = 0; this.cards = [];
    // instant arsenal tease: a crate lands next to the spawn

    this.pickups.push({ x: this.W / 2 - 96, y: this.H / 2 - 6, vx: 0, vy: 0, life: 60, kind: "hp", weapon: 0, color: "#3cff8f", t: 0 });
    this.status = "playing";
    this.cb.onStatus(this.status);
    this.setBanner("PREPARE-SE", this.cls.name + " · " + this.cls.role.toUpperCase(), this.cls.color, 2.2, "wave");
    this.publish(true);
  }

  /* ================= menu demo (predefined gameplay behind the menu) ================= */

  startDemo() {
    this.status = "menu";
    this.demoActive = true;
    this.demoT = 0;
    this.demoIdx = Math.max(0, this.roster().findIndex((c) => c.id === this.cls.id));
    this.enemies = []; this.marks = []; this.boss = null; this.beams = [];
    this.pBullets.forEach((b) => (b.on = false));
    this.eBullets.forEach((b) => (b.on = false));
    this.setupDemoClass(this.roster()[this.demoIdx]);
    this.wave = 0; this.waveActive = false; this.waveRestT = 0.4; this.spawnBudget = 0; this.setBiome(0);
    this.score = 0; this.kills = 0;
  }

  toMenu() {
    this.status = "menu";
    this.demoActive = false;
    this.resetClassPowers();
    this.enemies.length = 0; this.marks.length = 0; this.beams.length = 0; this.pickups.length = 0;
    this.boss = null;
    for (const b of this.pBullets) b.on = false;
    for (const b of this.eBullets) b.on = false;
    this.cards.length = 0;
    this.waveActive = false; this.spawnBudget = 0;
    this.cb.onStatus(this.status);
    this.publish(true);
  }

  /**
   * The sector changes every three waves; baking that plate mid-combat cost a
   * 10–25ms hitch. Wave clear always leads into the upgrade screen, where
   * rendering is idle-skipped — so the bake happens while nothing is moving.
   */
  private warmUpcomingSector() {
    const len = this.dlc ? HERO_BIOME_LIST.length : BIOMES.length;
    const next = Math.floor(this.wave / 3) % len;
    if (next === this.biomeIdx) return;
    try { this.bakePlate(next); } catch { /* ignora falha de canvas */ }
  }

  /**
   * Bakes the sector plate ahead of time (called from the class-select screen)
   * so the first gameplay frame never pays the ~20ms background build.
   */
  prewarm() {
    try {
      this.buildBackground();
      this.bakePlate((this.biomeIdx + 1) % (this.dlc ? HERO_BIOME_LIST.length : BIOMES.length));
    } catch { /* ignora falha de canvas fora do caminho crítico */ }
  }

  setQualityLock(low: boolean) {
    this.qualityLocked = low;
    if (low) {
      this.quality = 0.55;
      if (this.renderScale > 0.72) { this.renderScale = 0.72; this.applyResolution(); }
    }
  }

  private setupDemoClass(c: ClassDef) {
    this.cls = c;
    this.resetClassPowers();
    this.stats = baseStats();
    this.stats.dmgMul *= c.dmg;
    this.stats.speedMul *= c.speed;
    this.stats.fireRateMul *= c.fireRate;
    this.stats.dashCdMul *= c.dashCd;
    this.stats.armor += c.armor;
    this.stats.critChance += c.crit;
    if (c.stats.critMul) this.stats.critMul = c.stats.critMul;
    if (c.stats.pierce) this.stats.pierceAdd += c.stats.pierce;
    if (c.stats.boomRadius) this.stats.boomRadius *= c.stats.boomRadius;
    if (c.stats.chain) this.stats.chainBonus = c.stats.chain;
    if (c.stats.lifesteal) this.stats.lifesteal += c.stats.lifesteal;
    if (c.stats.hpRegen) this.stats.hpRegen += c.stats.hpRegen;
    this.classWeapons = this.dlc ? heroWeaponsFor(c.id) : weaponsForClass(c.id);
    this.owned = this.classWeapons.map(() => true);
    this.ammo = this.classWeapons.map((w) => w.ammoClip);
    this.weaponIdx = 0;
    this.resetHeroBuffs();
    const p = this.player;
    p.maxHp = c.hp; p.hp = p.maxHp; p.alive = true;
    p.x = this.W / 2; p.y = this.H / 2; p.vx = 0; p.vy = 0;
    p.r = c.shape === "brute" ? 18 : c.shape === "mech" ? 16 : c.shape === "blade" ? 15 : 14;
    p.trail = [];
    this.specT = Array(c.specials.length).fill(0);
    this.drones = []; this.meteors = [];
    this.boss = null;
  }

  private updateDemo(dt: number) {
    const p = this.player;
    this.demoT += dt;
    if (this.demoT >= 9) {
      this.demoT = 0;
      this.demoIdx = (this.demoIdx + 1) % this.roster().length;
      this.enemies = []; this.marks = []; this.boss = null;
      this.pBullets.forEach((b) => (b.on = false));
      this.eBullets.forEach((b) => (b.on = false));
      this.waveActive = false; this.waveRestT = 0.5; this.wave = 0; this.setBiome(0);
      this.setupDemoClass(this.roster()[this.demoIdx]);
    }
    p.inv = Math.max(p.inv, 0.6);
    if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 14 * dt);

    const tgt = this.nearestTarget(1200);
    let mx = 0, my = 0;
    if (tgt) {
      const dx = tgt.x - p.x, dy = tgt.y - p.y;
      const d = hyp(dx, dy) || 1;
      const want = this.cls.id === "samurai" ? 90 : 230;
      const radial = d > want + 50 ? 1 : d < want - 50 ? -0.8 : 0;
      const strafe = Math.sin(this.time * 0.7) > 0 ? 1 : -1;
      mx = (dx / d) * radial + (-dy / d) * strafe * 0.7;
      my = (dy / d) * radial + (dx / d) * strafe * 0.7;
      this.mouse.x = tgt.x; this.mouse.y = tgt.y;
      if (d < 120 && p.dashCd <= 0) this.tryDash();
      if (Math.random() < dt * 0.35) this.castSpecial((Math.random() * this.cls.specials.length) | 0);
      if (Math.random() < dt * 0.3) this.keys["ShiftLeft"] = true;
    } else {
      mx = Math.cos(this.time * 0.4); my = Math.sin(this.time * 0.53);
      this.mouse.x = p.x + mx * 200; this.mouse.y = p.y + my * 200;
    }
    this.keys["KeyA"] = mx < -0.25; this.keys["KeyD"] = mx > 0.25;
    this.keys["KeyW"] = my < -0.25; this.keys["KeyS"] = my > 0.25;
    this.mouse.down = true;
    this.autoFire = true;

    this.updatePlayer(dt);
    this.updatePassives(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateBullets(dt);
    this.updateBeams(dt);
    this.updateParticles(dt);
    this.updatePickups(dt);
    if (this.enemies.length) {
      let w = 0;
      const list = this.enemies;
      for (let i = 0; i < list.length; i++) if (!list[i].dead) list[w++] = list[i];
      list.length = w;
    }
    this.queueSpawns(dt);
    if (this.waveActive && this.spawnBudget <= 0 && this.enemies.length === 0 && this.marks.length === 0 && !this.boss) {
      this.waveActive = false; this.waveRestT = 1.1;
    }
    if (!this.waveActive) {
      this.waveRestT -= dt;
      if (this.waveRestT <= 0) this.nextWave();
    }
  }

  pause() {
    if (this.status !== "playing") return;
    this.resetInput();
    this.status = "paused"; this.cb.onStatus(this.status); this.publish(true);
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "playing"; this.cb.onStatus(this.status); this.publish(true);
  }

  toggleMute(v: boolean) { sfx.setEnabled(v); }

  setWeapon(i: number) {
    if (i < 0 || i >= this.classWeapons.length || !this.owned[i]) return;
    if (i === this.weaponIdx) return;
    this.weaponIdx = i;
    this.player.fireT = Math.max(this.player.fireT, 0.09);
    sfx.ui();
    this.publish(true);
  }

  cycleWeapon(dir: number) {
    const n = this.classWeapons.length || 1;
    for (let k = 1; k <= n; k++) {
      const i = (this.weaponIdx + dir * k + n * 4) % n;
      if (this.owned[i]) { this.setWeapon(i); return; }
    }
  }

  chooseUpgrade(i: number) {
    const card = this.cards[i];
    if (!card) return;
    const mod = MODS.find((m) => m.id === card.id) as ModDef;
    mod.apply(this.stats);
    this.modLevels[mod.id] = (this.modLevels[mod.id] ?? 0) + 1;
    if (mod.id === "bulk") {
      this.player.maxHp += 30;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
    }
    this.cards = [];
    this.status = "playing";
    this.cb.onStatus(this.status);
    sfx.levelUp();
    this.burst(this.player.x, this.player.y, card.color, 26, 260);
    this.ripples.push({ x: this.player.x, y: this.player.y, r: 10, maxR: 220, life: 0.5, max: 0.5, color: card.color, w: 4 });
    this.publish(true);
  }

  /* ================= wave director ================= */

  private isBossWave(w: number) { return w >= 3 && (w - 3) % 5 === 0; }

  private nextWave() {
    this.wave++;
    const w = this.wave;
    this.goShown = false;
    // new sector every three waves
    if (w > 1 && (w - 1) % 3 === 0) {
      this.setBiome(Math.floor((w - 1) / 3));
      this.setBanner(this.biome().name, "NOVO SETOR", this.biome().accent, 2.6, "wave");
      this.flashScreen(this.biome().accent, 0.22);
      this.shake = Math.max(this.shake, 10);
      sfx.wave(w);
    }
    this.runTime += 0;
    if (this.isBossWave(w) && !this.demoActive) {
      const idx = Math.min(BOSS_DEFS.length - 1, Math.floor((w - 3) / 5));
      const def = BOSS_DEFS[idx];
      const hpScale = 1 + Math.max(0, w - 3 - idx * 5) * 0.24 + (w - 3) * 0.02;
      this.boss = {
        def, idx, x: this.player.x, y: Math.max(-120, this.player.y - this.H * 0.55), vx: 0, vy: 0, hp: def.hp * hpScale, maxHp: def.hp * hpScale,
        r: def.radius, t: 0, phase: 1, atk: 0, atkT: 1.6, tele: 0, hitFlash: 0, ang: Math.PI / 2,
        entering: 1.5, dead: false, spin: 0, sub: 0,
      };
      this.setBanner(`ONDA ${String(w).padStart(2, "0")}`, "CHEFE · " + def.name, def.color, 3.2, "wave");
      sfx.bossWarn();
      this.flashScreen(def.color, 0.35);
      this.shake = Math.max(this.shake, 16);
      this.waveActive = true;
      this.spawnBudget = 3 + w * 0.35;
      this.spawnT = 2.2;
    } else {
      this.spawnBudget = 7 + w * 2.75 + Math.pow(Math.max(0, w - 6), 1.6) * 0.5;
      this.spawnT = 0.3;
      const kinds = this.availableKinds().length;
      this.setBanner(`ONDA ${String(w).padStart(2, "0")}`, `${Math.round(this.spawnBudget)} HOSTIS · ${kinds} TIPOS`, "#ff3b5c", 2.4, "wave");
      sfx.wave(w);
    }
    // rearm partially
    for (let i = 0; i < this.classWeapons.length; i++) {
      const wd = this.classWeapons[i];
      if (wd.ammoClip > 0) this.ammo[i] = Math.min(wd.ammoClip, this.ammo[i] + Math.ceil(wd.ammoClip * 0.4));
    }
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8);
    this.waveActive = true;
    this.publish(true);
  }

  private offerUpgrades() {
    const pool = MODS.filter((m) => (this.modLevels[m.id] ?? 0) < m.max);
    const options: UpgradeCard[] = [];
    const bag = [...pool];
    while (options.length < 3 && bag.length) {
      const i = (Math.random() * bag.length) | 0;
      const m = bag.splice(i, 1)[0];
      options.push({
        id: m.id, name: m.name, tag: m.tag, color: m.color, desc: m.desc,
        level: (this.modLevels[m.id] ?? 0) + 1, max: m.max,
      });
    }
    if (!options.length) {
      this.waveRestT = 0.6;
      return;
    }
    this.cards = options;
    this.status = "upgrade";
    this.cb.onStatus(this.status);
    this.publish(true);
  }

  private availableKinds(): EnemyKind[] {
    const w = this.wave, out: EnemyKind[] = ["grunt"];
    if (w >= 1) out.push("drone");
    if (w >= 2) out.push("shooter");
    if (w >= 3) out.push("charger");
    if (w >= 4) out.push("splitter", "spitter");
    if (w >= 5) out.push("bomber", "warden");
    if (w >= 6) out.push("orbiter", "phantom");
    if (w >= 7) out.push("heavy", "healer");
    if (w >= 8) out.push("sniper");
    if (w >= 9) out.push("summoner");
    return out;
  }

  private queueSpawns(dt: number) {
    if (!this.waveActive || this.spawnBudget <= 0) return;
    if (!this.goShown && this.wave >= 1 && !this.demoActive) {
      this.goShown = true;
      this.goT = 0.9;
      sfx.wave(this.wave);
    }
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    const burst = clamp(1 + Math.floor(this.wave / 3), 1, 5);
    const kinds = this.availableKinds();
    let attempts = 0;
    for (let i = 0; i < burst && this.spawnBudget > 0 && attempts < 10; i++) {
      attempts++;
      if (this.enemies.length + this.marks.length > 52) break;
      const kind = pick(kinds);
      const def = ENEMY_DEFS[kind];
      // spawn in a ring just outside the viewport so the bigger arena stays busy
      const ring = hyp(this.W, this.H) * 0.5;
      const a = Math.random() * TAU;
      let x = this.player.x + Math.cos(a) * ring;
      let y = this.player.y + Math.sin(a) * ring;
      const m = 50;
      x = clamp(x, m, this.worldW - m);
      y = clamp(y, m, this.worldH - m);
      const dd = hyp(x - this.player.x, y - this.player.y);
      if (dd < Math.min(ring, 320)) { i--; continue; }
      this.marks.push({ x, y, t: 0.75, kind, elite: this.wave > 4 && Math.random() < 0.12 });
      this.spawnBudget -= def.cost * (this.isBossWave(this.wave) ? 0.35 : 1);
    }
    const rate = clamp(1.5 - this.wave * 0.055, 0.42, 1.5);
    this.spawnT = rate * rnd(0.75, 1.25);
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number, elite: boolean, scale = 1) {
    const def = ENEMY_DEFS[kind];
    const hpS = 1 + (this.wave - 1) * 0.21 + Math.pow(Math.max(0, this.wave - 8), 1.5) * 0.035;
    const spS = 1 + Math.min(this.wave - 1, 18) * 0.033;
    const e: Enemy = {
      id: ++this.enemySeq,
      x, y, vx: 0, vy: 0, tele: 0,
      hp: def.hp * hpS * scale * (elite ? 2.4 : 1), maxHp: def.hp * hpS * scale * (elite ? 2.4 : 1),
      r: def.radius * scale * (elite ? 1.32 : 1), kind,
      speed: def.speed * spS * (elite ? 0.86 : 1),
      contact: def.contact * (1 + (this.wave - 1) * 0.085),
      score: def.score * (elite ? 2.6 : 1),
      rot: 0, spin: rnd(-2, 2), t: rnd(0, 6), fireT: rnd(0.4, 1.7), charge: 0,
      hitFlash: 0, spawnT: 0.34, squash: 0, dead: false, aim: 0, orbitDir: Math.random() < 0.5 ? -1 : 1,
      dist: rnd(220, 330), elite, shield: kind === "heavy" ? 1 : kind === "warden" ? 2 : 0,
      curseT: 0, stunT: 0, markT: 0, chillT: 0, controlledT: 0, controlFireT: 0,
    };
    this.enemies.push(e);
    this.ripples.push({ x, y, r: 6, maxR: e.r * 4.4, life: 0.34, max: 0.34, color: def.color, w: 3 });
    this.burst(x, y, def.color, 10, 190);
  }

  /* ================= main tick ================= */

  private runScheduled(dt: number) {
    const q = this.scheduled;
    for (let i = q.length - 1; i >= 0; i--) {
      const s = q[i];
      s.t -= dt;
      if (s.t > 0) continue;
      q.splice(i, 1);
      if (s.bullet) {
        if (this.status !== "playing" || !s.owner || s.owner.dead || this.boss !== s.owner) continue;
        this.spawnEBullet(s.owner.x, s.owner.y, Math.cos(s.ang!) * s.sp!, Math.sin(s.ang!) * s.sp!, 8, s.dmg!, s.color!, "dot");
      } else {
        if (this.status === "paused") continue;
        this.explodeAt(s.x!, s.y!, s.r!, 0, s.color!, false);
      }
    }
  }

  private tick(dt: number) {
    if (this.status === "paused" || this.status === "upgrade") { this.publish(false); return; }
    this.time += dt;
    if (this.scheduled.length) this.runScheduled(dt);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    // fx always decay
    this.shake *= 0.86;
    if (this.shake < 0.05) this.shake = 0;
    this.flash *= 0.86;
    this.dmgVig *= 0.94;
    for (let i = 0; i < this.specFlash.length; i++) {
      if (this.specFlash[i] > 0) this.specFlash[i] = Math.max(0, this.specFlash[i] - dt * 2);
    }
    if (this.eyeBeamT > 0) this.eyeBeamT -= dt;
    if (this.beamBoostT > 0) this.beamBoostT -= dt;
    if (this.timeStopT > 0) this.timeStopT = Math.max(0, this.timeStopT - dt);
    if (this.goT > 0) this.goT = Math.max(0, this.goT - dt);
    for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].t -= dt; if (this.toasts[i].t <= 0) this.toasts.splice(i, 1); }
    if (this.waveFlashT > 0) this.waveFlashT = Math.max(0, this.waveFlashT - dt);
    this.shakeAng += dt * 3;
    this.hurtAmbient(dt);

    if (this.status === "menu") {
      if (this.demoActive) this.updateDemo(dt);
      else this.updateParticles(dt);
      this.publish(false);
      return;
    }
    if (this.status === "gameover") {
      const gdt = dt * this.timeScale;
      this.timeScale += (1 - this.timeScale) * 1.6 * dt;
      this.updateParticles(gdt);
      this.updateBeams(gdt);
      this.updateBulletsDrain(gdt);
      this.publish(false);
      return;
    }
    if (this.status !== "playing") { this.publish(false); return; }

    if (this.hitStop > 0) { this.hitStop -= dt; this.publish(false); return; }
    dt *= this.timeScale;
    this.timeScale += (1 - this.timeScale) * 4.2 * dt;

    /* ---- VELOCISTA bullet time: the world crawls, the runner does not ---- */
    const slow = this.slowT > 0;
    const frozen = this.timeStopT > 0 || this.rewindCursor >= 0;
    const wdt = frozen ? dt * 0.012 : slow ? dt * 0.38 : dt;   // world
    // O velocista atravessa o tempo: movimento e projéteis do jogador ficam
    // quase em tempo real enquanto inimigos e balas hostis continuam lentos.
    const pdt = slow ? dt * 1.08 : dt;

    const zTarget = 1 - this.boostFx * 0.05 - this.slowFx * 0.06;
    this.zoom += (zTarget - this.zoom) * Math.min(1, dt * 4);
    this.runTime += wdt;

    this.updatePlayer(pdt);
    this.updatePassives(pdt);
    this.updateEnemies(wdt);
    this.updateBoss(wdt);
    this.updateBullets(wdt, pdt);
    this.updateBeams(wdt);
    this.updateParticles(wdt);
    this.updatePickups(wdt);
    this.updateCamera(0.14);
    // compactação in-place: filter() alocava um array novo em quase todo
    // frame de combate → pressão de GC = micro-travamentos intermitentes
    if (this.enemies.length) {
      let w = 0;
      const list = this.enemies;
      for (let i = 0; i < list.length; i++) {
        if (!list[i].dead) list[w++] = list[i];
      }
      list.length = w;
    }
    this.queueSpawns(wdt);
    this.updateWave(wdt);
    this.publish(false);
  }


  private hurtAmbient(dt: number) {
    this.lowHpPulse += dt * (this.player.hp / this.player.maxHp < 0.34 ? 7 : 2.2);
  }

  /* ================= player ================= */

  private updatePlayer(dt: number) {
    const p = this.player;
    // Rewind only restores player state; the arena stays slightly slowed.
    if (this.rewindCursor >= 0) {
      const frame = this.rewindFrames[this.rewindCursor];
      if (frame) {
        p.x = frame.x; p.y = frame.y; p.ang = frame.ang;
        p.hp = Math.min(p.maxHp, Math.max(p.hp, frame.hp));
        p.vx = 0; p.vy = 0; p.inv = 0.08;
        this.rewindCursor -= 3;
        if (this.rewindCursor < 0) {
          this.rewindFrames = [];
          this.rewindCursor = -1;
          p.inv = Math.max(p.inv, 0.45);
          this.setBanner("REBOBINADO", "POSIÇÃO RESTAURADA", this.cls.color, 1);
        }
      } else {
        this.rewindCursor = -1;
        this.rewindFrames = [];
      }
      return;
    }
    let mx = 0, my = 0;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) mx -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) mx += 1;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) my -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) my += 1;
    if (this.stickMove.active) { mx = this.stickMove.dx * 1.35; my = this.stickMove.dy * 1.35; }
    const mag = hyp(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }

    const base = 408 * this.stats.speedMul * this.buffSpeed * (this.buffFly ? 1.3 : 1) * (this.danceT > 0 ? 1.3 : 1);

    /* ---------------- BOOST (sprint) ----------------
       Every class but Velocista gets an afterburner: drains a meter,
       then vents and refills. Holding it changes how the whole game feels. */
    /* Velocista trades the afterburner for BULLET TIME */
    const isVelo = this.cls.id === "velocista";
    const canBoost = !isVelo;
    const held = !!(this.keys["ShiftLeft"] || this.keys["ShiftRight"] || this.keys["KeyL"] || this.boostBtnHeld);
    if (isVelo) {
      const wants = held && this.slowMeter > 0.03;
      this.slowT = wants ? 0.1 : Math.max(0, this.slowT - dt);
      if (wants) {
        this.slowMeter = Math.max(0, this.slowMeter - dt / 2.6);
        if (this.slowMeter <= 0.001) this.slowT = 0;
      } else {
        this.slowMeter = Math.min(1, this.slowMeter + dt / 3.4);
      }
    } else {
      this.slowT = 0;
      this.slowMeter = Math.min(1, this.slowMeter + dt / 3.4);
    }
    this.slowFx += ((this.slowT > 0 ? 1 : 0) - this.slowFx) * Math.min(1, dt * 10);
    if (this.boostLock > 0) this.boostLock -= dt;
    this.boosting = false;
    if (canBoost) {
      const wants = canBoost && held && this.boost > 0.02 && this.boostLock <= 0 && mag > 0.08 && p.dashT <= 0;
      if (wants) {
        this.boosting = true;
        this.boost = Math.max(0, this.boost - dt / 1.85);
        // vent before it hits zero, so the meter can't flicker on/off
        if (this.boost <= 0.04) {
          this.boost = 0;
          this.boostLock = 0.9;
          this.burst(p.x, p.y, "#ffd23c", 16, 300, Math.atan2(-p.vy, -p.vx), 0.8);
          sfx.dash();
        }
      } else {
        this.boost = Math.min(1, this.boost + dt / 3.1);
      }
    } else {
      this.boost = 1;
    }
    this.boostFx += ((this.boosting ? 1 : 0) - this.boostFx) * Math.min(1, dt * 9);

    const speed = this.boosting
      ? base * 1.78
      : isVelo && this.slowT > 0
        ? base * 1.65
        : base;
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.inv = Math.max(p.inv, 0.05);
      const dashSpeed = (this.boosting ? speed : base) * 3.6;
      p.vx = Math.cos(p.dashAng) * dashSpeed;
      p.vy = Math.sin(p.dashAng) * dashSpeed;
      if (Math.random() < 0.9) {
        this.addParticle(p.x, p.y, rnd(-40, 40), rnd(-40, 40), 0.28, "#4ff0ff", 8, 0, 4);
      }
    } else {
      const targetVx = mx * speed, targetVy = my * speed;
      const acc = p.hp > 0 ? (this.boosting ? 5200 : 3900) : 0;
      p.vx += clamp(targetVx - p.vx, -acc * dt, acc * dt);
      p.vy += clamp(targetVy - p.vy, -acc * dt, acc * dt);
      const fr = Math.pow(0.0006, dt);
      if (mag < 0.05) { p.vx *= fr; p.vy *= fr; }
      if (this.boosting && Math.random() < dt * 42) {
        const ba = Math.atan2(-p.vy, -p.vx);
        this.addParticle(
          p.x + Math.cos(ba) * 12 + rnd(-6, 6), p.y + Math.sin(ba) * 12 + rnd(-6, 6),
          Math.cos(ba) * rnd(180, 460), Math.sin(ba) * rnd(180, 460),
          rnd(0.16, 0.34), Math.random() < 0.3 ? "#ffffff" : this.cls.color, rnd(2.4, 5), 1, 2,
        );
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, p.r + 12, this.worldW - p.r - 12);
    p.y = clamp(p.y, p.r + 12, this.worldH - p.r - 12);
    p.walkT += hyp(p.vx, p.vy) * dt * 0.05;
    if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.inv > 0) p.inv -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    p.recoil *= Math.pow(0.0025, dt);
    p.muzzle = Math.max(0, p.muzzle - dt * 6);
    p.safeT += dt;
    if (this.stats.hpRegen > 0 && p.safeT > 2.4 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + this.stats.hpRegen * dt);
    }

    // trail ghosting
    p.trail.push(p.x, p.y);
    if (p.trail.length > 24) p.trail.splice(0, 2);

    // aiming
    let ax = 0, ay = 0;
    if (this.stickAim.active && (Math.abs(this.stickAim.dx) > 0.1 || Math.abs(this.stickAim.dy) > 0.1)) {
      ax = this.stickAim.dx; ay = this.stickAim.dy;
      p.ang = this.applyAimAssist(Math.atan2(ay, ax), 0.62);
    } else if (!this.touchMode) {
      const raw = Math.atan2(this.wy(this.mouse.y) - p.y, this.wx(this.mouse.x) - p.x);
      p.ang = this.applyAimAssist(raw, 0.3);
    } else {
      p.ang = this.applyAimAssist(p.ang, 0.5);
    }
    this.aimAngle = p.ang;

    // firing (mobile: right stick aims & fires; idle thumb auto-engages nearest target)
    p.fireT -= dt;
    let wantFire = this.touchMode
      ? (this.stickAim.active && (Math.abs(this.stickAim.dx) > 0.2 || Math.abs(this.stickAim.dy) > 0.2)) || this.autoFire
      : (this.mouse.down || this.keys["KeyJ"]);
    if (this.touchMode && !this.stickAim.active && this.cls.id !== "robo") {
      const t = this.nearestTarget(760);
      if (t) {
        p.ang = Math.atan2(t.y - p.y, t.x - p.x);
        wantFire = true;
      }
    }
    if (wantFire && p.fireT <= 0 && p.hp > 0) this.fire();

    this.rewindFrames.push({ x: p.x, y: p.y, hp: p.hp, ang: p.ang });
    if (this.rewindFrames.length > 180) this.rewindFrames.shift();
  }

  private applyAimAssist(base: number, strength: number) {
    let best = Infinity, bestAng = base;
    const cos = Math.cos(base), sin = Math.sin(base);
    const px = this.player.x, py = this.player.y;
    const scan = (x: number, y: number, r: number) => {
      const dx = x - px, dy = y - py;
      const d = hyp(dx, dy);
      if (d < 1) return;
      const dot = (dx / d) * cos + (dy / d) * sin;
      if (dot < 0.55) return;
      const ang = Math.atan2(dy, dx);
      let diff = ang - base;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      const score = Math.abs(diff) + d / 2600 + (r > 30 ? -0.08 : 0);
      if (score < best) { best = score; bestAng = ang; }
    };
    for (const e of this.enemies) if (!e.dead && e.controlledT <= 0) scan(e.x, e.y, e.r);
    if (this.boss) scan(this.boss.x, this.boss.y, this.boss.r);
    return base + (bestAng - base) * strength;
  }

  /* ================= class abilities (auto-cast) ================= */

  /* ================= class passives ================= */

  private resetHeroBuffs() {
    this.buffT = 0; this.buffDmg = 1; this.buffSpeed = 1; this.buffRate = 1;
    this.buffArmor = 0; this.buffBeam = 1; this.buffFly = false;
    this.rageT = 0; this.rageDmg = 1; this.rageArmor = 0; this.rageRegen = 0; this.rageZoneDps = 0;
    this.shieldReduce = 0.3; this.markCrits = 0;
  }

  private updateHeroBuffs(dt: number) {
    if (this.buffT > 0) {
      this.buffT = Math.max(0, this.buffT - dt);
      if (this.buffT === 0) {
        this.buffDmg = 1; this.buffSpeed = 1; this.buffRate = 1;
        this.buffArmor = 0; this.buffBeam = 1; this.buffFly = false;
      }
    }
    if (this.rageT > 0) {
      this.rageT = Math.max(0, this.rageT - dt);
      const p = this.player;
      if (this.rageRegen > 0) p.hp = Math.min(p.maxHp, p.hp + this.rageRegen * dt);
      if (this.rageZoneDps > 0) {
        this.rageZoneTick = (this.rageZoneTick ?? 0) - dt;
        if (this.rageZoneTick <= 0) {
          this.rageZoneTick = 0.3;
          for (const e of this.enemies) {
            if (!e.dead && dist2(e.x, e.y, p.x, p.y) < 190 * 190) this.damageEnemy(e, this.rageZoneDps * 0.3, true, p.x, p.y);
          }
        }
      }
      if (this.rageT === 0) { this.rageDmg = 1; this.rageArmor = 0; this.rageRegen = 0; this.rageZoneDps = 0; }
    }
  }

  private updatePassives(dt: number) {
    const c = this.cls;
    const p = this.player;
    this.updateHeroBuffs(dt);
    for (let i = 0; i < this.specT.length; i++) {
      if (this.specT[i] > 0) {
        this.specT[i] = Math.max(0, this.specT[i] - dt);
        if (this.specT[i] === 0 && c.specials[i]) this.toast(`${c.specials[i].key} · ${c.specials[i].short} PRONTO`, c.specials[i].color);
      }
    }

    if (this.invisT > 0) this.invisT = Math.max(0, this.invisT - dt);
    if (this.flightT > 0) this.flightT = Math.max(0, this.flightT - dt);
    if (this.titanT > 0) this.titanT = Math.max(0, this.titanT - dt);
    if (this.parryT > 0) this.parryT = Math.max(0, this.parryT - dt);
    if (this.shieldT > 0) this.shieldT = Math.max(0, this.shieldT - dt);
    if (this.decoyT > 0) this.decoyT = Math.max(0, this.decoyT - dt);

    // SAMURAI — Dança das Mil Lâminas (spawns sword arcs while active)
    if (this.danceT > 0) {
      this.danceT -= dt;
      p.inv = Math.max(p.inv, 0.05);
      this.danceFx -= dt;
      if (this.danceFx <= 0) {
        this.danceFx = 0.07;
        const def = weaponById(c.weapon);
        const a = p.ang + Math.sin(this.time * 9) * 0.7;
        this.spawnPBullet(p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 22, Math.cos(a) * 1500, Math.sin(a) * 1500, 30 * this.stats.dmgMul, 99, 0.11, 12, def, false);
      }
    }

    if (this.abilityOn > 0) this.abilityOn = Math.max(0, this.abilityOn - dt);
    if (this.bladeT > 0) {
      this.bladeT -= dt;
      p.inv = Math.max(p.inv, 0.05);
      this.bladeSpin += dt * 22;
      if (Math.random() < dt * 30) {
        const a = Math.random() * TAU;
        this.spawnPBullet(p.x, p.y, Math.cos(a) * 720, Math.sin(a) * 720, 22 * this.stats.dmgMul, 1, 0.42, 4, WEAPONS[1], false);
      }
    }
    this.updateDrones(dt);
    this.updateMeteors(dt);
    this.updateClassGadgets(dt);
    this.updateExpansionPowers(dt);
  }

  private updateClassGadgets(dt: number) {
    const p = this.player;
    if (this.decoyT > 0) this.decoyT = Math.max(0, this.decoyT - dt);

    // poças ácidas (cuspidor): dano contínuo se pisar, ignoradas em voo
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      if (h.life <= 0) { this.hazards.splice(i, 1); continue; }
      if (h.owner === "player") {
        h.tick = (h.tick ?? 0) - dt;
        if (h.tick <= 0) {
          h.tick = 0.5;
          const rr = h.r * h.r;
          for (const e of this.enemies) if (!e.dead && dist2(e.x, e.y, h.x, h.y) < rr) this.damageEnemy(e, h.dps * 0.5, true, h.x, h.y);
        }
      } else if (this.flightT <= 0 && this.invisT <= 0 && dist2(p.x, p.y, h.x, h.y) < (h.r + p.r * 0.5) ** 2) {
        this.acidT -= dt;
        if (this.acidT <= 0) { this.acidT = 0.45; p.inv = 0; this.hurtPlayer(h.dps * 0.45 + 2, h.x, h.y); }
      }
    }

    // Two linked gates. Entering either one exits from the other.
    if (this.portal) {
      const g = this.portal;
      g.life -= dt;
      g.cooldown = Math.max(0, g.cooldown - dt);
      if (g.life <= 0) this.portal = null;
      else if (g.cooldown <= 0) {
        const da = hyp(p.x - g.ax, p.y - g.ay);
        const db = hyp(p.x - g.bx, p.y - g.by);
        if (Math.min(da, db) < 34) {
          const fromA = da < db;
          p.x = fromA ? g.bx : g.ax;
          p.y = fromA ? g.by : g.ay;
          p.inv = Math.max(p.inv, 0.55);
          g.cooldown = 1;
          this.updateCamera(1);
          this.ripples.push({ x: p.x, y: p.y, r: 10, maxR: 100, life: 0.35, max: 0.35, color: fromA ? "#7de6ff" : this.cls.color, w: 4 });
          sfx.ui();
        }
      }
    }

    for (let i = this.nukes.length - 1; i >= 0; i--) {
      const n = this.nukes[i];
      n.t -= dt;
      if (n.t > 0) continue;
      this.nukes.splice(i, 1);
      this.explodeAt(n.x, n.y, n.r, n.dmg, "#ffb020", false);
      this.flashScreen("#fff2c2", 0.32);
      this.shake = Math.max(this.shake, 18);
      this.hitStop = Math.max(this.hitStop, 0.07);
      this.setBanner("DETONAÇÃO ATÔMICA", "ZONA DE IMPACTO LIMPA", "#ffb020", 1.3);
      sfx.explode();
    }

    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.t -= dt;
      g.vy += 620 * dt;
      g.x += g.vx * dt; g.y += g.vy * dt; g.spin += dt * 12;
      g.x = clamp(g.x, 18, this.worldW - 18); g.y = clamp(g.y, 18, this.worldH - 18);
      if (g.t > 0) continue;
      this.grenades.splice(i, 1);
      this.explodeAt(g.x, g.y, g.r, g.dmg, "#ffb020", false);
    }

    for (let i = this.turrets.length - 1; i >= 0; i--) {
      const t = this.turrets[i];
      t.t -= dt; t.cd -= dt;
      if (t.t <= 0) { this.turrets.splice(i, 1); continue; }
      const target = this.nearestTargetFrom(t.x, t.y, 680);
      if (!target) continue;
      t.ang = Math.atan2(target.y - t.y, target.x - t.x);
      if (t.cd <= 0) {
        t.cd = 0.42;
        this.spawnPBullet(t.x, t.y, Math.cos(t.ang) * 1400, Math.sin(t.ang) * 1400, 18 * this.stats.dmgMul, 0, 0.8, 4, weaponById("pulse"), false);
      }
    }

    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      m.t -= dt;
      let triggered = m.t <= 0;
      if (!triggered) {
        for (const e of this.enemies) {
          if (!e.dead && hyp(e.x - m.x, e.y - m.y) < 42 + e.r) { triggered = true; break; }
        }
      }
      if (!triggered) continue;
      this.mines.splice(i, 1);
      this.explodeAt(m.x, m.y, m.r, m.dmg, m.color, false);
    }
  }

  /* ================= HeroWave power executor (data-driven) ================= */

  private runPower(sp: SpecialDef) {
    const p = this.player;
    const prm = sp.params ?? {};
    const num = (k: string, d = 0) => (typeof prm[k] === "number" ? (prm[k] as number) : d);
    const str = (k: string, d = "") => (typeof prm[k] === "string" ? String(prm[k]) : d);
    const col = sp.color;
    const mul = this.powerMul();
    const aim = this.aimedPoint(num("aimRange", 600));

    switch (sp.fx) {
      /* --- radial / conal shockwave --- */
      case "nova": {
        const cone = num("cone", 0);
        this.forcePulse(num("radius", 300), cone > 0 ? cone : Math.PI, num("dmg", 120) * mul, num("push", 800), num("stun", 1));
        if (num("clear", 0) === 1 || prm.clear === true) {
          const r = num("radius", 300);
          for (const b of this.eBullets) if (b.on && dist2(b.x, b.y, p.x, p.y) < r * r) b.on = false;
        }
        this.burst(p.x, p.y, col, 16, 380);
        break;
      }
      /* --- bullet fan / radial spray --- */
      case "salvo": {
        const n = num("n", 8), rows = num("rows", 1);
        const dmg = num("dmg", 30) * mul;
        const radial = prm.radial === true;
        for (let row = 0; row < rows; row++) {
          for (let i = 0; i < n; i++) {
            const a = radial
              ? (i / n) * TAU + row * 0.2
              : p.ang + (i / Math.max(1, n - 1) - 0.5) * num("spread", 0.2) * 2 + (row ? 0.05 : 0);
            this.spawnPBullet(p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20,
              Math.cos(a) * num("speed", 1800), Math.sin(a) * num("speed", 1800),
              dmg, num("pierce", 1), num("life", 1), num("bulletR", 5), this.classWeapons[0], false);
          }
        }
        this.shake = Math.max(this.shake, 4);
        break;
      }
      /* --- precision shots at the nearest targets --- */
      case "targeted": {
        const list = this.enemies.filter((e) => !e.dead && e.controlledT <= 0)
          .sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))
          .slice(0, num("count", 4));
        for (const e of list) {
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          this.spawnPBullet(p.x, p.y, Math.cos(a) * num("speed", 2200), Math.sin(a) * num("speed", 2200),
            num("dmg", 60) * mul, num("pierce", 1), 1.2, 5, this.classWeapons[0], true);
        }
        break;
      }
      /* --- delayed marked explosion(s) --- */
      case "blast": {
        const count = num("count", 1), radius = num("radius", 180);
        const dmg = num("dmg", 170) * mul;
        for (let i = 0; i < count; i++) {
          const t = this.enemies.filter((e) => !e.dead);
          let x = aim.x, y = aim.y;
          if (count > 1) {
            const e = t[i % Math.max(1, t.length)];
            if (e) { x = e.x; y = e.y; } else { const a = (i / count) * TAU; x = p.x + Math.cos(a) * 260; y = p.y + Math.sin(a) * 260; }
          }
          this.nukes.push({ x, y, t: num("delay", 1) + i * num("stagger", 0.3), r: radius, dmg, color: col });
        }
        this.setBanner(sp.short, "ALVO MARCADO", col, 1);
        sfx.bossWarn();
        break;
      }
      /* --- lingering zone (fire / dark / smoke / snow / psi) --- */
      case "zone": {
        const kind = str("kind", "fire") as "fire" | "dark" | "smoke" | "snow" | "psi";
        this.classFields.push({ kind, x: aim.x, y: aim.y, r: num("radius", 220), life: num("life", 5), max: num("life", 5), tick: 0, damage: num("dps", 40) * mul });
        this.ripples.push({ x: aim.x, y: aim.y, r: 12, maxR: num("radius", 220), life: 0.4, max: 0.4, color: col, w: 5 });
        break;
      }
      /* --- self buffs (speed, damage, fire rate, flight, shield, ammo) --- */
      case "buff": {
        this.buffT = num("dur", 5);
        this.buffDmg = num("dmg", 1);
        this.buffSpeed = num("speed", 1);
        this.buffRate = num("rate", 1);
        this.buffBeam = num("beam", 1);
        this.buffFly = prm.fly === true;
        if (this.buffFly) this.flightT = Math.max(this.flightT, this.buffT);
        if (prm.shield === true || typeof prm.shield === "number") this.shieldT = Math.max(this.shieldT, num("shield", 2));
        if (num("heal", 0) > 0) p.hp = Math.min(p.maxHp, p.hp + num("heal"));
        if (num("mark", 0) > 0) {
          this.markCrits = num("mark", 3);
          for (const e of this.enemies) if (!e.dead) e.markT = num("markDur", 6);
        }
        if (prm.ammo === true) for (let i = 0; i < this.classWeapons.length; i++) this.ammo[i] = this.classWeapons[i].ammoClip;
        this.burst(p.x, p.y, col, 14, 260);
        break;
      }
      /* --- heal / shield / drain --- */
      case "heal": {
        if (num("drain", 0) > 0) {
          let dealt = 0;
          const r = num("drain", 320);
          for (const e of this.enemies) {
            if (e.dead || e.controlledT > 0 || dist2(e.x, e.y, p.x, p.y) > r * r) continue;
            const d = num("dmg", 90) * mul;
            this.damageEnemy(e, d, true, p.x, p.y);
            dealt += d;
          }
          p.hp = Math.min(p.maxHp, p.hp + dealt * num("healPer", 0.35));
          this.ripples.push({ x: p.x, y: p.y, r: 14, maxR: r, life: 0.5, max: 0.5, color: col, w: 6 });
        } else {
          if (num("heal", 0) > 0) p.hp = Math.min(p.maxHp, p.hp + num("heal"));
          if (num("inv", 0) > 0) p.inv = Math.max(p.inv, num("inv"));
        }
        if (num("shield", 0) > 0) { this.shieldT = Math.max(this.shieldT, num("shield")); this.shieldReduce = num("reduce", 0.3); }
        if (num("armor", 0) > 0) this.buffArmor = Math.max(this.buffArmor, num("armor"));
        if (num("reflect", 0) > 0) this.parryT = Math.max(this.parryT, num("reflect"));
        this.burst(p.x, p.y, col, 16, 240);
        sfx.pickup();
        break;
      }
      /* --- teleport toward the aim point --- */
      case "blink": {
        const ox = p.x, oy = p.y;
        const d = num("dist", 560);
        const dx = aim.x - p.x, dy = aim.y - p.y, len = Math.hypot(dx, dy) || 1;
        const step = Math.min(d, len);
        p.x = clamp(p.x + dx / len * step, p.r + 16, this.worldW - p.r - 16);
        p.y = clamp(p.y + dy / len * step, p.r + 16, this.worldH - p.r - 16);
        p.inv = Math.max(p.inv, num("inv", 0.6));
        if (num("invis", 0) > 0) this.invisT = Math.max(this.invisT, num("invis"));
        if (num("dmg", 0) > 0) {
          const r = num("radius", 150);
          for (const e of this.enemies) if (!e.dead && dist2(e.x, e.y, p.x, p.y) < r * r) this.damageEnemy(e, num("dmg") * mul, true, ox, oy);
        }
        this.ripples.push({ x: ox, y: oy, r: 10, maxR: 90, life: 0.3, max: 0.3, color: col, w: 4 });
        this.ripples.push({ x: p.x, y: p.y, r: 10, maxR: 130, life: 0.4, max: 0.4, color: col, w: 5 });
        this.burst(p.x, p.y, col, 12, 220);
        this.updateCamera(1);
        sfx.dash();
        break;
      }
      /* --- summons: orbiting units or a fixed emplacement --- */
      case "summon": {
        const n = num("count", 2), dur = num("dur", 12), dmg = num("dmg", 24);
        for (let i = 0; i < n; i++) {
          if (prm.static === true) {
            this.turrets.push({ x: aim.x, y: aim.y, t: dur, cd: 0, ang: 0 });
          } else {
            this.drones.push({ a: (i / n) * TAU, d: 82, t: dur, cd: 0, x: p.x, y: p.y, ang: 0, color: str("color", col), dmg });
          }
        }
        this.ripples.push({ x: p.x, y: p.y, r: 12, maxR: 150, life: 0.45, max: 0.45, color: col, w: 4 });
        break;
      }
      /* --- freeze: stun + chill in an area --- */
      case "freeze": {
        const r = num("radius", 300);
        for (const e of this.enemies) {
          if (e.dead || e.controlledT > 0 || dist2(e.x, e.y, p.x, p.y) > r * r) continue;
          e.stunT = Math.max(e.stunT, num("dur", 2.5));
          e.chillT = Math.max(e.chillT, num("dur", 2.5) + 1);
          if (num("dmg", 0) > 0) this.damageEnemy(e, num("dmg") * mul, true, p.x, p.y);
        }
        if (prm.clear === true) for (const b of this.eBullets) if (b.on && dist2(b.x, b.y, p.x, p.y) < r * r) b.on = false;
        this.ripples.push({ x: p.x, y: p.y, r: 18, maxR: r, life: 0.6, max: 0.6, color: col, w: 6 });
        break;
      }
      /* --- executions --- */
      case "execute": {
        const r = num("radius", 280);
        const targets = this.enemies.filter((e) => !e.dead && e.spawnT <= 0 && !e.elite && dist2(e.x, e.y, p.x, p.y) < r * r)
          .sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.x, p.x, p.y))
          .slice(0, num("count", 4));
        for (const e of targets) {
          this.burst(e.x, e.y, col, 8, 260);
          this.damageEnemy(e, e.hp + 120, true, p.x, p.y);
        }
        if (num("heal", 0) > 0) p.hp = Math.min(p.maxHp, p.hp + num("heal"));
        if (prm.ammo === true) for (let i = 0; i < this.classWeapons.length; i++) this.ammo[i] = this.classWeapons[i].ammoClip;
        this.shake = Math.max(this.shake, 6);
        break;
      }
      /* --- reflect incoming fire --- */
      case "reflect": {
        const r = num("radius", 340);
        let count = 0;
        for (const b of this.eBullets) {
          if (!b.on || b.kind === "ring" || dist2(b.x, b.y, p.x, p.y) > r * r) continue;
          const t = this.nearestTargetFrom(b.x, b.y, 900);
          const a = t ? Math.atan2(t.y - b.y, t.x - b.x) : Math.atan2(-b.vy, -b.vx);
          this.spawnPBullet(b.x, b.y, Math.cos(a) * 1300, Math.sin(a) * 1300, num("dmg", 50) * mul, 1, 1, 5, this.classWeapons[0], true);
          b.on = false; count++;
        }
        if (num("parry", 0) > 0) this.parryT = Math.max(this.parryT, num("parry"));
        this.addFloater(p.x, p.y - 34, `${count} REFLETIDOS`, col, 15);
        break;
      }
      /* --- time stop / rewind --- */
      case "timestop": {
        this.timeStopT = num("dur", 2.5);
        p.inv = Math.max(p.inv, this.timeStopT);
        this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: 520, life: 0.6, max: 0.6, color: col, w: 4 });
        break;
      }
      case "rewind": {
        const count = Math.min(138, this.rewindFrames.length);
        if (count > 12) {
          this.rewindFrames = this.rewindFrames.slice(-count);
          this.rewindCursor = this.rewindFrames.length - 1;
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 25);
          this.addFloater(p.x, p.y - 30, "+25 HP", col, 15);
        }
        break;
      }
      /* --- dashing strike --- */
      case "charge": {
        const ox = p.x, oy = p.y;
        const d = num("dist", 420);
        const dx = aim.x - p.x, dy = aim.y - p.y, len = Math.hypot(dx, dy) || 1;
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const x = ox + dx / len * Math.min(d, len) * t;
          const y = oy + dy / len * Math.min(d, len) * t;
          if (str("trail", "") === "snow") {
            this.classFields.push({ kind: "snow", x, y, r: 70, life: 2.2, max: 2.2, tick: 0, damage: 18 * mul });
          }
          for (const e of this.enemies) {
            if (e.dead || e.controlledT > 0 || dist2(e.x, e.y, x, y) > num("radius", 130) ** 2) continue;
            this.damageEnemy(e, num("dmg", 180) * mul / steps * 2.2, true, x, y);
            if (!e.dead && num("stun", 0) > 0) e.stunT = Math.max(e.stunT, num("stun"));
          }
        }
        p.x = clamp(ox + dx / len * Math.min(d, len), p.r + 16, this.worldW - p.r - 16);
        p.y = clamp(oy + dy / len * Math.min(d, len), p.r + 16, this.worldH - p.r - 16);
        p.inv = Math.max(p.inv, 0.5);
        if (prm.quake === true) {
          this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: num("radius", 200) * 1.4, life: 0.55, max: 0.55, color: col, w: 10 });
          this.decals.push({ x: p.x, y: p.y, r: num("radius", 200) * 0.6, life: 3.2, max: 3.2, color: col, rot: Math.random() * TAU, kind: 1 });
          this.shake = Math.max(this.shake, 14);
          this.hitStop = Math.max(this.hitStop, 0.06);
          sfx.explode();
        } else {
          this.shake = Math.max(this.shake, 7);
          sfx.shot("rail");
        }
        if (prm.dash === true) p.dashCd = 0;
        this.updateCamera(1);
        break;
      }
      /* --- vortex: pull + damage over time --- */
      case "vortex": {
        if (prm.once === true) {
          const r = num("radius", 340);
          for (const e of this.enemies) {
            if (e.dead || e.controlledT > 0) continue;
            const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
            if (d > r) continue;
            const pull = Math.min(d - 60, num("pull", 700) * 0.35);
            e.x = clamp(e.x + dx / Math.max(1, d) * pull, 24, this.worldW - 24);
            e.y = clamp(e.y + dy / Math.max(1, d) * pull, 24, this.worldH - 24);
            e.stunT = Math.max(e.stunT, 0.6);
            this.damageEnemy(e, num("dps", 60) * mul, true, e.x, e.y);
          }
          this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: r, life: 0.4, max: 0.4, color: col, w: 6 });
          sfx.explode();
        } else {
          this.classFields.push({ kind: "psi", x: aim.x, y: aim.y, r: num("radius", 240), life: num("life", 3), max: num("life", 3), tick: 0, damage: num("dps", 45) * mul });
        }
        break;
      }
      /* --- chain lightning from the player --- */
      case "chain": {
        const waves = num("waves", 2), jumps = num("jumps", 4);
        const hit = new Set<number>();
        for (let w = 0; w < waves; w++) {
          let src = this.enemies.filter((e) => !e.dead && !hit.has(e.id) && e.controlledT <= 0)
            .sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))[0];
          if (!src) break;
          let cx = p.x, cy = p.y;
          for (let j = 0; j < jumps; j++) {
            if (!src) break;
            this.zap(cx, cy, src.x, src.y, col);
            this.damageEnemy(src, num("dmg", 60) * mul * (1 - j * 0.12), true, cx, cy);
            hit.add(src.id);
            cx = src.x; cy = src.y;
            const from = src;
            src = this.enemies.filter((e) => !e.dead && !hit.has(e.id) && dist2(e.x, e.y, from.x, from.y) < num("range", 380) ** 2)
              .sort((a, b) => dist2(a.x, a.y, from.x, from.y) - dist2(b.x, b.y, from.x, from.y))[0];
          }
        }
        sfx.shot("tesla");
        break;
      }
      /* --- sweeping beams --- */
      case "beam": {
        const n = num("count", 1), spread = num("spread", 0);
        for (let i = 0; i < n; i++) {
          const a = p.ang + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0);
          this.beams.push({ x: p.x, y: p.y, ang: a, len: num("len", 1400), w: num("width", 30),
            tele: 0.4, fire: num("dur", 1.2), color: col, dmg: num("dmg", 22) * mul, fromBoss: false, spin: 0 });
        }
        sfx.shot("rail");
        break;
      }
      /* --- rage: long buff + optional burning aura --- */
      case "rage": {
        this.rageT = num("dur", 7);
        this.rageDmg = num("dmg", 1.6);
        this.rageArmor = num("armor", 2);
        this.rageRegen = num("regen", 0);
        this.rageZoneDps = num("dps", 0) * mul;
        if (num("heal", 0) > 0) p.hp = Math.min(p.maxHp, p.hp + num("heal"));
        if (str("zone", "") === "fire") {
          this.classFields.push({ kind: "fire", x: p.x, y: p.y, r: 190, life: num("dur", 7), max: num("dur", 7), tick: 0, damage: this.rageZoneDps });
        }
        this.flashScreen(col, 0.2);
        this.shake = Math.max(this.shake, 9);
        this.burst(p.x, p.y, col, 20, 320);
        sfx.levelUp();
        break;
      }
      /* --- decoy that draws aggro --- */
      case "decoy": {
        this.decoyX = aim.x; this.decoyY = aim.y; this.decoyT = num("dur", 6);
        if (num("stun", 0) > 0) {
          for (const e of this.enemies) if (!e.dead && dist2(e.x, e.y, aim.x, aim.y) < 320 * 320) e.stunT = Math.max(e.stunT, num("stun"));
        }
        this.ripples.push({ x: aim.x, y: aim.y, r: 12, maxR: 110, life: 0.4, max: 0.4, color: col, w: 4 });
        break;
      }
      /* --- mind control --- */
      case "charm": {
        const r = num("radius", 240);
        const target = this.enemies.filter((e) => !e.dead && !e.elite && e.spawnT <= 0 && e.controlledT <= 0 && dist2(e.x, e.y, aim.x, aim.y) < r * r)
          .sort((a, b) => dist2(a.x, a.y, aim.x, aim.y) - dist2(b.x, b.y, aim.x, aim.y))[0];
        if (!target) { this.specT[this.cls.specials.findIndex((x) => x.name === sp.name)] = 0; this.toast("Nenhum alvo dominável", col); return; }
        for (const e of this.enemies) if (e.controlledT > 0) e.controlledT = 0;
        target.controlledT = num("dur", 8); target.controlFireT = 0; target.stunT = 0; target.tele = 0;
        this.ripples.push({ x: target.x, y: target.y, r: 10, maxR: 90, life: 0.4, max: 0.4, color: col, w: 4 });
        break;
      }
      /* --- orbiting blades --- */
      case "orbit": {
        this.bladeT = num("dur", 1.4);
        this.bladeSpin = 0;
        p.inv = Math.max(p.inv, this.bladeT + 0.1);
        break;
      }
      default: break;
    }
  }

  /* ================= special abilities (manual) ================= */

  castSpecial(slot: number) {
    if ((this.status !== "playing" && !this.demoActive) || slot < 0 || slot >= this.cls.specials.length) return;
    const c = this.cls;
    if (this.specT[slot] > 0) return;
    const p = this.player;
    const id = c.specials[slot].name;
    this.specT[slot] = c.specials[slot].cd;
    this.specFlash[slot] = 0.5;
    if (c.specials[slot].fx) {
      this.runPower(c.specials[slot]);
      this.publish(true);
      return;
    }
    if (this.castExpansionSpecial(slot)) {
      this.publish(true);
      return;
    }

    switch (id) {
      /* ---------- MAGO ---------- */
      case "NOVA ARCANA": {
        this.novaR = 20;
        this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: 330, life: 0.55, max: 0.55, color: c.color, w: 9 });
        this.shake = Math.max(this.shake, 10);
        this.flashScreen(c.color, 0.2);
        sfx.explode();
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = hyp(e.x - p.x, e.y - p.y);
          if (d < 330) {
            this.damageEnemy(e, 74 * this.stats.dmgMul, true, p.x, p.y);
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            e.vx += Math.cos(a) * 620; e.vy += Math.sin(a) * 620;
          }
        }
        if (this.boss && !this.boss.dead && hyp(this.boss.x - p.x, this.boss.y - p.y) < 380) {
          this.damageBoss(this.boss, 90 * this.stats.dmgMul);
        }
        for (const eb of this.eBullets) {
          if (!eb.on) continue;
          if (hyp(eb.x - p.x, eb.y - p.y) < 300) { this.burst(eb.x, eb.y, eb.color, 4, 130); eb.on = false; }
        }
        this.burst(p.x, p.y, c.color, 34, 520);
        this.setBanner("NOVA ARCANA", "PROJÉTEIS INIMIGOS APAGADOS", c.color, 1.2);
        break;
      }
      case "METEORO": {
        const picked = this.rankTargets(3, 900);
        if (!picked.length) for (let i = 0; i < 3; i++) picked.push({ x: p.x + rnd(-260, 260), y: p.y + rnd(-260, 260) });
        for (let i = 0; i < picked.length; i++) {
          this.meteors.push({ x: picked[i].x, y: picked[i].y, t: 0.55 + i * 0.16, r: 96, dmg: 130 * this.stats.dmgMul });
        }
        this.setBanner("METEORO", "IMPACTO IMINENTE", "#ff8400", 1.1);
        sfx.bossWarn();
        break;
      }
      case "MANTO DO VAZIO": {
        this.invisT = 4;
        p.inv = Math.max(p.inv, 4);
        this.burst(p.x, p.y, "#d7c5ff", 14, 230);
        this.setBanner("MANTO DO VAZIO", "INVISIBILIDADE · 4s", c.color, 1);
        sfx.ui();
        break;
      }
      case "PORTAIS ARCANOS": {
        const ax = p.x, ay = p.y;
        let bx = this.wx(this.mouse.x), by = this.wy(this.mouse.y);
        if (this.touchMode) {
          bx = p.x + Math.cos(p.ang) * 430;
          by = p.y + Math.sin(p.ang) * 430;
        }
        const dx = bx - ax, dy = by - ay;
        const dist = hyp(dx, dy);
        if (dist < 180) { bx = ax + Math.cos(p.ang) * 340; by = ay + Math.sin(p.ang) * 340; }
        const scale = Math.min(1, 850 / Math.max(1, hyp(bx - ax, by - ay)));
        bx = ax + (bx - ax) * scale; by = ay + (by - ay) * scale;
        this.portal = { ax, ay, bx: clamp(bx, 50, this.worldW - 50), by: clamp(by, 50, this.worldH - 50), life: 9, cooldown: 0 };
        this.ripples.push({ x: ax, y: ay, r: 12, maxR: 90, life: 0.35, max: 0.35, color: c.color, w: 4 });
        this.ripples.push({ x: this.portal.bx, y: this.portal.by, r: 12, maxR: 90, life: 0.35, max: 0.35, color: "#7de6ff", w: 4 });
        this.setBanner("PORTAIS ARCANOS", "ATRAVESSE UM PARA SAIR NO OUTRO", c.color, 1.2);
        sfx.levelUp();
        break;
      }

      /* ---------- ATIRADOR ---------- */
      case "TIRO PERFEITO": {
        this.perfectShot = 1;
        this.abilityOn = 4;
        this.addFloater(p.x, p.y - 40, "PERFEITO PRONTO", c.color, 18);
        this.flashScreen(c.color, 0.14);
        sfx.levelUp();
        break;
      }
      case "SALVA CRISTAL": {
        const n = 14;
        for (let i = 0; i < n; i++) {
          const a = p.ang + (i / (n - 1) - 0.5) * 1.5;
          this.spawnPBullet(
            p.x + Math.cos(p.ang) * 20, p.y + Math.sin(p.ang) * 20,
            Math.cos(a) * 1500, Math.sin(a) * 1500,
            34 * this.stats.dmgMul, 4, 0.9, 5, WEAPONS[3], true,
          );
        }
        this.shake = Math.max(this.shake, 11);
        this.hitStop = Math.max(this.hitStop, 0.05);
        this.flashScreen("#ffffff", 0.18);
        this.burst(p.x + Math.cos(p.ang) * 26, p.y + Math.sin(p.ang) * 26, "#b7ff3c", 22, 460, p.ang, 0.6);
        sfx.shot("rail");
        this.setBanner("SALVA CRISTAL", "14 PROJÉTEIS PERFURANTES", "#b7ff3c", 1.1);
        break;
      }
      case "BOMBA ATÔMICA": {
        const x = this.wx(this.mouse.x), y = this.wy(this.mouse.y);
        const tx = this.touchMode ? p.x + Math.cos(p.ang) * 420 : x;
        const ty = this.touchMode ? p.y + Math.sin(p.ang) * 420 : y;
        this.nukes.push({ x: clamp(tx, 60, this.worldW - 60), y: clamp(ty, 60, this.worldH - 60), t: 2.2, r: 440, dmg: 1650 * this.stats.dmgMul });
        this.setBanner("BOMBA ATÔMICA", "IMPACTO EM 2 SEGUNDOS · AFASTE-SE", c.color, 1.4);
        sfx.bossWarn();
        break;
      }
      case "RICOCHETE": {
        const def = weaponById(c.weapon);
        for (let i = 0; i < 6; i++) {
          const a = p.ang + (i - 2.5) * 0.12;
          this.spawnPBullet(p.x, p.y, Math.cos(a) * 2200, Math.sin(a) * 2200, 48 * this.stats.dmgMul, 3, 1.2, 5, def, true);
        }
        this.shake = Math.max(this.shake, 7);
        this.setBanner("RICOCHETE", "6 TIROS PERFURANTES", c.color, 1);
        sfx.shot("rail");
        break;
      }

      /* ---------- VELOCISTA ---------- */
      case "CORTE FANTASMA": {
        p.dashT = 0.22;
        p.dashCd = 0;
        p.inv = 0.5;
        p.dashAng = p.ang;
        const dmg = (c.stats.dashDamage ?? 40) * this.stats.dmgMul * 1.6;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = hyp(e.x - p.x, e.y - p.y);
          if (d > 200) continue;
          let diff = Math.atan2(e.y - p.y, e.x - p.x) - p.ang;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          if (Math.abs(diff) < 1.2) {
            this.damageEnemy(e, dmg, true, p.x, p.y);
            e.vx += Math.cos(p.ang) * 420; e.vy += Math.sin(p.ang) * 420;
          }
        }
        for (let i = 0; i < 12; i++) {
          const t = i / 12;
          this.addParticle(p.x + Math.cos(p.ang) * 200 * t, p.y + Math.sin(p.ang) * 200 * t, rnd(-70, 70), rnd(-70, 70), 0.4, i % 3 ? c.color : "#ffffff", 6, 1, 2);
        }
        this.ripples.push({ x: p.x, y: p.y, r: 14, maxR: 210, life: 0.36, max: 0.36, color: c.color, w: 6 });
        this.shake = Math.max(this.shake, 7);
        sfx.shot("rail");
        break;
      }
      case "TEMPESTADE DE LÂMINAS": {
        this.bladeT = 1.4;
        this.bladeSpin = 0;
        p.inv = 1.5;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU;
          this.spawnPBullet(p.x, p.y, Math.cos(a) * 820, Math.sin(a) * 820, 30 * this.stats.dmgMul, 2, 0.6, 4.4, WEAPONS[1], i % 4 === 0);
        }
        this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: 300, life: 0.6, max: 0.6, color: c.color, w: 8 });
        this.shake = Math.max(this.shake, 9);
        this.flashScreen(c.color, 0.16);
        sfx.levelUp();
        this.setBanner("TEMPESTADE DE LÂMINAS", "INVULNERÁVEL", c.color, 1.2);
        break;
      }
      case "PARAR O TEMPO": {
        this.timeStopT = 2.5;
        p.inv = Math.max(p.inv, 2.5);
        this.slowMeter = Math.max(0, this.slowMeter - 0.35);
        this.flashScreen("#d8ff8a", 0.12);
        this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: 520, life: 0.6, max: 0.6, color: c.color, w: 4 });
        this.setBanner("TEMPO ZERO", "MUNDO CONGELADO · 2.5s", c.color, 1.2);
        sfx.levelUp();
        break;
      }
      case "REBOBINAR": {
        const count = Math.min(138, this.rewindFrames.length);
        if (count > 12) {
          this.rewindCursor = this.rewindFrames.length - 1;
          this.rewindFrames = this.rewindFrames.slice(-count);
          this.rewindCursor = this.rewindFrames.length - 1;
          this.parryT = 0;
          this.setBanner("REBOBINAR", "VOLTANDO 2.3 SEGUNDOS", c.color, 1.1);
          sfx.shot("rail");
        } else {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 22);
          this.addFloater(p.x, p.y - 30, "REBOBINAR · +22 HP", c.color, 15);
          sfx.pickup();
        }
        break;
      }

      /* ---------- SUPER-FORÇA ---------- */
      case "IMPACTO SÍSMICO": {
        const rad = 260;
        this.ripples.push({ x: p.x, y: p.y, r: 22, maxR: rad * 1.4, life: 0.55, max: 0.55, color: c.color, w: 12 });
        this.decals.push({ x: p.x, y: p.y, r: rad * 0.55, life: 5, max: 5, color: c.color, rot: Math.random() * TAU, kind: 1 });
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = hyp(e.x - p.x, e.y - p.y);
          if (d < rad + e.r) {
            this.damageEnemy(e, (c.stats.dashDamage ?? 60) * 1.7 * this.stats.dmgMul * (1 - (d / (rad + e.r)) * 0.4), true, p.x, p.y);
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            e.vx += Math.cos(a) * 780; e.vy += Math.sin(a) * 780;
          }
        }
        if (this.boss && !this.boss.dead && hyp(this.boss.x - p.x, this.boss.y - p.y) < rad + this.boss.r) {
          this.damageBoss(this.boss, 120 * this.stats.dmgMul);
        }
        for (const eb of this.eBullets) {
          if (eb.on && eb.kind !== "ring" && hyp(eb.x - p.x, eb.y - p.y) < rad) { this.burst(eb.x, eb.y, eb.color, 3, 110); eb.on = false; }
        }
        this.burst(p.x, p.y, c.color, 34, 520);
        this.shake = Math.max(this.shake, 17);
        this.hitStop = Math.max(this.hitStop, 0.06);
        sfx.explode();
        this.setBanner("IMPACTO SÍSMICO", "ONDA DE CHOQUE", c.color, 1.1);
        break;
      }
      case "RAIO DE FORÇA": {
        this.ripples.push({ x: p.x, y: p.y, r: 30, maxR: 1400, life: 0.7, max: 0.7, color: "#ff3ce0", w: 7 });
        this.flashScreen("#ff3ce0", 0.22);
        sfx.explode();
        for (const e of this.enemies) {
          if (e.dead) continue;
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          const d = hyp(e.x - p.x, e.y - p.y);
          e.vx = Math.cos(a) * 1500; e.vy = Math.sin(a) * 1500;
          this.damageEnemy(e, 58 * this.stats.dmgMul, true, e.x - Math.cos(a) * 40, e.y - Math.sin(a) * 40);
          void d;
        }
        for (const eb of this.eBullets) {
          if (!eb.on || eb.kind === "ring") continue;
          eb.vx = Math.cos(Math.atan2(p.y - eb.y, p.x - eb.x)) * 200;
          eb.vy = Math.sin(Math.atan2(p.y - eb.y, p.x - eb.x)) * 200;
        }
        this.shake = Math.max(this.shake, 12);
        this.setBanner("RAIO DE FORÇA", "TODOS PUXADOS", "#ff3ce0", 1.1);
        break;
      }
      case "PALMA SÔNICA": {
        const ca = Math.cos(p.ang), sa = Math.sin(p.ang);
        const range = 540, cone = Math.cos(0.68);
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = e.x - p.x, dy = e.y - p.y, d = hyp(dx, dy) || 1;
          const dot = (dx * ca + dy * sa) / d;
          if (d > range || dot < cone) continue;
          this.damageEnemy(e, 310 * this.stats.dmgMul * (1 - d / (range * 1.5)), true, p.x, p.y);
          e.vx += ca * 1450; e.vy += sa * 1450;
        }
        if (this.boss && hyp(this.boss.x - p.x, this.boss.y - p.y) < range + this.boss.r) {
          const dx = this.boss.x - p.x, dy = this.boss.y - p.y;
          if ((dx * ca + dy * sa) / (hyp(dx, dy) || 1) > cone) this.damageBoss(this.boss, 460 * this.stats.dmgMul);
        }
        for (const eb of this.eBullets) if (eb.on && eb.kind !== "ring") {
          const dx = eb.x - p.x, dy = eb.y - p.y;
          if (hyp(dx, dy) < range && dx * ca + dy * sa > 0) eb.on = false;
        }
        this.ripples.push({ x: p.x + ca * 100, y: p.y + sa * 100, r: 30, maxR: 430, life: 0.45, max: 0.45, color: c.color, w: 14 });
        this.shake = Math.max(this.shake, 14);
        this.hitStop = Math.max(this.hitStop, 0.06);
        this.setBanner("PALMA SÔNICA", "IMPACTO FRONTAL", c.color, 1);
        sfx.explode();
        break;
      }
      case "POSTURA TITÂNICA": {
        this.titanT = 4;
        p.inv = Math.max(p.inv, 0.18);
        this.ripples.push({ x: p.x, y: p.y, r: 24, maxR: 100, life: 0.4, max: 0.4, color: c.color, w: 5 });
        this.setBanner("POSTURA TITÂNICA", "DANO RECEBIDO −75% · 4s", c.color, 1.1);
        sfx.levelUp();
        break;
      }

      /* ---------- SAMURAI ---------- */
      case "IAIJUTSU": {
        const tgt = this.nearestTargetFrom(p.x, p.y, 640);
        if (tgt) {
          const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
          p.ang = a;
          p.x = clamp(tgt.x - Math.cos(a) * 56, p.r + 6, this.worldW - p.r - 6);
          p.y = clamp(tgt.y - Math.sin(a) * 56, p.r + 6, this.worldH - p.r - 6);
        } else {
          p.x = clamp(p.x + Math.cos(p.ang) * 170, p.r + 6, this.worldW - p.r - 6);
          p.y = clamp(p.y + Math.sin(p.ang) * 170, p.r + 6, this.worldH - p.r - 6);
        }
        p.inv = Math.max(p.inv, 0.45);
        const def = weaponById(c.weapon);
        for (const off of [-0.3, 0, 0.3]) {
          const a = p.ang + off;
          this.spawnPBullet(p.x + Math.cos(p.ang) * 26, p.y + Math.sin(p.ang) * 26, Math.cos(a) * 1700, Math.sin(a) * 1700, 130 * this.stats.dmgMul, 99, 0.13, 16, def, true);
        }
        this.ripples.push({ x: p.x, y: p.y, r: 12, maxR: 200, life: 0.4, max: 0.4, color: c.color, w: 6 });
        this.flashScreen("#ffffff", 0.18);
        this.shake = Math.max(this.shake, 10);
        sfx.shot("rail");
        this.setBanner("IAIJUTSU", "CORTE INSTANTÂNEO", c.color, 1);
        break;
      }
      case "DANÇA DAS MIL LÂMINAS": {
        this.danceT = 1.1;
        this.danceFx = 0;
        p.inv = Math.max(p.inv, 1.15);
        this.setBanner("MIL LÂMINAS", "VELOCIDADE +30%", "#ffd23c", 1.1);
        sfx.levelUp();
        break;
      }
      case "CINCO CORTES": {
        const targets = this.enemies
          .filter((e) => !e.dead && e.spawnT <= 0 && hyp(e.x - p.x, e.y - p.y) <= 245)
          .sort((a, b) => hyp(a.x - p.x, a.y - p.y) - hyp(b.x - p.x, b.y - p.y))
          .slice(0, 5);
        for (const e of targets) {
          this.addParticle(e.x, e.y, 0, -90, 0.22, "#ffffff", 8, 1, 1);
          this.damageEnemy(e, e.hp + 100, true, p.x, p.y);
        }
        if (this.boss && hyp(this.boss.x - p.x, this.boss.y - p.y) < 320) this.damageBoss(this.boss, 560 * this.stats.dmgMul);
        this.ripples.push({ x: p.x, y: p.y, r: 16, maxR: 270, life: 0.38, max: 0.38, color: c.color, w: 8 });
        this.shake = Math.max(this.shake, 12);
        this.flashScreen(c.color, 0.14);
        this.setBanner("CINCO CORTES", `${targets.length} ALVOS EXECUTADOS`, c.color, 1.1);
        sfx.shot("rail");
        break;
      }
      case "PARRY PERFEITO": {
        this.parryT = 1.5;
        p.inv = Math.max(p.inv, 1.5);
        this.ripples.push({ x: p.x, y: p.y, r: 18, maxR: 150, life: 0.42, max: 0.42, color: "#ffffff", w: 6 });
        this.setBanner("PARRY PERFEITO", "PROJÉTEIS SERÃO DEVOLVIDOS", c.color, 1);
        sfx.ui();
        break;
      }

      /* ---------- ROBÔ ---------- */
      case "SOBRECARGA": {
        this.beamBoostT = 3;
        this.abilityOn = 3;
        this.flashScreen(c.color, 0.22);
        this.shake = Math.max(this.shake, 8);
        this.setBanner("SOBRECARGA", "FEIXES POTENCIALIZADOS", c.color, 1.2);
        sfx.levelUp();
        break;
      }
      case "DRONES SENTINELA": {
        for (let i = 0; i < 2; i++) {
          this.drones.push({ a: (i / 2) * TAU, d: 74, t: 14, cd: 0, x: p.x, y: p.y, ang: 0 });
        }
        this.setBanner("DRONES SENTINELA", "2 UNIDADES ATIVAS", "#4ff0ff", 1.2);
        this.ripples.push({ x: p.x, y: p.y, r: 14, maxR: 160, life: 0.5, max: 0.5, color: "#4ff0ff", w: 4 });
        sfx.levelUp();
        break;
      }
      case "MODO DE VOO": {
        this.flightT = 5;
        p.inv = Math.max(p.inv, 0.3);
        this.setBanner("MODO DE VOO", "SOBREVOANDO INIMIGOS · 5s", c.color, 1.1);
        sfx.levelUp();
        break;
      }
      case "GRANADA DE ÍON": {
        let tx = this.wx(this.mouse.x), ty = this.wy(this.mouse.y);
        if (this.touchMode) { tx = p.x + Math.cos(p.ang) * 320; ty = p.y + Math.sin(p.ang) * 320; }
        const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy) || 1;
        const len = Math.min(520, d);
        this.grenades.push({ x: p.x, y: p.y, vx: dx / d * len * 1.35, vy: dy / d * len * 1.35 - 250, t: 1.2, r: 155, dmg: 115 * this.stats.dmgMul, spin: 0 });
        this.setBanner("GRANADA DE ÍON", "GRANADA LANÇADA", c.color, 0.8);
        sfx.shot("rocket");
        break;
      }
      /* ---------- ENGENHEIRA ---------- */
      case "TORRETA AUTOMÁTICA": {
        const a = p.ang;
        this.turrets.push({ x: clamp(p.x + Math.cos(a) * 72, 30, this.worldW - 30), y: clamp(p.y + Math.sin(a) * 72, 30, this.worldH - 30), t: 12, cd: 0, ang: a });
        this.setBanner("TORRETA AUTOMÁTICA", "UNIDADE INSTALADA · 12s", c.color, 1);
        this.ripples.push({ x: this.turrets[this.turrets.length - 1].x, y: this.turrets[this.turrets.length - 1].y, r: 8, maxR: 70, life: 0.35, max: 0.35, color: c.color, w: 4 });
        sfx.levelUp();
        break;
      }
      case "CAMPO MINADO": {
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + Math.PI / 4;
          this.mines.push({ x: clamp(p.x + Math.cos(a) * 125, 24, this.worldW - 24), y: clamp(p.y + Math.sin(a) * 125, 24, this.worldH - 24), t: 18, r: 110, dmg: 95 * this.stats.dmgMul, color: c.color });
        }
        this.setBanner("CAMPO MINADO", "4 MINAS ARMADAS", c.color, 1);
        sfx.ui();
        break;
      }
      case "BARREIRA DE FASE": {
        this.shieldT = 4;
        this.ripples.push({ x: p.x, y: p.y, r: 28, maxR: 100, life: 0.4, max: 0.4, color: c.color, w: 6 });
        this.setBanner("BARREIRA DE FASE", "PROJÉTEIS BLOQUEADOS · 4s", c.color, 1);
        sfx.levelUp();
        break;
      }
      case "REPARO DE EMERGÊNCIA": {
        p.hp = Math.min(p.maxHp, p.hp + 45);
        for (let i = 0; i < this.classWeapons.length; i++) {
          const wd = this.classWeapons[i];
          if (wd.ammoClip > 0) this.ammo[i] = wd.ammoClip;
        }
        for (const eb of this.eBullets) if (eb.on) eb.on = false;
        this.burst(p.x, p.y, c.color, 18, 260);
        this.setBanner("REPARO DE EMERGÊNCIA", "+45 HP · MUNIÇÃO COMPLETA", c.color, 1.2);
        sfx.pickup();
        break;
      }
      /* ---------- ALQUIMISTA ---------- */
      case "MISTURA INSTÁVEL": {
        const tx = this.touchMode ? p.x + Math.cos(p.ang) * 230 : this.wx(this.mouse.x);
        const ty = this.touchMode ? p.y + Math.sin(p.ang) * 230 : this.wy(this.mouse.y);
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * TAU;
          this.hazards.push({ x: clamp(tx + Math.cos(a) * 82, 24, this.worldW - 24), y: clamp(ty + Math.sin(a) * 82, 24, this.worldH - 24), r: 76, life: 5, max: 5, dps: 28 * this.stats.dmgMul, color: c.color, owner: "player", tick: 0 });
        }
        this.setBanner("MISTURA INSTÁVEL", "5 ZONAS CORROSIVAS", c.color, 1);
        sfx.shot("scatter");
        break;
      }
      case "TRANSMUTAÇÃO": {
        this.explodeAt(p.x, p.y, 270, 155 * this.stats.dmgMul, "#ffd23c", false);
        for (let i = 0; i < this.classWeapons.length; i++) {
          const wd = this.classWeapons[i];
          if (wd.ammoClip > 0) this.ammo[i] = Math.min(wd.ammoClip, this.ammo[i] + Math.ceil(wd.ammoClip * 0.35));
        }
        this.setBanner("TRANSMUTAÇÃO", "ENERGIA CONVERTIDA", c.color, 1);
        break;
      }
      case "FUMAÇA TÓXICA": {
        this.hazards.push({ x: p.x, y: p.y, r: 255, life: 5, max: 5, dps: 36 * this.stats.dmgMul, color: c.color, owner: "player", tick: 0 });
        this.setBanner("FUMAÇA TÓXICA", "ÁREA CONTAMINADA · 5s", c.color, 1);
        sfx.explode();
        break;
      }
      case "ELIXIR DE FERRO": {
        p.hp = Math.min(p.maxHp, p.hp + 35);
        this.titanT = 5;
        p.inv = Math.max(p.inv, 0.4);
        this.setBanner("ELIXIR DE FERRO", "+35 VIDA · RESISTÊNCIA", c.color, 1);
        sfx.pickup();
        break;
      }
      /* ---------- ORÁCULO ---------- */
      case "VISÃO DO FUTURO": {
        this.perfectShot = Math.max(this.perfectShot, 3);
        this.abilityOn = 6;
        this.setBanner("VISÃO DO FUTURO", "PRÓXIMOS 3 TIROS CRÍTICOS", c.color, 1.1);
        sfx.levelUp();
        break;
      }
      case "FENDA DO DESTINO": {
        let bx = p.x, by = p.y, best = -1;
        for (let i = 0; i < 18; i++) {
          const a = i / 18 * TAU, r = 330;
          const x = clamp(p.x + Math.cos(a) * r, 40, this.worldW - 40);
          const y = clamp(p.y + Math.sin(a) * r, 40, this.worldH - 40);
          let nearest = 1500;
          for (const e of this.enemies) if (!e.dead) nearest = Math.min(nearest, hyp(e.x - x, e.y - y));
          if (nearest > best) { best = nearest; bx = x; by = y; }
        }
        const ox = p.x, oy = p.y;
        this.ripples.push({ x: ox, y: oy, r: 8, maxR: 85, life: 0.3, max: 0.3, color: c.color, w: 4 });
        p.x = bx; p.y = by; p.inv = Math.max(p.inv, 0.9); this.updateCamera(1);
        this.ripples.push({ x: bx, y: by, r: 8, maxR: 130, life: 0.4, max: 0.4, color: c.color, w: 5 });
        this.setBanner("FENDA DO DESTINO", "REPOSICIONAMENTO SEGURO", c.color, 1);
        sfx.ui();
        break;
      }
      case "ECLIPSE": {
        const radius = 475;
        for (const e of this.enemies) if (!e.dead && hyp(e.x - p.x, e.y - p.y) < radius) e.stunT = Math.max(e.stunT, 3);
        for (const b of this.eBullets) if (b.on && hyp(b.x - p.x, b.y - p.y) < radius) b.on = false;
        this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: radius, life: 0.65, max: 0.65, color: c.color, w: 6 });
        this.setBanner("ECLIPSE", "HOSTIS IMOBILIZADOS · 3s", c.color, 1);
        sfx.levelUp();
        break;
      }
      case "AURORA": {
        p.hp = Math.min(p.maxHp, p.hp + 60);
        this.shieldT = Math.max(this.shieldT, 1.5);
        for (const b of this.eBullets) if (b.on && hyp(b.x - p.x, b.y - p.y) < 440) b.on = false;
        this.ripples.push({ x: p.x, y: p.y, r: 14, maxR: 260, life: 0.5, max: 0.5, color: c.color, w: 6 });
        this.setBanner("AURORA", "+60 VIDA · PROJÉTEIS LIMPOS", c.color, 1);
        sfx.pickup();
        break;
      }
      /* ---------- NECROMANTE ---------- */
      case "ESPECTROS": {
        for (let i = 0; i < 3; i++) this.drones.push({ a: i / 3 * TAU, d: 96, t: 12, cd: 0, x: p.x, y: p.y, ang: 0, color: c.color, dmg: 25 });
        this.setBanner("ESPECTROS", "3 ALMAS INVOCADAS · 12s", c.color, 1);
        sfx.levelUp();
        break;
      }
      case "DRENAR VIDA": {
        let total = 0;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = hyp(e.x - p.x, e.y - p.y);
          if (d > 310) continue;
          const dealt = 70 * this.stats.dmgMul * (1 - d / 430);
          this.damageEnemy(e, dealt, true, p.x, p.y); total += dealt;
        }
        if (this.boss && hyp(this.boss.x - p.x, this.boss.y - p.y) < 360) {
          const dealt = 110 * this.stats.dmgMul; this.damageBoss(this.boss, dealt); total += dealt;
        }
        const healed = Math.min(55, total * 0.17);
        p.hp = Math.min(p.maxHp, p.hp + healed);
        this.setBanner("DRENAR VIDA", `+${Math.round(healed)} VIDA`, c.color, 1);
        this.ripples.push({ x: p.x, y: p.y, r: 12, maxR: 310, life: 0.45, max: 0.45, color: c.color, w: 6 });
        sfx.explode();
        break;
      }
      case "MALDIÇÃO": {
        for (const e of this.enemies) if (!e.dead) e.curseT = 7;
        this.setBanner("MALDIÇÃO", "TODOS RECEBEM +50% DANO · 7s", c.color, 1);
        sfx.levelUp();
        break;
      }
      case "RENASCIMENTO": {
        p.hp = Math.min(p.maxHp, p.hp + 55); p.inv = Math.max(p.inv, 1.3);
        this.burst(p.x, p.y, c.color, 18, 230);
        this.setBanner("RENASCIMENTO", "+55 VIDA · INVULNERÁVEL", c.color, 1);
        sfx.pickup();
        break;
      }
      /* ---------- ILUSIONISTA ---------- */
      case "HOLOGRAMA": {
        this.decoyX = this.touchMode ? p.x + Math.cos(p.ang) * 320 : this.wx(this.mouse.x);
        this.decoyY = this.touchMode ? p.y + Math.sin(p.ang) * 320 : this.wy(this.mouse.y);
        this.decoyT = 5;
        this.setBanner("HOLOGRAMA", "HOSTIS DESVIADOS · 5s", c.color, 1);
        this.ripples.push({ x: this.decoyX, y: this.decoyY, r: 10, maxR: 90, life: 0.3, max: 0.3, color: c.color, w: 4 });
        sfx.ui();
        break;
      }
      case "PISCAR": {
        const tx = this.touchMode ? p.x + Math.cos(p.ang) * 420 : this.wx(this.mouse.x);
        const ty = this.touchMode ? p.y + Math.sin(p.ang) * 420 : this.wy(this.mouse.y);
        const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy) || 1, len = Math.min(500, d);
        this.ripples.push({ x: p.x, y: p.y, r: 8, maxR: 65, life: 0.22, max: 0.22, color: c.color, w: 3 });
        p.x = clamp(p.x + dx / d * len, p.r + 20, this.worldW - p.r - 20);
        p.y = clamp(p.y + dy / d * len, p.r + 20, this.worldH - p.r - 20);
        p.inv = Math.max(p.inv, 0.75); this.updateCamera(1);
        this.ripples.push({ x: p.x, y: p.y, r: 8, maxR: 110, life: 0.35, max: 0.35, color: c.color, w: 5 });
        this.setBanner("PISCAR", "REPOSICIONAMENTO", c.color, 0.8);
        sfx.ui();
        break;
      }
      case "ESPELHO": {
        let count = 0;
        for (const b of this.eBullets) {
          if (!b.on || b.kind === "ring" || hyp(b.x - p.x, b.y - p.y) > 340) continue;
          const target = this.nearestTargetFrom(b.x, b.y, 1000);
          if (target) {
            const a = Math.atan2(target.y - b.y, target.x - b.x);
            this.spawnPBullet(b.x, b.y, Math.cos(a) * 1450, Math.sin(a) * 1450, 42 * this.stats.dmgMul, 1, 1, 5, weaponById("mirror"), true);
            count++;
          }
          b.on = false;
        }
        this.parryT = 1.2; p.inv = Math.max(p.inv, 1.2);
        this.setBanner("ESPELHO", `${count} PROJÉTEIS DEVOLVIDOS`, c.color, 1);
        sfx.levelUp();
        break;
      }
      case "PRISMA": {
        const wd = weaponById("prism");
        for (let i = 0; i < 18; i++) {
          const a = i / 18 * TAU + this.time * 0.25;
          this.spawnPBullet(p.x, p.y, Math.cos(a) * 1220, Math.sin(a) * 1220, 35 * this.stats.dmgMul, 1, 0.9, 5, wd, i % 5 === 0);
        }
        this.ripples.push({ x: p.x, y: p.y, r: 12, maxR: 210, life: 0.4, max: 0.4, color: c.color, w: 5 });
        this.setBanner("PRISMA", "ESTILHAÇOS EM TODAS AS DIREÇÕES", c.color, 1);
        sfx.shot("tesla");
        break;
      }
    }
    this.publish(true);
  }

  private aimedPoint(range: number) {
    const p = this.player;
    const dx = this.touchMode ? Math.cos(p.ang) * range : this.wx(this.mouse.x) - p.x;
    const dy = this.touchMode ? Math.sin(p.ang) * range : this.wy(this.mouse.y) - p.y;
    const scale = Math.min(1, range / Math.max(1, hyp(dx, dy)));
    return {
      x: clamp(p.x + dx * scale, 35, this.worldW - 35),
      y: clamp(p.y + dy * scale, 35, this.worldH - 35),
    };
  }

  private forcePulse(range: number, halfAngle: number, damage: number, push: number, stun: number) {
    const p = this.player;
    const ca = Math.cos(p.ang), sa = Math.sin(p.ang), threshold = Math.cos(halfAngle);
    const inCone = (x: number, y: number, radius = 0) => {
      const dx = x - p.x, dy = y - p.y, d = hyp(dx, dy);
      return d < range + radius && (d < 1 || (dx * ca + dy * sa) / d >= threshold);
    };
    const count = this.enemies.length;
    for (let i = 0; i < count; i++) {
      const e = this.enemies[i];
      if (e.dead || e.controlledT > 0 || !inCone(e.x, e.y, e.r)) continue;
      this.damageEnemy(e, damage * this.stats.dmgMul, true);
      if (e.dead) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.max(1, hyp(dx, dy));
      const travel = push > 0 ? Math.min(95, push * 0.16) : -Math.max(0, Math.min(d - 85, 220));
      e.x = clamp(e.x + dx / d * travel, 24, this.worldW - 24);
      e.y = clamp(e.y + dy / d * travel, 24, this.worldH - 24);
      e.vx = dx / d * push; e.vy = dy / d * push;
      e.stunT = Math.max(e.stunT, stun);
    }
    const boss = this.boss;
    if (boss && !boss.dead && inCone(boss.x, boss.y, boss.r)) this.damageBoss(boss, damage * this.stats.dmgMul * 1.35);
    for (const b of this.eBullets) if (b.on && inCone(b.x, b.y, b.r)) b.on = false;
    if (this.forceArcs.length >= 8) this.forceArcs.shift();
    this.forceArcs.push({ x: p.x, y: p.y, angle: p.ang, halfAngle, life: 0.4, max: 0.4, r: range, color: this.cls.color });
    this.shake = Math.max(this.shake, 3);
  }

  private castExpansionSpecial(slot: number): boolean {
    const p = this.player;
    const c = this.cls;
    if (c.id !== "telepata" && c.id !== "jedi" && c.id !== "criomante") return false;
    const sp = c.specials[slot];
    const aim = this.aimedPoint(650);
    if (!this.touchMode) p.ang = Math.atan2(aim.y - p.y, aim.x - p.x);

    if (c.id === "telepata") {
      if (slot === 0) {
        this.forcePulse(310, Math.PI, 85, 540, 1.3);
      } else if (slot === 1) {
        let chosen: Enemy | null = null;
        let closest = 180 * 180;
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0 || e.elite || e.controlledT > 0) continue;
          const d = dist2(e.x, e.y, aim.x, aim.y);
          if (d < closest) { closest = d; chosen = e; }
        }
        if (!chosen) {
          this.specT[slot] = 0;
          this.toast("Mire em um inimigo comum", c.color);
          return true;
        }
        // Only one dominated unit is kept alive at a time.
        for (const e of this.enemies) if (e.controlledT > 0) e.controlledT = 0;
        chosen.controlledT = 7; chosen.controlFireT = 0;
        chosen.stunT = 0; chosen.tele = 0; chosen.charge = 0;
        chosen.vx = 0; chosen.vy = 0;
        this.beams = this.beams.filter((b) => dist2(b.x, b.y, chosen.x, chosen.y) > 40 * 40);
      } else if (slot === 2) {
        this.classFields.push({ kind: "psi", x: aim.x, y: aim.y, r: 220, life: 3, max: 3, tick: 0, damage: 24 * this.stats.dmgMul });
      } else {
        this.mindGuardT = 4;
        p.hp = Math.min(p.maxHp, p.hp + 20);
      }
    } else if (c.id === "jedi") {
      if (slot === 0) this.forcePulse(360, 0.9, 82, 760, 1.1);
      else if (slot === 1) this.forcePulse(460, Math.PI, 35, -580, 0.65);
      else if (slot === 2) this.jediGuardT = 3;
      else {
        p.hp = Math.min(p.maxHp, p.hp + 40);
        p.dashCd = 0;
        p.inv = Math.max(p.inv, 0.8);
      }
    } else {
      if (slot === 0) {
        this.forcePulse(300, Math.PI, 65, 0, 2.5);
        for (const e of this.enemies) if (!e.dead && dist2(p.x, p.y, e.x, e.y) < 300 * 300) e.chillT = 4;
      } else if (slot === 1) {
        this.classFields.push({ kind: "snow", x: aim.x, y: aim.y, r: 210, life: 5, max: 5, tick: 0, damage: 21 * this.stats.dmgMul });
      } else if (slot === 2) {
        this.cryoArmorT = 4;
      } else {
        const weapon = weaponById("frostNeedle");
        for (let i = 0; i < 7; i++) {
          const a = p.ang + (i - 3) * 0.12;
          this.spawnPBullet(p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26,
            Math.cos(a) * 1620, Math.sin(a) * 1620, 55 * this.stats.dmgMul, 3, 0.85, 6, weapon, false);
        }
      }
    }
    // These timed zones are bounded; no full-screen effects or per-frame allocations.
    if (this.classFields.length > 3) this.classFields.shift();
    this.toast(sp.name, sp.color);
    sfx.ui();
    return true;
  }

  private updateExpansionPowers(dt: number) {
    this.mindGuardT = Math.max(0, this.mindGuardT - dt);
    this.jediGuardT = Math.max(0, this.jediGuardT - dt);
    this.deflectCd = Math.max(0, this.deflectCd - dt);
    this.cryoArmorT = Math.max(0, this.cryoArmorT - dt);
    for (let i = this.forceArcs.length - 1; i >= 0; i--) {
      this.forceArcs[i].life -= dt;
      if (this.forceArcs[i].life <= 0) this.forceArcs.splice(i, 1);
    }
    for (let i = this.classFields.length - 1; i >= 0; i--) {
      const field = this.classFields[i];
      field.life -= dt; field.tick -= dt;
      if (field.life <= 0) { this.classFields.splice(i, 1); continue; }
      const pulse = field.tick <= 0;
      if (pulse) field.tick += 0.25;
      const r2 = field.r * field.r;
      const count = this.enemies.length;
      for (let j = 0; j < count; j++) {
        const e = this.enemies[j];
        if (e.dead || e.controlledT > 0 || dist2(e.x, e.y, field.x, field.y) > r2) continue;
        if (field.kind === "snow") e.chillT = Math.max(e.chillT, 0.8);
        else if (field.kind === "smoke" || field.kind === "dark") e.chillT = Math.max(e.chillT, 0.5);
        else {
          const dx = field.x - e.x, dy = field.y - e.y, d = Math.max(1, hyp(dx, dy));
          const travel = Math.min(d, 160 * dt);
          e.x += dx / d * travel; e.y += dy / d * travel;
        }
        if (pulse) this.damageEnemy(e, field.damage * 0.25, true);
      }
      const b = this.boss;
      if (pulse && b && !b.dead && dist2(b.x, b.y, field.x, field.y) < (field.r + b.r) ** 2) this.damageBoss(b, field.damage * 0.25);
    }
  }

  private updateControlledEnemy(e: Enemy, dt: number) {
    e.controlledT = Math.max(0, e.controlledT - dt);
    if (e.controlledT <= 0) { e.fireT = 0.8; return; }
    e.controlFireT -= dt;
    const target = this.nearestTargetFrom(e.x, e.y, 900);
    if (!target) {
      const dx = this.player.x - e.x, dy = this.player.y - e.y, d = hyp(dx, dy);
      if (d > 140) { e.x += dx / d * 110 * dt; e.y += dy / d * 110 * dt; }
      return;
    }
    const dx = target.x - e.x, dy = target.y - e.y, d = Math.max(1, hyp(dx, dy));
    e.aim = Math.atan2(dy, dx);
    e.vx = d > 210 ? dx / d * e.speed : 0;
    e.vy = d > 210 ? dy / d * e.speed : 0;
    e.x = clamp(e.x + e.vx * dt, 24, this.worldW - 24);
    e.y = clamp(e.y + e.vy * dt, 24, this.worldH - 24);
    if (e.controlFireT <= 0) {
      e.controlFireT = 0.48;
      this.spawnPBullet(e.x, e.y, dx / d * 1100, dy / d * 1100, 20 * this.stats.dmgMul, 0, 1, 4.5, weaponById("psi"), false);
    }
  }

  /** nearest N living targets, used by meteors */
  private rankTargets(n: number, maxD: number) {
    const p = this.player;
    const list = this.enemies
      .filter((e) => !e.dead && e.spawnT <= 0)
      .map((e) => ({ e, d: hyp(e.x - p.x, e.y - p.y) }))
      .filter((o) => o.d < maxD)
      .sort((a, b) => a.d - b.d)
      .slice(0, n);
    const out = list.map((o) => ({ x: o.e.x, y: o.e.y }));
    if (this.boss && !this.boss.dead) {
      const d = hyp(this.boss.x - p.x, this.boss.y - p.y);
      if (d < maxD) out.unshift({ x: this.boss.x, y: this.boss.y });
    }
    return out.slice(0, n);
  }

  private updateDrones(dt: number) {
    const p = this.player;
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.t -= dt;
      if (d.t <= 0) { this.drones.splice(i, 1); continue; }
      d.a += dt * 1.9;
      d.x += (p.x + Math.cos(d.a) * d.d - d.x) * Math.min(1, dt * 8);
      d.y += (p.y + Math.sin(d.a) * d.d - d.y) * Math.min(1, dt * 8);
      d.cd -= dt;
      const tgt = this.nearestTargetFrom(d.x, d.y, 620);
      if (tgt) {
        d.ang = Math.atan2(tgt.y - d.y, tgt.x - d.x);
        if (d.cd <= 0) {
          d.cd = 0.22;
          const color = d.color ?? "#4ff0ff";
          this.spawnPBullet(d.x, d.y, Math.cos(d.ang) * 1300, Math.sin(d.ang) * 1300, (d.dmg ?? 15) * this.stats.dmgMul, 0, 0.6, 3.4, WEAPONS[0], false);
          this.addParticle(d.x, d.y, Math.cos(d.ang) * 120, Math.sin(d.ang) * 120, 0.1, color, 4, 0, 1);
        }
      }
    }
  }

  private updateMeteors(dt: number) {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.t -= dt;
      if (Math.random() < dt * 22) {
        this.addParticle(m.x + rnd(-40, 40), m.y - 200 - rnd(0, 160), rnd(-30, 30), 320, 0.5, "#ff8400", 4, 1, 2);
      }
      if (m.t > 0) continue;
      // impact
      this.explodeAt(m.x, m.y, m.r, m.dmg, "#ff8400", false);
      this.ripples.push({ x: m.x, y: m.y, r: 20, maxR: m.r * 1.6, life: 0.5, max: 0.5, color: "#ff8400", w: 9 });
      this.decals.push({ x: m.x, y: m.y, r: m.r * 0.5, life: 5, max: 5, color: "#ff8400", rot: 0, kind: 1 });
      if (this.boss && !this.boss.dead && hyp(this.boss.x - m.x, this.boss.y - m.y) < m.r + this.boss.r) {
        this.damageBoss(this.boss, m.dmg * 0.7);
      }
      this.meteors.splice(i, 1);
    }
  }

  private nearestTargetFrom(x: number, y: number, maxDist: number): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bd = maxDist;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.controlledT > 0) continue;
      const d = hyp(e.x - x, e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    const b = this.boss;
    if (b && !b.dead && b.entering <= 0) {
      const d = hyp(b.x - x, b.y - y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  private classDashEffect() {
    const c = this.cls;
    const p = this.player;
    if (c.id === "velocista") {
      // corte fantasma: slashing arc in dash direction
      const dmg = (c.stats.dashDamage ?? 30) * this.stats.dmgMul;
      const a0 = p.dashAng;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = hyp(e.x - p.x, e.y - p.y);
        if (d > 130) continue;
        let diff = Math.atan2(e.y - p.y, e.x - p.x) - a0;
        while (diff > Math.PI) diff -= TAU;
        while (diff < -Math.PI) diff += TAU;
        if (Math.abs(diff) < 1.1) {
          this.damageEnemy(e, dmg, true, p.x, p.y);
          e.vx += Math.cos(a0) * 300; e.vy += Math.sin(a0) * 300;
        }
      }
      for (let i = 0; i < 10; i++) {
        const t = i / 10;
        this.addParticle(
          p.x + Math.cos(a0) * 130 * t, p.y + Math.sin(a0) * 130 * t,
          rnd(-60, 60), rnd(-60, 60), 0.34, i % 3 === 0 ? "#ffffff" : c.color, 5, 1, 2,
        );
      }
      this.ripples.push({ x: p.x, y: p.y, r: 12, maxR: 130, life: 0.3, max: 0.3, color: c.color, w: 5 });
      this.shake = Math.max(this.shake, 5);
      sfx.shot("rail");
    } else if (c.id === "bruto") {
      // impacto sísmico
      const rad = c.stats.dashRadius ?? 180;
      const dmg = (c.stats.dashDamage ?? 60) * this.stats.dmgMul;
      this.ripples.push({ x: p.x, y: p.y, r: 20, maxR: rad * 1.3, life: 0.45, max: 0.45, color: c.color, w: 9 });
      this.decals.push({ x: p.x, y: p.y, r: rad * 0.6, life: 5, max: 5, color: c.color, rot: Math.random() * TAU, kind: 1 });
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = hyp(e.x - p.x, e.y - p.y);
        if (d < rad + e.r) {
          this.damageEnemy(e, dmg * (1 - d / (rad + e.r) * 0.5), true, p.x, p.y);
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          e.vx += Math.cos(a) * 640; e.vy += Math.sin(a) * 640;
        }
      }
      if (this.boss && hyp(this.boss.x - p.x, this.boss.y - p.y) < rad + this.boss.r) {
        this.damageBoss(this.boss, dmg * 0.8);
      }
      for (const eb of this.eBullets) {
        if (eb.on && eb.kind !== "ring" && hyp(eb.x - p.x, eb.y - p.y) < rad) { eb.on = false; this.burst(eb.x, eb.y, eb.color, 3, 100); }
      }
      this.burst(p.x, p.y, c.color, 26, 420);
      this.shake = Math.max(this.shake, 13);
      this.hitStop = Math.max(this.hitStop, 0.05);
      sfx.explode();
    }
  }

  private nearestTarget(maxDist: number): { x: number; y: number } | null {
    const p = this.player;
    let best: { x: number; y: number } | null = null;
    let bd = maxDist;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.controlledT > 0) continue;
      const d = hyp(e.x - p.x, e.y - p.y);
      if (d < bd) { bd = d; best = e; }
    }
    const b = this.boss;
    if (b && !b.dead && b.entering <= 0) {
      const d = hyp(b.x - p.x, b.y - p.y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  private tryDash() {
    const p = this.player;
    if ((this.status !== "playing" && !this.demoActive) || p.dashCd > 0 || p.dashT > 0) return;
    let dmx = 0, dmy = 0;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) dmx -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) dmx += 1;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) dmy -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) dmy += 1;
    if (this.stickMove.active) { dmx = this.stickMove.dx; dmy = this.stickMove.dy; }
    p.dashAng = hyp(dmx, dmy) > 0.25 ? Math.atan2(dmy, dmx) : p.ang;
    p.dashT = 0.16;
    p.dashCd = 1.55 * this.stats.dashCdMul;
    p.inv = 0.34;
    p.safeT = 0;
    this.classDashEffect();
    sfx.dash();
    this.shake = Math.max(this.shake, 4);
    this.ripples.push({ x: p.x, y: p.y, r: 8, maxR: 110, life: 0.32, max: 0.32, color: "#4ff0ff", w: 3 });
    this.burst(p.x, p.y, "#4ff0ff", 14, 260);
  }

  /* ================= weapons ================= */

  private fire() {
    const p = this.player;
    const def: WeaponDef = this.classWeapons[this.weaponIdx] ?? WEAPONS[0];
    if (def.kind === "beam") { this.fireBeam(def); return; }
    if (def.kind === "blade") { this.fireBlade(def); return; }
    if (def.ammoClip > 0) {
      if (this.ammo[this.weaponIdx] <= 0) {
        const alt = this.classWeapons.findIndex((wd, i) => (this.owned[i] && wd.ammoClip === 0) || (this.owned[i] && this.ammo[i] > 0));
        if (alt >= 0 && alt !== this.weaponIdx) { this.setWeapon(alt); }
        this.player.fireT = 0.12;
        sfx.ui();
        return;
      }
      this.ammo[this.weaponIdx] -= 1;
    }
    p.fireT = def.rate / (this.stats.fireRateMul * this.buffRate);
    p.muzzle = 1;
    p.recoil += def.recoil * 0.55;
    const shots = def.pellets + (this.stats.extraShot > 0 && def.id !== "rail" ? this.stats.extraShot : 0);
    const dmgPer = def.dmg * this.powerMul() * (def.pellets > 1 || this.stats.extraShot ? (shots > def.pellets ? 0.82 : 1) : 1);
    for (let i = 0; i < shots; i++) {
      const spreadBase = def.spread * (shots > 1 ? 1 : 1);
      const t = shots === 1 ? 0 : (i / (shots - 1) - 0.5) * 2;
      const ang = p.ang + t * spreadBase + rnd(-0.5, 0.5) * spreadBase * 0.6;
      const perfect = this.perfectShot > 0 && i === 0;
      const crit = perfect || this.markCrits > 0 || Math.random() < this.stats.critChance;
      const dmg = perfect ? dmgPer * 4 : dmgPer * (crit ? this.stats.critMul : 1);
      const speed = def.speed * (perfect ? 1.7 : 1) * rnd(0.96, 1.04);
      this.spawnPBullet(
        p.x + Math.cos(p.ang) * 18, p.y + Math.sin(p.ang) * 18,
        Math.cos(ang) * speed, Math.sin(ang) * speed,
        dmg, perfect ? 99 : def.pierce + this.stats.pierceAdd,
        perfect ? def.life * 1.6 : def.life, perfect ? def.bulletR * 1.8 : def.bulletR, def, crit,
      );
      if (perfect) {
        this.perfectShot = 0;
        this.shake = Math.max(this.shake, 13);
        this.hitStop = Math.max(this.hitStop, 0.06);
        this.flashScreen("#ffffff", 0.2);
        this.ripples.push({ x: p.x, y: p.y, r: 10, maxR: 190, life: 0.4, max: 0.4, color: this.cls.color, w: 5 });
        this.setBanner("TIRO PERFEITO", "ATRAVESSOU TUDO", this.cls.color, 1);
        sfx.shot("rail");
      }
    }
    if (this.markCrits > 0) this.markCrits--;
    // muzzle fx
    const mx = p.x + Math.cos(p.ang) * 22, my = p.y + Math.sin(p.ang) * 22;
    this.burst(mx, my, def.color, def.id === "scatter" ? 9 : 3, 320, p.ang, def.id === "scatter" ? 0.9 : 0.4);
    this.addParticle(mx, my, Math.cos(p.ang) * 60, Math.sin(p.ang) * 60, 0.14, "#ffffff", 12, 0, 0);
    p.vx -= Math.cos(p.ang) * def.recoil * 0.4;
    p.vy -= Math.sin(p.ang) * def.recoil * 0.4;
    this.shake = Math.max(this.shake, def.shake);
    if (def.id === "scatter" || def.id === "rail" || def.id === "rocket") {
      for (let s = 0; s < 3; s++) {
        const a = p.ang + Math.PI / 2 + rnd(-0.4, 0.4);
        this.addParticle(mx, my, Math.cos(a) * rnd(80, 200), Math.sin(a) * rnd(80, 200) - 40, 0.6, "#c9a22a", 2.4, 2.4, 1, 700, 0.2);
      }
    }
    sfx.shot(def.sfx);
    if (def.id === "rocket") this.hitStop = Math.max(this.hitStop, 0.02);
  }

  /** ROBO weapon: twin eye beams. Continuous and accurate, but low DPS by design. */
  /** ROBÔ weapon: twin eye beams that follow the mouse and reach it. */
  private fireBeam(def: WeaponDef) {
    const p = this.player;
    p.fireT = def.rate / (this.stats.fireRateMul * this.buffRate);
    p.muzzle = 0.4;
    const maxLen = this.beamBoostT > 0 ? 900 : 700;

    // aim where the player points — no auto-target
    let tx: number, ty: number;
    if (this.touchMode) {
      tx = p.x + Math.cos(p.ang) * maxLen;
      ty = p.y + Math.sin(p.ang) * maxLen;
    } else {
      tx = this.wx(this.mouse.x);
      ty = this.wy(this.mouse.y);
    }
    const dx = tx - p.x, dy = ty - p.y;
    const want = hyp(dx, dy);
    const len = Math.min(want, maxLen);
    const a = Math.atan2(dy, dx);
    const ex = p.x + Math.cos(a) * len;
    const ey = p.y + Math.sin(a) * len;
    this.eyeBeamX = ex; this.eyeBeamY = ey;
    this.eyeBeamT = 0.09;

    // damage everything the beams cross (segment vs circle), capped for balance
    const dmg = def.dmg * this.powerMul() * this.buffBeam * (this.beamBoostT > 0 ? 2.2 : 1);
    let hits = 0;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.controlledT > 0 || hits >= def.pierce) continue;
      if (this.segHitT(p.x, p.y, ex - p.x, ey - p.y, e.x, e.y, e.r + def.hitRadius) >= 0) {
        this.damageEnemy(e, dmg, true, p.x, p.y);
        if (Math.random() < 0.2) this.addParticle(e.x, e.y, rnd(-50, 50), rnd(-50, 50), 0.15, def.color, 2.4, 0, 1);
        hits++;
      }
    }
    const b = this.boss;
    if (b && !b.dead && b.entering <= 0 && this.segHitT(p.x, p.y, ex - p.x, ey - p.y, b.x, b.y, b.r) >= 0) {
      this.damageBoss(b, dmg);
    }
    if (Math.random() < 0.22) sfx.shot("tesla");
  }
  /** SAMURAI weapon: three short sword arcs + a small lunge. */
  private fireBlade(def: WeaponDef) {
    const p = this.player;
    p.fireT = def.rate / (this.stats.fireRateMul * this.buffRate);
    p.muzzle = 1;
    p.vx += Math.cos(p.ang) * 300;
    p.vy += Math.sin(p.ang) * 300;
    for (let i = 0; i < def.pellets; i++) {
      const t = def.pellets === 1 ? 0 : (i / (def.pellets - 1) - 0.5) * 2;
      const ang = p.ang + t * def.spread;
      const crit = Math.random() < this.stats.critChance;
      const dmg = def.dmg * this.stats.dmgMul * (crit ? this.stats.critMul : 1);
      this.spawnPBullet(
        p.x + Math.cos(p.ang) * 24, p.y + Math.sin(p.ang) * 24,
        Math.cos(ang) * def.speed, Math.sin(ang) * def.speed,
        dmg, 99, def.life, def.bulletR, def, crit,
      );
    }
    this.burst(p.x + Math.cos(p.ang) * 30, p.y + Math.sin(p.ang) * 30, "#ffffff", 3, 220, p.ang, 0.7);
    this.shake = Math.max(this.shake, def.shake);
    sfx.dash();
  }

  private spawnPBullet(x: number, y: number, vx: number, vy: number, dmg: number, pierce: number, life: number, r: number, w: WeaponDef, crit: boolean) {
    let slot: PBullet | null = null;
    for (let i = 0; i < this.pBullets.length; i++) {
      const b = this.pBullets[(this.pIdx + i) % this.pBullets.length];
      if (!b.on) { slot = b; this.pIdx = (this.pIdx + i + 1) % this.pBullets.length; break; }
    }
    if (!slot) { slot = this.pBullets[this.pIdx]; this.pIdx = (this.pIdx + 1) % this.pBullets.length; }
    slot.on = true; slot.x = x; slot.y = y; slot.px = x; slot.py = y;
    slot.vx = vx; slot.vy = vy; slot.dmg = dmg; slot.pierce = pierce;
    slot.life = life; slot.r = r; slot.w = w; slot.crit = crit;
    slot.returning = false;
    slot.hitIds.length = 0;
    slot.owner = this.enemies.length;
  }

  /* ================= enemies ================= */

  private updateEnemies(dt: number) {
    const p = this.player;
    // spawn marks
    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i];
      m.t -= dt;
      if (m.t <= 0) {
        this.spawnEnemy(m.kind, m.x, m.y, m.elite);
        this.marks.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) continue;
      e.t += dt;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      e.hitFlash = Math.max(0, e.hitFlash - dt * 5);
      e.squash *= Math.pow(0.02, dt);
      e.chillT = Math.max(0, e.chillT - dt);
      if (e.controlledT > 0) { this.updateControlledEnemy(e, dt); continue; }
      if (e.stunT > 0) {
        e.stunT = Math.max(0, e.stunT - dt);
        e.vx *= 0.8; e.vy *= 0.8;
        e.x += e.vx * dt; e.y += e.vy * dt;
        continue;
      }
      const targetX = this.decoyT > 0 ? this.decoyX : p.x;
      const targetY = this.decoyT > 0 ? this.decoyY : p.y;
      const dx = targetX - e.x, dy = targetY - e.y;
      const dist = hyp(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      const ang = Math.atan2(dy, dx);
      e.aim += (ang - e.aim) * Math.min(1, dt * 10);
      if (e.curseT > 0) e.curseT = Math.max(0, e.curseT - dt);
      if (e.markT > 0) e.markT = Math.max(0, e.markT - dt);
      let tx = ux * e.speed, ty = uy * e.speed;

      switch (e.kind) {
        case "drone": {
          const wob = Math.sin(e.t * 9) * 0.8;
          tx = Math.cos(ang + wob) * e.speed; ty = Math.sin(ang + wob) * e.speed;
          break;
        }
        case "shooter": {
          const want = e.dist;
          const rad = dist > want ? 1 : -1.2;
          tx = ux * e.speed * rad; ty = uy * e.speed * rad;
          e.fireT -= dt;
          if (e.fireT <= 0 && dist < 640 && this.invisT <= 0) {
            e.fireT = rnd(1.5, 2.4) / (1 + this.wave * 0.02);
            for (let s = 0; s < (this.wave > 6 ? 3 : 1); s++) {
              const a = ang + (s - 1) * 0.14;
              this.spawnEBullet(e.x, e.y, Math.cos(a) * 350, Math.sin(a) * 350, 7, e.contact * 0.55, "#c04bff", "dot");
            }
            this.burst(e.x + ux * 16, e.y + uy * 16, "#c04bff", 4, 140, ang, 0.5);
            sfx.shot("pulse");
          }
          break;
        }
        case "heavy": {
          tx = ux * e.speed; ty = uy * e.speed;
          e.fireT -= dt;
          if (e.fireT <= 0 && dist < 700) {
            e.fireT = rnd(1.9, 2.6);
            for (let s = -2; s <= 2; s++) {
              const a = ang + s * 0.16;
              this.spawnEBullet(e.x, e.y, Math.cos(a) * 300, Math.sin(a) * 300, 9, e.contact * 0.5, "#ffd23c", "spike", 0, 0);
            }
            this.shake = Math.max(this.shake, 2.4);
            sfx.shot("scatter");
          }
          break;
        }
        case "bomber": {
          tx = ux * e.speed * (1 + (dist < 160 ? 1.1 : 0));
          ty = uy * e.speed * (1 + (dist < 160 ? 1.1 : 0));
          e.charge = clamp(1 - dist / 90, 0, 1);
          if (dist < 62 || e.hp <= 0) {
            this.explodeAt(e.x, e.y, 130, e.contact, "#ff4d1a", true);
            this.killEnemy(e, e.hp > 0);
            continue;
          }
          break;
        }
        case "sniper": {
          const want = 380;
          const rad = dist > want ? 0.7 : -0.9;
          tx = ux * e.speed * rad - uy * e.speed * 0.55 * e.orbitDir;
          ty = uy * e.speed * rad + ux * e.speed * 0.55 * e.orbitDir;
          e.fireT -= dt;
          if (e.fireT < 0.9 && e.tele === 0 && this.invisT <= 0) {
            e.tele = 1;
            this.beams.push({ x: e.x, y: e.y, ang, len: 1400, w: 2.4, tele: 0.9, fire: 0.14, color: "#00e5c0", dmg: e.contact * 1.5, fromBoss: false, spin: 0 });
          }
          if (e.fireT <= 0) { e.fireT = rnd(2.4, 3.4); e.tele = 0; }
          break;
        }
        case "orbiter": {
          const ring = 200;
          const tang = Math.atan2(dy, dx) + (Math.PI / 2) * e.orbitDir;
          const pull = (dist - ring) * 1.4;
          tx = Math.cos(tang) * e.speed + ux * pull;
          ty = Math.sin(tang) * e.speed + uy * pull;
          e.fireT -= dt;
          if (e.fireT <= 0) {
            e.fireT = rnd(1.6, 2.3);
            for (let s = 0; s < 5; s++) {
              const a = ang + (s / 5) * TAU;
              this.spawnEBullet(e.x, e.y, Math.cos(a) * 260, Math.sin(a) * 260, 7, e.contact * 0.6, "#4f8dff", "dot");
            }
          }
          break;
        }
        case "summoner": {
          const want = 300;
          const rad = dist > want ? 0.8 : -1;
          tx = ux * e.speed * rad - uy * e.speed * 0.7 * e.orbitDir;
          ty = uy * e.speed * rad + ux * e.speed * 0.7 * e.orbitDir;
          e.fireT -= dt;
          if (e.fireT <= 0) {
            e.fireT = rnd(3.4, 5);
            if (this.enemies.length < 44) {
              for (let s = 0; s < 2; s++) {
                const a = Math.random() * TAU;
                this.spawnEnemy(s === 0 ? "drone" : "grunt", e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, false);
              }
            }
            this.ripples.push({ x: e.x, y: e.y, r: 10, maxR: 150, life: 0.5, max: 0.5, color: "#ff5ec8", w: 5 });
            sfx.pickup();
          }
          break;
        }
        case "charger": {
          // ciclo: aproxima → trava mira (tele) → investida reta → recupera
          e.fireT -= dt;
          if (e.charge > 0) {
            // investindo
            e.charge -= dt;
            tx = Math.cos(e.aim) * e.speed * 5.2;
            ty = Math.sin(e.aim) * e.speed * 5.2;
            if (e.charge <= 0) { e.fireT = rnd(1.4, 2.2); e.tele = 0; }
          } else if (e.tele > 0) {
            // mirando: parado, segue o jogador lentamente
            e.tele -= dt;
            tx = 0; ty = 0;
            e.aim = ang;
            if (e.tele <= 0) { e.charge = 0.55; this.burst(e.x, e.y, "#ff7a1a", 8, 180, e.aim + Math.PI, 0.5); sfx.dash(); }
          } else if (e.fireT <= 0 && dist < 520) {
            e.tele = 0.65;
          } else {
            tx = ux * e.speed; ty = uy * e.speed;
          }
          break;
        }
        case "healer": {
          // mantém distância e cura aliados num raio
          const want = 300;
          const rad = dist > want ? 0.8 : -1.1;
          tx = ux * e.speed * rad - uy * e.speed * 0.6 * e.orbitDir;
          ty = uy * e.speed * rad + ux * e.speed * 0.6 * e.orbitDir;
          e.fireT -= dt;
          if (e.fireT <= 0) {
            e.fireT = 1.1;
            let healed = 0;
            for (const o of this.enemies) {
              if (o === e || o.dead || o.controlledT > 0 || o.hp >= o.maxHp) continue;
              if (hyp(o.x - e.x, o.y - e.y) < 190) {
                o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.09);
                healed++;
                if (healed <= 4) this.addParticle(o.x, o.y - o.r, rnd(-20, 20), -60, 0.4, "#6cff9e", 3, 0, 1);
              }
            }
            if (healed) this.ripples.push({ x: e.x, y: e.y, r: 10, maxR: 190, life: 0.45, max: 0.45, color: "#6cff9e", w: 3 });
          }
          break;
        }
        case "warden": {
          // avança devagar com escudo frontal (tratado em damageEnemy via e.shield=2)
          tx = ux * e.speed; ty = uy * e.speed;
          e.aim = ang;
          break;
        }
        case "phantom": {
          // pisca: a cada ~1.6s teleporta para um ponto ao redor do jogador e fica intangível um instante
          e.fireT -= dt;
          if (e.fireT <= 0) {
            e.fireT = rnd(1.3, 2);
            const a = Math.random() * TAU;
            const d = rnd(140, 260);
            this.burst(e.x, e.y, "#c9b6ff", 8, 160);
            e.x = clamp(p.x + Math.cos(a) * d, 30, this.worldW - 30);
            e.y = clamp(p.y + Math.sin(a) * d, 30, this.worldH - 30);
            e.spawnT = 0.22;             // intangível/transparente ao reaparecer
            this.burst(e.x, e.y, "#c9b6ff", 8, 160);
            continue;
          }
          const wob = Math.sin(e.t * 7) * 0.5;
          tx = Math.cos(ang + wob) * e.speed; ty = Math.sin(ang + wob) * e.speed;
          break;
        }
        case "spitter": {
          const want = 340;
          const rad = dist > want ? 0.9 : -0.7;
          tx = ux * e.speed * rad - uy * e.speed * 0.4 * e.orbitDir;
          ty = uy * e.speed * rad + ux * e.speed * 0.4 * e.orbitDir;
          e.fireT -= dt;
          if (e.fireT <= 0 && dist < 620 && this.invisT <= 0) {
            e.fireT = rnd(2.2, 3.2);
            // glóbulo lento em arco; vira poça ao cair
            const sp = 320;
            const b = this.spawnEBullet(e.x, e.y, Math.cos(ang) * sp, Math.sin(ang) * sp, 9, e.contact * 0.6, "#b7ff3c", "dot");
            if (b) { b.life = clamp(dist / sp, 0.35, 1.6); b.pool = true; }
            sfx.shot("scatter");
          }
          break;
        }
        case "shard": {
          const wob = Math.sin(e.t * 12) * 1.1;
          tx = Math.cos(ang + wob) * e.speed; ty = Math.sin(ang + wob) * e.speed;
          break;
        }
        default: {
          const wob = Math.sin(e.t * 3.4 + e.spin) * 0.32;
          tx = Math.cos(ang + wob) * e.speed;
          ty = Math.sin(ang + wob) * e.speed;
        }
      }

      // Cloaked players are not tracked until the veil ends.
      if (this.invisT > 0) { tx = 0; ty = 0; }
      const chill = e.chillT > 0 ? 0.55 : 1;
      const psiAura = this.cls.id === "telepata" && dist2(e.x, e.y, p.x, p.y) < 150 * 150 ? 0.75 : 1;
      tx *= chill * psiAura; ty *= chill * psiAura;

      // separation
      for (let j = i - 1; j >= Math.max(0, i - 8); j--) {
        const o = this.enemies[j];
        const ddx = e.x - o.x, ddy = e.y - o.y;
        const dd = hyp(ddx, ddy);
        const min = e.r + o.r;
        if (dd > 0.001 && dd < min) {
          const f = ((min - dd) / min) * 240;
          tx += (ddx / dd) * f; ty += (ddy / dd) * f;
        }
      }

      e.vx += (tx - e.vx) * Math.min(1, dt * (e.kind === "heavy" ? 2.2 : 5));
      e.vy += (ty - e.vy) * Math.min(1, dt * (e.kind === "heavy" ? 2.2 : 5));
      e.x += e.vx * dt; e.y += e.vy * dt;
      const pad = 14;
      if (e.x < pad) { e.x = pad; e.vx = Math.abs(e.vx) * 0.4; }
      if (e.x > this.worldW - pad) { e.x = this.worldW - pad; e.vx = -Math.abs(e.vx) * 0.4; }
      if (e.y < pad) { e.y = pad; e.vy = Math.abs(e.vy) * 0.4; }
      if (e.y > this.worldH - pad) { e.y = this.worldH - pad; e.vy = -Math.abs(e.vy) * 0.4; }
      e.rot += e.spin * dt + hyp(e.vx, e.vy) * dt * 0.004;

      const playerDist = hyp(p.x - e.x, p.y - e.y);
      if (playerDist < e.r + p.r && this.invisT <= 0 && this.flightT <= 0) {
        this.hurtPlayer(e.contact, e.x, e.y);
        if (this.cryoArmorT > 0) { e.stunT = Math.max(e.stunT, 0.8); e.chillT = 2; }
        if (e.kind === "bomber") { this.explodeAt(e.x, e.y, 120, e.contact * 0.6, "#ff4d1a", true); this.killEnemy(e, false); continue; }
        e.vx -= ux * 260; e.vy -= uy * 260;
      }
    }
  }

  private killEnemy(e: Enemy, byPlayer = true) {
    if (e.dead) return;
    e.dead = true;
    const def = ENEMY_DEFS[e.kind];
    if (byPlayer) {
      this.kills++;
      this.streak++;
      this.streakT = 3.2;
      if (this.streak === 5) this.toast("SEQUÊNCIA ×5", "#ffb020");
      else if (this.streak === 10) this.toast("IMPLACÁVEL ×10", "#ff6a2e");
      else if (this.streak === 20) this.toast("MASSACRE ×20", "#ff3b5c");
      else if (this.streak > 20 && this.streak % 10 === 0) this.toast(`×${this.streak}`, "#ff3b5c");
      const waveMul = 1 + this.wave * 0.05;
      const gain = Math.round(e.score * this.comboMul() * waveMul * this.stats.mulReward);
      this.score += gain;
      this.addFloater(e.x, e.y, `+${gain}`, def.color, 15 + Math.min(12, this.comboMul() * 2));
      if (this.stats.lifesteal > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.stats.lifesteal);
      }
      // splitter
      if (e.kind === "splitter") {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU + Math.random();
          this.spawnEnemy("shard", e.x + Math.cos(a) * 22, e.y + Math.sin(a) * 22, false);
        }
      }
      // thermite shards
      if (this.stats.reflect > 0 && Math.random() < 0.5) {
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * TAU;
          this.spawnEBullet(e.x, e.y, Math.cos(a) * 340, Math.sin(a) * 340, 5, 5, "#ff6a2e", "shard");
        }
      }
      this.dropLoot(e.x, e.y, e.elite);
      this.hitStop = Math.max(this.hitStop, e.kind === "heavy" || e.elite ? 0.05 : 0.018);
      this.shake = Math.max(this.shake, e.kind === "heavy" ? 8 : 3.2);
    }
    if (e.kind === "bomber" || e.kind === "heavy" || e.elite) {
      this.explodeAt(e.x, e.y, e.kind === "bomber" ? 120 : 80, 0, def.color, false);
    }
    this.burst(e.x, e.y, def.color, e.elite ? 24 : 13, 300);
    this.ripples.push({ x: e.x, y: e.y, r: e.r, maxR: e.r * 6, life: 0.38, max: 0.38, color: def.color, w: 3 });
    this.decals.push({ x: e.x, y: e.y, r: e.r * rnd(1.3, 1.8), life: 2.4, max: 2.4, color: def.color, rot: Math.random() * TAU, kind: 0 });
    sfx.kill();
  }

  private dropLoot(x: number, y: number, elite: boolean) {
    const roll = Math.random();
    const hpFrac = this.player.hp / this.player.maxHp;
    void elite;
    if (roll < 0.12 + (hpFrac < 0.5 ? 0.06 : 0)) {
      this.pickups.push({ x, y, vx: rnd(-30, 30), vy: rnd(-30, 30), life: 12, kind: "hp", weapon: 0, color: "#3cff8f", t: 0 });
    } else if (roll < 0.24) {
      this.pickups.push({ x, y, vx: rnd(-30, 30), vy: rnd(-30, 30), life: 12, kind: "ammo", weapon: 0, color: "#ffd23c", t: 0 });
    }
  }

  private explodeAt(x: number, y: number, radius: number, dmg: number, color: string, hurtPlayer: boolean, chill = false) {
    const r = radius * this.stats.boomRadius;
    this.burst(x, y, color, 24, 430);
    this.ripples.push({ x, y, r: 10, maxR: r * 1.25, life: 0.42, max: 0.42, color, w: 6 });
    this.decals.push({ x, y, r: r * 0.5, life: 2.8, max: 2.8, color, rot: Math.random() * TAU, kind: 1 });
    this.shake = Math.max(this.shake, 7);
    this.flashScreen(color, 0.14);
    sfx.explode();
    for (const e of this.enemies) {
      if (e.dead || e.controlledT > 0) continue;
      const d = hyp(e.x - x, e.y - y);
      if (d < r + e.r) {
        if (chill) e.chillT = Math.max(e.chillT, 2);
        const f = 1 - d / (r + e.r);
        this.damageEnemy(e, dmg * f, true, x, y);
      }
    }
    if (this.boss && !this.boss.dead) {
      const d = hyp(this.boss.x - x, this.boss.y - y);
      if (d < r + this.boss.r) this.damageBoss(this.boss, dmg * (1 - d / (r + this.boss.r)));
    }
    if (hurtPlayer) {
      const d = hyp(this.player.x - x, this.player.y - y);
      if (d < r * 0.8) this.hurtPlayer(dmg * (1 - d / (r * 0.8)), x, y);
    }
  }

  private damageEnemy(e: Enemy, dmg: number, fromPlayer: boolean, fx?: number, fy?: number) {
    if (e.dead) return;
    let mult = e.shield > 0 && fromPlayer ? 0.72 : 1;
    if (e.markT > 0) mult *= 1.25;
    // ESCUDEIRO: tiros vindos pela frente (cone de 70°) são quase anulados
    if (e.kind === "warden" && fromPlayer && fx !== undefined && fy !== undefined) {
      const toSrc = Math.atan2(fy - e.y, fx - e.x);
      let diff = toSrc - e.aim;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      if (Math.abs(diff) < 0.62) {
        mult *= 0.12;
        this.addParticle(e.x + Math.cos(toSrc) * e.r, e.y + Math.sin(toSrc) * e.r, Math.cos(toSrc) * 120, Math.sin(toSrc) * 120, 0.18, "#dde8ff", 3, 1, 1);
      }
    }
    e.hp -= dmg * mult * (e.curseT > 0 ? 1.5 : 1);
    e.hitFlash = 1;
    e.squash = 1;
    if (fx !== undefined && fy !== undefined) {
      const a = Math.atan2(e.y - fy, e.x - fx);
      e.vx += Math.cos(a) * 90 * mult; e.vy += Math.sin(a) * 90 * mult;
    }
    if (fromPlayer) {
      // only show numbers that matter — every hit was unreadable spam
      if (dmg >= 45 || e.hp <= 0) {
        this.addFloater(e.x, e.y - e.r - 4, `${Math.round(dmg)}`, dmg > 60 ? "#ffd23c" : "#ffffff", dmg > 60 ? 20 : 15);
      }
      sfx.hit();
    }
    if (e.hp <= 0) this.killEnemy(e, true);
  }

  private hurtPlayer(dmg: number, sx: number, sy: number) {
    const p = this.player;
    if (this.parryT > 0) {
      this.parryT = 0;
      const a = Math.atan2(sy - p.y, sx - p.x);
      for (let i = 0; i < 10; i++) {
        const spread = a + (i / 9 - 0.5) * 1.2;
        this.spawnPBullet(p.x, p.y, Math.cos(spread) * 1450, Math.sin(spread) * 1450, 48 * this.stats.dmgMul, 2, 0.9, 5, weaponById("katana"), true);
      }
      this.ripples.push({ x: p.x, y: p.y, r: 12, maxR: 160, life: 0.35, max: 0.35, color: "#ffffff", w: 6 });
      sfx.shot("rail");
      return;
    }
    if (this.invisT > 0) return;
    if (p.inv > 0 || !p.alive || this.status !== "playing") return;
    const red = this.titanT > 0
      ? 0.25
      : this.shieldT > 0
        ? 0.15
        : 1 - Math.min(0.75, (this.stats.armor + this.buffArmor + this.rageArmor) * 0.12);
    const protection = Math.min(
      red,
      this.mindGuardT > 0 ? 0.4 : 1,
      this.jediGuardT > 0 ? 0.5 : 1,
      this.cryoArmorT > 0 ? 0.35 : 1,
      this.shieldT > 0 ? this.shieldReduce : 1,
    );
    const final = Math.max(1, dmg * protection);
    if (this.dlc && this.cls.id === "necromante") this.storedKinetic = Math.min(140, this.storedKinetic + final * 0.35);
    p.hp -= final;
    p.inv = 0.62;
    p.safeT = 0;
    p.hurtT = 0.4;
    this.streak = 0;
    this.shake = Math.max(this.shake, 6);
    this.hitStop = Math.max(this.hitStop, 0.04);
    this.dmgVig = 1;
    this.flashScreen("#ff2a4d", 0.16);
    sfx.hurt();
    const a = Math.atan2(p.y - sy, p.x - sx);
    p.vx += Math.cos(a) * 220; p.vy += Math.sin(a) * 220;
    this.burst(p.x, p.y, "#ff2a4d", 16, 300);
    for (let i = 0; i < 5; i++) {
      this.addParticle(p.x, p.y, Math.cos(a + rnd(-1, 1)) * rnd(150, 400), Math.sin(a + rnd(-1, 1)) * rnd(150, 400), 0.5, "#ff5b8f", 3, 1.5, 1, 900);
    }
    if (p.hp <= 0) this.endRun();
  }

  private endRun() {
    const p = this.player;
    p.hp = 0; p.alive = false;
    this.explodeAt(p.x, p.y, 200, 0, "#4ff0ff", false);
    this.burst(p.x, p.y, "#ffffff", 90, 620);
    this.shake = 14;
    this.flashScreen("#ffffff", 0.6);
    this.timeScale = 0.28;
    this.status = "gameover";
    sfx.gameOver();
    this.cb.onGameOver({ score: this.score, wave: this.wave, kills: this.kills, time: this.runTime });
    this.cb.onStatus(this.status);
    this.publish(true);
  }

  private comboMul() { return 1 + Math.min(this.streak, 40) * 0.12; }

  /* ================= bullets ================= */

  private spawnEBullet(x: number, y: number, vx: number, vy: number, r: number, dmg: number, color: string, kind: EBulletKind, grow = 0, homing = 0) {
    for (let i = 0; i < this.eBullets.length; i++) {
      const idx = (i + this.eIdx) % this.eBullets.length;
      const b = this.eBullets[idx];
      if (!b.on) {
        this.eIdx = (idx + 1) % this.eBullets.length;
        b.on = true; b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.r = r; b.dmg = dmg;
        b.life = kind === "ring" ? 3.4 : 6; b.color = color; b.kind = kind;
        b.grow = grow; b.homing = homing; b.rot = Math.atan2(vy, vx); b.pool = false;
        return b;
      }
    }
    return null;
  }

  private tryDeflect(b: EBullet): boolean {
    if (this.cls.id !== "jedi" || b.kind === "ring" || b.pool) return false;
    const p = this.player;
    const guarded = this.jediGuardT > 0;
    const attacking = this.classWeapons[this.weaponIdx]?.id === "lightsaber" && p.muzzle > 0.08;
    if (!guarded && (!attacking || this.deflectCd > 0)) return false;
    const dx = b.x - p.x, dy = b.y - p.y, distance = hyp(dx, dy);
    if (distance > (guarded ? 90 : 62)) return false;
    if (!guarded && (dx * Math.cos(p.ang) + dy * Math.sin(p.ang)) / Math.max(1, distance) < 0.35) return false;
    if (dx * b.vx + dy * b.vy >= 0) return false;

    const target = this.nearestTargetFrom(b.x, b.y, 700);
    const angle = target ? Math.atan2(target.y - b.y, target.x - b.x) : Math.atan2(-b.vy, -b.vx);
    this.spawnPBullet(b.x, b.y, Math.cos(angle) * 1150, Math.sin(angle) * 1150,
      Math.max(16, Math.min(55, b.dmg * 2.5)) * this.stats.dmgMul, 0, 0.9, 4, weaponById("pulse"), false);
    b.on = false;
    this.deflectCd = 0.25;
    this.burst(b.x, b.y, "#c6ffe0", 4, 95);
    return true;
  }

  private updateBullets(dt: number, playerDt = dt) {
    const p = this.player;
    /* ----- player bullets vs enemies / boss ----- */
    for (const b of this.pBullets) {
      if (!b.on) continue;
      b.px = b.x; b.py = b.y;
      if (b.w.id === "saberThrow" && b.life < b.w.life - 0.45) {
        if (!b.returning) { b.returning = true; b.hitIds.length = 0; }
        const dx = p.x - b.x, dy = p.y - b.y, d = hyp(dx, dy);
        if (d < p.r + 17) { b.on = false; continue; }
        b.vx = dx / d * 1120; b.vy = dy / d * 1120;
      }
      b.x += b.vx * playerDt; b.y += b.vy * playerDt;
      b.life -= playerDt;
      if (b.life <= 0 || b.x < -80 || b.x > this.worldW + 80 || b.y < -80 || b.y > this.worldH + 80) {
        if (b.w.explosive && b.life <= 0) this.explodeAt(b.x, b.y, b.w.explosive.radius, b.w.explosive.dmg * this.stats.dmgMul, b.w.color, false, b.w.owner === "criomante");
        b.on = false;
        continue;
      }
      let consumed = false;
      // swept segment test — fast bullets must not tunnel through small targets
      const segX = b.x - b.px, segY = b.y - b.py;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead || e.spawnT > 0 || e.controlledT > 0) continue;
        const t = this.segHitT(b.px, b.py, segX, segY, e.x, e.y, e.r + b.w.hitRadius);
        if (t < 0) continue;
        if (b.hitIds.indexOf(e.id) >= 0) continue;
        b.x = b.px + segX * t; b.y = b.py + segY * t;
        b.hitIds.push(e.id);
        if (b.w.owner === "criomante") e.chillT = Math.max(e.chillT, 2);
        this.damageEnemy(e, b.dmg, true, b.px, b.py);
        if (b.w.kind === "blade") this.player.dashCd = Math.max(0, this.player.dashCd - 0.035);
        this.burst(b.x, b.y, b.w.color, b.crit ? 7 : 3, 230, Math.atan2(-b.vy, -b.vx), 0.7);
        if (b.w.explosive) {
          this.explodeAt(b.x, b.y, b.w.explosive.radius, b.w.explosive.dmg * this.stats.dmgMul, b.w.color, false, b.w.owner === "criomante");
          consumed = true;
          break;
        }
        if (b.w.chain) this.chainLightning(b.x, b.y, e, b.dmg * 0.5, b.w);
        if (b.pierce-- < 0) { consumed = true; break; }
      }
      if (consumed) { b.on = false; continue; }
      const bs = this.boss;
      if (bs && !bs.dead && bs.entering <= 0 && !b.hitIds.includes(-1) && this.segHitT(b.px, b.py, segX, segY, bs.x, bs.y, bs.r + b.w.hitRadius) >= 0) {
        b.hitIds.push(-1);
        this.damageBoss(bs, b.dmg);
        if (b.w.kind === "blade") this.player.dashCd = Math.max(0, this.player.dashCd - 0.035);
        this.burst(b.x, b.y, b.w.color, b.crit ? 8 : 3, 250, Math.atan2(-b.vy, -b.vx), 0.8);
        if (b.w.explosive) this.explodeAt(b.x, b.y, b.w.explosive.radius, b.w.explosive.dmg * this.stats.dmgMul, b.w.color, false);
        if (b.w.id !== "rail" && b.w.id !== "saberThrow") b.on = false;
      }
    }

    /* ----- enemy bullets ----- */
    for (const b of this.eBullets) {
      if (!b.on) continue;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (this.tryDeflect(b)) continue;
      if (b.homing > 0) {
        const a = Math.atan2(p.y - b.y, p.x - b.x);
        const sp = hyp(b.vx, b.vy);
        const ca = Math.atan2(b.vy, b.vx);
        let diff = a - ca;
        while (diff > Math.PI) diff -= TAU;
        while (diff < -Math.PI) diff += TAU;
        const na = ca + clamp(diff, -b.homing * dt, b.homing * dt);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      if (b.kind === "ring") {
        b.r += b.grow * dt;
        if (b.r > 700) { b.on = false; continue; }
        const dd = hyp(p.x - b.x, p.y - b.y);
        if (Math.abs(dd - b.r) < 15 + p.r * 0.5) {
          if (this.shieldT > 0) this.burst(b.x, b.y, "#7de6ff", 4, 120);
          else this.hurtPlayer(b.dmg, b.x, b.y);
          b.on = false;
        }
        continue;
      }
      b.life -= dt;
      if (b.life <= 0 || b.x < -80 || b.x > this.worldW + 80 || b.y < -80 || b.y > this.worldH + 80) {
        if (b.pool && b.life <= 0 && this.hazards.length < 14) {
          this.hazards.push({ x: b.x, y: b.y, r: 58, life: 5, max: 5, dps: 9, color: "#b7ff3c" });
          this.burst(b.x, b.y, "#b7ff3c", 8, 160);
        }
        b.on = false; continue;
      }
      const dd = hyp(b.x - p.x, b.y - p.y);
      if (dd < b.r + p.r * 0.8) {
        if (this.shieldT > 0) this.burst(b.x, b.y, "#7de6ff", 5, 150);
        else this.hurtPlayer(b.dmg, b.x, b.y);
        if (b.pool && this.hazards.length < 14) this.hazards.push({ x: b.x, y: b.y, r: 58, life: 5, max: 5, dps: 9, color: "#b7ff3c" });
        b.on = false;
        this.burst(b.x, b.y, b.color, 10, 220);
        continue;
      }
      if (b.kind !== "shard" && Math.random() < dt * 9 && this.nParts < 380) {
        this.addParticle(b.x, b.y, rnd(-14, 14), rnd(-14, 14), 0.18, b.color, b.r * 0.55, 0, 0);
      }
    }
  }

  /** segment(px,py)->(px+dx,py+dy) vs circle; returns t in [0,1] or -1 */
  private segHitT(px: number, py: number, dx: number, dy: number, cx: number, cy: number, r: number): number {
    const len2 = dx * dx + dy * dy;
    if (len2 < 0.0001) {
      const ex = cx - px, ey = cy - py;
      return ex * ex + ey * ey <= r * r ? 0 : -1;
    }
    let t = ((cx - px) * dx + (cy - py) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const hx = px + dx * t - cx, hy = py + dy * t - cy;
    return hx * hx + hy * hy <= r * r ? t : -1;
  }

  /** after death: bullets keep flying, damage is disabled */
  private updateBulletsDrain(dt: number) {
    for (const b of this.pBullets) {
      if (!b.on) continue;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) b.on = false;
    }
    for (const b of this.eBullets) {
      if (!b.on) continue;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.kind === "ring") { b.r += b.grow * dt; if (b.r > 700) { b.on = false; continue; } }
      b.life -= dt;
      if (b.life <= 0) b.on = false;
    }
    for (const e of this.enemies) e.t += dt;
  }

  private chainLightning(x: number, y: number, src: Enemy, dmg: number, w: WeaponDef) {
    if (!w.chain) return;
    let cx = x, cy = y;
    const hit = new Set<number>([src.id]);
    for (let j = 0; j < w.chain.jumps; j++) {
      let target: Enemy | null = null, bd = w.chain.range;
      for (const e of this.enemies) {
        if (e.dead || e.controlledT > 0 || hit.has(e.id)) continue;
        const d = hyp(e.x - cx, e.y - cy);
        if (d < bd) { bd = d; target = e; }
      }
      if (!target) break;
      this.zap(cx, cy, target.x, target.y, w.color);
      this.damageEnemy(target, dmg * (1 - j * 0.18), true, cx, cy);
      hit.add(target.id);
      cx = target.x; cy = target.y;
    }
  }

  private zap(x1: number, y1: number, x2: number, y2: number, color: string) {
    const segs = 7;
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const jx = rnd(-11, 11), jy = rnd(-11, 11);
      this.addParticle(
        x1 + (x2 - x1) * t0 + jx, y1 + (y2 - y1) * t0 + jy,
        (x2 - x1) * 0.4, (y2 - y1) * 0.4, 0.18, color, 4.5, 0, 2, 0, 0.9,
      );
    }
  }

  /* ================= boss ================= */

  private damageBoss(b: Boss, dmg: number) {
    b.hp -= dmg;
    b.hitFlash = 1;
    if (dmg >= 45) this.addFloater(b.x + rnd(-24, 24), b.y - b.r - 6, `${Math.round(dmg)}`, dmg > 140 ? "#ffd23c" : "#ffffff", 19);
    sfx.hit();
    if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
      b.phase = 2;
      b.tele = 0.7;
      this.setBanner("FASE 2", b.def.name + " ENFURECEU", b.def.accent, 2);
      this.flashScreen(b.def.color, 0.5);
      this.shake = 20;
      this.eBullets.forEach((eb) => { if (eb.on) { eb.on = false; this.burst(eb.x, eb.y, eb.color, 4, 120); } });
      sfx.bossWarn();
    }
    if (b.hp <= 0) this.killBoss(b);
  }

  private killBoss(b: Boss) {
    b.dead = true;
    this.score += Math.round(b.def.score * this.comboMul() * this.stats.mulReward);
    this.addFloater(b.x, b.y - 40, `+${Math.round(b.def.score * this.comboMul()).toLocaleString()}`, "#ffd23c", 30);
    this.boss = null;
    this.timeScale = 0.25;
    this.hitStop = 0.12;
    this.shake = 18;
    this.flashScreen("#ffffff", 0.8);
    this.setBanner("ALVO ELIMINADO", b.def.name + " DESTRUÍDO", b.def.color, 2.4);
    for (let i = 0; i < 9; i++) {
      this.scheduled.push({
        t: i * 0.09,
        x: b.x + rnd(-90, 90), y: b.y + rnd(-90, 90),
        r: 110, color: pick([b.def.color, "#ffffff", "#ffd23c"]),
      });
    }
    for (let i = 0; i < 4; i++) {
      this.pickups.push({ x: b.x + rnd(-60, 60), y: b.y + rnd(-40, 40), vx: rnd(-60, 60), vy: rnd(-90, -20), life: 22, kind: i === 0 ? "hp" : "ammo", weapon: 0, color: i === 0 ? "#3cff8f" : "#ffd23c", t: 0 });
    }

    this.enemies.forEach((e) => { this.burst(e.x, e.y, ENEMY_DEFS[e.kind].color, 12, 240); this.killEnemy(e, true); });
    this.enemies = [];
    this.beams = [];
    this.marks = [];
    for (const eb of this.eBullets) {
      if (!eb.on) continue;
      this.burst(eb.x, eb.y, eb.color, 3, 90);
      eb.on = false;
    }
    this.zoom = 1.06;
    sfx.explode();
    sfx.levelUp();
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    if (!b) return;
    b.t += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt * 4);
    b.spin += dt * (b.phase === 2 ? 1.6 : 0.9);
    const p = this.player;
    if (b.entering > 0) {
      b.entering -= dt;
      b.y += (this.player.y - this.H * 0.22 - b.y) * Math.min(1, dt * 3);
      b.x += (this.player.x - b.x) * Math.min(1, dt * 3);
      return;
    }
    const ang = Math.atan2(p.y - b.y, p.x - b.x);
    b.ang += (ang - b.ang) * Math.min(1, dt * 2.5);
    const dist = hyp(p.x - b.x, p.y - b.y);
    const want = 240;
    const tx = Math.cos(ang) * (dist > want ? 92 : -70) - Math.sin(ang) * 62 * Math.sin(b.t * 0.5);
    const ty = Math.sin(ang) * (dist > want ? 92 : -70) + Math.cos(ang) * 62 * Math.sin(b.t * 0.5);
    b.vx += (tx - b.vx) * dt * 2.2; b.vy += (ty - b.vy) * dt * 2.2;
    b.x = clamp(b.x + b.vx * dt, b.r + 20, this.worldW - b.r - 20);
    b.y = clamp(b.y + b.vy * dt, b.r + 20, this.worldH - b.r - 20);

    if (b.tele > 0) { b.tele -= dt; return; }
    b.atkT -= dt;
    if (b.atkT > 0) return;

    const speedMul = b.phase === 2 ? 1.35 : 1;
    const pattern = (b.atk + (b.phase === 2 ? 1 : 0)) % 4;
    b.atk++;
    const id = b.idx;
    const hard = 1 + this.wave * 0.03;

    if (pattern === 0) {
      // spiral burst
      const n = 14 + id * 2 + (b.phase === 2 ? 6 : 0);
      for (let ring = 0; ring < 3; ring++) {
        for (let i = 0; i < n; i++) {
          const a = b.spin + (i / n) * TAU + ring * 0.18;
          const sp = (150 + ring * 46) * speedMul;
          this.scheduled.push({
            t: ring * 0.11, bullet: true, sp,
            ang: a, dmg: 11 * hard, color: b.def.color, owner: b,
          });
        }
      }
      this.ripples.push({ x: b.x, y: b.y, r: b.r, maxR: b.r * 4, life: 0.4, max: 0.4, color: b.def.color, w: 5 });
      this.shake = Math.max(this.shake, 6);
      sfx.shot("scatter");
      b.atkT = 2.0 / speedMul;
    } else if (pattern === 1) {
      // shockwave rings
      for (let i = 0; i < (b.phase === 2 ? 3 : 2); i++) {
        const ring = this.spawnEBullet(b.x, b.y, 0, 0, b.r * 0.7, 13 * hard, b.def.accent, "ring", 260 + i * 55, 0);
        void ring;
      }
      this.shake = Math.max(this.shake, 8);
      sfx.explode();
      b.atkT = 2.3 / speedMul;
    } else if (pattern === 2) {
      // sweeping beams
      const count = b.phase === 2 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        this.beams.push({
          x: b.x, y: b.y, ang: ang + (i - (count - 1) / 2) * 0.42, len: 2200, w: 26,
          tele: 0.85, fire: 1.5, color: b.def.color, dmg: 16 * hard, fromBoss: true, spin: (i % 2 === 0 ? 1 : -1) * 0.5,
        });
      }
      sfx.bossWarn();
      b.atkT = 2.6 / speedMul;
    } else {
      // charge + spawn adds
      const a = ang;
      b.vx = Math.cos(a) * 720 * speedMul; b.vy = Math.sin(a) * 720 * speedMul;
      for (let i = 0; i < 2 + id; i++) {
        const aa = Math.random() * TAU;
        this.spawnEnemy(pick<EnemyKind>(["drone", "grunt", "shooter"]), b.x + Math.cos(aa) * 70, b.y + Math.sin(aa) * 70, false);
      }
      for (let i = 0; i < 12; i++) {
        const sp = this.spawnEBullet(b.x, b.y, Math.cos(a + rnd(-0.3, 0.3)) * 420, Math.sin(a + rnd(-0.3, 0.3)) * 420, 7, 10 * hard, b.def.accent, "shard");
        void sp;
      }
      this.shake = Math.max(this.shake, 10);
      b.atkT = 2.1 / speedMul;
      // lingering flame trail
      b.sub = 0.7;
    }

    if (b.sub > 0) {
      b.sub -= dt;
      this.burst(b.x, b.y, b.def.color, 2, 120);
    }
    if (dist < b.r + p.r) this.hurtPlayer(20, b.x, b.y);
  }

  private updateBeams(dt: number) {
    const p = this.player;
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const bm = this.beams[i];
      if (bm.tele > 0) {
        bm.tele -= dt;
        if (bm.tele <= 0) sfx.shot("rail");
      } else if (bm.fire > 0) {
        bm.fire -= dt;
        bm.ang += bm.spin * dt;
        if (bm.fromBoss && this.boss) { bm.x = this.boss.x; bm.y = this.boss.y; }
        // hit test: distance from point to ray
        const dx = Math.cos(bm.ang), dy = Math.sin(bm.ang);
        const rx = p.x - bm.x, ry = p.y - bm.y;
        const proj = rx * dx + ry * dy;
        if (proj > 0 && proj < bm.len) {
          const perp = Math.abs(rx * dy - ry * dx);
          if (perp < bm.w * 0.5 + p.r * 0.6) this.hurtPlayer(bm.dmg, bm.x + dx * proj, bm.y + dy * proj);
        }
        if (Math.random() < dt * 40) {
          const t = Math.random();
          this.addParticle(bm.x + dx * bm.len * t, bm.y + dy * bm.len * t, rnd(-40, 40), rnd(-40, 40), 0.3, bm.color, 4, 0, 1.4);
        }
      } else this.beams.splice(i, 1);
    }
  }

  /* ================= particles / fx ================= */

  /** compact particle pool: only [0, nParts) are alive */
  private addParticle(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, kind = 0, glow = 1, grav = 0, drag = 3.4) {
    if (this.nParts >= this.particles.length) return;
    const p = this.particles[this.nParts++];
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.max = life; p.color = color; p.size = size;
    p.kind = kind; p.glow = glow; p.grav = grav; p.drag = drag;
    p.rot = Math.random() * TAU; p.spin = rnd(-9, 9);
  }

  private burst(x: number, y: number, color: string, n: number, spd: number, dir?: number, cone = 3.14) {
    let count = Math.round(n * this.quality);
    if (this.nParts + count > this.particles.length) count = Math.max(0, this.particles.length - this.nParts);
    if (this.status === "playing" && this.enemies.length > 26) count = Math.min(count, 22);
    for (let i = 0; i < count; i++) {
      const a = dir !== undefined ? dir + rnd(-cone, cone) : Math.random() * TAU;
      const s = rnd(spd * 0.25, spd);
      const c = Math.cos(a), sn = Math.sin(a);
      this.addParticle(x, y, c * s, sn * s, rnd(0.2, 0.6), i % 4 === 0 ? "#ffffff" : color, rnd(1.6, 4.4), Math.random() < 0.35 ? 1 : 0, 1);
    }
  }

  private addFloater(x: number, y: number, text: string, color: string, size: number) {
    if (this.floaters.length > 26) this.floaters.shift();
    this.floaters.push({ x, y, vy: -52, life: 0.75, max: 0.75, text, color, size });
  }

  private flashScreen(color: string, a: number) {
    this.flashColor = color;
    this.flash = Math.max(this.flash, a);
  }

  private updateParticles(dt: number) {
    const parts = this.particles;
    for (let i = 0; i < this.nParts; i++) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        // swap-remove: keeps the live block compact
        const last = parts[--this.nParts];
        parts[this.nParts] = p;
        parts[i] = last;
        i--;
        continue;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy *= d;
      p.vy += p.grav * dt;
      p.rot += p.spin * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt; f.y += f.vy * dt; f.vy *= 0.94;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].life -= dt;
      if (this.decals[i].life <= 0) this.decals.splice(i, 1);
    }
    if (this.decals.length > 34) this.decals.splice(0, this.decals.length - 34);
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life -= dt;
      r.r += (r.maxR - r.r) * Math.min(1, dt * 9);
      if (r.life <= 0) this.ripples.splice(i, 1);
    }
    if (this.streakT > 0) {
      this.streakT -= dt;
      if (this.streakT <= 0) this.streak = 0;
    }
  }

  private updatePickups(dt: number) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const it = this.pickups[i];
      it.t += dt;
      it.life -= dt;
      const d = hyp(p.x - it.x, p.y - it.y);
      const pr = this.stats.pickupRadius;
      if (d < pr) {
        const a = Math.atan2(p.y - it.y, p.x - it.x);
        const pull = clamp((pr - d) / pr, 0, 1) * 900;
        it.vx += Math.cos(a) * pull * dt; it.vy += Math.sin(a) * pull * dt;
      }
      it.x += it.vx * dt; it.y += it.vy * dt;
      it.vx *= Math.pow(0.15, dt); it.vy *= Math.pow(0.15, dt);
      if (d < p.r + 16) {
        this.applyPickup(it);
        this.pickups.splice(i, 1);
        continue;
      }
      if (it.life <= 0) this.pickups.splice(i, 1);
    }
  }

  private applyPickup(it: Pickup) {
    const p = this.player;
    if (it.kind === "hp") {
      p.hp = Math.min(p.maxHp, p.hp + 26);
      this.toast("+26 VIDA", "#3cff8f");
    } else if (it.kind === "ammo") {
      const wd = this.classWeapons[this.weaponIdx];
      if (wd && wd.ammoClip > 0) {
        this.ammo[this.weaponIdx] = Math.min(wd.ammoClip, this.ammo[this.weaponIdx] + Math.ceil(wd.ammoClip * 0.4));
        this.addFloater(p.x, p.y - 26, "+" + Math.ceil(wd.ammoClip * 0.4) + " MUNIÇÃO", "#ffd23c", 14);
      } else {
        let any = -1;
        for (let i = 0; i < this.classWeapons.length; i++) if (this.owned[i] && this.ammo[i] < this.classWeapons[i].ammoClip) { any = i; break; }
        if (any >= 0) this.ammo[any] = Math.min(this.classWeapons[any].ammoClip, this.ammo[any] + Math.ceil(this.classWeapons[any].ammoClip * 0.35));
        else this.score += 150;
      }
    } else if (it.kind === "weapon") {
      // weapons are class-fixed now: crates refill ammo for the whole kit instead
      for (let i = 0; i < this.classWeapons.length; i++) {
        const wd = this.classWeapons[i];
        if (wd.ammoClip > 0) this.ammo[i] = Math.min(wd.ammoClip, this.ammo[i] + Math.ceil(wd.ammoClip * 0.5));
      }
      this.toast("MUNIÇÃO REABASTECIDA", "#ffd23c");
    }
    sfx.pickup();
    this.burst(it.x, it.y, it.color, 12, 200);
  }

  private updateWave(dt: number) {
    const cleared = this.waveActive && this.spawnBudget <= 0 && !this.enemies.some((e) => !e.dead && e.controlledT <= 0) && !this.boss && this.marks.length === 0;
    if (cleared) {
      for (const e of this.enemies) if (e.controlledT > 0) e.dead = true;
      this.waveActive = false;
      const bonus = 300 * this.wave;
      this.score += bonus;
      this.setBanner(`ONDA ${String(this.wave).padStart(2, "0")} LIMPA`, `BÔNUS +${bonus}`, "#4ff0ff", 1.4);
      this.waveFlashT = 0.9;
      sfx.levelUp();
      this.flashScreen("#4ff0ff", 0.2);
      this.waveRestT = 1.0;
      this.warmUpcomingSector();
      this.publish(true);
      this.offerUpgrades();
    }
    if (!this.waveActive && this.status === "playing" && this.cards.length === 0) {
      this.waveRestT -= dt;
      if (this.waveRestT <= 0) this.nextWave();
    }
  }

  /* ================= render ================= */

  private glowSprite(color: string) {
    let c = this.glowCache.get(color);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.18, color);
    grad.addColorStop(0.5, this.hexA(color, 0.28));
    grad.addColorStop(1, this.hexA(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    this.glowCache.set(color, c);
    return c;
  }

  private hexCache = new Map<string, string>();
  private hexA(hex: string, a: number) {
    const q = Math.round(a * 40) / 40;
    const key = hex + (q * 100 | 0);
    const got = this.hexCache.get(key);
    if (got) return got;
    const made = this.hexARaw(hex, q);
    if (this.hexCache.size < 400) this.hexCache.set(key, made);
    return made;
  }

  private hexARaw(hex: string, a: number) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  private glow(x: number, y: number, size: number, color: string, alpha = 1) {
    if (!(size > 0.4) || !(alpha > 0.02)) return;
    if (!isFinite(x) || !isFinite(y) || !isFinite(size)) return;
    if (this.glowBudget <= 0) return;
    this.glowBudget--;
    const ctx = this.ctx;
    const s = size > 340 ? 340 : size;
    ctx.globalAlpha = alpha > 1 ? 1 : alpha;
    ctx.drawImage(this.glowSprite(color), x - s, y - s, s * 2, s * 2);
    ctx.globalAlpha = 1;
  }

  private render(dt: number) {
    const ctx = this.ctx;
    const { W, H } = this;
    // hard cap on additive glow blits per frame (biggest fill-rate cost)
    this.glowBudget = this.quality > 0.9 ? 150 : this.quality > 0.7 ? 80 : 34;
    ctx.setTransform(this.pxScale, 0, 0, this.pxScale, 0, 0);

    // base fill (screen space) — the world plate is drawn inside the camera
    ctx.fillStyle = this.biome().sky;
    ctx.fillRect(0, 0, W, H);
    // estrelas em parallax (camada de fundo, se move a 35% da câmera): profundidade barata
    if (this.quality > 0.6 && this.status !== "menu") this.drawStars();

    const sh = this.shake;
    const z = this.zoom;
    ctx.save();
    if (Math.abs(z - 1) > 0.001) {
      ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    }
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY));
    this.drawWorld();
    if (sh > 0.1) {
      const a = this.shakeAng;
      ctx.translate(
        Math.cos(a * 2.7) * sh + rnd(-sh, sh) * 0.5,
        Math.sin(a * 3.9) * sh + rnd(-sh, sh) * 0.5,
      );
      ctx.rotate(Math.sin(a * 4.1) * sh * 0.0009);
    }

    this.drawDecals();
    this.drawHazards();
    this.drawRipples();
    this.drawSpawnMarks();
    this.drawPickups();
    if (this.status !== "menu" || this.demoActive) {
      this.drawBeams();
      this.drawMeteors();
      this.drawEnemies();
      this.drawBoss();
      this.drawDrones();
      this.drawExpansionEffects();
      this.drawClassGadgets();
      if (this.player.alive) this.drawPlayer();
      this.drawBullets();
    }
    this.drawParticles();
    this.drawFloaters();
    ctx.restore();

    this.drawMinimap();
    this.drawOverlays(dt);
    this.drawReticle();
    if (this.touchMode && (this.status === "playing" || this.status === "paused")) this.drawTouchUI();
    this.drawBanner();
    this.drawGoAndEdge();
    this.drawToasts();
  }

  /** radial speed streaks while boosting — cheap lines, huge feel payoff */
  private drawStars() {
    const ctx = this.ctx;
    if (!this.starTile) {
      const t = document.createElement("canvas");
      t.width = 256; t.height = 256;
      const tc = t.getContext("2d")!;
      let seed = 99991;
      const r01 = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < 46; i++) {
        const x = r01() * 256, y = r01() * 256, sz = r01() < 0.15 ? 2 : 1;
        tc.globalAlpha = 0.25 + r01() * 0.55;
        tc.fillStyle = i % 7 === 0 ? "#9fd8ff" : "#ffffff";
        tc.fillRect(x, y, sz, sz);
      }
      this.starTile = t;
      this.starPattern = ctx.createPattern(t, "repeat");
    }
    if (!this.starPattern) return;
    const ox = -(this.camX * 0.35) % 256, oy = -(this.camY * 0.35) % 256;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = this.starPattern;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-ox, -oy, this.W + 256, this.H + 256);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawWorld() {
    const { ctx } = this;
    const B = this.biome();
    const plate = this.bgPlate;
    if (plate) {
      // Só a região visível da câmera: amostra ~2x menos textura por frame
      // do que blitar o mundo inteiro escalado.
      const k = plate.width / this.worldW;
      const m = 40; // margem para shake/zoom
      const sx = Math.max(0, (this.camX - m) * k);
      const sy = Math.max(0, (this.camY - m) * k);
      const sw = Math.min(plate.width - sx, (this.W + m * 2) * k);
      const sh = Math.min(plate.height - sy, (this.H + m * 2) * k);
      if (sw > 1 && sh > 1) {
        ctx.drawImage(plate, sx, sy, sw, sh, sx / k, sy / k, sw / k, sh / k);
      }
    } else {
      ctx.fillStyle = B.floor;
      ctx.fillRect(this.camX - 40, this.camY - 40, this.W + 80, this.H + 80);
    }

    // arena border (world space)
    ctx.strokeStyle = `rgba(${B.grid},0.18)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, this.worldW - 16, this.worldH - 16);
    ctx.strokeStyle = this.player.hp / this.player.maxHp < 0.34 ? "rgba(255,60,90,0.4)" : B.accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 3;
    const cl = 46;
    ctx.beginPath();
    ctx.moveTo(8, 8 + cl); ctx.lineTo(8, 8); ctx.lineTo(8 + cl, 8);
    ctx.moveTo(this.worldW - 8 - cl, 8); ctx.lineTo(this.worldW - 8, 8); ctx.lineTo(this.worldW - 8, 8 + cl);
    ctx.moveTo(this.worldW - 8, this.worldH - 8 - cl); ctx.lineTo(this.worldW - 8, this.worldH - 8); ctx.lineTo(this.worldW - 8 - cl, this.worldH - 8);
    ctx.moveTo(8 + cl, this.worldH - 8); ctx.lineTo(8, this.worldH - 8); ctx.lineTo(8, this.worldH - 8 - cl);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** minimap: the arena is bigger than the screen, so show where everything is */
  private drawMinimap() {
    if (this.status === "menu") return;
    const ctx = this.ctx;
    // mundo é 2.4x a tela: o minimapa fica maior e no canto inferior central
    const mw = Math.min(176, this.W * 0.26);
    const mh = mw * (this.worldH / this.worldW);
    const x = (this.W - mw) / 2;
    const y = this.H - mh - (this.touchMode ? 100 : 64);
    if (y < 100) return;
    const sx = mw / this.worldW, sy = mh / this.worldH;
    const B = this.biome();
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "rgba(4,4,12,0.78)";
    ctx.fillRect(x, y, mw, mh);
    // moldura com cantos do bioma
    ctx.strokeStyle = this.hexA(B.accent, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, mw - 1, mh - 1);
    ctx.lineWidth = 2;
    const cl = 8;
    ctx.beginPath();
    ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y);
    ctx.moveTo(x + mw - cl, y); ctx.lineTo(x + mw, y); ctx.lineTo(x + mw, y + cl);
    ctx.moveTo(x + mw, y + mh - cl); ctx.lineTo(x + mw, y + mh); ctx.lineTo(x + mw - cl, y + mh);
    ctx.moveTo(x + cl, y + mh); ctx.lineTo(x, y + mh); ctx.lineTo(x, y + mh - cl);
    ctx.stroke();
    // janela da câmera
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + this.camX * sx, y + this.camY * sy, this.W * sx, this.H * sy);
    // poças e gadgets
    ctx.fillStyle = "rgba(183,255,60,0.5)";
    for (const h of this.hazards) ctx.fillRect(x + h.x * sx - 1.5, y + h.y * sy - 1.5, 3, 3);
    ctx.fillStyle = "#38d6a5";
    for (const t of this.turrets) ctx.fillRect(x + t.x * sx - 1.5, y + t.y * sy - 1.5, 3, 3);
    // hostis (healer e warden destacados — alvos táticos)
    for (const e of this.enemies) {
      if (e.dead || e.controlledT > 0) continue;
      const big = e.kind === "healer" || e.kind === "warden" || e.kind === "heavy" || e.elite;
      ctx.fillStyle = e.kind === "healer" ? "#6cff9e" : e.kind === "warden" ? "#8fb4ff" : "#ff3b5c";
      const sz = big ? 3 : 2;
      ctx.fillRect(x + e.x * sx - sz / 2, y + e.y * sy - sz / 2, sz, sz);
    }
    if (this.boss && !this.boss.dead) {
      ctx.fillStyle = this.boss.def.color;
      ctx.fillRect(x + this.boss.x * sx - 3, y + this.boss.y * sy - 3, 6, 6);
    }
    ctx.fillStyle = "#3cff8f";
    for (const it of this.pickups) ctx.fillRect(x + it.x * sx - 1, y + it.y * sy - 1, 2, 2);
    // portal
    if (this.portal) {
      ctx.fillStyle = "#7de6ff";
      ctx.fillRect(x + this.portal.ax * sx - 2, y + this.portal.ay * sy - 2, 4, 4);
      ctx.fillRect(x + this.portal.bx * sx - 2, y + this.portal.by * sy - 2, 4, 4);
    }
    // jogador: ponto maior com direção
    const px = x + this.player.x * sx, py = y + this.player.y * sy;
    ctx.fillStyle = this.cls.color;
    ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = this.cls.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(this.player.ang) * 7, py + Math.sin(this.player.ang) * 7); ctx.stroke();
    ctx.restore();
  }
  private drawDecals() {
    const ctx = this.ctx;
    for (const d of this.decals) {
      const a = (d.life / d.max) * 0.35;
      ctx.globalAlpha = a;
      ctx.fillStyle = d.color;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      if (d.kind === 0) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * TAU;
          const r = d.r * (0.7 + Math.sin(i * 2.3) * 0.25);
          ctx[i ? "lineTo" : "moveTo"](Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, d.r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  private drawRipples() {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "lighter";
    for (const r of this.ripples) {
      const a = r.life / r.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = a * 0.75;
      ctx.lineWidth = r.w * a + 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawSpawnMarks() {
    const ctx = this.ctx;
    for (const m of this.marks) {
      const k = 1 - clamp(m.t / 0.75, 0, 1);
      const def = ENEMY_DEFS[m.kind];
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(this.time * 3);
      ctx.globalAlpha = 0.35 + k * 0.55;
      ctx.strokeStyle = m.elite ? "#ffffff" : def.color;
      ctx.lineWidth = 2;
      const r = 60 * (1 - k) + 12;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + 1.2) * r, Math.sin(a + 1.2) * r);
      }
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = k;
      this.glow(m.x, m.y, 30 + k * 26, def.color, 0.35);
      ctx.globalAlpha = 1;
    }
  }

  private drawPickups() {
    const ctx = this.ctx;
    for (const it of this.pickups) {
      const bob = Math.sin(it.t * 5) * 3;
      const blink = it.life < 3 ? (Math.sin(it.t * 22) > 0 ? 0.35 : 1) : 1;
      ctx.save();
      ctx.translate(it.x, it.y + bob);
      ctx.globalAlpha = blink;
      ctx.globalCompositeOperation = "lighter";
      this.glow(0, 0, 26, it.color, 0.55);
      ctx.globalCompositeOperation = "source-over";
      ctx.rotate(it.t * 1.5);
      ctx.strokeStyle = it.color;
      ctx.fillStyle = this.hexA(it.color, 0.2);
      ctx.lineWidth = 2;
      ctx.beginPath();
      const sides = it.kind === "weapon" ? 6 : it.kind === "hp" ? 4 : 3;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * TAU;
        ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * 13, Math.sin(a) * 13);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.rotate(-it.t * 1.5);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 13px 'Chakra Petch', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = it.kind === "hp" ? "+" : it.kind === "ammo" ? "»" : "»";
      ctx.fillText(label, 0, 1);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  private drawEnemies() {
    const ctx = this.ctx;
    for (const e of this.enemies) {
      const def = ENEMY_DEFS[e.kind];
      const s = e.spawnT > 0 ? 1 - e.spawnT / 0.34 : 1;
      const scale = 0.3 + 0.7 * s;
      const ang = Math.atan2(e.vy, e.vx);
      // glow only where it reads: big units, elites, and anything just struck
      const wantGlow = e.r > 20 || (e.elite && this.quality > 0.75);
      if (wantGlow) {
        ctx.globalCompositeOperation = "lighter";
        this.glow(e.x, e.y, e.r * (this.quality > 0.8 ? 3.2 : 2.4), def.color, 0.26 + e.hitFlash * 0.4);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.globalAlpha = clamp(s, 0.1, 1);
      ctx.rotate(ang);
      ctx.scale(scale * (1 + e.squash * 0.25), scale * (1 - e.squash * 0.18));
      const col = e.hitFlash > 0.25 ? "#ffffff" : e.controlledT > 0 ? "#f292cf" : e.chillT > 0 ? "#9ddfff" : def.color;
      ctx.fillStyle = this.hexA(col, 0.9);
      ctx.strokeStyle = e.hitFlash > 0.25 ? "#ffffff" : def.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      switch (e.kind) {
        case "drone":
        case "shard":
          ctx.moveTo(e.r * 1.4, 0); ctx.lineTo(-e.r * 0.7, e.r * 0.85); ctx.lineTo(-e.r * 0.2, 0); ctx.lineTo(-e.r * 0.7, -e.r * 0.85);
          break;
        case "shooter":
          ctx.moveTo(e.r, 0); ctx.lineTo(0, e.r); ctx.lineTo(-e.r, 0); ctx.lineTo(0, -e.r);
          break;
        case "heavy":
          for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.4; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * e.r, Math.sin(a) * e.r); }
          break;
        case "bomber": {
          const pulse = 1 + Math.sin(e.t * (8 + e.charge * 26)) * 0.12 + e.charge * 0.15;
          ctx.arc(0, 0, e.r * pulse, 0, TAU);
          break;
        }
        case "sniper":
          ctx.moveTo(e.r * 1.6, 0); ctx.lineTo(-e.r * 0.5, e.r * 0.6); ctx.lineTo(-e.r * 0.9, 0); ctx.lineTo(-e.r * 0.5, -e.r * 0.6);
          break;
        case "orbiter":
          ctx.arc(0, 0, e.r, 0.5, TAU - 0.5); ctx.lineTo(0, 0);
          break;
        case "summoner":
          for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; const rr = i % 2 ? e.r * 0.55 : e.r * 1.25; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
          break;
        case "charger": {
          // cunha pesada com "chifres": comprida quando investe
          const k = e.charge > 0 ? 1.45 : e.tele > 0 ? 0.85 : 1;
          ctx.moveTo(e.r * 1.5 * k, 0); ctx.lineTo(e.r * 0.3, -e.r); ctx.lineTo(-e.r * 0.9, -e.r * 0.7);
          ctx.lineTo(-e.r * 0.6, 0); ctx.lineTo(-e.r * 0.9, e.r * 0.7); ctx.lineTo(e.r * 0.3, e.r);
          break;
        }
        case "healer":
          // cruz dentro de um disco
          ctx.arc(0, 0, e.r, 0, TAU);
          break;
        case "warden":
          // corpo + placa frontal larga
          ctx.moveTo(e.r * 0.6, -e.r * 1.25); ctx.lineTo(e.r * 0.95, -e.r * 1.1); ctx.lineTo(e.r * 0.95, e.r * 1.1);
          ctx.lineTo(e.r * 0.6, e.r * 1.25); ctx.lineTo(-e.r * 0.9, e.r * 0.7); ctx.lineTo(-e.r * 0.9, -e.r * 0.7);
          break;
        case "phantom":
          // losango alongado e fino
          ctx.moveTo(e.r * 1.3, 0); ctx.lineTo(0, e.r * 0.7); ctx.lineTo(-e.r * 1.3, 0); ctx.lineTo(0, -e.r * 0.7);
          break;
        case "spitter":
          // gota com bico
          ctx.moveTo(e.r * 1.5, 0);
          ctx.quadraticCurveTo(e.r * 0.4, e.r * 1.1, -e.r * 0.8, e.r * 0.8);
          ctx.quadraticCurveTo(-e.r * 1.2, 0, -e.r * 0.8, -e.r * 0.8);
          ctx.quadraticCurveTo(e.r * 0.4, -e.r * 1.1, e.r * 1.5, 0);
          break;
        default:
          for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * e.r, Math.sin(a) * e.r); }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // inner detail (single path: dark socket + accent node)
      ctx.globalAlpha *= 0.9;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.34, 0, TAU);
      ctx.fillStyle = e.hitFlash > 0.25 ? "#ff0044" : "#08060f";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.r * 0.42, 0, e.r * 0.14, 0, TAU);
      ctx.fillStyle = def.accent;
      ctx.fill();

      if (e.kind === "healer") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-e.r * 0.5, 0); ctx.lineTo(e.r * 0.5, 0);
        ctx.moveTo(0, -e.r * 0.5); ctx.lineTo(0, e.r * 0.5);
        ctx.stroke();
      }
      if (e.kind === "warden") {
        // placa de escudo brilhante na frente
        ctx.fillStyle = this.hexA("#dde8ff", 0.85);
        ctx.fillRect(e.r * 0.95, -e.r * 1.1, e.r * 0.3, e.r * 2.2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(e.r * 0.95, -e.r * 1.1, e.r * 0.3, e.r * 2.2);
      }
      if (e.kind === "charger" && e.tele > 0) {
        // linha de mira da investida: avisa o jogador
        ctx.rotate(-ang + e.aim);
        ctx.strokeStyle = this.hexA("#ff7a1a", 0.35 + (1 - e.tele / 0.65) * 0.5);
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(e.r, 0); ctx.lineTo(520, 0); ctx.stroke();
        ctx.setLineDash([]);
        ctx.rotate(ang - e.aim);
      }
      if (e.shield === 1) {
        ctx.strokeStyle = this.hexA("#ffd23c", 0.4 + Math.sin(this.time * 4) * 0.14);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.r * 1.42, -0.9, 0.9);
        ctx.stroke();
      }
      if (e.elite) {
        ctx.rotate(-ang + this.time * 1.6);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, e.r * 1.6, 0, 1.2);
        ctx.arc(0, 0, e.r * 1.6, Math.PI, Math.PI + 1.2);
        ctx.stroke();
      }
      ctx.restore();

      // hp bar for big ones
      if (e.controlledT > 0 || e.chillT > 0 || e.stunT > 0) {
        ctx.strokeStyle = e.controlledT > 0 ? "#f292cf" : "#bcecff";
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, TAU); ctx.stroke();
        if (e.controlledT > 0) {
          ctx.fillStyle = "#ffe2f3";
          ctx.font = "700 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("ALIADO", e.x, e.y - e.r - 12);
        }
        ctx.globalAlpha = 1;
      }
      if ((e.maxHp > 80 || e.elite) && e.hp < e.maxHp) {
        const w = e.r * 2.2;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(e.x - w / 2, e.y - e.r - 12, w, 4);
        ctx.fillStyle = def.accent;
        ctx.fillRect(e.x - w / 2, e.y - e.r - 12, w * clamp(e.hp / e.maxHp, 0, 1), 4);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }

  private drawBoss() {
    const b = this.boss;
    if (!b) return;
    const ctx = this.ctx;
    const flash = b.hitFlash;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalCompositeOperation = "lighter";
    this.glow(0, 0, b.r * (3.4 + Math.sin(this.time * 3) * 0.14), b.def.color, 0.4 + flash * 0.3);
    ctx.globalCompositeOperation = "source-over";

    // outer rotating segments
    for (let ring = 0; ring < 3; ring++) {
      const rr = b.r * (1.5 - ring * 0.22);
      ctx.rotate(b.spin * (ring % 2 ? -1 : 1) * (0.6 + ring * 0.3));
      ctx.strokeStyle = this.hexA(ring === 1 ? b.def.accent : b.def.color, 0.55 + flash * 0.4);
      ctx.lineWidth = 6 - ring;
      ctx.beginPath();
      const segs = 5 + ring;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * TAU;
        ctx.arc(0, 0, rr, a0, a0 + TAU / segs * 0.55);
        ctx.moveTo(0, 0);
      }
      ctx.stroke();
    }
    ctx.rotate(-b.spin * 0.4);
    // body
    const bodyCol = flash > 0.3 ? "#ffffff" : b.def.color;
    ctx.fillStyle = this.hexA(bodyCol, 0.92);
    ctx.strokeStyle = b.def.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + b.spin * 0.2;
      const rr = b.r * (i % 2 ? 0.86 : 1.05);
      ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // core / eye
    const eyeA = b.ang;
    ctx.save();
    ctx.rotate(eyeA);
    ctx.fillStyle = "#07060f";
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r * 0.55, b.r * 0.4, 0, 0, TAU);
    ctx.fill();
    const pulse = 0.6 + Math.sin(this.time * (b.phase === 2 ? 12 : 6)) * 0.24;
    ctx.globalCompositeOperation = "lighter";
    this.glow(b.r * 0.16, 0, b.r * 0.42 * pulse, b.phase === 2 ? "#ff2a4d" : "#ffffff", 0.95);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // phase 2 cracks
    if (b.phase === 2) {
      ctx.strokeStyle = this.hexA("#ff2a4d", 0.7 + Math.sin(this.time * 8) * 0.2);
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + b.spin;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * b.r * 0.3, Math.sin(a) * b.r * 0.3);
        ctx.lineTo(Math.cos(a + 0.3) * b.r * 0.95, Math.sin(a + 0.3) * b.r * 0.95);
        ctx.stroke();
      }
    }
    if (b.entering > 0) {
      ctx.globalAlpha = clamp(b.entering, 0, 1);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 2 + b.entering * 200, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawPlayer() {
    const p = this.player;
    const ctx = this.ctx;
    const w = this.classWeapons[this.weaponIdx] ?? WEAPONS[0];
    const c = this.cls;
    const S = 1.42;                       // legibility scale
    const inv = p.inv > 0 && p.dashT <= 0;
    const flick = inv && Math.sin(this.time * 34) > 0 ? 0.45 : 1;
    const thrust = clamp(hyp(p.vx, p.vy) / 420, 0, 1.6);
    const hurt = p.hurtT > 0;
    const line = "#ffffff";               // hard white outline = instant read
    const fill = hurt ? "#ff5b8f" : this.hexA(c.color, 0.5);

    if (p.dashT > 0) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < p.trail.length; i += 6) {
        const a = (i / p.trail.length) * 0.4;
        ctx.globalAlpha = a;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(p.trail[i], p.trail[i + 1], p.r * 0.7 * (0.4 + a), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    // FEIXE OCULAR — twin light beams (Robo's main weapon)
    if (this.eyeBeamT > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const over = this.beamBoostT > 0;
      for (let i = 0; i < 2; i++) {
        const side = i ? 7 : -7;
        const ex = p.x + Math.cos(p.ang) * 10 - Math.sin(p.ang) * side;
        const ey = p.y + Math.sin(p.ang) * 10 + Math.cos(p.ang) * side;
        const bw = over ? 7 : 4.5;
        ctx.globalAlpha = over ? 0.95 : 0.6;
        ctx.strokeStyle = over ? "#ffffff" : w.color;
        ctx.lineWidth = bw;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(this.eyeBeamX, this.eyeBeamY); ctx.stroke();
        ctx.globalAlpha = over ? 0.3 : 0.15;
        ctx.lineWidth = bw * 3;
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    // blade storm ring
    if (this.bladeT > 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(this.bladeT / 1.4, 0, 1);
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 52 + Math.sin(this.bladeSpin) * 5, this.bladeSpin, this.bladeSpin + 4.4);
      ctx.stroke();
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    // mage nova ring
    if (this.novaR > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(1 - this.novaR / 330, 0, 1) * 0.75;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.novaR, 0, TAU);
      ctx.stroke();
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    // ground shadow: grounds the character so it stops looking like a sticker
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.r * S * 0.78, p.r * S * 0.92, p.r * S * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalCompositeOperation = "lighter";
    this.glow(0, 0, 52 + p.muzzle * 22, c.color, 0.34 + p.muzzle * 0.22);
    ctx.globalCompositeOperation = "source-over";
    ctx.scale(S, S);
    ctx.rotate(p.ang);
    ctx.translate(-p.recoil * 0.025, 0);
    ctx.globalAlpha = flick;
    ctx.lineJoin = "round";

    /** main hull: dark base coat, class colour top, white rim, inner highlight */
    const drawBody = (path: () => void) => {
      ctx.beginPath();
      path();
      ctx.closePath();
      ctx.fillStyle = this.hexA(c.color, 0.3);
      ctx.fill();
      ctx.save();
      ctx.clip();
      // upper highlight in the class colour
      ctx.fillStyle = fill;
      ctx.fillRect(-40, -40, 80, 40);
      // soft lower shade
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(-40, 8, 80, 40);
      // specular streak
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-40, -12, 80, 3);
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.strokeStyle = line;
      ctx.lineWidth = 2.6;
      ctx.stroke();
    };

    switch (c.shape) {
      case "telepath":
      case "jedi":
      case "cryo":
        drawExpansionCharacter(ctx, c, this.time, thrust, hurt, p.muzzle > 0.1);
        break;
      /* MAGO: pointed hood, two glowing eyes, floating staff */
      case "hood": {
        drawBody(() => {
          ctx.moveTo(19, 0);
          ctx.quadraticCurveTo(6, -19, -15 - thrust * 5, -12);
          ctx.quadraticCurveTo(-20, 0, -15 - thrust * 5, 12);
          ctx.quadraticCurveTo(6, 19, 19, 0);
        });
        // cloak inner fold
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-11, -7); ctx.quadraticCurveTo(2, 0, -11, 7);
        ctx.stroke();
        ctx.globalAlpha = flick;
        // face shadow
        ctx.beginPath();
        ctx.ellipse(4, 0, 8.5, 8, 0, 0, TAU);
        ctx.fillStyle = "#0a0716";
        ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        this.glow(8, -3.6, 7, c.accent, 1);
        this.glow(8, 3.6, 7, c.accent, 1);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = c.accent;
        ctx.beginPath(); ctx.arc(8, -3.6, 2.1, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 3.6, 2.1, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#c9b6ff";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(1, 12); ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        this.glow(-2, -15, 11, c.color, 0.95);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = c.accent;
        ctx.beginPath(); ctx.arc(-2, -15, 4.2, 0, TAU); ctx.fill();
        // orbiting rune ring
        ctx.save();
        ctx.rotate(-p.ang);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.3;
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * TAU + this.time * 1.6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
          ctx.lineTo(Math.cos(a) * 29, Math.sin(a) * 29);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      /* ATIRADOR: long barrel + scope block */
      case "sniper": {
        ctx.strokeStyle = "#dff6ff";
        ctx.lineWidth = 4.4;
        ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(34, 0); ctx.stroke();
        ctx.strokeStyle = w.color; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(30, -4.4); ctx.lineTo(30, 4.4); ctx.stroke();
        drawBody(() => {
          ctx.moveTo(20, 0); ctx.lineTo(6, -10); ctx.lineTo(-15, -8);
          ctx.lineTo(-15, 8); ctx.lineTo(6, 10);
        });
        ctx.fillStyle = "#0a1a22";
        ctx.fillRect(-2, -6, 12, 12);
        ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.strokeRect(-2, -6, 12, 12);
        ctx.fillStyle = this.perfectShot > 0 ? "#ffffff" : c.accent;
        ctx.fillRect(1, -3, 6, 6);
        if (this.specT[0] > 0) {
          ctx.rotate(-p.ang);
          ctx.strokeStyle = this.hexA(c.color, 0.55);
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - this.specT[0] / c.specials[0].cd));
          ctx.stroke();
          ctx.rotate(p.ang);
        }
        break;
      }
      /* VELOCISTA: twin blades + speed wedge */
      case "runner": {
        ctx.strokeStyle = "#f2ffe0";
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(3, -10); ctx.lineTo(30, -13);
        ctx.moveTo(3, 10); ctx.lineTo(30, 13);
        ctx.stroke();
        drawBody(() => {
          ctx.moveTo(24, 0); ctx.lineTo(-2, -11); ctx.lineTo(-19 - thrust * 11, -5);
          ctx.lineTo(-13, 0); ctx.lineTo(-19 - thrust * 11, 5); ctx.lineTo(-2, 11);
        });
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(13, 0); ctx.lineTo(3, -4.4); ctx.lineTo(3, 4.4);
        ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        this.glow(7, 0, 9, c.accent, 0.7);
        ctx.globalCompositeOperation = "source-over";
        break;
      }
      /* SUPER-FORÇA: broad hull + hammer fists */
      case "brute": {
        ctx.fillStyle = this.hexA(c.color, 0.72);
        ctx.strokeStyle = line; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(15, -17); ctx.lineTo(15, -7); ctx.lineTo(0, -10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 21); ctx.lineTo(15, 17); ctx.lineTo(15, 7); ctx.lineTo(0, 10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#ffe9b8"; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(6, -14); ctx.lineTo(30, -14);
        ctx.moveTo(6, 14); ctx.lineTo(30, 14);
        ctx.stroke();
        ctx.fillStyle = c.accent;
        ctx.fillRect(28, -20, 8, 12); ctx.fillRect(28, 8, 8, 12);
        drawBody(() => {
          ctx.moveTo(20, -11); ctx.lineTo(20, 11); ctx.lineTo(-18, 15); ctx.lineTo(-18, -15);
        });
        ctx.fillStyle = "#1a1006";
        ctx.fillRect(-12, -6, 22, 12);
        ctx.fillStyle = hurt ? "#ffffff" : c.accent;
        ctx.fillRect(-9, -3.4, 15, 6.8);
        // rivets
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(-10, -4.6, 1.6, 1.6);
        ctx.fillRect(-10, 3, 1.6, 1.6);
        ctx.fillRect(6, -4.6, 1.6, 1.6);
        ctx.fillRect(6, 3, 1.6, 1.6);
        ctx.strokeStyle = line; ctx.lineWidth = 1.8;
        ctx.strokeRect(-12, -6, 22, 12);
        break;
      }
      /* ROBÔ: boxy head with TWO light eyes */
      case "mech": {
        drawBody(() => {
          ctx.moveTo(19, -14); ctx.lineTo(19, 14); ctx.lineTo(-16, 11); ctx.lineTo(-16, -11);
        });
        ctx.fillStyle = "#140a1e";
        ctx.fillRect(1, -11, 16, 22);
        ctx.strokeStyle = line; ctx.lineWidth = 2.2;
        ctx.strokeRect(1, -11, 16, 22);
        const over = this.abilityOn > 0;
        ctx.globalCompositeOperation = "lighter";
        this.glow(15, -5.4, over ? 15 : 10, over ? "#ffffff" : c.color, 1);
        this.glow(15, 5.4, over ? 15 : 10, over ? "#ffffff" : c.color, 1);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = over ? "#ffffff" : c.accent;
        ctx.beginPath(); ctx.arc(15, -5.4, 3.2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(15, 5.4, 3.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = this.hexA(c.accent, 0.55); ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-13, -7); ctx.lineTo(-2, -7);
        ctx.moveTo(-13, 0); ctx.lineTo(-2, 0);
        ctx.moveTo(-13, 7); ctx.lineTo(-2, 7);
        ctx.stroke();
        // antenna
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-9, -11); ctx.lineTo(-15, -19); ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        this.glow(-15, -19, 6, c.color, 0.9);
        ctx.globalCompositeOperation = "source-over";
        break;
      }
      /* SAMURAI: robe, white headband, long katana */
      case "blade": {
        ctx.strokeStyle = this.hexA(c.color, 0.8);
        ctx.lineWidth = 3;
        const sway = Math.sin(this.time * 6) * 3;
        ctx.beginPath();
        ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-22 - thrust * 8, -8 + sway, -30 - thrust * 10, -4 + sway);
        ctx.moveTo(-10, 6); ctx.quadraticCurveTo(-22 - thrust * 8, 8 - sway, -30 - thrust * 10, 4 - sway);
        ctx.stroke();
        ctx.strokeStyle = "#f4f7ff";
        ctx.lineWidth = 3.6;
        ctx.beginPath(); ctx.moveTo(4, -4); ctx.lineTo(36, -18); ctx.stroke();
        // blade sheen
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(12, -9); ctx.lineTo(30, -17); ctx.stroke();
        ctx.globalAlpha = flick;
        // sash
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-9, 8); ctx.stroke();
        ctx.fillStyle = "#1a1a22";
        ctx.fillRect(-2, -6, 8, 5);
        ctx.beginPath();
        ctx.moveTo(20, 0); ctx.lineTo(6, -10); ctx.lineTo(-15, -8);
        ctx.lineTo(-15, 8); ctx.lineTo(6, 10);
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = line; ctx.lineWidth = 2.6; ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(2, -8.5, 13, 4.6);
        ctx.strokeStyle = c.color; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(2, -8.5); ctx.lineTo(-6, -12); ctx.moveTo(2, -3.9); ctx.lineTo(-6, -1); ctx.stroke();
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.arc(8.5, -6.2, 2, 0, TAU); ctx.fill();
        break;
      }
      /* ENGENHEIRA: exoesqueleto técnico, mochila geradora com bobinas Tesla, óculos de solda e chave de indução */
      case "engineer": {
        // bobina geradora / bateria nas costas
        ctx.fillStyle = "#122a22";
        ctx.fillRect(-18, -10, 8, 20);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-18, -10, 8, 20);
        // anéis de indução da bobina
        ctx.fillStyle = c.color;
        ctx.fillRect(-17, -7, 6, 3);
        ctx.fillRect(-17, -1, 6, 3);
        ctx.fillRect(-17, 5, 6, 3);
        // faísca elétrica sutil na bobina
        if (Math.sin(this.time * 25) > 0.4) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-18, -4);
          ctx.lineTo(-24 + Math.sin(this.time * 40) * 4, -4 + Math.cos(this.time * 30) * 6);
          ctx.stroke();
        }
        // antena de telemetria com LED piscando
        ctx.strokeStyle = "#8cecd0";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-10, -9);
        ctx.lineTo(-16, -18);
        ctx.stroke();
        ctx.fillStyle = Math.sin(this.time * 8) > 0 ? "#ffffff" : c.color;
        ctx.beginPath();
        ctx.arc(-16, -18, 2.2, 0, TAU);
        ctx.fill();

        // corpo angular / exo-blindagem
        drawBody(() => {
          ctx.moveTo(18, -8);
          ctx.lineTo(18, 8);
          ctx.lineTo(8, 14);
          ctx.lineTo(-12, 13);
          ctx.lineTo(-14, 0);
          ctx.lineTo(-12, -13);
          ctx.lineTo(8, -14);
        });

        // ombreiras reforçadas com placas parafusadas
        ctx.fillStyle = this.hexA(c.color, 0.4);
        ctx.strokeStyle = line;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.rect(-6, -16, 12, 6);
        ctx.rect(-6, 10, 12, 6);
        ctx.fill();
        ctx.stroke();

        // óculos de solda / visor industrial duplo com lentes de cristal
        ctx.fillStyle = "#0a1814";
        ctx.fillRect(4, -8, 11, 16);
        ctx.strokeStyle = line;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(4, -8, 11, 16);
        ctx.globalCompositeOperation = "lighter";
        this.glow(11, -3.8, 6, c.accent, 0.9);
        this.glow(11, 3.8, 6, c.accent, 0.9);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(11, -3.8, 2.6, 0, TAU);
        ctx.arc(11, 3.8, 2.6, 0, TAU);
        ctx.fill();

        // chave de indução / ferramenta na lateral direita
        ctx.strokeStyle = "#e0fff5";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(6, 12);
        ctx.lineTo(26, 14);
        ctx.moveTo(24, 11);
        ctx.lineTo(28, 11);
        ctx.moveTo(24, 17);
        ctx.lineTo(28, 17);
        ctx.stroke();
        break;
      }
      /* ALQUIMISTA: máscara de bico com respirador, grande frasco borbulhante nas costas e cinto de poções */
      case "alchemist": {
        // grande frasco erlenmeyer de vidro nas costas
        ctx.save();
        ctx.fillStyle = "rgba(10, 24, 12, 0.85)";
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-18, -11);
        ctx.lineTo(-24, -9);
        ctx.lineTo(-24, 9);
        ctx.lineTo(-18, 11);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fluido tóxico borbulhante dentro do frasco
        const fluidWave = Math.sin(this.time * 6) * 1.5;
        ctx.fillStyle = this.hexA(c.color, 0.7);
        ctx.beginPath();
        ctx.moveTo(-23, -8);
        ctx.lineTo(-18, -9 + fluidWave);
        ctx.lineTo(-18, 9 - fluidWave);
        ctx.lineTo(-23, 8);
        ctx.closePath();
        ctx.fill();
        // bolhas de ácido subindo
        ctx.fillStyle = "#ffffff";
        const b1 = (this.time * 18) % 12;
        const b2 = (this.time * 24 + 6) % 12;
        ctx.beginPath();
        ctx.arc(-22 + b1 * 0.4, -4 + Math.sin(b1 * 2) * 2, 1.3, 0, TAU);
        ctx.arc(-21 + b2 * 0.3, 3 + Math.cos(b2 * 2) * 2, 1.1, 0, TAU);
        ctx.fill();
        ctx.restore();

        // corpo com manto rasgado assimétrico
        drawBody(() => {
          ctx.moveTo(18, 0);
          ctx.lineTo(6, -11);
          ctx.lineTo(-8, -12);
          ctx.lineTo(-14 - thrust * 6, -6);
          ctx.lineTo(-10, 0);
          ctx.lineTo(-14 - thrust * 6, 6);
          ctx.lineTo(-8, 12);
          ctx.lineTo(6, 11);
        });

        // máscara respiradora com bico estilizado para frente
        ctx.fillStyle = "#162210";
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, -6);
        ctx.lineTo(23, 0);
        ctx.lineTo(8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // respiradores / filtros laterais
        ctx.fillStyle = "#334422";
        ctx.fillRect(5, -9, 4, 3);
        ctx.fillRect(5, 6, 4, 3);

        // lentes oculares tóxicas redondas
        ctx.globalCompositeOperation = "lighter";
        this.glow(9, -4.2, 7, c.color, 0.95);
        this.glow(9, 4.2, 7, c.color, 0.95);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(9, -4.2, 2.8, 0, TAU);
        ctx.arc(9, 4.2, 2.8, 0, TAU);
        ctx.fill();

        // cinto de bandoleira com 2 pequenos frascos com rolha de cortiça
        ctx.strokeStyle = "#886633";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -11);
        ctx.lineTo(4, 11);
        ctx.stroke();
        ctx.fillStyle = "#ff6a2e";
        ctx.fillRect(-2, -6, 3, 5);
        ctx.fillStyle = "#4ff0ff";
        ctx.fillRect(1, 1, 3, 5);
        ctx.fillStyle = "#eeddaa";
        ctx.fillRect(-2.5, -8, 4, 2);
        ctx.fillRect(0.5, -1, 4, 2);
        break;
      }
      /* ORÁCULO: venda cerimonial, Grande Terceiro Olho solar na testa, halo astral com glifos orbitais */
      case "oracle": {
        // halo astral celestial dourado flutuando atrás da cabeça
        ctx.save();
        ctx.rotate(-p.ang * 0.4 + this.time * 0.8);
        ctx.strokeStyle = this.hexA(c.color, 0.65);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, TAU);
        ctx.stroke();
        // pontas em cruz estelar no halo
        ctx.fillStyle = c.accent;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
          ctx.lineTo(Math.cos(a) * 29, Math.sin(a) * 29);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(Math.cos(a + 0.38) * 24, Math.sin(a + 0.38) * 24, 1.8, 0, TAU);
          ctx.fill();
        }
        ctx.restore();

        // túnica sacerdotal com dobras em losango
        drawBody(() => {
          ctx.moveTo(17, 0);
          ctx.lineTo(5, -12);
          ctx.lineTo(-10, -13);
          ctx.lineTo(-17 - thrust * 4, -5);
          ctx.lineTo(-13, 0);
          ctx.lineTo(-17 - thrust * 4, 5);
          ctx.lineTo(-10, 13);
          ctx.lineTo(5, 12);
        });

        // estola / faixa de seda sagrada dourada cruzando o peito
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-10, -6);
        ctx.moveTo(10, 0);
        ctx.lineTo(-10, 6);
        ctx.stroke();

        // venda sagrada cerimonial sobre os olhos humanos
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(4, -6.5, 5, 13);
        ctx.strokeStyle = "#caa030";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(4, -6.5, 5, 13);

        // O GRANDE TERCEIRO OLHO MÍSTICO (centro da testa)
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        this.glow(11, 0, 11, c.color, 1);
        ctx.globalCompositeOperation = "source-over";
        // formato amendoado do olho divino
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.quadraticCurveTo(11, -5, 16, 0);
        ctx.quadraticCurveTo(11, 5, 6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // pupila dourada brilhante
        ctx.fillStyle = "#7a4e00";
        ctx.beginPath();
        ctx.arc(11, 0, 2.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fffbf0";
        ctx.beginPath();
        ctx.arc(11.5, -0.6, 1, 0, TAU);
        ctx.fill();
        ctx.restore();

        // espelho sagrado da vidência na mão esquerda
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(4, -15, 5.5, 0, TAU);
        ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        this.glow(4, -15, 7, c.color, 0.7);
        ctx.globalCompositeOperation = "source-over";
        break;
      }
      /* NECROMANTE: crânio espectral branco com olhos de chama violeta, grande foice da morte e fogos-fátuos */
      case "necromancer": {
        // fogos-fátuos (3 almas aprisionadas orbitando o corpo)
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU + this.time * 2.2;
          const dist = 22 + Math.sin(this.time * 4 + i) * 3;
          const ox = Math.cos(a) * dist;
          const oy = Math.sin(a) * (dist * 0.75);
          ctx.globalCompositeOperation = "lighter";
          this.glow(ox, oy, 9, "#b46cff", 0.85);
          ctx.fillStyle = "#eed5ff";
          ctx.beginPath();
          ctx.arc(ox, oy, 2.2, 0, TAU);
          ctx.fill();
          // cauda de chama etérea
          ctx.strokeStyle = this.hexA("#b46cff", 0.5);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox - Math.cos(a + 0.3) * 6, oy - Math.sin(a + 0.3) * 6);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // grande foice da morte na lateral esquerda
        ctx.save();
        ctx.strokeStyle = "#4a3366";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-14, 12);
        ctx.lineTo(16, -20);
        ctx.stroke();
        // lâmina curva da foice de ectoplasma
        ctx.strokeStyle = "#eed5ff";
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(16, -20);
        ctx.quadraticCurveTo(28, -25, 26, -9);
        ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        this.glow(23, -18, 11, c.color, 0.8);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // corpo com túnica esfarrapada
        drawBody(() => {
          ctx.moveTo(18, 0);
          ctx.lineTo(6, -11);
          ctx.lineTo(-12, -14);
          ctx.lineTo(-20 - thrust * 6, -7);
          ctx.lineTo(-14, 0);
          ctx.lineTo(-20 - thrust * 6, 7);
          ctx.lineTo(-12, 14);
          ctx.lineTo(6, 11);
        });

        // ombreiras feitas de espinhos de ossos e costelas
        ctx.strokeStyle = "#e8d8f8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -12); ctx.lineTo(-4, -19); ctx.lineTo(-10, -14);
        ctx.moveTo(0, 12); ctx.lineTo(-4, 19); ctx.lineTo(-10, 14);
        ctx.stroke();

        // MÁSCARA MORTUÁRIA DE CRÂNIO
        ctx.fillStyle = "#f4eaff";
        ctx.strokeStyle = "#221133";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(8, 0, 8, 6.5, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        // dentes do maxilar
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(14, -3, 3, 6);
        ctx.strokeStyle = "#331144";
        ctx.lineWidth = 1;
        ctx.strokeRect(14, -3, 3, 6);
        // órbitas profundas com chamas de ectoplasma violeta
        ctx.fillStyle = "#120520";
        ctx.beginPath();
        ctx.arc(8, -3.2, 2.5, 0, TAU);
        ctx.arc(8, 3.2, 2.5, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        this.glow(9, -3.2, 6, c.color, 1);
        this.glow(9, 3.2, 6, c.color, 1);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(9, -3.2, 1.4, 0, TAU);
        ctx.arc(9, 3.2, 1.4, 0, TAU);
        ctx.fill();
        break;
      }
      /* ILUSIONISTA: fraque bipartido, máscara veneziana facetada e facetas prismáticas de espelho flutuantes */
      case "illusionist": {
        // pós-imagem prismática sutil translúcida (efeito de miragem/refração)
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "#ff7be5";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-12 - thrust * 4, -9, 20, 18);
        ctx.strokeStyle = "#55d9ff";
        ctx.strokeRect(-10 + thrust * 2, -11, 20, 18);
        ctx.restore();

        // 4 facetas de espelho / fragmentos de cristal flutuando e girando ao redor
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + this.time * 1.8;
          const dist = 23 + Math.sin(this.time * 5 + i * 2) * 4;
          const fx = Math.cos(a) * dist;
          const fy = Math.sin(a) * (dist * 0.85);
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(this.time * 3 + i);
          // faceta de diamante com reflexos furta-cor
          ctx.fillStyle = i % 2 === 0 ? "rgba(217, 248, 255, 0.7)" : "rgba(255, 180, 240, 0.7)";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(4, 0);
          ctx.lineTo(0, 5);
          ctx.lineTo(-4, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        // corpo: fraque nobre com lapelas pontiagudas
        drawBody(() => {
          ctx.moveTo(18, 0);
          ctx.lineTo(6, -9);
          ctx.lineTo(-4, -12);
          ctx.lineTo(-18 - thrust * 7, -10);
          ctx.lineTo(-12, -2);
          ctx.lineTo(-12, 2);
          ctx.lineTo(-18 - thrust * 7, 10);
          ctx.lineTo(-4, 12);
          ctx.lineTo(6, 9);
        });

        // gola alta e gravata borboleta / camafeu de cristal
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(5, -4);
        ctx.lineTo(10, 0);
        ctx.lineTo(5, 4);
        ctx.lineTo(2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff6bd6";
        ctx.beginPath();
        ctx.arc(6, 0, 1.8, 0, TAU);
        ctx.fill();

        // MÁSCARA VENEZIANA DE ESPELHO FACETADA
        ctx.fillStyle = "#0c1a26";
        ctx.fillRect(4, -7.5, 9, 15);
        ctx.strokeStyle = line;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(4, -7.5, 9, 15);
        // facetas reflexivas de diamante na máscara
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(7, -6); ctx.lineTo(12, -2); ctx.lineTo(7, -1);
        ctx.moveTo(7, 6); ctx.lineTo(12, 2); ctx.lineTo(7, 1);
        ctx.fill();
        // olhos misteriosos com brilho ciano
        ctx.globalCompositeOperation = "lighter";
        this.glow(10, -3.5, 5.5, c.color, 0.95);
        this.glow(10, 3.5, 5.5, "#ff7be5", 0.95);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(10, -3.5, 1.8, 0, TAU);
        ctx.arc(10, 3.5, 1.8, 0, TAU);
        ctx.fill();

        // cetro com prisma de cristal na mão
        ctx.strokeStyle = "#e8f8ff";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-2, 11);
        ctx.lineTo(22, 18);
        ctx.stroke();
        // prisma lapidado na ponta
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(22, 14);
        ctx.lineTo(28, 18);
        ctx.lineTo(22, 22);
        ctx.lineTo(19, 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#55d9ff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        this.glow(24, 18, 8, "#ffffff", 0.8);
        ctx.globalCompositeOperation = "source-over";
        break;
      }
    }

    if (this.dlc) this.drawHeroEmblem(ctx, this.heroDef());

    if (thrust > 0.05 || this.boostFx > 0.05) {
      ctx.globalCompositeOperation = "lighter";
      const fl = 9 + thrust * 14 + Math.random() * 4 + this.boostFx * 22;
      ctx.fillStyle = this.hexA(this.boostFx > 0.4 ? "#ffd23c" : c.color, 0.6 + this.boostFx * 0.3);
      ctx.beginPath();
      ctx.moveTo(-15, -4.5); ctx.lineTo(-15 - fl, 0); ctx.lineTo(-15, 4.5);
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    if (p.muzzle > 0.02) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = p.muzzle * flick;
      ctx.beginPath();
      ctx.moveTo(24, -6 * p.muzzle); ctx.lineTo(24 + 26 * p.muzzle, 0); ctx.lineTo(24, 6 * p.muzzle);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();

    /* class ring + name badge: what you are, always visible */
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * S + 7, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const by = p.y - p.r * S - 20;
    ctx.fillStyle = "rgba(6,5,14,0.82)";
    ctx.fillRect(p.x - 15, by - 8, 30, 13);
    ctx.strokeStyle = this.hexA(c.color, 0.85);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p.x - 15, by - 8, 30, 13);
    ctx.fillStyle = c.accent;
    ctx.font = "700 9px 'Chakra Petch', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.name.slice(0, 6), p.x, by - 1);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = this.perfectShot > 0 ? 0.55 : 0.22;
    ctx.strokeStyle = this.perfectShot > 0 ? "#ffffff" : w.color;
    ctx.lineWidth = this.perfectShot > 0 ? 2.4 : 1.4;
    ctx.setLineDash([11, 10]);
    ctx.lineDashOffset = -this.time * 44;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.ang) * 30, p.y + Math.sin(p.ang) * 30);
    ctx.lineTo(p.x + Math.cos(p.ang) * 480, p.y + Math.sin(p.ang) * 480);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }

  private drawHazards() {
    if (!this.hazards.length) return;
    const ctx = this.ctx;
    for (const h of this.hazards) {
      const a = clamp(h.life / h.max, 0, 1);
      ctx.globalAlpha = 0.22 + a * 0.22;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      // forma irregular (6 lóbulos) para parecer poça, não disco
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * TAU;
        const rr = h.r * (0.82 + Math.sin(ang * 3 + h.x) * 0.16);
        ctx[k ? "lineTo" : "moveTo"](h.x + Math.cos(ang) * rr, h.y + Math.sin(ang) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.55 + a * 0.3;
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // bolhas
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#ffffff";
      const bx = h.x + Math.sin(this.time * 3 + h.y) * h.r * 0.4;
      const by = h.y + Math.cos(this.time * 2.2 + h.x) * h.r * 0.4;
      ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawExpansionEffects() {
    if (!this.classFields.length && !this.forceArcs.length && this.mindGuardT <= 0 && this.jediGuardT <= 0 && this.cryoArmorT <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    for (const field of this.classFields) {
      if (field.x + field.r < this.camX || field.y + field.r < this.camY || field.x - field.r > this.camX + this.W || field.y - field.r > this.camY + this.H) continue;
      const ZONE: Record<string, [string, string]> = {
        snow: ["#b6eaff", "rgba(105,185,235,0.09)"],
        psi: ["#d4a5ff", "rgba(189,115,239,0.09)"],
        fire: ["#ff7a3d", "rgba(255,120,50,0.10)"],
        dark: ["#7a5cff", "rgba(90,60,200,0.13)"],
        smoke: ["#b6ffe4", "rgba(120,220,180,0.09)"],
      };
      const [color, fillC] = ZONE[field.kind] ?? ZONE.psi;
      ctx.fillStyle = fillC;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(field.x, field.y, field.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = Math.min(0.65, field.life);
      ctx.stroke();
      const markers = this.quality < 0.7 ? 5 : 9;
      for (let i = 0; i < markers; i++) {
        const angle = i / markers * TAU + this.time * 0.22;
        const radius = field.r * (0.3 + (i % 3) * 0.22);
        const x = field.x + Math.cos(angle) * radius, y = field.y + Math.sin(angle) * radius;
        ctx.beginPath();
        if (field.kind === "snow") {
          ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
        } else if (field.kind === "fire") {
          ctx.moveTo(x, y + 4); ctx.lineTo(x - 3, y - 3); ctx.lineTo(x + 3, y - 3); ctx.closePath();
        } else if (field.kind === "dark") {
          ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4);
        } else {
          ctx.arc(x, y, 8, angle, angle + 1.8);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    for (const arc of this.forceArcs) {
      const t = 1 - arc.life / arc.max;
      ctx.strokeStyle = arc.color;
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.lineWidth = 5 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(arc.x, arc.y, Math.max(1, arc.r * t), arc.angle - arc.halfAngle, arc.angle + arc.halfAngle);
      ctx.stroke();
    }
    const guard = Math.max(this.mindGuardT, this.jediGuardT, this.cryoArmorT);
    if (guard > 0) {
      const p = this.player;
      ctx.globalAlpha = Math.min(0.75, guard);
      ctx.strokeStyle = this.cls.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (this.cryoArmorT > 0) {
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * TAU;
          const x = p.x + Math.cos(a) * 39, y = p.y + Math.sin(a) * 39;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else ctx.arc(p.x, p.y, 38, -Math.PI / 2, -Math.PI / 2 + Math.min(1, guard / 3) * TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawClassGadgets() {
    const ctx = this.ctx;
    if (this.portal) {
      const g = this.portal;
      for (const [x, y, color, spin] of [[g.ax, g.ay, this.cls.color, 1], [g.bx, g.by, "#7de6ff", -1]] as const) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.time * spin * 1.4);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, 0, 21, 38, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
    for (const n of this.nukes) {
      const pulse = 1 + Math.sin(this.time * 15) * 0.05;
      const nc = n.color ?? "#ffb020";
      ctx.strokeStyle = nc;
      ctx.globalAlpha = 0.35 + Math.sin(this.time * 14) * 0.12;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = nc;
      ctx.font = "700 16px 'Chakra Petch', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`IMPACTO ${n.t.toFixed(1)}s`, n.x, n.y - n.r - 12);
    }
    for (const g of this.grenades) {
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.spin);
      ctx.fillStyle = "#ffb020"; ctx.strokeStyle = "#fff2c2"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 20) * 0.3;
      ctx.fillStyle = "#ffb020"; ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const t of this.turrets) {
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.ang);
      ctx.fillStyle = "#17372d"; ctx.strokeStyle = "#c5ffeb"; ctx.lineWidth = 2;
      ctx.fillRect(-13, -12, 26, 24); ctx.strokeRect(-13, -12, 26, 24);
      ctx.fillStyle = "#38d6a5"; ctx.fillRect(3, -4, 20, 8);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(-8, -7, 5, 5); ctx.fillRect(-8, 2, 5, 5);
      ctx.restore();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = "#38d6a5"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(t.x, t.y, 680, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const m of this.mines) {
      const pulse = Math.sin(this.time * 8) > 0 ? 1 : 0.55;
      ctx.fillStyle = `rgba(255,176,32,${pulse})`;
      ctx.strokeStyle = "#fff2c2"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = "#ffb020"; ctx.beginPath(); ctx.arc(m.x, m.y, 22, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /** Chest crest identifying each hero — a handful of cheap paths, no sprites. */
  private drawHeroEmblem(ctx: CanvasRenderingContext2D, hero?: HeroDef) {
    if (!hero) return;
    ctx.save();
    ctx.translate(-2, 0);
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = hero.accent;
    ctx.fillStyle = hero.accent;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    switch (hero.emblem) {
      case "eye": // Agamotto eye
        ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 4.2, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 2.1, 0, TAU); ctx.fill();
        break;
      case "skull": // Punisher skull
        ctx.beginPath(); ctx.moveTo(-4.5, -4.5); ctx.lineTo(4.5, -4.5); ctx.lineTo(3.5, 2);
        ctx.lineTo(-3.5, 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#15151c"; ctx.lineWidth = 1.1;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2.2, 2); ctx.lineTo(i * 2.2, 6); ctx.stroke(); }
        break;
      case "bolt": // Flash lightning
        ctx.beginPath(); ctx.moveTo(1.5, -7); ctx.lineTo(-3, 0.5); ctx.lineTo(0, 0.5);
        ctx.lineTo(-1.5, 7); ctx.lineTo(3.5, -1); ctx.lineTo(0.5, -1); ctx.closePath(); ctx.fill();
        break;
      case "fist": // Hulk fist
        ctx.fillRect(-4.5, -3.5, 9, 7);
        ctx.strokeStyle = "#1d3a17"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-1.5, -3.5); ctx.lineTo(-1.5, 3.5); ctx.moveTo(1.5, -3.5); ctx.lineTo(1.5, 3.5); ctx.stroke();
        break;
      case "arc": // Iron Man arc reactor
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#8edaff";
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, -2.4); ctx.moveTo(0, 5); ctx.lineTo(0, 2.4); ctx.stroke();
        break;
      case "katana": // crossed blades
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.moveTo(6, -6); ctx.lineTo(-6, 6); ctx.stroke();
        break;
      case "claw": // three claw slashes
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 3 - 1, -6); ctx.lineTo(i * 3 + 2, 6); ctx.stroke(); }
        break;
      case "mask": // Deadpool mask eyes
        ctx.beginPath(); ctx.ellipse(-2.4, 0, 2.6, 1.8, -0.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(2.8, 0, 2.6, 1.8, 0.4, 0, TAU); ctx.fill();
        break;
      case "doom": // Doom faceplate
        ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(3, 5); ctx.lineTo(-3, 5);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(3, -2); ctx.stroke();
        break;
      case "crow": // Raven gem
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill();
        break;
      case "panther": // Panther eyes + necklace
        ctx.beginPath(); ctx.ellipse(-2.6, -1.5, 2.4, 1.3, -0.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(2.6, -1.5, 2.4, 1.3, 0.5, 0, TAU); ctx.fill();
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 2, 4.5, 0.9, 0, TAU); ctx.fill(); }
        break;
      case "smoke": // Mysterio dome
        ctx.beginPath(); ctx.arc(0, 1, 5.2, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 1, 2.2, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5.2, 1); ctx.lineTo(5.2, 1); ctx.stroke();
        break;
      case "phoenix": // Phoenix wings
        ctx.beginPath(); ctx.moveTo(-6, -1); ctx.quadraticCurveTo(-2, -5, 0, 3);
        ctx.quadraticCurveTo(2, -5, 6, -1); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.5, 1.6, 0, TAU); ctx.fill();
        break;
      case "snow": // Iceman snowflake
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(-Math.cos(a) * 5.5, -Math.sin(a) * 5.5);
          ctx.lineTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  }

  private drawDrones() {
    if (!this.drones.length) return;
    const ctx = this.ctx;
    for (const d of this.drones) {
      const color = d.color ?? "#4ff0ff";
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.globalCompositeOperation = "lighter";
      this.glow(0, 0, 22, color, 0.5);
      ctx.globalCompositeOperation = "source-over";
      ctx.rotate(d.ang);
      ctx.fillStyle = this.hexA(color, 0.55);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(11, 0); ctx.lineTo(-7, 7); ctx.lineTo(-3, 0); ctx.lineTo(-7, -7);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(4, 0, 2.2, 0, TAU); ctx.fill();
      ctx.restore();
      const k = clamp(d.t / 2, 0, 1);
      if (k < 1) {
        ctx.globalAlpha = k;
        ctx.strokeStyle = "#4ff0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 18, -Math.PI / 2, -Math.PI / 2 + TAU * k);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  private drawMeteors() {
    if (!this.meteors.length) return;
    const ctx = this.ctx;
    for (const m of this.meteors) {
      const k = 1 - clamp(m.t / 0.7, 0, 1);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.globalAlpha = 0.4 + k * 0.5;
      ctx.strokeStyle = "#ff8400";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, m.r * (1.15 - k * 0.15), 0, TAU);
      ctx.stroke();
      ctx.rotate(this.time * 4);
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (m.r * 0.72), Math.sin(a) * (m.r * 0.72));
        ctx.lineTo(Math.cos(a) * (m.r * 0.95), Math.sin(a) * (m.r * 0.95));
        ctx.stroke();
      }
      ctx.restore();
      const rockY = m.y - (1 - k) * 520;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      this.glow(m.x, rockY, 26, "#ff8400", 0.85);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#ffd08a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(m.x, rockY);
      ctx.lineTo(m.x - 8, rockY - 120);
      ctx.stroke();
      ctx.fillStyle = "#fff1d0";
      ctx.beginPath();
      ctx.arc(m.x, rockY, 9, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  private drawBullets() {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "lighter";
    // Em cenas cheias, cada arc/fill extra de projétil vira centenas de draw
    // calls. Contamos uma vez e cortamos os detalhes mais caros.
    let eActive = 0, pActive = 0;
    for (const b of this.eBullets) if (b.on) eActive++;
    for (const b of this.pBullets) if (b.on) pActive++;
    const detailed = eActive + pActive < 160;
    ctx.lineCap = "round";
    // enemy bullets
    for (const b of this.eBullets) {
      if (!b.on) continue;
      if (b.kind === "ring") {
        ctx.globalAlpha = clamp(b.life / 1.2, 0.15, 1);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.stroke();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      // halo is a translucent stroke, NOT a sprite blit: bullets are numerous,
      // and drawImage of a radial gradient per bullet is what murders fill-rate.
      const len = b.kind === "shard" ? 26 : 12;
      const a = Math.atan2(b.vy, b.vx);
      const ex = b.x - Math.cos(a) * len, ey = b.y - Math.sin(a) * len;
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.r * 3.4;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = b.r * 1.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      if (detailed) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.55, 0, TAU);
        ctx.fill();
      }
    }
    // player bullets
    for (const b of this.pBullets) {
      if (!b.on) continue;
      const w = b.w;
      if (w.kind === "blade" || w.id === "saberThrow") {
        const a = Math.atan2(b.vy, b.vx);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = b.crit ? "#ffffff" : w.color;
        ctx.lineWidth = b.r * 1.15;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 1.25, a - 1.05, a + 1.05);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 1.25, a - 0.7, a + 0.7);
        ctx.stroke();
        continue;
      }
      const a = Math.atan2(b.vy, b.vx);
      const len = b.r * 6 * w.trail;
      const ex = b.x - Math.cos(a) * len, ey = b.y - Math.sin(a) * len;
      ctx.globalAlpha = b.crit ? 0.4 : 0.28;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = b.r * 4.2;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = b.crit ? "#ffffff" : w.color;
      ctx.lineWidth = b.r * (w.id === "rail" ? 1.4 : 1);
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      if (w.id === "rail" && detailed) {
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(b.px, b.py);
        ctx.lineTo(b.x - Math.cos(a) * len * 2.6, b.y - Math.sin(a) * len * 2.6);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.5, 0, TAU);
      ctx.fill();
    }
    ctx.lineCap = "butt";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawBeams() {
    const ctx = this.ctx;
    for (const bm of this.beams) {
      ctx.save();
      ctx.translate(bm.x, bm.y);
      ctx.rotate(bm.ang);
      if (bm.tele > 0) {
        const k = 1 - bm.tele / (bm.fromBoss ? 0.85 : 0.9);
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = this.hexA(bm.color, 0.25 + k * 0.5);
        ctx.lineWidth = 1 + k * 2.4;
        ctx.setLineDash([16, 12]);
        ctx.lineDashOffset = -this.time * 90;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(bm.len, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const k = clamp(bm.fire / (bm.fromBoss ? 1.5 : 0.14), 0, 1);
        const w = bm.w * k;
        ctx.globalCompositeOperation = "lighter";
        this.glow(0, 0, w * 2, bm.color, 0.6);
        const g = ctx.createLinearGradient(0, -w, 0, w);
        g.addColorStop(0, this.hexA(bm.color, 0));
        g.addColorStop(0.5, "#ffffff");
        g.addColorStop(1, this.hexA(bm.color, 0));
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.7 + Math.sin(this.time * 40) * 0.16;
        ctx.fillRect(0, -w / 2, bm.len, w);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  /** additive sparks — cheap rects, glow only for the few big ones */
  private drawParticles() {
    const ctx = this.ctx;
    const n = this.nParts;
    if (!n) return;
    ctx.globalCompositeOperation = "lighter";
    let glowBudget = this.quality > 0.8 ? 26 : 8;
    let lastColor = "";
    for (let i = 0; i < n; i++) {
      const p = this.particles[i];
      const a = p.life / p.max;
      const s = p.size * (0.55 + a * 0.75);
      if (p.color !== lastColor) { ctx.fillStyle = p.color; lastColor = p.color; }
      if (p.kind === 1) {
        // streak shard
        ctx.globalAlpha = a * 0.85;
        const dx = p.vx, dy = p.vy;
        const l = hyp(dx, dy) || 1;
        const ux = (dx / l) * s * 2.4, uy = (dy / l) * s * 2.4;
        ctx.lineWidth = s * 0.8;
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x - ux * 0.5, p.y - uy * 0.5);
        ctx.lineTo(p.x + ux * 0.5, p.y + uy * 0.5);
        ctx.stroke();
      } else if (p.glow > 0.9 && glowBudget > 0 && s > 2.6) {
        glowBudget--;
        ctx.globalAlpha = a;
        this.glow(p.x, p.y, s * 2.4, p.color, 0.8);
      } else {
        ctx.globalAlpha = a;
        ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawFloaters() {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    let lastFont = "";
    for (const f of this.floaters) {
      const a = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = a;
      const fs = `700 ${f.size}px 'Chakra Petch', sans-serif`;
      if (fs !== lastFont) { ctx.font = fs; lastFont = fs; }
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  private drawOverlays(dt: number) {
    const ctx = this.ctx;
    const { W, H } = this;
    if (this.flash > 0.01) {
      ctx.globalAlpha = clamp(this.flash, 0, 0.65);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    // damage vignette (cached gradient, alpha animated; toggleable in Options)
    const vg = this.dmgFlashEnabled ? this.dmgVig : 0;
    if (vg > 0.01 && this.dmgGrad) {
      ctx.globalAlpha = clamp(vg * 0.85, 0, 0.8);
      ctx.fillStyle = this.dmgGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    // base vignette (cached)
    void dt;
  }

  private drawReticle() {
    if (this.touchMode || this.status !== "playing") return;
    const ctx = this.ctx;
    const x = this.mouse.x, y = this.mouse.y;
    const w = this.classWeapons[this.weaponIdx] ?? WEAPONS[0];
    const spread = 10 + w.spread * 90 + (this.player.fireT > 0 ? 6 : 0) + hyp(this.player.vx, this.player.vy) * 0.012;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.time * 0.6);
    ctx.strokeStyle = w.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * spread, Math.sin(a) * spread);
      ctx.lineTo(Math.cos(a) * (spread + 8), Math.sin(a) * (spread + 8));
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, spread * 0.42, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  setTouch(v: boolean) { this.touchMode = v; }

  private drawTouchHints() {
    const ctx = this.ctx;
    const spot = (x: number, y: number, label: string, color: string) => {
      const a = 0.16 + Math.sin(this.time * 2.2) * 0.05;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 9]);
      ctx.beginPath(); ctx.arc(x, y, 54, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = a * 2.4;
      ctx.fillStyle = color;
      ctx.font = "700 11px 'Chakra Petch', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, x, y);
      ctx.restore();
    };
    if (!this.stickMove.active) spot(this.W * 0.22, this.H - 140, "MOVER", "#4ff0ff");
    if (!this.stickAim.active) spot(this.W * 0.78, this.H - 240, "MIRAR", "#ff6a2e");
  }

  private drawTouchUI() {
    const ctx = this.ctx;
    if (!this.stickMove.active || !this.stickAim.active) this.drawTouchHints();
    const drawStick = (s: typeof this.stickMove, color: string) => {
      if (s.active) {
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.ox, s.oy, 62, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = this.hexA(color, 0.28);
        ctx.beginPath(); ctx.arc(s.ox + s.dx * 52, s.oy + s.dy * 52, 26, 0, TAU); ctx.fill();
        ctx.strokeStyle = color; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };
    drawStick(this.stickMove, "#4ff0ff");
    drawStick(this.stickAim, "#ff6a2e");
    // dash button
    const ready = this.player.dashCd <= 0;
    const cx = this.dashBtn.x, cy = this.dashBtn.y, r = this.dashBtn.r;
    ctx.globalAlpha = ready ? 0.9 : 0.4;
    ctx.strokeStyle = ready ? "#4ff0ff" : "#5a6b8c";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    if (!ready) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#4ff0ff";
      ctx.beginPath();
      ctx.arc(cx, cy, r - 4, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - this.player.dashCd / (1.55 * this.stats.dashCdMul)));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = ready ? "#4ff0ff" : "#5a6b8c";
    ctx.font = "700 12px 'Chakra Petch', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("DASH", cx, cy);

    // ---- special ability buttons (E / F) ----
    for (let si = 0; si < this.cls.specials.length; si++) {
      const def = this.cls.specials[si];
      const b = this.specBtn[si];
      const pct = clamp(1 - this.specT[si] / def.cd, 0, 1);
      const ready = pct >= 1;
      const cx = b.x, cy = b.y, r = b.r;
      ctx.globalAlpha = ready ? 0.95 : 0.4;
      ctx.strokeStyle = ready ? def.color : "#4c5878";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      if (!ready) {
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 5, -Math.PI / 2, -Math.PI / 2 + TAU * pct);
        ctx.stroke();
      } else if (this.specFlash[si] > 0) {
        ctx.globalAlpha = this.specFlash[si];
        ctx.lineWidth = 2 + this.specFlash[si] * 6;
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = ready ? 1 : 0.5;
      ctx.fillStyle = ready ? def.color : "#6a7898";
      ctx.font = "700 10px 'Chakra Petch', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const label = def.short.length > 9 ? def.short.slice(0, 8) + "." : def.short;
      ctx.fillText(label, cx, cy - 4);
      ctx.font = "700 9px 'Chakra Petch', sans-serif";
      ctx.globalAlpha *= 0.7;
      ctx.fillText(def.key, cx, cy + 9);
      ctx.globalAlpha = 1;
    }

    // botão de turbo (ou TEMPO LENTO para o Velocista — mesmo botão, mesmo gesto: segurar)
    {
      const velo = this.cls.id === "velocista";
      const bx = this.boostBtn.x, by = this.boostBtn.y, br = this.boostBtn.r;
      const meter = velo ? this.slowMeter : this.boost;
      const active = velo ? this.slowT > 0 : this.boosting;
      const can = velo ? this.slowMeter > 0.03 : this.boost > 0.02 && this.boostLock <= 0;
      const hot = velo ? "#b7ff3c" : "#ffd23c";
      ctx.globalAlpha = can ? 0.9 : 0.35;
      ctx.strokeStyle = active ? hot : can ? this.cls.color : "#5a6b8c";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.stroke();
      ctx.globalAlpha *= 0.75;
      ctx.strokeStyle = this.cls.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(bx, by, br - 5, -Math.PI / 2, -Math.PI / 2 + TAU * meter);
      ctx.stroke();
      ctx.globalAlpha = can ? 0.95 : 0.4;
      ctx.fillStyle = active ? hot : this.cls.color;
      ctx.font = "700 10px 'Chakra Petch', sans-serif";
      ctx.fillText(velo ? "TEMPO" : "TURBO", bx, by);
      ctx.globalAlpha = 1;
    }
  }

  private drawBanner() {
    const b = this.banner;
    if (!b) return;
    const ctx = this.ctx;
    const { W, H } = this;
    const el = b.dur - b.t;                 // tempo decorrido
    const inK = clamp(el / 0.35, 0, 1);     // entrada
    const outK = clamp(b.t / 0.45, 0, 1);   // saída
    const k = Math.min(inK, outK);
    const ease = 1 - Math.pow(1 - k, 3);

    if (b.kind === "wave") {
      // ---- faixa cinematográfica: duas barras varrem da esquerda/direita ----
      const y = H * 0.34;
      const bh = clamp(H * 0.17, 82, 136);
      const slide = (1 - ease) * W;
      ctx.save();
      // barra escura
      ctx.globalAlpha = 0.86 * k;
      ctx.fillStyle = "rgba(4,4,12,0.9)";
      ctx.fillRect(-slide, y - bh / 2, W, bh);
      // fios coloridos
      ctx.globalAlpha = k;
      ctx.fillStyle = b.color;
      ctx.fillRect(-slide, y - bh / 2 - 3, W, 3);
      ctx.fillRect(slide, y + bh / 2, W, 3);
      // listras diagonais animadas nas pontas
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y - bh / 2, W, bh); ctx.clip();
      ctx.globalAlpha = 0.14 * k;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 10;
      const off = (this.time * 120) % 40;
      ctx.beginPath();
      for (let x = -bh - 40 + off; x < W * 0.22; x += 40) { ctx.moveTo(x, y + bh / 2); ctx.lineTo(x + bh, y - bh / 2); }
      for (let x = W * 0.78 - off; x < W + bh; x += 40) { ctx.moveTo(x, y + bh / 2); ctx.lineTo(x + bh, y - bh / 2); }
      ctx.stroke();
      ctx.restore();
      // texto grande com leve escala
      const sc = 0.94 + ease * 0.06;
      ctx.translate(W / 2, y);
      ctx.scale(sc, sc);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = k;
      ctx.font = `italic 700 ${clamp(W * 0.085, 40, 84)}px 'Chakra Petch', sans-serif`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.strokeText(b.big, 0, -bh * 0.1);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(b.big, 0, -bh * 0.1);
      ctx.font = `700 ${clamp(W * 0.02, 12, 20)}px 'Chakra Petch', sans-serif`;
      ctx.fillStyle = b.color;
      // letter-spacing manual: desenha caractere a caractere
      const small = b.small.toUpperCase();
      const spacing = 3;
      let tw = 0;
      for (const ch of small) tw += ctx.measureText(ch).width + spacing;
      let cx = -tw / 2;
      ctx.textAlign = "left";
      for (const ch of small) { ctx.fillText(ch, cx, bh * 0.3); cx += ctx.measureText(ch).width + spacing; }
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    // ---- aviso compacto (habilidades, pickups, fase do chefe) ----
    const y = H * 0.22;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(W / 2, y + (1 - ease) * -10);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 700 ${clamp(W * 0.036, 18, 32)}px 'Chakra Petch', sans-serif`;
    const wdt = Math.max(ctx.measureText(b.big).width + 56, 200);
    ctx.fillStyle = "rgba(4,4,12,0.7)";
    ctx.fillRect(-wdt / 2, -24, wdt, 48);
    ctx.fillStyle = b.color;
    ctx.fillRect(-wdt / 2, -24, 3, 48);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(b.big, 0, -6);
    ctx.font = `600 ${clamp(W * 0.013, 10, 13)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = this.hexA(b.color, 0.9);
    ctx.fillText(b.small.toUpperCase(), 0, 13);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  /** "GO!" curto quando os hostis começam a surgir + pulso de borda ao limpar onda */
  private drawGoAndEdge() {
    const ctx = this.ctx;
    const { W, H } = this;
    if (this.waveFlashT > 0) {
      const k = this.waveFlashT / 0.9;
      ctx.save();
      ctx.globalAlpha = k * 0.7;
      ctx.strokeStyle = "#4ff0ff";
      ctx.lineWidth = 14 * k + 2;
      ctx.strokeRect(0, 0, W, H);
      ctx.restore();
    }
    if (this.goT > 0 && !this.banner) {
      const el = 0.9 - this.goT;
      const pop = el < 0.12 ? el / 0.12 : 1;
      const fade = clamp(this.goT / 0.3, 0, 1);
      const sc = 1.6 - pop * 0.6;
      ctx.save();
      ctx.translate(W / 2, H * 0.3);
      ctx.scale(sc, sc);
      ctx.globalAlpha = fade;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `italic 700 ${clamp(W * 0.1, 48, 96)}px 'Chakra Petch', sans-serif`;
      ctx.lineWidth = 8;
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.strokeText("GO!", 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("GO!", 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /** aviso lateral discreto (pickups, multi-abate, habilidade pronta) */
  private toast(text: string, color: string) {
    if (this.demoActive) return;
    if (this.toasts.length && this.toasts[this.toasts.length - 1].text === text) { this.toasts[this.toasts.length - 1].t = 1.8; return; }
    this.toasts.push({ text, color, t: 1.8 });
    if (this.toasts.length > 4) this.toasts.shift();
  }

  private drawToasts() {
    if (!this.toasts.length) return;
    const ctx = this.ctx;
    const x = this.W - 14;
    let y = 58;
    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "700 12px 'Chakra Petch', sans-serif";
    for (const t of this.toasts) {
      const a = clamp(t.t / 0.4, 0, 1);
      const slide = (1 - clamp((1.8 - t.t) / 0.2, 0, 1)) * 24;
      ctx.globalAlpha = a;
      const w = ctx.measureText(t.text).width + 20;
      ctx.fillStyle = "rgba(4,4,12,0.72)";
      ctx.fillRect(x - w + slide, y - 11, w, 22);
      ctx.fillStyle = t.color;
      ctx.fillRect(x - w + slide, y - 11, 2, 22);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(t.text, x - 8 + slide, y + 1);
      y += 26;
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private setBanner(big: string, small: string, color: string, dur: number, kind: "wave" | "info" = "info") {
    if (this.demoActive) return;
    // uma faixa de onda nunca é sobrescrita por um aviso menor
    if (this.banner && this.banner.kind === "wave" && kind === "info" && this.banner.t > 0.4) return;
    this.banner = { big, small, color, t: dur, dur, kind };
  }

  /* ================= hud bridge ================= */

  private publish(force: boolean) {
    const now = performance.now();
    // no menu só a legenda da demo muda; re-renderizar o React 11x/s ali
    // disputava CPU com a própria demo
    const minGap = this.status === "menu" ? 320 : this.touchMode ? 120 : 90;
    if (!force && now - this.hudT < minGap) return;
    this.hudT = now;
    const w = this.classWeapons[this.weaponIdx] ?? WEAPONS[0];
    const mods = MODS.filter((m) => (this.modLevels[m.id] ?? 0) > 0).map((m) => ({
      id: m.id, name: m.name, color: m.color, level: this.modLevels[m.id] ?? 0,
    }));
    this.cb.onHud({
      status: this.status,
      score: this.score,
      wave: this.wave,
      hp: Math.max(0, this.player.hp),
      maxHp: this.player.maxHp,
      armor: this.stats.armor,
      combo: this.comboMul(),
      comboPct: clamp(this.streakT / 3.2, 0, 1),
      weaponIdx: this.weaponIdx,
      weaponName: w.name,
      weaponCode: w.code,
      weaponColor: w.color,
      ammo: w.ammoClip > 0 ? this.ammo[this.weaponIdx] : -1,
      ammoMax: w.ammoClip,
      owned: [...this.owned],
      weaponAmmo: this.classWeapons.map((wd, i) => (wd.ammoClip > 0 ? this.ammo[i] / wd.ammoClip : 1)),
      slotCodes: this.classWeapons.map((wd) => wd.code),
      slotColors: this.classWeapons.map((wd) => wd.color),
      slotIds: this.classWeapons.map((wd) => wd.id),
      slowPct: this.slowMeter,
      slowing: this.slowT > 0,
      hasSlow: this.cls.id === "velocista",
      dashPct: clamp(1 - this.player.dashCd / (1.55 * this.stats.dashCdMul), 0, 1),
      enemies: this.enemies.reduce((n, e) => n + Number(!e.dead && e.controlledT <= 0), 0) + this.marks.length,
      boss: this.boss ? {
        name: this.boss.def.name, title: this.boss.def.title,
        hp: Math.max(0, this.boss.hp), max: this.boss.maxHp, color: this.boss.def.color,
      } : null,
      kills: this.kills,
      time: this.runTime,
      mods,
      cards: this.cards,
      banner: this.banner ? { big: this.banner.big, small: this.banner.small, color: this.banner.color } : null,
      touch: this.touchMode,
      waveType: this.boss ? "CHEFE" : this.waveActive ? "COMBATE" : "REAGRUPAR",
      className: this.cls.name,
      classId: this.cls.id,
      classColor: this.cls.color,
      abilityName: this.cls.specials[0].name,
      abilityPct: clamp(1 - this.abilityT / Math.max(0.001, this.cls.specials[0].cd), 0, 1),
      abilityActive: this.abilityOn > 0 || this.eyeOn > 0 || this.novaR > 0,
      passName: this.cls.passiveName,
      spec0: { name: this.cls.specials[0].short, full: this.cls.specials[0].name, key: this.cls.specials[0].key,
               pct: clamp(1 - (this.specT[0] ?? 0) / this.cls.specials[0].cd, 0, 1), cd: this.cls.specials[0].cd,
               color: this.cls.specials[0].color },
      spec1: { name: this.cls.specials[1].short, full: this.cls.specials[1].name, key: this.cls.specials[1].key,
               pct: clamp(1 - (this.specT[1] ?? 0) / this.cls.specials[1].cd, 0, 1), cd: this.cls.specials[1].cd,
               color: this.cls.specials[1].color },
      specs: this.cls.specials.map((sp, i) => ({
        name: sp.short, full: sp.name, key: sp.key,
        pct: clamp(1 - (this.specT[i] ?? 0) / sp.cd, 0, 1), cd: sp.cd, color: sp.color,
      })),
      biomeName: this.biome().name,
      boostPct: this.boost,
      boosting: this.boosting,
      hasBoost: this.cls.id !== "velocista",
    });
  }

  /* ================= attract mode (title screen) ================= */

}
