/* Verifies the boost/sprint system per class. */
const anyObj: any = new Proxy(function () {} as any, {
  get(_t, prop) {
    if (prop === "measureText") return () => ({ width: 10 });
    if (prop === "createPattern") return () => ({ pattern: 1 });
    if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => ({ addColorStop() {} });
    if (prop === Symbol.toPrimitive) return () => 0;
    return anyObj;
  },
  apply() { return anyObj; }, set() { return true; }, construct() { return anyObj; },
});
const fakeCanvas: any = new Proxy(
  { width: 800, height: 600, style: {}, addEventListener() {}, removeEventListener() {}, setPointerCapture() {} },
  { get(t, p) { if (p === "getContext") return () => anyObj; return (t as any)[p]; }, set(t, p, v) { (t as any)[p] = v; return true; } },
);
(globalThis as any).document = { createElement: () => fakeCanvas, addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};

const { Engine } = await import("../src/game/engine");
const { CLASSES } = await import("../src/game/classes");
const dt = 1 / 60;
let bad = 0;

for (const cls of CLASSES as any[]) {
  const e: any = new Engine(fakeCanvas, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
  e.resize(1280, 720, 1);
  e.startRun(cls.id);
  e.enemies = []; e.boss = null; e.marks = [];
  const px = 640, py = 360;
  e.player.x = px; e.player.y = py;
  // clear input, hold right
  e.keys = {}; e.mouse.down = false; e.touchMode = false;
  e.stickMove.active = false; e.stickAim.active = false;
  const dist = (frames: number, shift: boolean) => {
    e.player.x = 320; e.player.vx = 0; e.player.vy = 0;
    e.keys["KeyD"] = true;
    if (shift) e.keys["ShiftLeft"] = true;
    const sx = e.player.x;
    for (let i = 0; i < frames; i++) e.tick(dt);
    e.keys = {};
    return e.player.x - sx;
  };
  const normal = dist(45, false);
  // refill meter, then boost / slow-mo acceleration
  e.boost = 1; e.boostLock = 0; e.slowMeter = 1;
  const boosted = dist(30, true);
  const ratio = boosted / Math.max(0.001, normal * (30 / 45));
  const isVelo = cls.id === "velocista";
  // All classes now move faster when holding shift (velocista accelerates during slow-mo)
  const ok = ratio > 1.4 && ratio < 2.0;
  console.log(
    `${cls.id.padEnd(10)} normal=${normal.toFixed(0)}px boost=${boosted.toFixed(0)}px ratio=${ratio.toFixed(2)}x`,
    `meter=${(isVelo ? e.slowMeter : e.boost).toFixed(2)} ${ok ? "OK" : "FAIL"}`,
  );
  if (!ok) bad++;
  // meter must vent and lock out (for classes with boost)
  if (!isVelo) {
    let lockedSeen = false;
    for (let i = 0; i < 220 && e.boost > 0.02; i++) { e.keys["KeyD"] = true; e.keys["ShiftLeft"] = true; e.tick(dt); }
    if (e.boost <= 0.05 && e.boostLock > 0) lockedSeen = true;
    e.keys = {};
    let refilled = false;
    for (let i = 0; i < 260; i++) { e.tick(dt); if (e.boost > 0.98) { refilled = true; break; } }
    console.log(`           vent+lock=${lockedSeen ? "OK" : "FAIL"} refill=${refilled ? "OK" : "FAIL"}`);
    if (!lockedSeen || !refilled) bad++;
  }
  e.destroy();
}
console.log(bad === 0 ? "BOOST SYSTEM PASSED" : `${bad} BOOST FAILURES`);
if (bad) process.exit(1);
