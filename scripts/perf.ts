/* Mede custo de tick+render sob carga pesada e detecta picos (micro-hitches). */
const anyObj: any = new Proxy(function () {} as any, {
  get(_t, p) {
    if (p === "measureText") return () => ({ width: 10 });
    if (p === "createLinearGradient" || p === "createRadialGradient") return () => ({ addColorStop() {} });
    if (p === "createPattern") return () => ({});
    if (p === Symbol.toPrimitive) return () => 0;
    return anyObj;
  },
  apply() { return anyObj; }, set() { return true; }, construct() { return anyObj; },
});
let ops = 0;
const fc: any = new Proxy(
  { width: 800, height: 600, style: {}, addEventListener() {}, removeEventListener() {}, setPointerCapture() {} },
  { get(t: any, p) { if (p === "getContext") return () => anyObj; return t[p]; }, set(t: any, p, v) { t[p] = v; return true; } },
);
anyObj.drawImage = () => { ops++; };
anyObj.fillRect = () => { ops++; };
anyObj.stroke = () => { ops++; };
anyObj.fill = () => { ops++; };
(globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => anyObj }), addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout, requestIdleCallback: undefined };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};
(globalThis as any).performance = globalThis.performance;

const { Engine } = await import("../src/game/engine");
const { CLASSES } = await import("../src/game/classes");

const dt = 1 / 60;
let worstFrame = 0, worstAtClass = "", p99sum = 0, frames = 0;
const allTimes: number[] = [];

for (const cls of CLASSES as any[]) {
  const e: any = new Engine(fc, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
  e.resize(1920, 1080, 2);
  e.prewarm();   // mesmo caminho da tela de seleção: cenário já cozido
  e.startRun(cls.id);
  e.setBiome(0);
  // CENA PESADA: 45 inimigos + muitas balas + chefe
  e.enemies = []; e.marks = [];
  for (let i = 0; i < 45; i++) e.spawnEnemy(i % 3 === 0 ? "heavy" : i % 3 === 1 ? "drone" : "shooter", 100 + (i * 61) % 1800, 80 + (i * 43) % 900, i % 11 === 0);
  // chefe no campo
  e.spawnEnemy("grunt", 0, 0, false);
  const before = e.boss;
  e.boss = { def: { name: "T", title: "T", color: "#fff", accent: "#fff", hp: 100, radius: 50, score: 1 }, idx: 0, x: 900, y: 500, vx: 0, vy: 0, hp: 100, maxHp: 100, r: 50, t: 0, phase: 1, atk: 0, atkT: 1, tele: 0, hitFlash: 0, ang: 0, entering: 0, dead: false, spin: 0, sub: 0 };
  void before;

  let clsWorst = 0, clsWorstAt = -1;
  for (let i = 0; i < 60 * 60; i++) {
    // mantém a cena cheia
    if (e.enemies.length < 40 && i % 5 === 0) e.spawnEnemy("grunt", 60 + Math.random() * 1800, 60 + Math.random() * 900, false);
    if (e.pBullets.filter((b: any) => b.on).length < 120 && i % 3 === 0) e.fire();
    e.mouse.down = true;
    e.mouse.x = 400 + Math.sin(i / 30) * 800;
    e.mouse.y = 300 + Math.cos(i / 24) * 400;
    if (i % 47 === 0) { e.specT = e.specT.map(() => 0); e.castSpecial((Math.random() * e.cls.specials.length) | 0); }
    if (i % 90 === 0) e.tryDash();
    const t0 = performance.now();
    e.tick(dt);
    e.render(dt);
    const ms = performance.now() - t0;
    allTimes.push(ms);
    if (ms > clsWorst) { clsWorst = ms; clsWorstAt = i; }
    frames++;
  }
  if (clsWorst > worstFrame) { worstFrame = clsWorst; worstAtClass = cls.id; }
  const cold = clsWorstAt < 30;
  console.log(`${cls.id.padEnd(11)} pior_frame=${clsWorst.toFixed(2)}ms @${clsWorstAt}${cold ? " (cold-start)" : ""}`);
  e.destroy();
}
allTimes.sort((a, b) => a - b);
const avg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
const p95 = allTimes[Math.floor(allTimes.length * 0.95)];
const p99 = allTimes[Math.floor(allTimes.length * 0.99)];
void p99sum;
console.log(`\nframes=${frames} avg=${avg.toFixed(3)}ms p95=${p95.toFixed(2)}ms p99=${p99.toFixed(2)}ms WORST=${worstFrame.toFixed(2)}ms (${worstAtClass})`);
console.log(`budget de 16.67ms: p99 ${(p99 < 16.67 ? "OK" : "ESTOUROU")} · pior ${worstFrame < 16.67 ? "OK" : "ESTOUROU"}`);
