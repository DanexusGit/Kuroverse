import type { ClassId } from "./classes";
export type { ClassId } from "./classes";

export interface WeaponDef {
  id: string;
  name: string;
  code: string;
  color: string;
  glow: string;
  dmg: number;
  rate: number;   // seconds between shots
  speed: number;  // px/s
  spread: number; // radians
  pellets: number;
  pierce: number;
  knock: number;
  recoil: number;
  life: number;   // bullet lifetime (s)
  bulletR: number;
  trail: number;
  ammoClip: number; // 0 = infinite
  shake: number;
  sfx: string;
  desc: string;
  hitRadius: number;
  explosive?: { radius: number; dmg: number };
  chain?: { jumps: number; range: number };
  kind?: "beam" | "blade";
  owner?: ClassId;  // set = unique to that class; unset = universal
  shape: "bolt" | "slug" | "orb" | "shell" | "bee" | "star" | "beam" | "blade";
}

/**
 * One universal weapon plus two uniques per class.
 * Every class ends up with exactly three weapons.
 */
export const WEAPONS: WeaponDef[] = [
  /* ---------- UNIVERSAL (every class) ---------- */
  {
    id: "pulse", name: "PULSE-9", code: "RK-9", color: "#4ff0ff", glow: "#0fd0ff",
    dmg: 14, rate: 0.1, speed: 1520, spread: 0.016, pellets: 1, pierce: 0,
    knock: 90, recoil: 60, life: 1.05, bulletR: 4.4, trail: 1.5, ammoClip: 0,
    shake: 1.6, sfx: "pulse",
    desc: "Rifle de plasma equilibrado. Munição infinita. Presente em todas as classes.",
    hitRadius: 7, shape: "bolt",
  },

  /* ---------- MAGO ---------- */
  {
    id: "tesla", name: "ARC", code: "TS-N", color: "#a37bff", glow: "#7a2bff",
    dmg: 26, rate: 0.26, speed: 2600, spread: 0.04, pellets: 1, pierce: 2,
    knock: 60, recoil: 70, life: 0.42, bulletR: 5, trail: 1.6, ammoClip: 150,
    shake: 2.6, sfx: "tesla",
    desc: "Raio que salta entre 3 alvos próximos.",
    hitRadius: 9, chain: { jumps: 3, range: 250 }, owner: "mago", shape: "orb",
  },
  {
    id: "rune", name: "RUNA", code: "RN-3", color: "#c77bff", glow: "#a12bff",
    dmg: 34, rate: 0.36, speed: 1080, spread: 0.02, pellets: 1, pierce: 3,
    knock: 110, recoil: 90, life: 0.95, bulletR: 8, trail: 1.2, ammoClip: 110,
    shake: 3.2, sfx: "tesla",
    desc: "Orbe rúnico lento que atravessa 3 inimigos e detona ao fim.",
    hitRadius: 12, explosive: { radius: 105, dmg: 34 }, owner: "mago", shape: "orb",
  },

  /* ---------- ATIRADOR ---------- */
  {
    id: "rail", name: "LANCE", code: "RV-X", color: "#ff3ce0", glow: "#ff00c8",
    dmg: 92, rate: 0.92, speed: 3300, spread: 0.002, pellets: 1, pierce: 99,
    knock: 200, recoil: 240, life: 0.5, bulletR: 7, trail: 4, ammoClip: 28,
    shake: 7.5, sfx: "rail",
    desc: "Perfura a fileira inteira. Dano devastador.",
    hitRadius: 12, owner: "atirador", shape: "star",
  },
  {
    id: "needle", name: "AGULHA", code: "AG-7", color: "#7bffd6", glow: "#00ffc8",
    dmg: 23, rate: 0.13, speed: 2650, spread: 0.008, pellets: 1, pierce: 1,
    knock: 50, recoil: 40, life: 0.7, bulletR: 3.4, trail: 2.2, ammoClip: 210,
    shake: 1.4, sfx: "smg",
    desc: "Rajada hiperveloz e precisa. Perfeita para críticos.",
    hitRadius: 6, owner: "atirador", shape: "bee",
  },

  /* ---------- VELOCISTA ---------- */
  {
    id: "smg", name: "VULCAN", code: "SMG-V", color: "#b7ff3c", glow: "#7ce800",
    dmg: 7.5, rate: 0.052, speed: 1680, spread: 0.115, pellets: 1, pierce: 0,
    knock: 40, recoil: 34, life: 0.8, bulletR: 3.1, trail: 1.1, ammoClip: 340,
    shake: 1.1, sfx: "smg",
    desc: "Cascata de projéteis. Cadência absurda, mira frouxa.",
    hitRadius: 6, owner: "velocista", shape: "bee",
  },
  {
    id: "shuriken", name: "SHURIKEN", code: "SH-4", color: "#d8ff8a", glow: "#a8ff2b",
    dmg: 11, rate: 0.3, speed: 1450, spread: 0.26, pellets: 5, pierce: 1,
    knock: 80, recoil: 60, life: 0.42, bulletR: 6, trail: 0.6, ammoClip: 90,
    shake: 2.2, sfx: "scatter",
    desc: "Leque de 5 lâminas giratórias de médio alcance.",
    hitRadius: 8, owner: "velocista", shape: "blade",
  },

  /* ---------- SUPER-FORÇA ---------- */
  {
    id: "scatter", name: "MAW", code: "SG-8", color: "#ffb020", glow: "#ff8400",
    dmg: 10, rate: 0.58, speed: 1180, spread: 0.34, pellets: 9, pierce: 1,
    knock: 260, recoil: 320, life: 0.34, bulletR: 3.6, trail: 0.8, ammoClip: 64,
    shake: 5.4, sfx: "scatter",
    desc: "9 estilhaços com recuo brutal. Limpa cercados.",
    hitRadius: 6, owner: "bruto", shape: "shell",
  },
  {
    id: "rocket", name: "HELLFIRE", code: "RL-2", color: "#ff6a2e", glow: "#ff2d00",
    dmg: 34, rate: 0.86, speed: 940, spread: 0.03, pellets: 1, pierce: 0,
    knock: 140, recoil: 190, life: 1.5, bulletR: 7.5, trail: 1.2, ammoClip: 22,
    shake: 4.2, sfx: "rocket",
    desc: "Explosão em área de 150px. Cuidado com o recuo.",
    hitRadius: 10, explosive: { radius: 150, dmg: 66 }, owner: "bruto", shape: "slug",
  },

  /* ---------- ROBÔ ---------- */
  {
    id: "beam", name: "FEIXE OCULAR", code: "FX-0", color: "#ff3ce0", glow: "#ff00c8",
    dmg: 4.8, rate: 0.05, speed: 0, spread: 0, pellets: 1, pierce: 3,
    knock: 0, recoil: 0, life: 0, bulletR: 0, trail: 0, ammoClip: 0,
    shake: 0, sfx: "tesla",
    desc: "Feixes manuais que seguem a mira. Potência reforçada: 50% mais dano por pulso.",
    hitRadius: 9, kind: "beam", owner: "robo", shape: "beam",
  },
  {
    id: "ion", name: "ÍON", code: "IO-5", color: "#ff9cf0", glow: "#ff5ce0",
    dmg: 46, rate: 0.72, speed: 820, spread: 0.02, pellets: 1, pierce: 0,
    knock: 160, recoil: 200, life: 1.4, bulletR: 9, trail: 1.1, ammoClip: 30,
    shake: 4.6, sfx: "rocket",
    desc: "Esfera de íons lenta que explode em área ampla.",
    hitRadius: 12, explosive: { radius: 165, dmg: 62 }, owner: "robo", shape: "orb",
  },

  /* ---------- SAMURAI ---------- */
  {
    id: "katana", name: "KATANA", code: "KT-1", color: "#ff4d3d", glow: "#ff2d1a",
    dmg: 27, rate: 0.36, speed: 1500, spread: 0.24, pellets: 3, pierce: 99,
    knock: 130, recoil: 0, life: 0.11, bulletR: 12, trail: 0, ammoClip: 0,
    shake: 1.2, sfx: "tesla",
    desc: "Espada forte de alcance curto. Três cortes por golpe.",
    hitRadius: 14, kind: "blade", owner: "samurai", shape: "blade",
  },
  {
    id: "wave", name: "ONDA DE CORTE", code: "OC-2", color: "#ff8a7a", glow: "#ff4d3d",
    dmg: 48, rate: 0.5, speed: 1350, spread: 0.06, pellets: 1, pierce: 99,
    knock: 90, recoil: 40, life: 0.58, bulletR: 15, trail: 0, ammoClip: 0,
    shake: 2.8, sfx: "rail",
    desc: "Corte de energia projetado que atravessa fileiras inteiras.",
    hitRadius: 16, kind: "blade", owner: "samurai", shape: "blade",
  },
  /* ---------- ENGENHEIRA ---------- */
  {
    id: "coil", name: "COIL DRIVER", code: "CD-4", color: "#38d6a5", glow: "#00b887",
    dmg: 20, rate: 0.22, speed: 2050, spread: 0.025, pellets: 1, pierce: 1,
    knock: 80, recoil: 45, life: 0.8, bulletR: 4.8, trail: 1.5, ammoClip: 190,
    shake: 1.8, sfx: "tesla",
    desc: "Dardo elétrico que salta para um segundo alvo.",
    hitRadius: 8, chain: { jumps: 1, range: 170 }, owner: "engenheira", shape: "orb",
  },
  {
    id: "mine", name: "MINA LANÇADA", code: "MN-2", color: "#ffb020", glow: "#ff8400",
    dmg: 30, rate: 0.68, speed: 870, spread: 0.04, pellets: 1, pierce: 0,
    knock: 120, recoil: 70, life: 1.15, bulletR: 7, trail: 0.5, ammoClip: 32,
    shake: 2.8, sfx: "rocket",
    desc: "Carga explosiva de alcance médio, útil para preparar uma zona.",
    hitRadius: 12, explosive: { radius: 120, dmg: 48 }, owner: "engenheira", shape: "slug",
  },
  /* ---------- ALQUIMISTA ---------- */
  {
    id: "flask", name: "FRASCO VIVO", code: "FV-3", color: "#c7ff52", glow: "#85d920",
    dmg: 22, rate: 0.42, speed: 1050, spread: 0.035, pellets: 1, pierce: 0,
    knock: 55, recoil: 28, life: 1.05, bulletR: 7, trail: 0.6, ammoClip: 90,
    shake: 1.6, sfx: "scatter",
    desc: "Frasco que estilhaça em uma pequena nuvem corrosiva.",
    hitRadius: 11, explosive: { radius: 72, dmg: 24 }, owner: "alquimista", shape: "orb",
  },
  {
    id: "bile", name: "BILE NEGRA", code: "BN-8", color: "#55e889", glow: "#14b85a",
    dmg: 18, rate: 0.24, speed: 1450, spread: 0.055, pellets: 1, pierce: 2,
    knock: 30, recoil: 18, life: 0.85, bulletR: 5, trail: 1.0, ammoClip: 150,
    shake: 1.1, sfx: "tesla",
    desc: "Dardo ácido. Perfura alvos e salta uma vez para um inimigo próximo.",
    hitRadius: 8, chain: { jumps: 1, range: 150 }, owner: "alquimista", shape: "slug",
  },
  /* ---------- ORÁCULO ---------- */
  {
    id: "oracle", name: "ESTRELA-GUIA", code: "EG-7", color: "#f3d37a", glow: "#d6aa3c",
    dmg: 19, rate: 0.18, speed: 1950, spread: 0.015, pellets: 1, pierce: 1,
    knock: 55, recoil: 32, life: 0.95, bulletR: 4.5, trail: 1.4, ammoClip: 170,
    shake: 1.2, sfx: "pulse",
    desc: "Projétil preciso que atravessa um alvo e segue sua trajetória.",
    hitRadius: 7, owner: "oraculo", shape: "star",
  },
  {
    id: "halo", name: "HALO SOLAR", code: "HS-2", color: "#fff0b0", glow: "#f3d37a",
    dmg: 13, rate: 0.48, speed: 1050, spread: 0.22, pellets: 3, pierce: 0,
    knock: 90, recoil: 36, life: 0.72, bulletR: 6.5, trail: 0.8, ammoClip: 72,
    shake: 2, sfx: "tesla",
    desc: "Três discos de luz que se abrem em leque e empurram hostis.",
    hitRadius: 9, owner: "oraculo", shape: "orb",
  },
  /* ---------- NECROMANTE ---------- */
  {
    id: "soul", name: "ORBE FÚNEBRE", code: "OF-9", color: "#b46cff", glow: "#7d35cf",
    dmg: 24, rate: 0.24, speed: 1350, spread: 0.025, pellets: 1, pierce: 1,
    knock: 40, recoil: 25, life: 1.05, bulletR: 6, trail: 1.3, ammoClip: 0,
    shake: 1.5, sfx: "tesla",
    desc: "Orbes sombrios perfuram alvos e saltam para um segundo alvo.",
    hitRadius: 9, chain: { jumps: 1, range: 125 }, owner: "necromante", shape: "orb",
  },
  {
    id: "reaper", name: "FOICE ESPECTRAL", code: "FE-3", color: "#ef79ff", glow: "#bd45e0",
    dmg: 34, rate: 0.42, speed: 1230, spread: 0.18, pellets: 2, pierce: 99,
    knock: 75, recoil: 12, life: 0.22, bulletR: 13, trail: 0.5, ammoClip: 0,
    shake: 2, sfx: "rail",
    desc: "Dois arcos de foice espectral atravessam inimigos próximos.",
    hitRadius: 13, kind: "blade", owner: "necromante", shape: "blade",
  },
  /* ---------- ILUSIONISTA ---------- */
  {
    id: "mirror", name: "ESTILHAÇO-ÍRIS", code: "EI-6", color: "#55d9ff", glow: "#249acb",
    dmg: 15, rate: 0.12, speed: 1790, spread: 0.04, pellets: 2, pierce: 0,
    knock: 50, recoil: 20, life: 0.9, bulletR: 4, trail: 1.3, ammoClip: 0,
    shake: 1.3, sfx: "pulse",
    desc: "Dois estilhaços espelhados que se abrem em leque.",
    hitRadius: 7, owner: "ilusionista", shape: "star",
  },
  {
    id: "prism", name: "PRISMA PARTIDO", code: "PP-4", color: "#f0a7ff", glow: "#b75bff",
    dmg: 28, rate: 0.38, speed: 1250, spread: 0.05, pellets: 1, pierce: 2,
    knock: 60, recoil: 30, life: 1.2, bulletR: 7, trail: 1, ammoClip: 96,
    shake: 1.7, sfx: "tesla",
    desc: "Projétil prismático que atravessa alvos e se divide em fragmentos.",
    hitRadius: 10, owner: "ilusionista", shape: "star",
  },
  {
    id: "psi", name: "AGULHA MENTAL", code: "PS-1", color: "#f292cf", glow: "#bc50a1",
    dmg: 23, rate: 0.2, speed: 1650, spread: 0.02, pellets: 1, pierce: 1,
    knock: 45, recoil: 12, life: 0.9, bulletR: 5, trail: 1.3, ammoClip: 0,
    shake: 0.8, sfx: "tesla", hitRadius: 8, owner: "telepata", shape: "star",
    desc: "Uma agulha psíquica precisa atravessa dois alvos. Munição infinita.",
  },
  {
    id: "synapse", name: "SINAPSE", code: "SN-3", color: "#d4a5ff", glow: "#995bcd",
    dmg: 28, rate: 0.48, speed: 1150, spread: 0.2, pellets: 3, pierce: 0,
    knock: 70, recoil: 22, life: 0.65, bulletR: 6, trail: 0.7, ammoClip: 70,
    shake: 1.4, sfx: "tesla", hitRadius: 9, chain: { jumps: 1, range: 130 }, owner: "telepata", shape: "orb",
    desc: "Três pulsos mentais em leque; cada um salta para mais um inimigo.",
  },
  {
    id: "lightsaber", name: "SABRE DE LUZ", code: "SL-1", color: "#83f6bc", glow: "#34d980",
    dmg: 34, rate: 0.34, speed: 1500, spread: 0.3, pellets: 3, pierce: 99,
    knock: 100, recoil: 0, life: 0.1, bulletR: 12, trail: 0, ammoClip: 0,
    shake: 1.1, sfx: "tesla", hitRadius: 14, kind: "blade", owner: "jedi", shape: "blade",
    desc: "Três arcos de luz em alcance curto. Atacar permite rebater tiros frontais.",
  },
  {
    id: "saberThrow", name: "SABRE ARREMESSADO", code: "SL-2", color: "#a8ffcf", glow: "#34d980",
    dmg: 48, rate: 0.8, speed: 790, spread: 0, pellets: 1, pierce: 99,
    knock: 65, recoil: 0, life: 1.9, bulletR: 13, trail: 0.6, ammoClip: 0,
    shake: 0.9, sfx: "tesla", hitRadius: 14, owner: "jedi", shape: "blade",
    desc: "O sabre vai e volta, atingindo cada inimigo uma vez em cada passagem.",
  },
  {
    id: "frostNeedle", name: "AGULHAS GLACIAIS", code: "GL-1", color: "#8edaff", glow: "#4da9e0",
    dmg: 18, rate: 0.16, speed: 1730, spread: 0.03, pellets: 1, pierce: 1,
    knock: 35, recoil: 20, life: 0.9, bulletR: 4.5, trail: 1.6, ammoClip: 0,
    shake: 0.8, sfx: "pulse", hitRadius: 7, owner: "criomante", shape: "star",
    desc: "Cristais perfurantes que retardam os alvos. Munição infinita.",
  },
  {
    id: "iceMortar", name: "NÚCLEO DE GEADA", code: "GL-2", color: "#c2eaff", glow: "#719fe9",
    dmg: 32, rate: 0.78, speed: 820, spread: 0.025, pellets: 1, pierce: 0,
    knock: 100, recoil: 55, life: 1.15, bulletR: 8.5, trail: 0.7, ammoClip: 48,
    shake: 1.8, sfx: "rocket", hitRadius: 12, explosive: { radius: 135, dmg: 65 }, owner: "criomante", shape: "orb",
    desc: "Uma esfera de gelo explode ao atingir ou expirar, retardando inimigos na área.",
  },
];

