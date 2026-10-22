import assert from 'node:assert/strict';
import { chromium, devices } from '@playwright/test';

const URL = 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];

async function boot(page) {
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  const skip = page.getByRole('button', { name: 'Pular introducao' });
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: 'JOGAR', exact: true }).waitFor();
}

async function setDlc(page, on) {
  await page.getByRole('button', { name: 'OPÇÕES', exact: true }).click();
  const row = page.getByRole('button', { name: /Versão do jogo/i });
  await row.waitFor();
  const current = await row.textContent();
  const active = current.includes('HEROWAVE');
  if (active !== on) await row.click();
  await page.getByRole('button', { name: 'VOLTAR', exact: true }).click();
  await page.getByRole('button', { name: 'JOGAR', exact: true }).waitFor();
}

async function startHero(page, name) {
  // Already on the select screen when called straight from the menu checks.
  const play = page.getByRole('button', { name: 'JOGAR', exact: true });
  if (await play.isVisible().catch(() => false)) await play.click();
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  await page.getByRole('button', { name: `COMEÇAR COM ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Pausar', exact: true }).waitFor();
}

try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 820 } });
  await boot(page);

  // ---------- 1. toggle the DLC from the options screen ----------
  await setDlc(page, true);
  const dlcAttr = await page.evaluate(() => document.querySelector('[data-dlc]')?.getAttribute('data-dlc'));
  assert.equal(dlcAttr, '1');
  const neon = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-dlc]')).getPropertyValue('--color-neon').trim());
  assert.equal(neon.toLowerCase(), '#ff4d5e', `DLC accent should be red, got ${neon}`);
  const voidBg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-dlc]')).getPropertyValue('--color-void').trim());
  assert.equal(voidBg.toLowerCase(), '#0b0205');
  console.log(`DLC theme applied: data-dlc=1, accent ${neon}, background ${voidBg}`);

  // ---------- 2. menu rebrands to HeroWave ----------
  await page.getByText('HEROWAVE', { exact: false }).first().waitFor();
  const sidebar = await page.locator('aside').first().textContent();
  assert.match(sidebar, /HEROWAVE/);
  assert.match(sidebar, /DLC · LEGADO DOS HERÓIS/);
  assert.match(sidebar, /13 heróis/);
  await page.screenshot({ path: 'artifacts/herowave-menu.png' });
  console.log('Menu rebranded to HEROWAVE with the hero roster copy');

  // ---------- 3. hero select: 13 heroes, no Jedi ----------
  await page.getByRole('button', { name: 'JOGAR', exact: true }).click();
  await page.getByText('ESCOLHA SEU HERÓI').waitFor();
  const pickerText = await page.locator('body').textContent();
  for (const hero of ['DR. ESTRANHO', 'JUSTICEIRO', 'FLASH', 'HULK', 'HOMEM DE FERRO', 'DEADPOOL',
    'DR. OCTOPUS', 'DR. DESTINO', 'RAVENA', 'PANTERA NEGRA', 'MYSTÉRIO', 'JEAN GREY', 'HOMEM DE GELO']) {
    assert.ok(pickerText.includes(hero), `missing hero ${hero}`);
  }
  assert.ok(!pickerText.includes('JEDI'), 'Jedi must not exist in the DLC');
  await page.screenshot({ path: 'artifacts/herowave-select.png' });
  console.log('Hero select lists all 13 heroes and excludes the Jedi');

  // ---------- 4. Iron Man: two weapons only, all four powers ----------
  await startHero(page, 'HOMEM DE FERRO');
  await page.waitForTimeout(900);
  // The compact HUD shows the hero's four powers and the DLC sector name.
  const hudText = (await page.locator('body').textContent()) ?? '';
  for (const power of ['UNIBEAM', 'MÍSSEIS', 'VOO', 'REATOR']) {
    assert.ok(hudText.includes(power), `Iron Man power ${power} missing from HUD`);
  }
  assert.match(hudText, /MARCO ZERO|FUNDIÇÃO|CATEDRAL RUBRA|COFRE-SANGUE|NÚCLEO SOMBRIO/i);
  const weaponSlots = await page.evaluate(() =>
    document.querySelectorAll('.pointer-events-auto.flex.items-end button').length);
  assert.equal(weaponSlots, 2, `expected 2 weapons (no universal rifle), got ${weaponSlots}`);
  assert.ok(!(await page.locator('body').textContent()).includes('PULSE-9'), 'universal rifle must be gone');

  await page.mouse.move(980, 360);
  await page.mouse.down();
  await page.waitForTimeout(400);
  for (const key of ['e', 'f', 'g', 'h']) { await page.keyboard.press(key); await page.waitForTimeout(320); }
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/herowave-ironman.png' });

  const state = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { w: c?.width ?? 0, h: c?.height ?? 0 };
  });
  assert.ok(state.w > 0 && state.h > 0);
  console.log('Iron Man: 2 weapons, 4 powers fired, canvas rendering');

  // ---------- 5. pause → menu keeps working in the DLC ----------
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('dialog', { name: 'Jogo pausado' }).waitFor();
  await page.getByRole('button', { name: 'VOLTAR AO MENU', exact: true }).click();
  await page.getByRole('button', { name: 'JOGAR', exact: true }).waitFor();
  console.log('DLC pause → menu flow intact');

  // ---------- 6. another hero: Jean Grey mind control + Phoenix ----------
  await startHero(page, 'JEAN GREY');
  await page.mouse.move(900, 300);
  for (const key of ['e', 'f', 'g', 'h']) { await page.keyboard.press(key); await page.waitForTimeout(260); }
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/herowave-jean.png' });
  console.log('Jean Grey powers executed in a real browser session');

  // ---------- 7. back to the base version ----------
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('button', { name: 'VOLTAR AO MENU', exact: true }).click();
  await setDlc(page, false);
  const baseAttr = await page.evaluate(() => document.querySelector('[data-dlc]')?.getAttribute('data-dlc'));
  assert.equal(baseAttr, '0');
  const baseNeon = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-dlc]')).getPropertyValue('--color-neon').trim());
  assert.equal(baseNeon.toLowerCase(), '#4ff0ff');
  await startHero(page, 'JEDI');
  const baseSlots = await page.evaluate(() =>
    document.querySelectorAll('.pointer-events-auto.flex.items-end button').length);
  assert.equal(baseSlots, 3, `base version keeps 3 weapons including the rifle, got ${baseSlots}`);
  await page.screenshot({ path: 'artifacts/base-jedi-restored.png' });
  console.log('Base version restored: Jedi selectable, 3 weapons, cyan theme');

  // ---------- 8. mobile layout in the DLC ----------
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const phone = await ctx.newPage();
  await boot(phone);
  await setDlc(phone, true);
  await startHero(phone, 'HULK');
  await phone.waitForTimeout(900);
  await phone.screenshot({ path: 'artifacts/herowave-mobile.png' });
  await phone.getByRole('button', { name: 'Pausar', exact: true }).tap();
  await phone.getByRole('dialog', { name: 'Jogo pausado' }).waitFor();
  const box = await phone.getByRole('button', { name: 'VOLTAR AO MENU', exact: true }).boundingBox();
  assert.ok(box && box.height >= 40 && box.x >= 0);
  await phone.screenshot({ path: 'artifacts/herowave-mobile-pause.png' });
  console.log('Mobile DLC layout and pause flow verified');

  assert.deepEqual(errors, [], `Runtime errors: ${errors.join(' | ')}`);
  console.log('\nHEROWAVE BROWSER CHECKS PASSED — no runtime errors.');
} finally {
  await browser.close();
}
