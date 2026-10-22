import assert from "node:assert/strict";
import test from "node:test";

// Logic assertions use a canvas stub, not GPU frame-rate measurements.
const gradient = { addColorStop() {} };
const context = new Proxy<Record<string, unknown>>({}, {
  get(target, key: string) {
    if (key === "measureText") return (text: string) => ({ width: text.length * 7 });
    if (key.startsWith("create") && key.endsWith("Gradient")) return () => gradient;
    if (key === "createPattern") return () => ({});
    return target[key] ?? (() => {});
  },
  set(target, key: string, value) { target[key] = value; return true; },
});
function canvas() {
  return {
    width: 1280, height: 720, style: {},
    getContext: () => context,
    addEventListener() {}, removeEventListener() {}, setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  };
}
Object.assign(globalThis, {
  window: {
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false }), requestIdleCallback: () => 0,
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  },
  document: { createElement: canvas, hidden: false },
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
});
const { Engine } = await import("../src/game/engine");
const { CLASSES } = await import("../src/game/classes");
const { weaponById, weaponsForClass } = await import("../src/game/weapons");
const { sfx } = await import("../src/game/audio");
sfx.setEnabled(false);

function fixture(id: string) {
  let savedRuns = 0;
  let hud: any;
  const e: any = new Engine(canvas() as unknown as HTMLCanvasElement, {
    onHud(h) { hud = h; }, onStatus() {}, onGameOver() { savedRuns++; },
  });
  e.resize(1280, 720, 1);
  e.startRun(id);
  e.enemies.length = 0; e.pickups.length = 0; e.marks.length = 0;
  e.wave = 1; e.waveActive = false; e.waveRestT = 99999; e.spawnBudget = 0;
  e.stats.critChance = 0;
  e.player.x = 1000; e.player.y = 800; e.player.inv = 0;
  e.updateCamera(1);
  e.mouse.down = false; e.keys = {};
  const aim = (x: number, y: number) => {
    e.mouse.x = x - e.camX; e.mouse.y = y - e.camY;
    e.player.ang = Math.atan2(y - e.player.y, x - e.player.x);
  };
  aim(1300, 800);
  const enemy = (x = 1200, y = 800, hp = 1000, elite = false) => {
    e.spawnEnemy("grunt", x, y, elite);
    const foe = e.enemies.at(-1);
    foe.spawnT = 0; foe.hp = hp; foe.maxHp = hp;
    return foe;
  };
  return { e, enemy, aim, saved: () => savedRuns, hud: () => hud };
}
const near = (a: number, b: number, eps = 1e-5) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test("all three new classes have two exclusive weapons and the shared rifle", () => {
  for (const id of ["telepata", "jedi", "criomante"]) {
    const cls = CLASSES.find((c) => c.id === id)!;
    assert.ok(cls);
    assert.equal(cls.specials.length, 4);
    const loadout = weaponsForClass(id);
    assert.equal(loadout.length, 3);
    assert.deepEqual(loadout.map((w) => w.id), [...cls.weapons, "pulse"]);
    assert.equal(loadout.filter((w) => w.owner === id).length, 2);
  }
});

test("Robo beam is exactly 50% stronger, including during overload", () => {
  const { e, enemy, aim } = fixture("robo");
  const target = enemy(1200, 800);
  const offAxis = enemy(1150, 970);
  aim(1300, 800);
  const beam = weaponById("beam");
  near(beam.dmg, 3.2 * 1.5);
  e.fireBeam(beam);
  near(1000 - target.hp, 4.8);
  assert.equal(offAxis.hp, 1000);
  e.beamBoostT = 3;
  const before = target.hp;
  e.fireBeam(beam);
  near(before - target.hp, 4.8 * 2.2);
  near(e.eyeBeamX, 1300); near(e.eyeBeamY, 800);
  e.destroy();
});

test("Telepata stuns and pushes with a psychic wave", () => {
  const { e, enemy } = fixture("telepata");
  const foe = enemy(1160, 800);
  e.castSpecial(0);
  assert.ok(foe.hp < 1000 && foe.stunT > 1 && foe.x > 1160);
  assert.ok(e.forceArcs.length > 0);
  e.destroy();
});

