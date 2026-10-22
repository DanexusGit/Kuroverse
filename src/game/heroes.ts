import { classById } from "./classes";
import type { ClassDef, ClassId, SpecialDef } from "./classes";
import { weaponById } from "./weapons";
import type { WeaponDef } from "./weapons";

/**
 * HEROWAVE — alternate roster. Same twelve archetypes, re-skinned as heroes with
 * completely new powers. The universal rifle is gone: each hero carries only
 * their two signature weapons. The Jedi archetype is not part of this release.
 */

interface HeroWeapon {
  base: string;
  name: string;
  code: string;
  color: string;
  glow: string;
  desc: string;
  dmg?: number;
  rate?: number;
  speed?: number;
  spread?: number;
  pellets?: number;
  pierce?: number;
  knock?: number;
  life?: number;
  bulletR?: number;
  trail?: number;
  ammoClip?: number;
  shake?: number;
  hitRadius?: number;
  kind?: "beam" | "blade";
  explosive?: { radius: number; dmg: number };
  chain?: { jumps: number; range: number };
  shape?: WeaponDef["shape"];
}

export interface HeroDef {
  id: ClassId;
  name: string;
  title: string;
  alias: string;
  role: string;
  color: string;
  accent: string;
  emblem: "eye" | "skull" | "bolt" | "fist" | "arc" | "katana" | "claw" | "mask" | "doom" | "crow" | "panther" | "smoke" | "phoenix" | "snow";
  hp?: number;
  speed?: number;
  dmg?: number;
  fireRate?: number;
  dashCd?: number;
  armor?: number;
  crit?: number;
  weapons: [HeroWeapon, HeroWeapon];
  passiveName: string;
  passiveDesc: string;
  specials: [SpecialDef, SpecialDef, SpecialDef, SpecialDef];
  blurb: string;
}

const sp = (
  key: string, name: string, short: string, cd: number, color: string, desc: string,
  fx: SpecialDef["fx"], params: Record<string, number | string | boolean> = {},
): SpecialDef => ({ key, name, short, cd, color, desc, fx, params });