export const UNIVERSAL_WEAPON = "pulse";

/** the three weapons a class carries: its two uniques + the universal one */
export const weaponsForClass = (cls: string): WeaponDef[] => {
  const uniques = WEAPONS.filter((w) => w.owner === (cls as ClassId));
  const uni = WEAPONS.find((w) => w.id === UNIVERSAL_WEAPON)!;
  return [...uniques, uni];
};

export const weaponById = (id: string) => WEAPONS.find((w) => w.id === id) ?? WEAPONS[0];

/* ---------------- MODS (upgrade cards) ---------------- */
export interface ModDef {
  id: string;
  name: string;
  tag: string;
  color: string;
  desc: string;
  max: number;
  apply: (p: PlayerStats) => void;
}

export interface PlayerStats {
  dmgMul: number;
  speedMul: number;
  fireRateMul: number;
  maxHpAdd: number;
  hpRegen: number;
  pierceAdd: number;
  extraShot: number;
  critChance: number;
  critMul: number;
  dashCdMul: number;
  lifesteal: number;
  pickupRadius: number;
  armor: number;
  boomRadius: number;
  mulReward: number;
  reflect: number;
  chainBonus: number;
}

export const baseStats = (): PlayerStats => ({
  dmgMul: 1,
  speedMul: 1,
  fireRateMul: 1,
  maxHpAdd: 0,
  hpRegen: 0,
  pierceAdd: 0,
  extraShot: 0,
  critChance: 0.06,
  critMul: 2,
  dashCdMul: 1,
  lifesteal: 0,
  pickupRadius: 130,
  armor: 0,
  boomRadius: 1,
  mulReward: 1,
  reflect: 0,
  chainBonus: 0,
});