test("mind control makes an ally shoot hostiles, then expires", () => {
  const { e, enemy, aim } = fixture("telepata");
  const ally = enemy(1180, 800);
  const hostile = enemy(1410, 800);
  aim(ally.x, ally.y);
  e.castSpecial(1);
  assert.equal(ally.controlledT, 7);
  assert.equal(hostile.controlledT, 0);
  for (let i = 0; i < 45; i++) {
    e.updateControlledEnemy(ally, 1 / 60);
    e.updateBullets(1 / 60);
  }
  assert.ok(hostile.hp < 1000);
  assert.equal(ally.hp, 1000, "friendly projectiles must not hit the controlled ally");
  ally.controlledT = 0.01;
  e.updateControlledEnemy(ally, 0.02);
  assert.equal(ally.controlledT, 0);
  e.destroy();
});

test("mind control rejects elites and does not spend its cooldown on empty space", () => {
  const { e, enemy, aim } = fixture("telepata");
  const elite = enemy(1200, 800, 1000, true);
  aim(elite.x, elite.y);
  e.castSpecial(1);
  assert.equal(elite.controlledT, 0);
  assert.equal(e.specT[1], 0);
  e.destroy();
});

test("psychic field pulls targets; mental fortress heals and reduces damage", () => {
  const { e, enemy, aim } = fixture("telepata");
  const foe = enemy(1340, 800);
  aim(1200, 800);
  e.castSpecial(2);
  e.updateExpansionPowers(0.25);
  assert.ok(foe.x < 1340 && foe.hp < 1000);
  e.player.hp = 40;
  e.castSpecial(3);
  near(e.player.hp, 60);
  e.player.inv = 0;
  e.hurtPlayer(20, 1200, 800);
  near(e.player.hp, 52);
  e.destroy();
});

test("Jedi saber throw damages on the outbound and return path", () => {
  const { e, enemy } = fixture("jedi");
  const foe = enemy(1220, 800);
  e.setWeapon(1);
  e.player.ang = 0;
  e.fire();
  const blade = e.pBullets.find((b: any) => b.on);
  assert.equal(blade.w.id, "saberThrow");
  let returning = false;
  for (let i = 0; i < 120; i++) {
    e.updateBullets(1 / 60);
    returning ||= blade.returning;
  }
  near(1000 - foe.hp, 48 * 1.05 * 2);
  assert.ok(returning && !blade.on);
  e.destroy();
});

test("Jedi passive reflects frontal shots, guard covers the rear", () => {
  const { e, enemy } = fixture("jedi");
  enemy(1250, 800);
  e.player.ang = 0; e.player.muzzle = 1;
  const front = e.spawnEBullet(1040, 800, -300, 0, 5, 10, "#ff0000", "dot");
  assert.ok(e.tryDeflect(front));
  assert.ok(!front.on && e.pBullets.some((b: any) => b.on));
  const rear = e.spawnEBullet(960, 800, 300, 0, 5, 10, "#ff0000", "dot");
  e.deflectCd = 0;
  assert.equal(e.tryDeflect(rear), false);
  e.castSpecial(2);
  assert.ok(e.tryDeflect(rear));
  const ring = e.spawnEBullet(1000, 800, 0, 0, 50, 10, "#ff0000", "ring");
  assert.equal(e.tryDeflect(ring), false);
  e.destroy();
});

test("Jedi force skills are directional and meditation restores health", () => {
  const { e, enemy, aim } = fixture("jedi");
  const front = enemy(1220, 800);
  const rear = enemy(780, 800);
  aim(1300, 800); e.castSpecial(0);
  assert.ok(front.x > 1220 && front.stunT > 0 && front.hp < 1000);
  assert.equal(rear.hp, 1000);
  const distance = Math.abs(front.x - e.player.x);
  e.castSpecial(1);
  assert.ok(Math.abs(front.x - e.player.x) < distance);
  e.player.hp = 40; e.player.dashCd = 1;
  e.castSpecial(3);
  assert.equal(e.player.hp, 80);
  assert.equal(e.player.dashCd, 0);
  assert.ok(e.player.inv >= 0.8);
  e.destroy();
});