export const HEROES: HeroDef[] = [
  {
    id: "mago",
    name: "DR. ESTRANHO",
    title: "MAGO SUPREMO",
    alias: "Stephen Strange",
    role: "Misticismo · portais",
    color: "#ff8a3d",
    accent: "#ffdcae",
    emblem: "eye",
    hp: 100, dmg: 1.28,
    weapons: [
      { base: "tesla", name: "FAÍSCAS DE VISHANTI", code: "VS-1", color: "#ffb057", glow: "#ff7a1a",
        desc: "Faíscas místicas que saltam entre inimigos.", dmg: 30, rate: 0.24, trail: 2, chain: { jumps: 4, range: 280 } },
      { base: "rune", name: "SELO DE CRIMSON", code: "CR-7", color: "#ff5f4d", glow: "#c81f14",
        desc: "Um selo flamejante que detém e explode alvos.", dmg: 40, speed: 1020, bulletR: 9,
        explosive: { radius: 125, dmg: 44 } },
    ],
    passiveName: "MANTO DA LEVITAÇÃO",
    passiveDesc: "O manto amortece quedas: 1 de armadura e dash mais curto.",
    dashCd: 0.85, armor: 1,
    specials: [
      sp("E", "ESCUDO DE SERAPHIM", "ESCUDO", 15, "#ffb057",
        "Barreira dourada bloqueia projéteis por 4s e corta o dano recebido.",
        "heal", { shield: 4, reduce: 0.3, heal: 10 }),
      sp("F", "PORTAIS", "PORTAIS", 13, "#ff8a3d",
        "Abre um portal na mira e salta até ele, ferindo quem estiver no caminho.",
        "blink", { dist: 620, dmg: 60, radius: 150, inv: 0.7 }),
      sp("G", "SINGULARIDADE", "VÓRTICE", 12, "#c86bff",
        "Um vórtice no ponto da mira arrasta e mói os inimigos por 3.5s.",
        "vortex", { radius: 250, life: 3.5, dps: 46, pull: 320 }),
      sp("H", "OLHO DE AGAMOTTO", "TEMPO", 26, "#ffd23c",
        "Reverte o tempo: congela a arena por 3s enquanto você age livre.",
        "timestop", { dur: 3 }),
    ],
    blurb: "Molda o tempo e o espaço. Frágil, mas nunca está onde você mira.",
  },
  {
    id: "atirador",
    name: "JUSTICEIRO",
    title: "FRANK CASTLE",
    alias: "Punisher",
    role: "Arsenal pesado · precisão",
    color: "#f2f2f2",
    accent: "#ffffff",
    emblem: "skull",
    hp: 105, dmg: 1.2, armor: 2, crit: 0.32,
    weapons: [
      { base: "needle", name: "M4 TÁTICA", code: "M4-A", color: "#f2f2f2", glow: "#bdbdbd",
        desc: "Rajada disciplinada. Alta cadência, críticos frequentes.", dmg: 26, rate: 0.12, ammoClip: 260 },
      { base: "scatter", name: "ESCOPETA DE COMBATE", code: "SG-12", color: "#ff8a3d", glow: "#c1440e",
        desc: "Doze estilhaços à queima-roupa.", dmg: 12, pellets: 12, rate: 0.62, ammoClip: 54 },
    ],
    passiveName: "TREINAMENTO DE GUERRA",
    passiveDesc: "Críticos garantidos em 32% dos tiros e recarga completa a cada onda.",
    specials: [
      sp("E", "RAJADA DUPLA", "RAJADA", 6, "#f2f2f2",
        "Duas rajadas cruzadas de 9 balas perfurantes à sua frente.",
        "salvo", { n: 9, rows: 2, spread: 0.16, dmg: 26, speed: 2100, pierce: 2 }),
      sp("F", "GRANADA DE FRAGMENTAÇÃO", "GRANADA", 10, "#ff8a3d",
        "Marca o ponto da mira; a granada detona após 1.2s.",
        "blast", { delay: 1.2, radius: 200, dmg: 190 }),
      sp("G", "TORRE SENTINELA", "TORRE", 18, "#ffd23c",
        "Instala uma metralhadora fixa que cobre a área por 12s.",
        "summon", { count: 1, dur: 12, dmg: 26, color: "#ffd23c", static: true }),
      sp("H", "EXECUÇÃO", "EXECUÇÃO", 20, "#ff3b3b",
        "Elimina até 4 inimigos comuns na mira e recupera munição.",
        "execute", { count: 4, radius: 300, ammo: true }),
    ],
    blurb: "Sem poderes. Só método, munição e paciência.",
  },
  {
    id: "velocista",
    name: "FLASH",
    title: "VELOCIDADE DA LUZ",
    alias: "Barry Allen",
    role: "Força de aceleração",
    color: "#ff3b3b",
    accent: "#ffd23c",
    emblem: "bolt",
    hp: 95, speed: 1.5, dmg: 1, fireRate: 1.25, dashCd: 0.3, crit: 0.16,
    weapons: [
      { base: "smg", name: "RAJADA CINÉTICA", code: "SP-1", color: "#ffd23c", glow: "#ff8a00",
        desc: "Projéteis disparados em velocidade sobre-humana.", dmg: 8.5, rate: 0.045, ammoClip: 400 },
      { base: "shuriken", name: "RAIOS DA FORÇA", code: "FR-3", color: "#ff3b3b", glow: "#c40d0d",
        desc: "Leque de raios de força que empurram alvos.", dmg: 13, pellets: 5, knock: 220 },
    ],
    passiveName: "FORÇA DE ACELERAÇÃO",
    passiveDesc: "O mais rápido da arena e o único que desacelera o mundo ao redor.",
    specials: [
      sp("E", "TURBO CINÉTICO", "TURBO", 8, "#ffd23c",
        "6s correndo acima da luz: +70% de velocidade e cadência.",
        "buff", { dur: 6, speed: 1.7, rate: 1.5 }),
      sp("F", "SOCO DE MASSA INFINITA", "SOCO", 9, "#ff3b3b",
        "Investida supersônica em linha reta com dano devastador.",
        "charge", { dist: 460, dmg: 240, radius: 130, stun: 1.2 }),
      sp("G", "PARAR O TEMPO", "TEMPO ZERO", 20, "#8edaff",
        "Acelera tanto que a arena congela por 2.5s.",
        "timestop", { dur: 2.5 }),
      sp("H", "VIBRAR NO TEMPO", "REBOBINAR", 17, "#c1a3ff",
        "Vibra através do tempo e volta 2.3s, recuperando vida.",
        "rewind", {}),
    ],
    blurb: "Já terminou a luta antes de você ver o primeiro golpe.",
  },
  {
    id: "bruto",
    name: "HULK",
    title: "O MAIS FORTE QUE HÁ",
    alias: "Bruce Banner",
    role: "Fúria · impacto",
    color: "#46c93a",
    accent: "#d8ffc4",
    emblem: "fist",
    hp: 230, speed: 0.9, dmg: 1.25, armor: 5, dashCd: 1.25,
    weapons: [
      { base: "scatter", name: "PUNHOS ESMAGADORES", code: "FST", color: "#46c93a", glow: "#1d7a17",
        desc: "Um soco duplo de curto alcance que arremessa tudo.", dmg: 16, pellets: 4, rate: 0.46,
        ammoClip: 0, speed: 900, life: 0.2, bulletR: 14, kind: "blade", hitRadius: 15, shape: "blade" },
      { base: "rocket", name: "ONDA DE CHOQUE", code: "THD", color: "#d8ffc4", glow: "#46c93a",
        desc: "Uma palma de ar comprimido que explode ao alcançar o alvo.",
        dmg: 40, explosive: { radius: 180, dmg: 78 }, ammoClip: 0, speed: 1000 },
    ],
    passiveName: "FÚRIA CRESCENTE",
    passiveDesc: "Quanto menos vida, mais dano: até +45% abaixo de 40% de HP.",
    specials: [
      sp("E", "TROVÃO", "TROVÃO", 7, "#46c93a",
        "Uma palma colossal: dano, empurrão e atordoamento em área.",
        "nova", { radius: 320, dmg: 160, push: 900, stun: 1.4, clear: true }),
      sp("F", "SALTO ESMAGADOR", "SALTO", 10, "#d8ffc4",
        "Salta até a mira e cria uma cratera de impacto.",
        "charge", { dist: 520, dmg: 220, radius: 230, quake: true }),
      sp("G", "RUGIDO", "RUGIDO", 13, "#ffd23c",
        "Um rugido em cone empurra todos para longe e apaga projéteis.",
        "nova", { cone: 0.85, radius: 520, dmg: 90, push: 1200, stun: 0.9, clear: true }),
      sp("H", "FÚRIA TOTAL", "FÚRIA", 22, "#ff3b3b",
        "8s de raiva: +60% de dano, armadura e regeneração.",
        "rage", { dur: 8, dmg: 1.6, armor: 3, regen: 9 }),
    ],
    blurb: "O Hulk esmaga. O resto é detalhe.",
  },
  {
    id: "robo",
    name: "HOMEM DE FERRO",
    title: "TONY STARK",
    alias: "Iron Man",
    role: "Tecnologia · repulsores",
    color: "#ffb020",
    accent: "#ff3b3b",
    emblem: "arc",
    hp: 140, armor: 3, dmg: 1.02,
    weapons: [
      { base: "beam", name: "REPULSORES", code: "RP-2", color: "#8edaff", glow: "#2f8fd6",
        desc: "Feixes contínuos que seguem a mira até o ponto indicado.", dmg: 5.4 },
      { base: "rocket", name: "MICRO-MÍSSEIS", code: "MM-8", color: "#ffb020", glow: "#ff6a00",
        desc: "Enxame de mísseis guiados de dano em área.", dmg: 38, rate: 0.62, speed: 1050,
        pellets: 3, spread: 0.14, ammoClip: 40, explosive: { radius: 130, dmg: 55 } },
    ],
    passiveName: "REATOR ARC",
    passiveDesc: "Regenera vida fora de combate. Sobrecarga dobra o repulsor.",
    specials: [
      sp("E", "UNIBEAM", "UNIBEAM", 11, "#8edaff",
        "Um feixe largo do peito atravessa a arena à sua frente.",
        "beam", { count: 1, width: 46, len: 1500, dur: 1.3, dmg: 26 }),
      sp("F", "CHUVA DE MÍSSEIS", "MÍSSEIS", 14, "#ffb020",
        "Três alvos marcados explodem em sequência.",
        "blast", { delay: 0.8, radius: 170, dmg: 165, count: 3, stagger: 0.35 }),
      sp("G", "MODO DE VOO", "VOO", 16, "#ff9cf0",
        "Voa por 5s: ignora colisões e ganha velocidade.",
        "buff", { dur: 5, fly: true, speed: 1.35 }),
      sp("H", "SOBRECARGA DO REATOR", "REATOR", 18, "#f2f2f2",
        "Repulsor 2.6x mais forte e +40% de dano por 6s.",
        "buff", { dur: 6, dmg: 1.4, beam: 2.6 }),
    ],
    blurb: "Gênio, bilionário, playboy, filantropo — e armado.",
  },
  {
    id: "samurai",
    name: "DEADPOOL",
    title: "WADE WILSON",
    alias: "Merc with a Mouth",
    role: "Katanas · regeneração",
    color: "#ff2f3b",
    accent: "#1b1b22",
    emblem: "katana",
    hp: 125, speed: 1.26, dmg: 1.12, dashCd: 0.55, armor: 1, crit: 0.14,
    weapons: [
      { base: "katana", name: "KATANAS GÊMEAS", code: "KT-2", color: "#ff2f3b", glow: "#8f0d16",
        desc: "Três cortes por golpe, alcance curto, dano alto.", dmg: 30 },
      { base: "wave", name: "DESINTEGRADORA", code: "DS-9", color: "#ffd23c", glow: "#ff8a00",
        desc: "Ondas de energia que atravessam fileiras inteiras.", dmg: 52 },
    ],
    passiveName: "FATOR DE CURA",
    passiveDesc: "Regenera vida constantemente. Cada acerto de katana recarrega o dash.",
    specials: [
      sp("E", "FATOR DE CURA", "CURA", 12, "#46c93a",
        "Regenera 50 de vida e fica invulnerável por 1.5s.",
        "heal", { heal: 50, inv: 1.5 }),
      sp("F", "BOMBA CHIMICHANGA", "BOMBA", 9, "#ff8a3d",
        "Uma bomba no ponto da mira explode após 1s.",
        "blast", { delay: 1, radius: 190, dmg: 175 }),
      sp("G", "CHUVA DE BALAS", "BALAS", 7, "#ffd23c",
        "Dispara em todas as direções sem mirar direito (e funciona).",
        "salvo", { n: 18, radial: true, dmg: 30, speed: 1700, pierce: 1 }),
      sp("H", "QUARTA PAREDE", "4ª PAREDE", 24, "#ff3b3b",
        "Elimina até 5 inimigos próximos e recupera toda a vida perdida.",
        "execute", { count: 5, radius: 280, heal: 40 }),
    ],
    blurb: "Sabe que está num jogo. Isso explica muita coisa.",
  },
  {
    id: "engenheira",
    name: "DR. OCTOPUS",
    title: "OTTO OCTAVIUS",
    alias: "Doctor Octopus",
    role: "Tentáculos · engenharia",
    color: "#6ee07a",
    accent: "#d9ffe0",
    emblem: "claw",
    hp: 115, armor: 2, dmg: 0.98,
    weapons: [
      { base: "coil", name: "GARRA ELÉTRICA", code: "TN-1", color: "#6ee07a", glow: "#1f8f36",
        desc: "Descargas que saltam entre alvos próximos.", dmg: 23, chain: { jumps: 2, range: 190 } },
      { base: "mine", name: "BOMBA DE TENTÁCULO", code: "TB-4", color: "#ffd23c", glow: "#ff8a00",
        desc: "Cargas arremessadas que preparam o terreno.", dmg: 34, explosive: { radius: 135, dmg: 56 } },
    ],
    passiveName: "ARNESES MECÂNICOS",
    passiveDesc: "Quatro braços: recarregam munição mais rápido e ampliam explosões.",
    specials: [
      sp("E", "TENTÁCULOS", "TENTÁCULOS", 9, "#6ee07a",
        "Agarra e arrasta todos os inimigos próximos até você.",
        "vortex", { radius: 340, life: 0.6, dps: 70, pull: 900, once: true }),
      sp("F", "LASER DOS ARNESES", "LASER", 12, "#8edaff",
        "Quatro feixes varrem a arena em leque à sua frente.",
        "beam", { count: 4, width: 20, len: 1300, dur: 1.4, dmg: 20, spread: 0.9 }),
      sp("G", "PROTOCOLO DE COMBATE", "PROTOCOLO", 18, "#ffd23c",
        "Dois arneses autônomos atiram sozinhos por 13s.",
        "summon", { count: 2, dur: 13, dmg: 24, color: "#ffd23c" }),
      sp("H", "GENIALIDADE", "GENIAL", 20, "#d9ffe0",
        "Recarrega tudo, cura 30 e ganha +30% de cadência por 6s.",
        "buff", { dur: 6, rate: 1.3, heal: 30, ammo: true }),
    ],
    blurb: "Quatro braços, um cérebro e zero paciência.",
  },
  {
    id: "alquimista",
    name: "DR. DESTINO",
    title: "VICTOR VON DOOM",
    alias: "Doctor Doom",
    role: "Ciência e feitiçaria",
    color: "#56b87a",
    accent: "#ffd23c",
    emblem: "doom",
    hp: 120, armor: 2, dmg: 1.08,
    weapons: [
      { base: "flask", name: "RAIO DE DOOM", code: "DM-1", color: "#56b87a", glow: "#1f7a45",
        desc: "Descargas de energia verde que explodem no impacto.",
        dmg: 26, rate: 0.38, explosive: { radius: 95, dmg: 34 } },
      { base: "bile", name: "ENXAME DE DOOMBOTS", code: "DB-6", color: "#c9d6cf", glow: "#7d8f85",
        desc: "Pequenos drones que perfuram e saltam entre alvos.", dmg: 20, pierce: 3 },
    ],
    passiveName: "ARMADURA DE DOOM",
    passiveDesc: "Chapa e feitiço: 2 de armadura e explosões 20% maiores.",
    specials: [
      sp("E", "CAMPO DE FORÇA", "CAMPO", 16, "#56b87a",
        "Uma bolha mística bloqueia projéteis e corta dano por 4s.",
        "heal", { shield: 4, reduce: 0.35 }),
      sp("F", "DOOMBOTS", "BOTS", 15, "#c9d6cf",
        "Três doombots orbitam e atiram por 13s.",
        "summon", { count: 3, dur: 13, dmg: 26, color: "#c9d6cf" }),
      sp("G", "FEITIÇARIA", "FEITIÇO", 11, "#a06bff",
        "Raios místicos encadeiam entre até 6 inimigos, três vezes.",
        "chain", { waves: 3, jumps: 6, dmg: 70, range: 420 }),
      sp("H", "JULGAMENTO DE DOOM", "JULGAMENTO", 22, "#ffd23c",
        "Três explosões marcadas destroem a área à sua frente.",
        "blast", { delay: 1.1, radius: 210, dmg: 190, count: 3, stagger: 0.3 }),
    ],
    blurb: "Doom não pede. Doom determina.",
  },
  {
    id: "oraculo",
    name: "RAVENA",
    title: "FILHA DE TRIGON",
    alias: "Raven",
    role: "Trevas · alma",
    color: "#7a5cff",
    accent: "#cbb8ff",
    emblem: "crow",
    hp: 100, speed: 1.06, dmg: 1.05, crit: 0.12,
    weapons: [
      { base: "oracle", name: "ALMA-ESCURA", code: "SK-1", color: "#7a5cff", glow: "#3a1f9e",
        desc: "Energia sombria que atravessa um alvo e continua.", dmg: 22 },
      { base: "halo", name: "PRISMA NEGRO", code: "PB-4", color: "#cbb8ff", glow: "#6a4bd6",
        desc: "Fragmentos de trevas em leque que empurram inimigos.", dmg: 15, pellets: 3 },
    ],
    passiveName: "EMPATIA SOMBRIA",
    passiveDesc: "Absorve dor: recupera vida lentamente fora de combate.",
    specials: [
      sp("E", "ALMA PRÓPRIA", "ALMA", 12, "#7a5cff",
        "Sua alma negra sai, puxa inimigos e os corrói por 3s.",
        "vortex", { radius: 230, life: 3, dps: 52, pull: 260 }),
      sp("F", "TREVAS", "TREVAS", 14, "#3a2b6b",
        "Uma nuvem de escuridão na mira cega e fere por 5s.",
        "zone", { kind: "dark", radius: 230, life: 5, dps: 40, slow: 0.45 }),
      sp("G", "PASSO SOMBRIO", "PASSO", 8, "#cbb8ff",
        "Desliza pelas sombras até a mira, intangível.",
        "blink", { dist: 560, inv: 1.1 }),
      sp("H", "DRENAR DOR", "DRENAR", 18, "#ff7be5",
        "Consome a vida dos inimigos próximos para curar a sua.",
        "heal", { drain: 320, healPer: 0.35, dmg: 95 }),
    ],
    blurb: "Azarath Metrion Zinthos. E depois silêncio.",
  },
  {
    id: "necromante",
    name: "PANTERA NEGRA",
    title: "T'CHALLA",
    alias: "Black Panther",
    role: "Vibrânio · cinética",
    color: "#a06bff",
    accent: "#e6d8ff",
    emblem: "panther",
    hp: 130, speed: 1.16, dmg: 1.12, armor: 2, dashCd: 0.62, crit: 0.12,
    weapons: [
      { base: "soul", name: "GARRAS DE VIBRÂNIO", code: "VB-1", color: "#a06bff", glow: "#4b2ba8",
        desc: "Cortes curtos que armazenam energia cinética.", dmg: 28, rate: 0.22,
        kind: "blade", shape: "blade", hitRadius: 13, speed: 1400, life: 0.14 },
      { base: "reaper", name: "IMPULSO CINÉTICO", code: "KN-2", color: "#e6d8ff", glow: "#7a4bd6",
        desc: "Libera a energia acumulada em arcos perfurantes.", dmg: 40 },
    ],
    passiveName: "ABSORÇÃO CINÉTICA",
    passiveDesc: "Parte do dano sofrido é devolvida na próxima rajada.",
    specials: [
      sp("E", "PULSO CINÉTICO", "PULSO", 8, "#a06bff",
        "Libera toda a energia absorvida numa onda roxa.",
        "nova", { radius: 300, dmg: 140, push: 700, stun: 0.8 }),
      sp("F", "INVESTIDA FELINA", "INVESTIDA", 6, "#e6d8ff",
        "Salta sobre o inimigo mais próximo com garras em cone.",
        "charge", { dist: 380, dmg: 150, radius: 140, dash: true }),
      sp("G", "TRAJE DE VIBRÂNIO", "TRAJE", 15, "#c1a3ff",
        "O traje endurece: 5s de armadura pesada e escudo.",
        "heal", { shield: 5, reduce: 0.65, armor: 3 }),
      sp("H", "RITUAL ANCESTRAL", "RITUAL", 22, "#ffd23c",
        "O plano ancestral cura, fortalece e marca os inimigos.",
        "buff", { dur: 7, dmg: 1.35, heal: 45, mark: 4 }),
    ],
    blurb: "Wakanda para sempre — e para quem chegar perto.",
  },
  {
    id: "ilusionista",
    name: "MYSTÉRIO",
    title: "QUENTIN BECK",
    alias: "Mysterio",
    role: "Ilusão · efeitos",
    color: "#4fd9a0",
    accent: "#b6ffe4",
    emblem: "smoke",
    hp: 95, speed: 1.12, dmg: 1.02, crit: 0.16, dashCd: 0.72,
    weapons: [
      { base: "mirror", name: "GÁS ILUSÓRIO", code: "GS-2", color: "#4fd9a0", glow: "#1f8f6a",
        desc: "Dois jatos de gás que se abrem em leque.", dmg: 17 },
      { base: "prism", name: "DRONE DE FUMAÇA", code: "DF-5", color: "#b6ffe4", glow: "#4fd9a0",
        desc: "Projeções sólidas que atravessam alvos.", dmg: 32 },
    ],
    passiveName: "MESTRE DOS EFEITOS",
    passiveDesc: "A cada 8s, o primeiro tiro que acertaria você é só fumaça.",
    specials: [
      sp("E", "ILUSÃO EM MASSA", "ILUSÃO", 14, "#4fd9a0",
        "Uma cópia sua na mira atrai e confunde os inimigos por 6s.",
        "decoy", { dur: 6, stun: 1.2 }),
      sp("F", "NÉVOA", "NÉVOA", 12, "#b6ffe4",
        "Fumaça densa na mira: reduz a visão e corrói os inimigos.",
        "zone", { kind: "smoke", radius: 260, life: 5, dps: 34, slow: 0.5 }),
      sp("G", "FALSO HERÓI", "FANTASMA", 9, "#8edaff",
        "Some e reaparece na mira, invisível por 3s.",
        "blink", { dist: 540, inv: 0.6, invis: 3 }),
      sp("H", "GRANDE REVELAÇÃO", "REVELAÇÃO", 18, "#ff7be5",
        "Desmonta as ilusões: reflete projéteis e fere em área.",
        "reflect", { radius: 380, dmg: 55, parry: 2 }),
    ],
    blurb: "Nada aqui é real. Principalmente ele.",
  },
  {
    id: "telepata",
    name: "JEAN GREY",
    title: "A FÊNIX",
    alias: "Jean Grey",
    role: "Telepatia · Fênix",
    color: "#ff7a3d",
    accent: "#ffd7b0",
    emblem: "phoenix",
    hp: 100, speed: 1.08, dmg: 1.1, crit: 0.12,
    weapons: [
      { base: "psi", name: "TELECINESE", code: "TK-1", color: "#ff7a3d", glow: "#c1440e",
        desc: "Arremessa objetos com a mente: dano preciso e perfurante.", dmg: 26 },
      { base: "synapse", name: "CHAMA FÊNIX", code: "PH-9", color: "#ffd23c", glow: "#ff3b3b",
        desc: "Três labaredas psíquicas que se espalham em leque.", dmg: 30, pellets: 3 },
    ],
    passiveName: "TELEPATIA ÔMEGA",
    passiveDesc: "Inimigos muito próximos hesitam: 25% mais lentos num raio de 150px.",
    specials: [
      sp("E", "TEMPESTADE TELECINÉTICA", "TEMPESTADE", 9, "#ff7a3d",
        "Uma onda de força ergue e arremessa tudo ao redor.",
        "nova", { radius: 340, dmg: 130, push: 1100, stun: 1.2, clear: true }),
      sp("F", "CONTROLE MENTAL", "CONTROLE", 18, "#f292cf",
        "Toma a mente de um inimigo próximo, que luta por você por 8s.",
        "charm", { dur: 8, radius: 240 }),
      sp("G", "LEVITAÇÃO", "LEVITAR", 14, "#8edaff",
        "Flutua por 5s: ignora contato e projéteis de chão.",
        "buff", { dur: 5, fly: true, shield: 0.5 }),
      sp("H", "FÊNIX NEGRA", "FÊNIX", 26, "#ff3b3b",
        "A Fênix desperta: 7s de fogo psíquico, dano dobrado e cura.",
        "rage", { dur: 7, dmg: 2, heal: 60, zone: "fire", dps: 70 }),
    ],
    blurb: "A mais poderosa da sala. E a menos estável.",
  },
  {
    id: "criomante",
    name: "HOMEM DE GELO",
    title: "BOBBY DRAKE",
    alias: "Iceman",
    role: "Gelo · ômega",
    color: "#7fd4ff",
    accent: "#eaf8ff",
    emblem: "snow",
    hp: 110, speed: 1.05, dmg: 1.05, armor: 1, crit: 0.1,
    weapons: [
      { base: "frostNeedle", name: "ESTILHAÇOS DE GELO", code: "IC-1", color: "#7fd4ff", glow: "#2f8fd6",
        desc: "Cristais que retardam quem acertam.", dmg: 20 },
      { base: "iceMortar", name: "ONDA GLACIAL", code: "IC-2", color: "#c2eaff", glow: "#7fd4ff",
        desc: "Uma massa de gelo explode e congela a área.", dmg: 36,
        explosive: { radius: 150, dmg: 72 } },
    ],
    passiveName: "FORMA ORGÂNICA DE GELO",
    passiveDesc: "Acertos congelantes reduzem a velocidade inimiga em 45%.",
    specials: [
      sp("E", "DESLIZE DE GELO", "DESLIZE", 8, "#7fd4ff",
        "Desliza até a mira deixando um rastro congelado.",
        "charge", { dist: 520, dmg: 90, radius: 120, trail: "snow" }),
      sp("F", "NEVASCA", "NEVASCA", 14, "#eaf8ff",
        "Uma tempestade de neve cobre a área por 5s.",
        "zone", { kind: "snow", radius: 260, life: 5, dps: 44, slow: 0.55 }),
      sp("G", "CONGELAR", "CONGELAR", 12, "#bcecff",
        "Congela inimigos próximos por 2.5s e apaga projéteis.",
        "freeze", { radius: 320, dur: 2.5, dmg: 70, clear: true }),
      sp("H", "ARMADURA DE GELO", "ARMADURA", 18, "#8edaff",
        "Vira gelo sólido: 5s de armadura, escudo e reflexo de tiros.",
        "heal", { shield: 5, reduce: 0.6, armor: 4, reflect: 2.5 }),
    ],
    blurb: "Nível ômega. Só não gosta de ser chamado assim.",
  },
];