export const MODS: ModDef[] = [
  {
    id: "over",
    name: "OVERCHARGE",
    tag: "DANO",
    color: "#ff5b8f",
    desc: "+20% de dano em todas as armas.",
    max: 6,
    apply: (s) => (s.dmgMul *= 1.2),
  },
  {
    id: "swift",
    name: "SERVO-LEGS",
    tag: "MOBILIDADE",
    color: "#4ff0ff",
    desc: "+13% de velocidade e dash mais ágil.",
    max: 5,
    apply: (s) => {
      s.speedMul *= 1.13;
      s.dashCdMul *= 0.88;
    },
  },
  {
    id: "haste",
    name: "TRIGGER-WIRE",
    tag: "CADÊNCIA",
    color: "#b7ff3c",
    desc: "+16% de velocidade de tiro.",
    max: 6,
    apply: (s) => (s.fireRateMul *= 1.16),
  },
  {
    id: "bulk",
    name: "PLATING",
    tag: "SOBREVIVÊNCIA",
    color: "#ffb020",
    desc: "+30 de vida máxima, cura 30 e +1 de armadura.",
    max: 5,
    apply: (s) => {
      s.maxHpAdd += 30;
      s.armor += 1;
    },
  },
  {
    id: "pierce",
    name: "SABIOTEC",
    tag: "PERFURAÇÃO",
    color: "#ff3ce0",
    desc: "Projéteis atravessam +1 inimigo.",
    max: 4,
    apply: (s) => (s.pierceAdd += 1),
  },
  {
    id: "echo",
    name: "ECHO-SPLIT",
    tag: "MULTI-TIRO",
    color: "#a37bff",
    desc: "+1 projétil por disparo (dano reduzido por cópia).",
    max: 3,
    apply: (s) => (s.extraShot += 1),
  },
  {
    id: "crit",
    name: "WEAK-POINT",
    tag: "CRÍTICO",
    color: "#ff8400",
    desc: "+12% de chance de crítico, +0.25x de dano crítico.",
    max: 5,
    apply: (s) => {
      s.critChance += 0.12;
      s.critMul += 0.25;
    },
  },
  {
    id: "vamp",
    name: "LEECH-CELL",
    tag: "ROUBO DE VIDA",
    color: "#3cff8f",
    desc: "Cada abate cura 1.6 de vida.",
    max: 4,
    apply: (s) => (s.lifesteal += 1.6),
  },
  {
    id: "regen",
    name: "NANO-WEAVE",
    tag: "REGENERAÇÃO",
    color: "#4ff0ff",
    desc: "Recupera 1.4 de vida por segundo fora de perigo.",
    max: 3,
    apply: (s) => (s.hpRegen += 1.4),
  },
  {
    id: "boom",
    name: "THERMITE",
    tag: "EXPLOSÃO",
    color: "#ff6a2e",
    desc: "+28% de raio e dano de explosões + estilhaços ao matar.",
    max: 4,
    apply: (s) => {
      s.boomRadius *= 1.28;
      s.reflect += 1;
    },
  },
  {
    id: "magnet",
    name: "GRAV-CORE",
    tag: "COLETA",
    color: "#b7ff3c",
    desc: "Raio de coleta +80% e +12% de pontos.",
    max: 3,
    apply: (s) => {
      s.pickupRadius *= 1.8;
      s.mulReward *= 1.12;
    },
  },
  {
    id: "rich",
    name: "BOUNTY-PROT",
    tag: "PONTOS",
    color: "#ffd83c",
    desc: "+30% de pontuação por abate.",
    max: 4,
    apply: (s) => (s.mulReward *= 1.3),
  },
];
