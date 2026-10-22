/* Headless smoke test: runs every class through the loop with a stubbed canvas. */
const anyObj: any = new Proxy(function () {} as any, {
  get(_t, prop) {
    if (prop === "measureText") return () => ({ width: 10 });
    if (prop === "createPattern") return () => ({ pattern: 1 });
    if (prop === "createLinearGradient" || prop === "createRadialGradient" || prop === "createConicGradient") {
      return () => ({ addColorStop() {} });
    }
    if (prop === Symbol.toPrimitive) return () => 0;
    return anyObj;
  },
  apply() { return anyObj; },
  set() { return true; },
  construct() { return anyObj; },
});
const fakeCanvas: any = new Proxy(
  { width: 800, height: 600, style: {}, addEventListener() {}, removeEventListener() {}, setPointerCapture() {}, getBoundingClientRect: () => ({ width: 1280, height: 720 }) },
  { get(t, p) { if (p === "getContext") return () => anyObj; return (t as any)[p]; }, set(t, p, v) { (t as any)[p] = v; return true; } },
);
(globalThis as any).document = { createElement: () => fakeCanvas, addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1 };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};

const { Engine } = await import("../src/game/engine");
const { CLASSES } = await import("../src/game/classes");

const dt = 1 / 60;
let fails = 0;

for (const cls of CLASSES as any[]) {
  let gameOvers = 0;
  const e: any = new Engine(fakeCanvas, { onHud: () => {}, onStatus: () => {}, onGameOver: () => { gameOvers++; } });
  e.resize(1280, 720, 1);
  e.startRun(cls.id);

  const t0 = process.hrtime.bigint();
  let upgrades = 0, maxWave = 0, abilityCasts = 0, lastAbility = 0;
  for (let i = 0; i < 60 * 150; i++) {
    if (e.status === "upgrade") { e.chooseUpgrade((Math.random() * 3) | 0); upgrades++; continue; }
    if (e.status === "gameover") { e.startRun(cls.id); continue; }
    if (i % 29 === 0) {
      const keys = ["KeyW", "KeyA", "KeyS", "KeyD"];
      e.keys = {}; e.keys[keys[(Math.random() * 4) | 0]] = true;
      e.mouse.down = Math.random() > 0.2;
      e.mouse.x = Math.random() * 1280; e.mouse.y = Math.random() * 720;
    }
    if (i % 41 === 0) e.tryDash();
    if (i % 173 === 0) e.cycleWeapon(1);
    e.tick(dt);
    e.render(dt);
    maxWave = Math.max(maxWave, e.wave);
    if (e.abilityT !== lastAbility) { if (e.abilityT > lastAbility) abilityCasts++; lastAbility = e.abilityT; }
    if (!isFinite(e.player.x) || !isFinite(e.player.y) || !isFinite(e.score) || !isFinite(e.player.hp)) {
      console.error("NaN in class", cls.id); fails++; break;
    }
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(
    `${cls.id.padEnd(10)} frames=${60 * 150} sim+render=${ms.toFixed(0)}ms (${(ms / (60 * 150)).toFixed(3)}ms/frame)`,
    `| maxWave=${maxWave} upgrades=${upgrades} deaths=${gameOvers} abilityTicks=${abilityCasts}`,
    `| score=${e.score} hp=${Math.round(e.player.hp)} parts=${e.nParts} enemies=${e.enemies.length}`,
  );
  e.destroy();
}
console.log(fails === 0 ? "ALL CLASSES PASSED" : `${fails} FAILURES`);
if (fails) process.exit(1);
