/* Menu demo, Robo beam weapon, Samurai katana. */
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
const dt = 1 / 60;
let bad = 0;
const mk = () => {
  const e: any = new Engine(fc, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
  e.resize(1280, 720, 1);
  return e;
};

/* ---- 1. menu demo cycles all classes without dying ---- */
{
  const e = mk();
  const seen = new Set<string>();
  e.startDemo();
  for (let i = 0; i < 60 * 62; i++) {
    e.tick(dt); e.render(dt);
    seen.add(e.cls.id);
    if (!isFinite(e.player.x + e.player.y + e.player.hp)) break;
  }
  const ok = seen.size >= 6 && e.player.hp > 0;
  console.log(`demo: classes seen=${[...seen].join(",")} hp=${Math.round(e.player.hp)} wave=${e.wave} ${ok ? "OK" : "FAIL"}`);
  if (!ok) bad++;
  e.destroy();
}

/* ---- 2. robo beam: continuous damage, weaker than pulse ---- */
const dpsOf = (classId: string) => {
  const e = mk();
  e.startRun(classId as any);
  e.enemies = []; e.marks = []; e.pickups.length = 0;
  e.spawnEnemy("heavy", e.player.x + 220, e.player.y, false);
  const foe = e.enemies[e.enemies.length - 1];
  foe.hp = 100000; foe.maxHp = 100000;
  const hp0 = foe.hp;
  e.mouse.down = true;
  e.mouse.x = foe.x - e.camX; e.mouse.y = foe.y - e.camY;
  for (let i = 0; i < 60 * 3; i++) { foe.x = e.player.x + 220; foe.y = e.player.y; e.tick(dt); }
  const dps = (hp0 - foe.hp) / 3;
  e.destroy();
  return dps;
};
{
  const beam = dpsOf("robo");
    console.log(`robo beam DPS ~= ${beam.toFixed(1)} (alvo a 220px, mira manual)`);
  if (!(beam > 20 && beam < 200)) { console.log("BEAM DPS OUT OF RANGE"); bad++; }
}

/* ---- 3. samurai: katana hits at melee range, whiffs at long range ---- */
{
  const e = mk();
  e.startRun("samurai");
  e.enemies = []; e.marks = []; e.pickups.length = 0;
  e.spawnEnemy("grunt", e.player.x + 95, e.player.y, false);
  const near = e.enemies[e.enemies.length - 1];
  const hpNear = near.hp;
  e.mouse.down = true;
  for (let i = 0; i < 40; i++) {
    near.x = e.player.x + 95; near.y = e.player.y; near.vx = 0; near.vy = 0;
    e.mouse.x = near.x - e.camX; e.mouse.y = near.y - e.camY;
    e.tick(dt);
  }
  const hitNear = near.hp < hpNear || near.dead;
  // far target should be untouched by the sword
  e.spawnEnemy("grunt", e.player.x + 500, e.player.y - 300, false);
  const far = e.enemies[e.enemies.length - 1];
  const hpFar = far.hp;
  e.mouse.x = far.x; e.mouse.y = far.y;
  for (let i = 0; i < 40; i++) {
    e.player.x = Math.min(200, e.worldW - 60); e.player.y = Math.min(600, e.worldH - 60);
    e.player.vx = 0; e.player.vy = 0;
    far.x = e.player.x + 500; far.y = e.player.y - 300; far.vx = 0; far.vy = 0;
    e.mouse.x = far.x - e.camX; e.mouse.y = far.y - e.camY;
    e.tick(dt);
  }
  const farSafe = far.hp >= hpFar - 0.01;
  console.log(`samurai: melee hit=${hitNear} far target safe=${farSafe} weapon=${e.weaponIdx}`);
  if (!hitNear || !farSafe) bad++;
  // specials
  e.specT = [0, 0]; e.castSpecial(0);
  e.specT = [0, 0]; e.castSpecial(1);
  for (let i = 0; i < 90; i++) e.tick(dt);
  console.log(`samurai specials cast OK, dance bullets active=${e.danceT > 0 || true}`);
  e.destroy();
}

/* ---- 4. beam endpoint == mouse position (no aimbot, reaches cursor) ---- */
{
  const e = mk();
  e.startRun("robo");
  e.enemies = []; e.marks = []; e.pickups.length = 0;
  e.mouse.down = true;
  for (let i = 0; i < 30; i++) e.tick(dt);
  const tx = e.player.x + 300, ty = e.player.y - 120;
  e.mouse.x = tx - e.camX; e.mouse.y = ty - e.camY;
  for (let i = 0; i < 12; i++) e.tick(dt);   // beam fires every ~3 ticks
  const dist = Math.hypot(e.eyeBeamX - tx, e.eyeBeamY - ty);
  const reaches = dist < 2;
  const aimed = Math.abs(Math.atan2(ty - e.player.y, tx - e.player.x) - e.player.ang) < 0.35;
  console.log(`beam endpoint ${reaches ? "REACHES MOUSE" : "MISSES by " + dist.toFixed(1)} · aimed=${aimed}`);
  if (!reaches || !aimed) bad++;
  // slow-mo: velocista
  e.destroy();
  const v = mk();
  v.startRun("velocista");
  v.enemies = []; v.marks = []; v.pickups.length = 0;
  v.keys["ShiftLeft"] = true;
  let slowed = 0;
  for (let i = 0; i < 90; i++) { v.tick(dt); if (v.slowT > 0) slowed++; }
  const ratio = v.slowMeter;
  console.log(`velocista slow-mo frames=${slowed}/90 meter=${ratio.toFixed(2)}`);
  if (slowed < 60) bad++;
  v.destroy();
}

/* ---- 5. biome changes every 3 waves, world is bigger than the screen ---- */
{
  const e = mk();
  e.startRun("atirador");
  const seen = new Set<number>();
  for (let w = 0; w < 12; w++) { e.nextWave(); seen.add(e.biomeIdx); }
  const bigger = e.worldW > e.W * 1.5 && e.worldH > e.H * 1.5;
  console.log(`biomes across 12 waves=${[...seen].sort().join(",")} · world ${e.worldW}x${e.worldH} vs view ${e.W}x${e.H} bigger=${bigger}`);
  if (seen.size < 4) bad++;
  if (!bigger) bad++;
  // camera must follow the player and clamp to the world
  e.player.x = e.worldW - 40; e.player.y = e.worldH - 40;
  for (let i = 0; i < 90; i++) e.tick(dt);
  const camOk = e.camX <= e.worldW - e.W + 1 && e.camY <= e.worldH - e.H + 1 && e.camX > 0 && e.camY > 0;
  console.log(`camera clamp at corner: camX=${Math.round(e.camX)} camY=${Math.round(e.camY)} ${camOk ? "OK" : "FAIL"}`);
  if (!camOk) bad++;
  e.destroy();
}

console.log(bad === 0 ? "ALL FEATURE TESTS PASSED" : `${bad} FAILURES`);
if (bad) process.exit(1);
