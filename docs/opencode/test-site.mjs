import { chromium } from 'playwright';

const BASE = 'http://localhost:8081';
let passed = 0;
let failed = 0;
const errors = [];

function ok(name) { passed++; console.log(`  ✅ ${name}`); }
function fail(name, msg) { failed++; errors.push({ name, msg }); console.log(`  ❌ ${name}: ${msg}`); }

async function test(name, fn) {
  try { await fn(); ok(name); } catch (e) { fail(name, e.message); }
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('\n🔍 Test du site OpenCode via Copilot\n');

  // ===== LOAD =====
  console.log('--- Chargement ---');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  await test('Page charge', async () => {
    const title = await page.title();
    if (!title.includes('OpenCode')) throw new Error(`Titre: ${title}`);
  });

  await test('Quick Start par defaut', async () => {
    const d = await page.locator('#quickstart').evaluate(el => getComputedStyle(el).display);
    if (d === 'none') throw new Error('QS hidden');
  });

  // ===== NAV =====
  console.log('\n--- Navigation ---');
  for (const p of ['guide', 'reference', 'quickstart']) {
    await test(`Clic nav "${p}"`, async () => {
      await page.click(`.header-nav a[data-page="${p}"]`);
      await page.waitForTimeout(300);
      const d = await page.locator(`#${p}`).evaluate(el => getComputedStyle(el).display);
      if (d === 'none') throw new Error(`${p} hidden`);
    });
  }

  await test('Une seule page visible', async () => {
    const pages = ['quickstart', 'guide', 'reference'];
    for (const p of pages) {
      await page.click(`.header-nav a[data-page="${p}"]`);
      await page.waitForTimeout(200);
      for (const o of pages) {
        const d = await page.locator(`#${o}`).evaluate(el => getComputedStyle(el).display);
        if (o === p && d === 'none') throw new Error(`${p} should be visible`);
        if (o !== p && d !== 'none') throw new Error(`${o} should be hidden when ${p} active`);
      }
    }
  });

  // ===== SIDEBAR =====
  console.log('\n--- Sidebar ---');

  await test('Sidebar QS visible', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const d = await page.locator('.sidebar-page-section[data-page="quickstart"]').evaluate(el => getComputedStyle(el).display);
    if (d === 'none') throw new Error('QS sidebar hidden');
  });

  await test('Sidebar Guide visible avec 10+ liens', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(200);
    const s = page.locator('.sidebar-page-section[data-page="guide"]');
    const d = await s.evaluate(el => getComputedStyle(el).display);
    if (d === 'none') throw new Error('Guide sidebar hidden');
    const count = await s.locator('a[href^="#"]').count();
    if (count < 10) throw new Error(`Only ${count} links`);
  });

  await test('Clic sidebar scrolle', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(200);
    const link = page.locator('.sidebar a[href="#g-copilot-tokens"]');
    if (await link.count() > 0) {
      await link.click();
      await page.waitForTimeout(500);
      const v = await page.locator('#g-copilot-tokens').isVisible();
      if (!v) throw new Error('Section not visible');
    }
  });

  // ===== TABS =====
  console.log('\n--- Tabs ---');

  await test('Tabs installation fonctionnent', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(200);
    const tab = page.locator('.tab[data-target="install-scoop"]');
    if (await tab.count() > 0) {
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
      await page.waitForTimeout(300);
      const d = await page.locator('#install-scoop').evaluate(el => getComputedStyle(el).display);
      if (d === 'none') throw new Error('Scoop tab hidden');
      const d2 = await page.locator('#install-brew').evaluate(el => getComputedStyle(el).display);
      if (d2 !== 'none') throw new Error('Brew tab should be hidden');
    }
  });

  // ===== COPY BUTTONS =====
  console.log('\n--- Boutons copier ---');

  await test('Blocs code ont bouton Copier', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const pre = await page.locator('#quickstart pre').count();
    const btn = await page.locator('#quickstart pre .copy-btn').count();
    if (pre === 0) throw new Error('No pre');
    if (btn !== pre) throw new Error(`${pre} pre but ${btn} buttons`);
  });

  // ===== CARDS =====
  console.log('\n--- Cards ---');

  await test('Cards Quick Start presentes', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const c = await page.locator('#quickstart .card').count();
    if (c < 4) throw new Error(`Only ${c} cards`);
  });

  await test('Cards Reference combinaisons presentes', async () => {
    await page.click('.header-nav a[data-page="reference"]');
    await page.waitForTimeout(200);
    const c = await page.locator('#reference .card').count();
    if (c < 3) throw new Error(`Only ${c} cards`);
  });

  // ===== CONTRASTE =====
  console.log('\n--- Contraste ---');

  await test('Header: logo blanc sur fond sombre', async () => {
    const color = await page.locator('.header-logo').evaluate(el => getComputedStyle(el).color);
    const bg = await page.locator('.header').evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`    Logo: ${color} on ${bg}`);
    if (!color.includes('255')) throw new Error(`Logo not white: ${color}`);
  });

  await test('Header nav: liens lisibles', async () => {
    const color = await page.locator('.header-nav a').first().evaluate(el => getComputedStyle(el).color);
    console.log(`    Nav: ${color}`);
    const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m && (parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3])) / 3 < 150)
      throw new Error(`Too dark: ${color}`);
  });

  await test('Header nav active: blanc sur rouge', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const a = page.locator('.header-nav a.active');
    const color = await a.evaluate(el => getComputedStyle(el).color);
    const bg = await a.evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`    Active: ${color} on ${bg}`);
    if (!color.includes('255')) throw new Error(`Active not white: ${color}`);
  });

  await test('Sidebar: texte lisible', async () => {
    const color = await page.locator('.sidebar a').first().evaluate(el => getComputedStyle(el).color);
    console.log(`    Sidebar: ${color}`);
  });

  // ===== CONTENU =====
  console.log('\n--- Contenu ---');

  await test('Quick Start complet', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const t = await page.locator('#quickstart').innerText();
    if (t.length < 500) throw new Error(`Too short: ${t.length}`);
    if (!t.includes('opencode')) throw new Error('Missing opencode');
    if (!t.includes('/connect')) throw new Error('Missing /connect');
  });

  await test('Guide complet', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(200);
    const t = await page.locator('#guide').innerText();
    if (t.length < 2000) throw new Error(`Too short: ${t.length}`);
    if (!t.includes('Consommation')) throw new Error('Missing tokens section');
    if (!t.includes('Claude Code')) throw new Error('Missing comparison');
  });

  await test('Reference complet', async () => {
    await page.click('.header-nav a[data-page="reference"]');
    await page.waitForTimeout(200);
    const t = await page.locator('#reference').innerText();
    if (t.length < 1000) throw new Error(`Too short: ${t.length}`);
  });

  // ===== TABLES =====
  console.log('\n--- Tableaux ---');

  await test('Tableaux Reference ont des donnees', async () => {
    await page.click('.header-nav a[data-page="reference"]');
    await page.waitForTimeout(200);
    const tables = await page.locator('#reference table').count();
    if (tables < 4) throw new Error(`Only ${tables} tables`);
    const rows = await page.locator('#reference table tbody tr').count();
    if (rows < 15) throw new Error(`Only ${rows} rows`);
  });

  await test('Comparatif OpenCode vs Claude Code present', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(200);
    const section = page.locator('#g-vs-claude');
    if (await section.count() === 0) throw new Error('Missing comparison section');
    const table = await section.locator('~ .table-wrap table').first();
    const rows = await page.locator('#g-vs-claude ~ .table-wrap table tbody tr').count();
    if (rows < 5) throw new Error(`Only ${rows} comparison rows`);
  });

  // ===== SCREENSHOTS =====
  console.log('\n--- Screenshots ---');
  for (const p of ['quickstart', 'guide', 'reference']) {
    await page.click(`.header-nav a[data-page="${p}"]`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshot-${p}.png`, fullPage: false });
    console.log(`  📸 screenshot-${p}.png`);
  }

  // ===== SUMMARY =====
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultats: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log('\nErreurs:');
    errors.forEach(e => console.log(`  ❌ ${e.name}: ${e.msg}`));
  }

  await page.waitForTimeout(3000);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
