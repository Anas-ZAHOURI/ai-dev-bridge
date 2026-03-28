import { chromium } from 'playwright';

const BASE = 'http://localhost:8082';
let passed = 0, failed = 0;
const errors = [];
function ok(n) { passed++; console.log(`  ✅ ${n}`); }
function fail(n, m) { failed++; errors.push({n,m}); console.log(`  ❌ ${n}: ${m}`); }
async function test(n, fn) { try { await fn(); ok(n); } catch(e) { fail(n, e.message); } }

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  console.log('\n🔍 Test site Comparaison\n');

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  console.log('--- Chargement ---');
  await test('Page charge', async () => {
    if (!(await page.title()).includes('Comparatif')) throw new Error('Bad title');
  });
  await test('Comparatif par defaut', async () => {
    const d = await page.locator('#comparatif').evaluate(el => getComputedStyle(el).display);
    if (d === 'none') throw new Error('Hidden');
  });

  console.log('\n--- Navigation ---');
  for (const p of ['scenarios', 'decision', 'comparatif']) {
    await test(`Nav "${p}"`, async () => {
      await page.click(`.header-nav a[data-page="${p}"]`);
      await page.waitForTimeout(300);
      const d = await page.locator(`#${p}`).evaluate(el => getComputedStyle(el).display);
      if (d === 'none') throw new Error(`${p} hidden`);
    });
  }
  await test('Une seule page visible', async () => {
    for (const p of ['comparatif','scenarios','decision']) {
      await page.click(`.header-nav a[data-page="${p}"]`);
      await page.waitForTimeout(200);
      for (const o of ['comparatif','scenarios','decision']) {
        const d = await page.locator(`#${o}`).evaluate(el => getComputedStyle(el).display);
        if (o===p && d==='none') throw new Error(`${p} hidden`);
        if (o!==p && d!=='none') throw new Error(`${o} visible when ${p}`);
      }
    }
  });

  console.log('\n--- Sidebar ---');
  await test('Sidebar comparatif 8+ liens', async () => {
    await page.click('.header-nav a[data-page="comparatif"]');
    await page.waitForTimeout(200);
    const c = await page.locator('.sidebar-page-section[data-page="comparatif"] a').count();
    if (c < 8) throw new Error(`Only ${c}`);
  });
  await test('Sidebar scenarios 5+ liens', async () => {
    await page.click('.header-nav a[data-page="scenarios"]');
    await page.waitForTimeout(200);
    const c = await page.locator('.sidebar-page-section[data-page="scenarios"] a').count();
    if (c < 5) throw new Error(`Only ${c}`);
  });

  console.log('\n--- Contenu ---');
  await test('VS banner presente', async () => {
    await page.click('.header-nav a[data-page="comparatif"]');
    await page.waitForTimeout(200);
    if (await page.locator('.vs-banner').count() === 0) throw new Error('Missing');
  });
  await test('Tableaux comparatifs presents (5+)', async () => {
    const t = await page.locator('#comparatif table').count();
    if (t < 5) throw new Error(`Only ${t} tables`);
  });
  await test('Verdicts presents (5+)', async () => {
    const v = await page.locator('#comparatif .verdict').count();
    if (v < 5) throw new Error(`Only ${v} verdicts`);
  });
  await test('Score bars presentes', async () => {
    const s = await page.locator('.score-bar').count();
    if (s < 6) throw new Error(`Only ${s} bars`);
  });
  await test('Arbre de decision present', async () => {
    await page.click('.header-nav a[data-page="decision"]');
    await page.waitForTimeout(200);
    const d = await page.locator('#decision .diagram').count();
    if (d === 0) throw new Error('Missing diagram');
  });
  await test('Liens vers docs presentes', async () => {
    const l = await page.locator('#decision .nav-link').count();
    if (l < 2) throw new Error(`Only ${l} links`);
  });
  await test('Cards scenarios presentes', async () => {
    await page.click('.header-nav a[data-page="scenarios"]');
    await page.waitForTimeout(200);
    const c = await page.locator('#scenarios .card').count();
    if (c < 4) throw new Error(`Only ${c} cards`);
  });

  console.log('\n--- Contraste ---');
  await test('Header lisible', async () => {
    const c = await page.locator('.header-logo').evaluate(el => getComputedStyle(el).color);
    if (!c.includes('255')) throw new Error(`Logo: ${c}`);
  });
  await test('Nav links lisibles', async () => {
    const c = await page.locator('.header-nav a').first().evaluate(el => getComputedStyle(el).color);
    const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m && (parseInt(m[1])+parseInt(m[2])+parseInt(m[3]))/3 < 150) throw new Error(c);
  });

  console.log('\n--- Screenshots ---');
  for (const p of ['comparatif','scenarios','decision']) {
    await page.click(`.header-nav a[data-page="${p}"]`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshot-${p}.png`, fullPage: false });
    console.log(`  📸 screenshot-${p}.png`);
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultats: ${passed} passed, ${failed} failed`);
  if (errors.length) errors.forEach(e => console.log(`  ❌ ${e.n}: ${e.m}`));

  await page.waitForTimeout(3000);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