export const HERO_IDS = HEROES.map((h) => h.id);

const heroById = (id: ClassId) => HEROES.find((h) => h.id === id);

/** Two signature weapons only — the shared rifle does not exist in HeroWave. */
export function heroWeaponsFor(id: ClassId): WeaponDef[] {
  const hero = heroById(id);
  if (!hero) return [];
  return hero.weapons.map((hw) => {
    const base = weaponById(hw.base);
    const { base: _b, ...rest } = hw;
    void _b;
    return { ...base, ...rest, id: `${id}:${hw.base}`, owner: id } as WeaponDef;
  });
}

/** Merge the base archetype with the hero identity so the engine sees one type. */
export function heroClassDef(id: ClassId): ClassDef {
  const hero = heroById(id);
  const base = classById(id);
  if (!hero) return base;
  const weapons = heroWeaponsFor(id);
  return {
    ...base,
    id: hero.id,
    name: hero.name,
    title: hero.title,
    role: hero.role,
    color: hero.color,
    accent: hero.accent,
    hp: hero.hp ?? base.hp,
    speed: hero.speed ?? base.speed,
    dmg: hero.dmg ?? base.dmg,
    fireRate: hero.fireRate ?? base.fireRate,
    dashCd: hero.dashCd ?? base.dashCd,
    armor: hero.armor ?? base.armor,
    crit: hero.crit ?? base.crit,
    passiveName: hero.passiveName,
    passiveDesc: hero.passiveDesc,
    weapon: weapons[0].id,
    weapons: [weapons[0].id, weapons[1].id],
    specials: hero.specials,
    blurb: hero.blurb,
  };
}

