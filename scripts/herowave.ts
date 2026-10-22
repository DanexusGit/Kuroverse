/* HeroWave DLC: roster, weapons, all 52 powers, biomes and mode switching. */
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
(globalThis as any).document = { createElement: () => fc, addEventListener() {}, removeEventListener() {}, hidden: false };
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), setTimeout, clearTimeout };
(globalThis as any).requestAnimationFrame = () => 0;
(globalThis as any).cancelAnimationFrame = () => {};

const { Engine } = await import("../src/game/engine");
const { CLASSES } = await import("../src/game/classes");
const { HEROES, HERO_CLASSES, HERO_BIOMES, heroWeaponsFor } = await import("../src/game/heroes");
const dt = 1 / 60;
let bad = 0;
const ok = (name: string, cond: boolean, info = "") => {
  console.log(`${cond ? "OK  " : "FAIL"} ${name}${info ? " · " + info : ""}`);
  if (!cond) bad++;
};

const mk = () => {
  const e: any = new Engine(fc, { onHud: () => {}, onStatus: () => {}, onGameOver: () => {} });
  e.resize(1280, 720, 1);
  return e;
};

/* ---------- 1. roster shape ---------- */
ok("13 heróis (sem Jedi)", HEROES.length === 13 && !HEROES.some((h: any) => h.id === "jedi"),
  HEROES.map((h: any) => h.name).join(","));
ok("cada herói tem 4 poderes", HEROES.every((h: any) => h.specials.length === 4));
ok("52 poderes no total", HEROES.reduce((n: number, h: any) => n + h.specials.length, 0) === 52);
ok("nomes de classe viraram nomes de heróis",
  HERO_CLASSES.every((c: any) => c.name !== CLASSES.find((b) => b.id === c.id)!.name),
  HERO_CLASSES.map((c: any) => c.name).join(" / "));
ok("todo poder tem efeito data-driven", HEROES.every((h: any) => h.specials.every((s: any) => !!s.fx)));

/* ---------- 2. loadout: 2 armas próprias, sem rifle universal ---------- */
{
  const noPulse = HEROES.every((h: any) => {
    const w = heroWeaponsFor(h.id);
    return w.length === 2 && !w.some((x: any) => x.id === "pulse") && x_owner_ok(w, h.id);
  });
  function x_owner_ok(w: any[], id: string) { return w.every((x) => x.owner === id); }
  ok("2 armas exclusivas por herói, sem PULSE-9", noPulse);
  const e = mk();
  e.setDlc(true);
  e.startRun("robo");
  ok("motor carrega 2 armas na DLC", e.classWeapons.length === 2, e.classWeapons.map((w: any) => w.name).join(" + "));
  ok("feixe do Robô buffado em 50%", Math.abs(e.classWeapons[0].dmg - 5.4) < 0.01, `dmg=${e.classWeapons[0].dmg}`);
  e.destroy();
}

/* ---------- 3. todos os 52 poderes disparam ---------- */
{
  const e = mk();
  e.setDlc(true);
  let cast = 0, silent = 0;
  for (const hero of HEROES as any[]) {
    e.startRun(hero.id);
    for (let slot = 0; slot < 4; slot++) {
      e.enemies.length = 0; e.marks.length = 0; e.pickups.length = 0;
      e.classFields.length = 0; e.nukes.length = 0; e.drones.length = 0; e.turrets.length = 0;
      e.beams.length = 0; e.hazards.length = 0; e.boss = null;
      e.wave = 1; e.waveActive = false; e.waveRestT = 999; e.spawnBudget = 0;
      e.stats.critChance = 0;
      e.player.hp = e.player.maxHp; e.player.inv = 0;
      // estado limpo: cada poder precisa provar o próprio efeito
      e.resetHeroBuffs();
      e.shieldT = 0; e.parryT = 0; e.invisT = 0; e.flightT = 0; e.decoyT = 0;
      e.timeStopT = 0; e.rewindCursor = -1; e.rewindFrames.length = 0; e.markCrits = 0;
      for (const b of e.pBullets) b.on = false;
      for (const b of e.eBullets) b.on = false;
      e.player.x = 1000; e.player.y = 800; e.updateCamera(1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        e.spawnEnemy("grunt", 1000 + Math.cos(a) * 210, 800 + Math.sin(a) * 210, false);
        e.enemies[e.enemies.length - 1].spawnT = 0;
      }
      e.mouse.x = e.enemies[0].x - e.camX;
      e.mouse.y = e.enemies[0].y - e.camY;
      // rebobinar precisa de histórico e de vida perdida para ser observável
      if (hero.specials[slot].fx === "rewind") {
        e.player.hp = e.player.maxHp * 0.6;
        for (let k = 0; k < 60; k++) e.rewindFrames.push({ x: e.player.x - k * 2, y: e.player.y, hp: e.player.maxHp, ang: 0 });
      }
      const snap = () => JSON.stringify([
        e.enemies.map((x: any) => [Math.round(x.hp), Math.round(x.x), Math.round(x.y), x.stunT > 0, x.chillT > 0, x.controlledT > 0]),
        e.classFields.length, e.nukes.length, e.drones.length, e.turrets.length, e.beams.length,
        Math.round(e.player.hp), Math.round(e.player.x), Math.round(e.player.y),
        e.buffT > 0, e.rageT > 0, e.shieldT > 0, e.timeStopT > 0, e.parryT > 0, e.invisT > 0,
        e.flightT > 0, e.decoyT > 0, e.markCrits, e.rewindCursor >= 0, e.ammo.slice(),
        e.pBullets.filter((b: any) => b.on).length, Math.round(e.player.inv * 100),
        e.buffDmg, e.buffSpeed, e.buffRate, e.buffBeam, e.buffFly, e.buffArmor,
      ]);
      const before = snap();
      e.specT[slot] = 0;
      e.castSpecial(slot);
      const after = snap();
      // run two seconds so delayed effects (meteoros, zonas, ondas) aconteçam
      let threw = "";
      try {
        for (let f = 0; f < 120; f++) {
          if (e.status === "gameover") { e.startRun(hero.id); break; }
          e.tick(dt); e.render(dt);
        }
      } catch (ex: any) { threw = ex?.message ?? String(ex); }
      const changed = before !== after;
      const finite = isFinite(e.player.x) && isFinite(e.player.hp) && isFinite(e.score);
      if (changed && !threw && finite) cast++;
      else { silent++; console.log(`  ↳ ${hero.name} [${hero.specials[slot].key}] ${hero.specials[slot].name} changed=${changed} err=${threw}`); }
    }
  }
  ok("52 poderes executam com efeito observável", cast === 52 && silent === 0, `${cast}/52`);
  e.destroy();
}