test("Cryomancer weapons apply chill; all four powers have distinct effects", () => {
  const { e, enemy, aim } = fixture("criomante");
  const foe = enemy(1140, 800);
  const weapon = weaponById("frostNeedle");
  e.spawnPBullet(foe.x - 10, foe.y, 500, 0, 18, 1, 0.9, 4.5, weapon, false);
  e.updateBullets(1 / 60);
  assert.ok(foe.chillT > 1.9 && foe.hp < 1000);
  e.castSpecial(0);
  assert.ok(foe.stunT >= 2.5);
  aim(foe.x, foe.y);
  e.castSpecial(1);
  const before = foe.hp;
  e.updateExpansionPowers(0.25);
  assert.ok(foe.hp < before && e.classFields[0].kind === "snow");
  e.castSpecial(2);
  e.player.inv = 0;
  const hp = e.player.hp;
  e.hurtPlayer(20, foe.x, foe.y);
  near(hp - e.player.hp, 7);
  for (const b of e.pBullets) b.on = false;
  e.castSpecial(3);
  assert.equal(e.pBullets.filter((b: any) => b.on).length, 7);
  e.destroy();
});

test("leaving pause clears the arena without saving an unfinished score", () => {
  const { e, enemy, saved } = fixture("criomante");
  enemy();
  e.castSpecial(1); e.castSpecial(2);
  e.spawnEBullet(800, 600, 90, 0, 4, 4, "#ff0000", "dot");
  e.scheduled.push({ t: 0.1, x: 1000, y: 800, r: 100, color: "#ffffff" });
  e.pause();
  const lifetime = e.classFields[0].life;
  for (let i = 0; i < 60; i++) e.tick(1 / 60);
  near(e.classFields[0].life, lifetime);
  assert.equal(e.scheduled.length, 1, "paused tasks must remain paused");
  e.toMenu();
  assert.equal(e.status, "menu");
  assert.equal(e.enemies.length + e.classFields.length + e.scheduled.length, 0);
  assert.equal(e.cryoArmorT, 0);
  assert.ok(!e.eBullets.some((b: any) => b.on));
  assert.equal(saved(), 0);
  e.startDemo();
  assert.ok(e.demoActive && e.status === "menu");
  e.startRun("telepata");
  assert.ok(!e.demoActive && e.status === "playing");
  assert.deepEqual(e.classWeapons.map((w: any) => w.id), ["psi", "synapse", "pulse"]);
  assert.equal(saved(), 0);
  e.destroy();
});

test("keyboard and touch can select all twelve new powers", () => {
  for (const id of ["telepata", "jedi", "criomante"]) {
    for (let slot = 0; slot < 4; slot++) {
      const { e, enemy, aim } = fixture(id);
      const foe = enemy(1200, 800);
      aim(foe.x, foe.y);
      const key = e.cls.specials[slot].key;
      e.keyHandler({ code: `Key${key}`, repeat: false, preventDefault() {} });
      assert.ok(e.specT[slot] > 0, `${id}: keyboard ${key}`);
      const cd = e.specT[slot];
      e.castSpecial(slot);
      near(e.specT[slot], cd);
      e.startRun(id);
      e.resize(390, 844, 1);
      const target = enemy(e.player.x + 220, e.player.y);
      const button = e.specBtn[slot];
      // Touch casts in the aim direction, not at the pressed button.
      e.player.ang = Math.atan2(target.y - e.player.y, target.x - e.player.x);
      if (slot === 1 && id === "telepata") { target.x = e.player.x + 600; target.y = e.player.y; }
      e.pdHandler({ pointerType: "touch", pointerId: 91, clientX: button.x, clientY: button.y, button: 0 });
      assert.ok(e.specT[slot] > 0, `${id}: touch ${key}`);
      e.render(1 / 60);
      e.destroy();
    }
  }
});