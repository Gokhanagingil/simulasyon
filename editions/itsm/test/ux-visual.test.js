import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';
import { liveMap } from '../public/itsm-map.js';

// Synthetic component rendering only: no app server, real credentials or network.
const css = readFileSync(new URL('../public/itsm.css', import.meta.url), 'utf8');
const sharedCss = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/itsm.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const brand = readFileSync(new URL('../public/brand.svg', import.meta.url)).toString('base64');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const functionSource = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
const loginHtml = vm.runInNewContext(`${functionSource('login', 'render')} login();`, { ctx: { auth: { platform: true } }, liveMap });

function shellHtml() {
  const app = {};
  const context = {
    app, ctx: { user: { name: 'Uzun Ad Soyad · Katılımcı', trainer: false }, state: null, motion: true, view: 'park', workshops: [{ id: 'fixture', name: 'Mavi Vadi Uzun Adlı Deneme Atölyesi' }] },
    document: { body: { dataset: {} } }, navigation: [['park', 'park', 'Operasyon masası']],
    icon: () => '', button: () => '<button>Çıkış yap</button>', e: escape,
    syncLearningUI: () => {}, tick: () => {},
  };
  vm.runInNewContext(`${functionSource('render', 'heading')} render();`, context);
  return app.innerHTML;
}

function luminance(color) {
  const parts = color.startsWith('#') ? color.slice(1).match(/.{2}/g).map(v => parseInt(v, 16)) : color.match(/[\d.]+/g).slice(0, 3).map(Number);
  const [r, g, b] = parts.map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}
const token = name => css.match(new RegExp(`--${name}:(#[a-f0-9]{6})`))[1];

