import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
let passed = 0;
let failed = 0;
const errors = [];

function ok(name) { passed++; console.log(`  ✅ ${name}`); }
function fail(name, msg) { failed++; errors.push({ name, msg }); console.log(`  ❌ ${name}: ${msg}`); }

async function test(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    fail(name, e.message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('\n🔍 Test du site Claude Code via Copilot\n');

  // ===== PAGE LOAD =====
  console.log('--- Chargement initial ---');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  await test('Page charge sans erreur', async () => {
    const title = await page.title();
    if (!title.includes('Claude Code')) throw new Error(`Titre inattendu: ${title}`);
  });

  await test('Quick Start est la page par defaut', async () => {
    const qs = await page.locator('#quickstart');
    const display = await qs.evaluate(el => getComputedStyle(el).display);
    if (display === 'none') throw new Error('Quick Start page hidden');
  });

  // ===== HEADER NAV =====
  console.log('\n--- Navigation header ---');

  await test('Clic "Guide Detaille" affiche la bonne page', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(400);
    const display = await page.locator('#guide').evaluate(el => getComputedStyle(el).display);
    if (display === 'none') throw new Error('Guide page hidden after click');
    const active = await page.locator('.header-nav a[data-page="guide"]').evaluate(el => el.classList.contains('active'));
    if (!active) throw new Error('Nav link not marked active');
  });

  await test('Clic "Reference" affiche la bonne page', async () => {
    await page.click('.header-nav a[data-page="reference"]');
    await page.waitForTimeout(400);
    const display = await page.locator('#reference').evaluate(el => getComputedStyle(el).display);
    if (display === 'none') throw new Error('Reference page hidden after click');
  });

  await test('Clic "Quick Start" revient a la premiere page', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(400);
    const display = await page.locator('#quickstart').evaluate(el => getComputedStyle(el).display);
    if (display === 'none') throw new Error('Quick Start page hidden after click');
  });

  await test('Une seule page visible a la fois', async () => {
    const pages = ['quickstart', 'guide', 'reference'];
    for (const p of pages) {
      await page.click(`.header-nav a[data-page="${p}"]`);
      await page.waitForTimeout(300);
      for (const other of pages) {
        const display = await page.locator(`#${other}`).evaluate(el => getComputedStyle(el).display);
        if (other === p && display === 'none') throw new Error(`${p} should be visible`);
        if (other !== p && display !== 'none') throw new Error(`${other} should be hidden when ${p} is active`);
      }
    }
  });

  // ===== SIDEBAR =====
  console.log('\n--- Sidebar ---');

  await test('Sidebar Quick Start: liens vers les sections', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(300);
    const sidebar = page.locator('.sidebar-page-section[data-page="quickstart"]');
    const display = await sidebar.evaluate(el => getComputedStyle(el).display);
    if (display === 'none') throw new Error('QS sidebar hidden');
    const links = await sidebar.locator('a[href^="#"]').count();
    if (links < 3) throw new Error(`Only ${links} sidebar links`);
  });

  await test('Sidebar Guide: liens vers les sections', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(300);
    const sidebar = page.locator('.sidebar-page-section[data-page="guide"]');
    const display = await sidebar.evaluate(el => getComputedStyle(el).display);
    if (display === 'none') throw new Error('Guide sidebar hidden');
    const links = await sidebar.locator('a[href^="#"]').count();
    if (links < 10) throw new Error(`Only ${links} sidebar links, expected 10+`);
  });

  await test('Clic sidebar scrolle vers la section', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(300);
    const link = page.locator('.sidebar a[href="#g-tokens"]');
    if (await link.count() > 0) {
      await link.click();
      await page.waitForTimeout(500);
      const visible = await page.locator('#g-tokens').isVisible();
      if (!visible) throw new Error('#g-tokens not visible after sidebar click');
    }
  });

  // ===== TABS =====
  console.log('\n--- Tabs ---');

  await test('Tabs pre-requis fonctionnent', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(300);
    // Scroll to tabs area
    const tabNode = page.locator('.tab[data-target="prereq-python"]');
    if (await tabNode.count() > 0) {
      await tabNode.scrollIntoViewIfNeeded();
      await tabNode.click();
      await page.waitForTimeout(300);
      const pyTab = await page.locator('#prereq-python').evaluate(el => getComputedStyle(el).display);
      const nodeTab = await page.locator('#prereq-node').evaluate(el => getComputedStyle(el).display);
      if (pyTab === 'none') throw new Error('Python tab should be visible');
      if (nodeTab !== 'none') throw new Error('Node tab should be hidden');
    }
  });

  await test('Tabs config fonctionnent', async () => {
    const tabBash = page.locator('.tab[data-target="config-bash"]');
    if (await tabBash.count() > 0) {
      await tabBash.scrollIntoViewIfNeeded();
      await tabBash.click();
      await page.waitForTimeout(300);
      const display = await page.locator('#config-bash').evaluate(el => getComputedStyle(el).display);
      if (display === 'none') throw new Error('Bash config tab hidden after click');
    }
  });

  // ===== COPY BUTTONS =====
  console.log('\n--- Boutons copier ---');

  await test('Les blocs de code ont un bouton Copier', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(300);
    const preBlocks = await page.locator('#quickstart pre').count();
    const copyBtns = await page.locator('#quickstart pre .copy-btn').count();
    if (preBlocks === 0) throw new Error('No pre blocks found');
    if (copyBtns !== preBlocks) throw new Error(`${preBlocks} pre blocks but ${copyBtns} copy buttons`);
  });

  await test('Bouton Copier visible au hover', async () => {
    const firstPre = page.locator('#quickstart pre').first();
    await firstPre.scrollIntoViewIfNeeded();
    await firstPre.hover();
    await page.waitForTimeout(300);
    const opacity = await firstPre.locator('.copy-btn').evaluate(el => getComputedStyle(el).opacity);
    if (parseFloat(opacity) < 0.5) throw new Error(`Copy btn opacity: ${opacity}`);
  });

  // ===== CARDS =====
  console.log('\n--- Cards cliquables ---');

  await test('Cards "Quelle methode choisir" naviguent', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(300);
    const cards = page.locator('#guide .card[data-goto]');
    const count = await cards.count();
    if (count < 4) throw new Error(`Only ${count} clickable cards, expected 4+`);
  });

  // ===== CONTRAST / ACCESSIBILITY =====
  console.log('\n--- Contraste et lisibilite ---');

  await test('Header: texte logo lisible (blanc sur fond sombre)', async () => {
    const logo = page.locator('.header-logo');
    const color = await logo.evaluate(el => getComputedStyle(el).color);
    const bg = await page.locator('.header').evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`    Logo: color=${color}, header bg=${bg}`);
    // White text expected
    if (!color.includes('255')) throw new Error(`Logo color not white: ${color}`);
  });

  await test('Header nav: liens lisibles (pas gris sur rouge)', async () => {
    const link = page.locator('.header-nav a').first();
    const color = await link.evaluate(el => getComputedStyle(el).color);
    const bg = await page.locator('.header').evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`    Nav link: color=${color}, header bg=${bg}`);
    // Should not be gray on red anymore
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const brightness = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
      if (brightness < 150) throw new Error(`Nav text too dark (${brightness}): ${color} on ${bg}`);
    }
  });

  await test('Header nav active: lien actif lisible', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const activeLink = page.locator('.header-nav a.active');
    const color = await activeLink.evaluate(el => getComputedStyle(el).color);
    const bg = await activeLink.evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`    Active nav: color=${color}, bg=${bg}`);
  });

  await test('Sidebar: texte muted lisible sur fond clair', async () => {
    const link = page.locator('.sidebar a').first();
    const color = await link.evaluate(el => getComputedStyle(el).color);
    console.log(`    Sidebar link: color=${color}`);
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const brightness = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
      if (brightness > 180) throw new Error(`Sidebar text too light: ${color}`);
    }
  });

  await test('Code inline: texte rouge lisible sur fond gris clair', async () => {
    const code = page.locator('#quickstart code').first();
    if (await code.count() > 0) {
      const color = await code.evaluate(el => getComputedStyle(el).color);
      const bg = await code.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log(`    Inline code: color=${color}, bg=${bg}`);
    }
  });

  // ===== ALL PAGES CONTENT =====
  console.log('\n--- Contenu des pages ---');

  await test('Quick Start a du contenu', async () => {
    await page.click('.header-nav a[data-page="quickstart"]');
    await page.waitForTimeout(200);
    const text = await page.locator('#quickstart').innerText();
    if (text.length < 500) throw new Error(`QS trop court: ${text.length} chars`);
    if (!text.includes('npx copilot-api')) throw new Error('Missing npx command');
  });

  await test('Guide a du contenu', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(200);
    const text = await page.locator('#guide').innerText();
    if (text.length < 2000) throw new Error(`Guide trop court: ${text.length} chars`);
    if (!text.includes('Consommation de tokens')) throw new Error('Missing tokens section');
  });

  await test('Reference a du contenu', async () => {
    await page.click('.header-nav a[data-page="reference"]');
    await page.waitForTimeout(200);
    const text = await page.locator('#reference').innerText();
    if (text.length < 1000) throw new Error(`Reference trop court: ${text.length} chars`);
  });

  await test('Section tokens/quota presente et visible', async () => {
    await page.click('.header-nav a[data-page="guide"]');
    await page.waitForTimeout(300);
    const section = page.locator('#g-tokens');
    if (await section.count() === 0) throw new Error('Section g-tokens missing');
  });

  // ===== TABLES =====
  console.log('\n--- Tableaux ---');

  await test('Les tableaux sont presents et ont des donnees', async () => {
    await page.click('.header-nav a[data-page="reference"]');
    await page.waitForTimeout(300);
    const tables = await page.locator('#reference table').count();
    if (tables < 3) throw new Error(`Only ${tables} tables in reference`);
    const rows = await page.locator('#reference table tbody tr').count();
    if (rows < 10) throw new Error(`Only ${rows} table rows`);
  });

  // ===== SCREENSHOTS =====
  console.log('\n--- Captures d\'ecran ---');

  const pages = ['quickstart', 'guide', 'reference'];
  for (const p of pages) {
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
  console.log('');

  await page.waitForTimeout(3000);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
