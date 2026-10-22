export type EnemyKind =
  | "grunt"
  | "drone"
  | "shooter"
  | "heavy"
  | "splitter"
  | "shard"
  | "bomber"
  | "sniper"
  | "orbiter"
  | "summoner"
  | "charger"
  | "healer"
  | "warden"
  | "phantom"
  | "spitter";

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  hp: number;
  speed: number;
  radius: number;
  contact: number;
  score: number;
  cost: number;
  color: string;
  accent: string;
  xp: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  grunt: {
    kind: "grunt", name: "CAÇADOR", hp: 26, speed: 118, radius: 15,
    contact: 9, score: 100, cost: 1, color: "#ff3b5c", accent: "#ff9aab", xp: 1,
  },
  drone: {
    kind: "drone", name: "ENXAME", hp: 12, speed: 260, radius: 10,
    contact: 6, score: 70, cost: 0.7, color: "#ff8400", accent: "#ffd08a", xp: 1,
  },
  shooter: {
    kind: "shooter", name: "ATIRADOR", hp: 30, speed: 92, radius: 14,
    contact: 7, score: 160, cost: 1.6, color: "#c04bff", accent: "#e6b3ff", xp: 2,
  },
  heavy: {
    kind: "heavy", name: "COLOSSO", hp: 165, speed: 52, radius: 27,
    contact: 18, score: 460, cost: 3.4, color: "#ffd23c", accent: "#fff2a8", xp: 4,
  },
  splitter: {
    kind: "splitter", name: "DIVISOR", hp: 60, speed: 96, radius: 19,
    contact: 10, score: 200, cost: 2, color: "#3cff8f", accent: "#b6ffd8", xp: 2,
  },
  shard: {
    kind: "shard", name: "FRAGMENTO", hp: 16, speed: 210, radius: 9,
    contact: 5, score: 45, cost: 0.3, color: "#7dffbe", accent: "#d6ffee", xp: 1,
  },
  bomber: {
    kind: "bomber", name: "FUNGÍVEL", hp: 34, speed: 190, radius: 16,
    contact: 34, score: 190, cost: 1.8, color: "#ff4d1a", accent: "#ffb08f", xp: 2,
  },
  sniper: {
    kind: "sniper", name: "PRECISÃO", hp: 40, speed: 70, radius: 15,
    contact: 8, score: 260, cost: 2.2, color: "#00e5c0", accent: "#a8fff2", xp: 3,
  },
  orbiter: {
    kind: "orbiter", name: "ÓRBITA", hp: 46, speed: 175, radius: 14,
    contact: 8, score: 240, cost: 2.1, color: "#4f8dff", accent: "#bcd6ff", xp: 3,
  },
  summoner: {
    kind: "summoner", name: "EVOCADOR", hp: 90, speed: 60, radius: 21,
    contact: 8, score: 420, cost: 3, color: "#ff5ec8", accent: "#ffc4ea", xp: 4,
  },
  // ---- novos ----
  charger: {
    // para, mira, e investe em linha reta — esquive para o lado
    kind: "charger", name: "ARIETE", hp: 70, speed: 80, radius: 18,
    contact: 22, score: 300, cost: 2.4, color: "#ff7a1a", accent: "#ffd0a8", xp: 3,
  },
  healer: {
    // fica atrás dos outros e regenera aliados próximos — alvo prioritário
    kind: "healer", name: "MEDICANTE", hp: 55, speed: 85, radius: 15,
    contact: 5, score: 380, cost: 2.6, color: "#6cff9e", accent: "#d8ffe8", xp: 3,
  },
  warden: {
    // carrega um escudo frontal que bloqueia tiros: flanqueie-o
    kind: "warden", name: "ESCUDEIRO", hp: 120, speed: 68, radius: 20,
    contact: 14, score: 360, cost: 2.8, color: "#8fb4ff", accent: "#dde8ff", xp: 3,
  },
  phantom: {
    // pisca entre posições e some por instantes
    kind: "phantom", name: "FANTASMA", hp: 42, speed: 150, radius: 14,
    contact: 12, score: 320, cost: 2.3, color: "#c9b6ff", accent: "#f0eaff", xp: 3,
  },
  spitter: {
    // cospe poças ácidas que ficam no chão
    kind: "spitter", name: "CUSPIDOR", hp: 58, speed: 78, radius: 17,
    contact: 7, score: 280, cost: 2.2, color: "#b7ff3c", accent: "#ecffc4", xp: 3,
  },
};

export const BOSS_DEFS = [
  {
    id: "warden",
    name: "O GUARDIÃO",
    title: "SENTINELA DE OBSIDIANA",
    hp: 1500,
    radius: 54,
    color: "#ff3b5c",
    accent: "#ffb3c0",
    score: 5000,
  },
  {
    id: "hydra",
    name: "HIDRA-9",
    title: "COROAS DE FOGO",
    hp: 2600,
    radius: 60,
    color: "#ffb020",
    accent: "#ffe6a8",
    score: 9000,
  },
  {
    id: "monolith",
    name: "MONÓLITO",
    title: "PRISMA ANCESTRAL",
    hp: 4200,
    radius: 66,
    color: "#a37bff",
    accent: "#ded0ff",
    score: 15000,
  },
  {
    id: "reaper",
    name: "CEIFA-NULA",
    title: "O FIM DO SILÍCIO",
    hp: 6400,
    radius: 72,
    color: "#00e5c0",
    accent: "#c1fff4",
    score: 24000,
  },
] as const;