export const HERO_CLASSES: ClassDef[] = HEROES.map((h) => heroClassDef(h.id));

/** Dark red sectors replace the neon biomes while HeroWave is active. */
export const HERO_BIOMES = [
  { name: "MARCO ZERO",     sky: "#0c0306", floor: "#16060b", grid: "255,90,90",   accent: "#ff4d5e", blob: "#3d0a12", blob2: "#2a0710", prop: "hex" },
  { name: "FUNDIÇÃO",       sky: "#0f0405", floor: "#1c0808", grid: "255,130,70",  accent: "#ff7a3d", blob: "#4a1206", blob2: "#2d0a06", prop: "ring" },
  { name: "CATEDRAL RUBRA", sky: "#0a0308", floor: "#180710", grid: "255,80,150",  accent: "#ff3b7a", blob: "#3d0820", blob2: "#25060f", prop: "pillar" },
  { name: "Cofre-Sangue",   sky: "#0b0204", floor: "#1a0508", grid: "255,60,60",   accent: "#ff2f3b", blob: "#450a10", blob2: "#280509", prop: "crystal" },
  { name: "NÚCLEO SOMBRIO", sky: "#08030a", floor: "#140712", grid: "200,110,255", accent: "#c07bff", blob: "#2e0f3d", blob2: "#1d0725", prop: "flower" },
] as const;
