/* Pacing probe: a competent bot plays and we measure wave timing + lethality. */
const anyObj: any = new Proxy(function () {} as any, {
  get(_t, prop) {
    if (prop === "measureText") return () => ({ width: 10 });
    if (prop === "createPattern") return () => ({ pattern: 1 });
    if (prop === Symbol.toPrimitive) return () => 0;
    return anyObj;
  },
  apply() { return anyObj; },
  set() { return true; },
  construct() { return anyObj; },
});
const fakeCanvas: any = new Proxy(
  { width: 1200, height: 700, style: {}, addEventListener() {}, removeEventListener() {}, setPointerCapture() {} },
  { get(t, p) { if (p === "getContext") return () => anyObj; return (t as any)[p]; }, set(t, p, v) { (t as any)[p] = v; return true; } },
);
(globalThis as any).document = { createElement: () => fakeCanvas, addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};

const { Engine } = await import("../src/game/engine");
const e: any = new Engine(fakeCanvas, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
e.resize(1200, 700, 1);
e.startRun("atirador");

const dt = 1 / 60;
let deaths = 0;
let lastWave = 0;
const marks: Record<number, number> = {};
let t = 0;
for (let i = 0; i < 60 * 300; i++) {
  t = i / 60;
  if (e.status === "upgrade") { e.chooseUpgrade(0); continue; }
  if (e.status === "gameover") { deaths++; e.startRun(); lastWave = 0; continue; }
  // bot: aim at nearest, strafe away from it
  const tgt = e.nearestTarget(4000);
  if (tgt) {
    e.mouse.x = tgt.x; e.mouse.y = tgt.y;
    const dx = e.player.x - tgt.x, dy = e.player.y - tgt.y;
    const d = Math.hypot(dx, dy) || 1;
    const want = 260;
    e.keys = {};
    if (d < want) { if (dx > 0) e.keys["KeyD"] = true; else e.keys["KeyA"] = true; }
    else if (d > want + 90) { if (dx > 0) e.keys["KeyA"] = true; else e.keys["KeyD"] = true; }
    if (dy > 0) e.keys["KeyS"] = true; else e.keys["KeyW"] = true;
    if (d < 150 && i % 90 === 0) e.tryDash();
  } else { e.keys = {}; }
  e.mouse.down = true;
  e["tick"](dt);
  if (e.wave !== lastWave) { marks[e.wave] = t; lastWave = e.wave; }
}
const waveTimes = Object.entries(marks).map(([w, tt]) => `W${w}@${tt.toFixed(1)}s`).join(" ");
console.log("deaths:", deaths, "| final wave:", e.wave, "| score:", e.score, "| hp:", Math.round(e.player.hp));
console.log("wave start times:", waveTimes);