/* ---------- 4. biomas rubros e troca de modo ---------- */
{
  const e = mk();
  e.setDlc(true);
  e.startRun("velocista");
  const seen = new Set<number>();
  for (let w = 0; w < 12; w++) { e.nextWave(); seen.add(e.biomeIdx); }
  ok("setores vermelho-escuros trocam a cada 3 ondas", seen.size >= 4 && HERO_BIOMES.length === 5,
    `${[...seen].sort().join(",")} · ${e.biome().name}`);
  const dark = HERO_BIOMES.every((b) => b.sky.startsWith("#0") || b.sky.startsWith("#1"));
  ok("paleta da DLC é escura", dark);
  // back to base
  e.setDlc(false);
  e.startRun("jedi");
  ok("modo base mantém o Jedi e o rifle universal", e.cls.id === "jedi" && e.classWeapons.some((w: any) => w.id === "pulse"));
  // base → DLC with jedi selected must fall back
  e.setDlc(true);
  ok("DLC exclui o Jedi", e.cls.id !== "jedi" && !e.classWeapons.some((w: any) => w.id === "pulse"), e.cls.name);
  e.destroy();
}

/* ---------- 5. poderes específicos ---------- */
{
  const e = mk();
  e.setDlc(true);
  // Flash: parar o tempo congela a arena
  e.startRun("velocista");
  e.enemies.length = 0; e.marks.length = 0;
  e.spawnEnemy("grunt", e.player.x + 260, e.player.y, false);
  const foe = e.enemies[e.enemies.length - 1]; foe.spawnT = 0;
  const fx0 = foe.x;
  e.specT[2] = 0; e.castSpecial(2);
  for (let i = 0; i < 60; i++) e.tick(dt);
  ok("Flash paralisa o tempo (inimigo quase imóvel)", Math.abs(foe.x - fx0) < 12, `Δ=${Math.abs(foe.x - fx0).toFixed(1)}px`);
  // Hulk: fúria cresce com pouca vida
  e.startRun("bruto");
  e.player.hp = e.player.maxHp;
  const calm = e.hulkRage();
  e.player.hp = e.player.maxHp * 0.2;
  const angry = e.hulkRage();
  ok("Hulk fica mais forte com pouca vida", angry > calm, `${calm} → ${angry}`);
  // Jean Grey: controle mental
  e.startRun("telepata");
  e.enemies.length = 0; e.marks.length = 0;
  e.spawnEnemy("grunt", e.player.x + 180, e.player.y, false);
  const victim = e.enemies[e.enemies.length - 1]; victim.spawnT = 0;
  e.mouse.x = victim.x - e.camX; e.mouse.y = victim.y - e.camY;
  e.specT[1] = 0; e.castSpecial(1);
  ok("Jean Grey domina a mente de um inimigo", victim.controlledT > 7.9, `t=${victim.controlledT.toFixed(1)}`);
  // Estranho: portais teleportam
  e.startRun("mago");
  const px0 = e.player.x;
  e.mouse.x = e.player.x + 500 - e.camX; e.mouse.y = e.player.y - e.camY;
  e.specT[1] = 0; e.castSpecial(1);
  ok("Dr. Estranho atravessa portais", Math.abs(e.player.x - px0) > 300, `moveu ${Math.round(e.player.x - px0)}px`);
  // Destino: doombots
  e.startRun("alquimista");
  e.specT[1] = 0; e.castSpecial(1);
  ok("Dr. Destino invoca doombots", e.drones.length === 3, `drones=${e.drones.length}`);
  // Iceman: nevasca cria zona de gelo que lentifica
  e.startRun("criomante");
  e.enemies.length = 0;
  e.spawnEnemy("grunt", e.player.x + 200, e.player.y, false);
  const cold = e.enemies[e.enemies.length - 1]; cold.spawnT = 0;
  e.mouse.x = cold.x - e.camX; e.mouse.y = cold.y - e.camY;
  e.specT[1] = 0; e.castSpecial(1);
  for (let i = 0; i < 40; i++) e.tick(dt);
  ok("Homem de Gelo cria nevasca que congela", e.classFields.some((f: any) => f.kind === "snow") || cold.chillT > 0,
    `chill=${cold.chillT.toFixed(2)}`);
  e.destroy();
}

console.log(bad === 0 ? "HEROWAVE PASSED" : `${bad} HEROWAVE FAILURES`);
if (bad) process.exit(1);
