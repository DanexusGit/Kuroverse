import assert from 'node:assert/strict';
import { chromium, devices } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];

async function openMenu(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  const boot = page.getByRole('button', { name: 'Pular introducao' });
  if (await boot.isVisible()) await boot.click();
  await page.getByRole('button', { name: 'JOGAR', exact: true }).waitFor();
}

async function startClass(page, name) {
  await page.getByRole('button', { name: 'JOGAR', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  await page.getByRole('button', { name: `COMEÇAR COM ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Pausar', exact: true }).waitFor();
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await openMenu(page);
  const savedBefore = await page.evaluate(() => localStorage.getItem('neon-void-scores-v2'));

  for (const name of ['TELEPATA', 'JEDI', 'CRIOMANTE']) {
    await startClass(page, name);
    await page.waitForTimeout(1100);
    await page.mouse.move(920, 340);
    await page.mouse.down();
    await page.keyboard.down('d');
    await page.waitForTimeout(250);
    await page.keyboard.up('d');
    await page.mouse.up();
    for (const key of ['e', 'f', 'g', 'h']) await page.keyboard.press(key);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `artifacts/${name.toLowerCase()}-game.png` });
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await page.getByRole('dialog', { name: 'Jogo pausado' }).waitFor();
    await page.screenshot({ path: `artifacts/${name.toLowerCase()}-pause.png` });
    await page.getByRole('button', { name: 'VOLTAR AO MENU', exact: true }).click();
    await page.getByRole('button', { name: 'JOGAR', exact: true }).waitFor();
    assert.equal(await page.getByRole('dialog', { name: 'Jogo pausado' }).count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('neon-void-scores-v2')), savedBefore);
    console.log(`${name}: class selection, casting, pause and menu return passed`);
  }

  await startClass(page, 'JEDI');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Jogo pausado' }).waitFor();
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'REINICIAR', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'VOLTAR AO MENU', exact: true }).click();
  console.log('Desktop pause, resume and restart passed');

  const mobile = await browser.newContext({ ...devices['iPhone 13'] });
  const phone = await mobile.newPage();
  await openMenu(phone);
  await startClass(phone, 'CRIOMANTE');
  await phone.waitForTimeout(1000);
  const height = phone.viewportSize().height;
  const width = phone.viewportSize().width;
  await phone.touchscreen.tap(width - 132, height - 206);
  await phone.getByRole('button', { name: 'Pausar', exact: true }).tap();
  await phone.getByRole('dialog', { name: 'Jogo pausado' }).waitFor();
  const menuButton = phone.getByRole('button', { name: 'VOLTAR AO MENU', exact: true });
  const rect = await menuButton.boundingBox();
  assert.ok(rect && rect.height >= 44 && rect.x >= 0 && rect.x + rect.width <= width);
  await phone.screenshot({ path: 'artifacts/mobile-pause.png' });
  await menuButton.tap();
  await phone.getByRole('button', { name: 'JOGAR', exact: true }).waitFor();
  console.log('Mobile selection, pause layout and menu return passed');

  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  console.log('All browser checks passed; no JavaScript runtime errors.');
} finally {
  await browser.close();
}