test('audited information palette clears normal-text contrast without rounding', () => {
  for (const background of ['#ffffff', '#f6f6f0', '#f7f7f0']) {
    assert.ok(contrast(token('muted'), background) >= 4.5, `Muted text on ${background}`);
  }
  assert.ok(contrast(token('amber'), '#fbefd4') >= 4.5);
  assert.ok(contrast('#ffffff', token('green')) >= 4.5);
  assert.match(css, /a\.skip-link\s*\{[^}]*color:\s*#fff;/);
});

test('login priority and skip targets remain explicit in component source', () => {
  assert.ok(loginHtml.indexOf('data-form="login"') < loginHtml.indexOf('login-trainer'));
  assert.ok(loginHtml.indexOf('login-form') < loginHtml.indexOf('login-map'));
  assert.match(loginHtml, /<main[^>]*id="main"[^>]*tabindex="-1"/);
  assert.match(shellHtml(), /<main[^>]*id="main"[^>]*tabindex="-1"/);
  assert.match(index, /<main[^>]*id="main"[^>]*tabindex="-1"/);
  assert.match(shellHtml(), /class="mobile-identity"/);
});

test('ITSM login explicitly resets the shared illustration layout', () => {
  const mapRule = css.match(/\.login \.login-map\s*\{([^}]+)\}/)[1];
  for (const declaration of ['margin: 0;', 'min-height: 0;', 'height: auto;', 'transform: none;', 'flex: 0 0 auto;', 'mask-image: none;', '-webkit-mask-image: none;']) {
    assert.ok(mapRule.includes(declaration), `Map reset includes ${declaration}`);
  }
  assert.match(css, /body\s*\{\s*min-width:\s*0;/);
});

const executable = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, chromium.executablePath(), '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(path => path && existsSync(path));
const evidenceDir = process.env.UX_VISUAL_EVIDENCE_DIR;

// Enable separately in an executor that permits Chromium's local IPC sockets:
// UX_VISUAL_BROWSER=1 node --test test/ux-visual.test.js
test('isolated Chromium visual acceptance fixtures', { skip: process.env.UX_VISUAL_BROWSER !== '1' ? 'Opt-in browser check: set UX_VISUAL_BROWSER=1 in a Chromium-capable executor' : !executable && 'Chromium is not installed; palette and source tests still run' }, async t => {
  const browser = await chromium.launch({ executablePath: executable, headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    const show = async (html, width, height = 844) => {
      await page.setViewportSize({ width, height });
      await page.setContent(`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${sharedCss}</style><style>${css.replace(/@import[^;]+;/g, '')}</style></head><body><a class="skip-link" href="#main">İçeriğe geç</a>${html.replaceAll('/brand.svg', `data:image/svg+xml;base64,${brand}`)}</body></html>`);
    };
    const screenshot = async name => {
      if (!evidenceDir) return;
      mkdirSync(evidenceDir, { recursive: true });
      await page.screenshot({ path: `${evidenceDir}/${name}.png`, fullPage: true });
    };

    await t.test('form appears before map; narrow layouts have no document overflow or phantom map height', async () => {
      for (const [width, height] of [[1366, 768], [768, 844], [500, 844], [390, 844], [320, 844]]) {
        await show(loginHtml, width, height);
        const dimensions = await page.evaluate(() => {
          const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
          return { width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, submit: box('[type=submit]'), form: box('.login-form'), map: box('.login-map'), svg: box('.login-map svg') };
        });
        assert.ok(dimensions.scrollWidth <= dimensions.width, `${width}px document overflow: ${JSON.stringify(dimensions)}`);
        assert.ok(dimensions.submit.bottom < height, `${width}px submit remains in initial viewport`);
        assert.ok(dimensions.map.y >= dimensions.form.bottom, `${width}px map follows form`);
        assert.ok(Math.abs(dimensions.map.height - dimensions.svg.height - 2) < 1, `${width}px map follows SVG aspect ratio`);
        await screenshot(`login-fixture-${width}`);
      }
    });

    await t.test('first Tab shows a readable skip link; Enter moves focus to main', async () => {
      await show(loginHtml, 1366, 768);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
      const colors = await page.locator('.skip-link').evaluate(el => { const s = getComputedStyle(el); return { foreground: s.color, background: s.backgroundColor, top: el.getBoundingClientRect().top }; });
      assert.ok(colors.top >= 0);
      assert.ok(contrast(colors.foreground, colors.background) >= 4.5);
      await screenshot('login-fixture-skip-focus');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'brand');
    });

    await t.test('computed form information is at least 14px and meets contrast', async () => {
      await show(loginHtml, 390);
      for (const selector of ['.login-form label', '.login-help', '.login-trainer p', '.login-form .btn']) {
        const value = await page.locator(selector).first().evaluate(el => {
          const s = getComputedStyle(el);
          let ancestor = el, background;
          while (ancestor) { background = getComputedStyle(ancestor).backgroundColor; if (background !== 'rgba(0, 0, 0, 0)') break; ancestor = ancestor.parentElement; }
          return { foreground: s.color, background, size: parseFloat(s.fontSize) };
        });
        assert.ok(value.size >= 14, `${selector}: ${value.size}px`);
        assert.ok(contrast(value.foreground, value.background) >= 4.5, `${selector}: ${JSON.stringify(value)}`);
      }
    });

    await t.test('mobile shell preserves user identity, workshop, connection and clock', async () => {
      for (const width of [320, 390, 500, 768]) {
        await show(shellHtml(), width);
        const result = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
        assert.ok(result.scrollWidth <= result.width, `Shell overflows at ${width}px`);
        for (const selector of [width <= 760 ? '.mobile-identity' : '.profile', '#workshop', '#connection', '.clock']) {
          assert.ok(await page.locator(selector).isVisible(), `${selector} is visible at ${width}px`);
        }
        await screenshot(`shell-fixture-${width}`);
      }
    });

    await t.test('both reduced-motion paths retain static result text', async () => {
      await show(`<main id="main" tabindex="-1"><div class="scene-character">●</div><p class="scene-state">Ekip müdahalede. Hizmet doğrulama bekliyor.</p>${liveMap([], ['fence'], null, false, [{ ack_at: 1, resolved_at: null }])}</main>`, 768);
      const before = await page.locator('main').innerText();
      for (const preference of ['user', 'system']) {
        await page.evaluate(value => { document.body.dataset.motion = value; }, preference === 'user' ? 'off' : 'on');
        await page.emulateMedia({ reducedMotion: preference === 'system' ? 'reduce' : 'no-preference' });
        const animationNames = await page.locator('.scene-character,.siren-halo,.crew-bob,.alert-animal').evaluateAll(elements => elements.map(el => getComputedStyle(el).animationName));
        assert.ok(animationNames.every(name => name === 'none'), `${preference} preference disables animation`);
        assert.equal(await page.locator('main').innerText(), before);
        assert.match(before, /EKİP MÜDAHALEDE/);
        assert.match(before, /ALAN KAPALI/);
      }
      await screenshot('reduced-motion-fixture');
    });
  } finally {
    await browser.close();
  }
});
