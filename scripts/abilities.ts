/* Smoke test: each ability gets a fresh run and a valid target. */
const anyObj: any = new Proxy(function () {} as any, {
  get(_t, prop) {
    if (prop === "measureText") return () => ({ width: 10 });
    if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => ({ addColorStop() {} });
    if (prop === Symbol.toPrimitive) return () => 0;
    return anyObj;
  },
  apply() { return anyObj; }, set() { return true; }, construct() { return anyObj; },
});
const fc: any = new Proxy(
  { width: 800, height: 600, style: {}, addEventListener() {}, removeEventListener() {}, setPointerCapture() {} },
  { get(t, p) { if (p === "getContext") return () => anyObj; return (t as any)[p]; }, set(t, p, v) { (t as any)[p] = v; return true; } },
);
(globalThis as any).document = { createElement: () => fc, addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};
const { Engine } = await import("../src/game/engine");
const { CLASSES } = await import("../src/game/classes");
const dt = 1 / 60;
let bad = 0;
for (const cls of CLASSES as any[]) {
  const e: any = new Engine(fc, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
  e.resize(1280, 720, 1);
  for (let slot = 0; slot < cls.specials.length; slot++) {
    e.startRun(cls.id);
    e.enemies.length = 0; e.marks.length = 0; e.pickups.length = 0;
    e.wave = 1; e.waveActive = false; e.waveRestT = 999; e.spawnBudget = 0;
    e.player.x = 1000; e.player.y = 800;
    e.updateCamera(1);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      e.spawnEnemy("grunt", 1000 + Math.cos(a) * 220, 800 + Math.sin(a) * 220, false);
      e.enemies.at(-1).spawnT = 0;
    }
    e.mouse.x = e.enemies[0].x - e.camX;
    e.mouse.y = e.enemies[0].y - e.camY;
    e.player.ang = 0;
    const name = cls.specials[slot].name;
    e.specT[slot] = 0;
    e.player.hp = e.player.maxHp;
    e.castSpecial(slot);
    // cada habilidade deve mudar algum estado observável
    const {
      portal, nukes, grenades, turrets, mines, invisT, timeStopT, rewindCursor,
      shieldT, flightT, titanT, parryT, beamBoostT, specT,
    } = e;
    const activated =
      portal !== null || nukes.length > 0 || grenades.length > 0 || turrets.length > 0 || mines.length > 0 ||
      invisT > 0 || timeStopT > 0 || rewindCursor >= 0 || shieldT > 0 || flightT > 0 || titanT > 0 ||
      parryT > 0 || beamBoostT > 0 || specT[slot] > 0;
    // simulate 2 seconds
    let err = false;
    for (let f = 0; f < 120; f++) {
      if (e.status === "gameover") break;
      try { e.tick(dt); e.render(dt); } catch (ex) { console.error("THROW", name, ex); err = true; break; }
    }
    const finite = isFinite(e.player.x) && isFinite(e.player.hp) && isFinite(e.score);
    const ok = finite && !err && activated;
    console.log(
      `${cls.id.padEnd(10)} [${cls.specials[slot].key}] ${name.padEnd(20)}`,
      `cd=${cls.specials[slot].cd}s`.padEnd(8),
      activated ? "ativou" : "SEM EFEITO",
      ok ? "OK" : "FAIL",
    );
    if (!ok) bad++;
  }
  e.destroy();
}
console.log(bad === 0 ? "ALL SPECIALS PASSED" : `${bad} SPECIAL FAILURES`);
if (bad) process.exit(1);
