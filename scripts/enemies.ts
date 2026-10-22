/* Valida os 5 inimigos novos: comportamento observável de cada um. */
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
const fc: any = new Proxy(
  { width: 800, height: 600, style: {}, addEventListener() {}, removeEventListener() {}, setPointerCapture() {} },
  { get(t: any, p) { if (p === "getContext") return () => anyObj; return t[p]; }, set(t: any, p, v) { t[p] = v; return true; } },
);
(globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => anyObj }), addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};
const { Engine } = await import("../src/game/engine");
const { ENEMY_DEFS } = await import("../src/game/enemies");
const dt = 1 / 60;
let bad = 0;
const mk = () => {
  const e: any = new Engine(fc, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
  e.resize(1280, 720, 1);
  e.startRun("bruto");
  e.enemies = []; e.marks = []; e.pickups.length = 0; e.waveActive = false; e.spawnBudget = 0; e.waveRestT = 999;
  e.player.x = e.worldW / 2; e.player.y = e.worldH / 2; e.player.inv = 0; e.mouse.down = false; e.keys = {};
  return e;
};
const last = (e: any) => e.enemies[e.enemies.length - 1];
const ok = (name: string, cond: boolean, info = "") => { console.log(`${cond ? "OK  " : "FAIL"} ${name} ${info}`); if (!cond) bad++; };

/* --- ARIETE: deve atingir velocidade de investida >> velocidade base --- */
{
  const e = mk();
  e.spawnEnemy("charger", e.player.x + 330, e.player.y, false);
  const c = last(e);
  let peak = 0, telegraphed = false;
  for (let i = 0; i < 60 * 4; i++) {
    e.player.x = e.worldW / 2; e.player.y = e.worldH / 2; e.player.vx = 0; e.player.vy = 0; e.player.inv = 1;
    e.tick(dt);
    if (c.tele > 0) telegraphed = true;
    peak = Math.max(peak, Math.hypot(c.vx, c.vy));
  }
  ok("ARIETE investe", peak > ENEMY_DEFS.charger.speed * 3, `pico=${peak.toFixed(0)}px/s telegraph=${telegraphed}`);
}
/* --- MEDICANTE: cura aliado ferido próximo --- */
{
  const e = mk();
  e.spawnEnemy("heavy", e.player.x + 600, e.player.y, false);
  const tank = last(e); tank.hp = tank.maxHp * 0.3;
  e.spawnEnemy("healer", e.player.x + 650, e.player.y + 40, false);
  const hp0 = tank.hp;
  for (let i = 0; i < 60 * 3; i++) { e.player.inv = 1; e.tick(dt); }
  ok("MEDICANTE cura", tank.hp > hp0 + 5, `${hp0.toFixed(0)} -> ${tank.hp.toFixed(0)}`);
}
/* --- ESCUDEIRO: dano frontal bloqueado, lateral passa --- */
{
  const e = mk();
  e.spawnEnemy("warden", e.player.x + 200, e.player.y, false);
  const w = last(e); w.spawnT = 0; w.aim = Math.PI; // olhando para o jogador (à esquerda)
  const h0 = w.hp;
  e.damageEnemy(w, 40, true, e.player.x, e.player.y);     // de frente
  const front = h0 - w.hp;
  w.hp = h0;
  e.damageEnemy(w, 40, true, w.x, w.y - 300);              // por cima (flanco)
  const flank = h0 - w.hp;
  ok("ESCUDEIRO bloqueia frente", front < flank * 0.3, `frente=${front.toFixed(1)} flanco=${flank.toFixed(1)}`);
}
/* --- FANTASMA: teleporta (posição muda bruscamente) --- */
{
  const e = mk();
  e.spawnEnemy("phantom", e.player.x + 400, e.player.y, false);
  const ph = last(e); ph.spawnT = 0;
  let jumps = 0, lx = ph.x, ly = ph.y;
  for (let i = 0; i < 60 * 8; i++) {
    e.player.inv = 1; e.tick(dt);
    if (ph.dead) break;
    if (Math.hypot(ph.x - lx, ph.y - ly) > 120) jumps++;
    lx = ph.x; ly = ph.y;
  }
  ok("FANTASMA teleporta", jumps >= 2, `saltos=${jumps}`);
}
/* --- CUSPIDOR: glóbulo vira poça ácida --- */
{
  const e = mk();
  e.spawnEnemy("spitter", e.player.x + 300, e.player.y, false);
  const sp = last(e); sp.spawnT = 0;
  let pools = 0;
  for (let i = 0; i < 60 * 6; i++) {
    e.player.x = e.worldW / 2 - 100; e.player.y = e.worldH / 2 + 200; e.player.vx = 0; e.player.vy = 0; e.player.inv = 1;
    e.tick(dt);
    pools = Math.max(pools, e.hazards.length);
  }
  ok("CUSPIDOR cria poça", pools >= 1, `poças=${pools}`);
}
/* --- disponibilidade: todos os 15 tipos aparecem até a onda 9 --- */
{
  const e = mk();
  e.wave = 9;
  const kinds = e.availableKinds();
  ok("14 tipos spawnáveis na onda 9 (+shard via divisor)", kinds.length === 14, kinds.join(","));
}
/* --- mundo maior --- */
{
  const e = mk();
  ok("mundo 2.4x", e.worldW >= 1280 * 2.4 && e.worldH >= 720 * 2.4, `${e.worldW}x${e.worldH}`);
}
console.log(bad === 0 ? "ENEMY TESTS PASSED" : `${bad} ENEMY FAILURES`);
if (bad) process.exit(1);
