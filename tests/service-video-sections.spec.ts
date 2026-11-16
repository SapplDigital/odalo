import { test, expect } from '@playwright/test';

/** Video service page: format picker (data-svc-formats). Absent on other service pages. */

const labels = { es: 'Ver formato', en: 'See format', de: 'Format ansehen' } as const;

const pauseLabels = { es: 'Pausar rotación automática', en: 'Pause automatic rotation', de: 'Automatischen Wechsel pausieren' } as const;

for (const lang of ['es', 'en', 'de'] as const) {
  test.describe(`${lang} formats`, () => {
    test('order, heading accent, buttons', async ({ page }) => {
      await page.goto(`/${lang}/services/video/`);
      const sec = page.locator('[data-svc-formats]');
      await expect(sec).toHaveCount(1);
      const order = await page.evaluate(() => {
        const d = document.querySelector('[data-svc-deliver]');
        const f = document.querySelector('[data-svc-formats]');
        const p = document.querySelector('[data-svc-process]');
        if (!d || !f || !p) return false;
        return Boolean(d.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) && Boolean(f.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(order).toBe(true);
      const em = sec.locator('h2 em');
      await expect(em).toHaveCount(1);
      const [emColor, inkColor] = await page.evaluate(() => {
        const e = document.querySelector('[data-svc-formats] h2 em') as HTMLElement;
        const probe = document.createElement('span');
        probe.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
        document.body.appendChild(probe);
        const ink = getComputedStyle(probe).color;
        probe.remove();
        return [getComputedStyle(e).color, ink];
      });
      expect(emColor).toBe(inkColor);
      const group = sec.getByRole('group', { name: labels[lang] });
      await expect(group).toHaveCount(1);
      const btns = group.locator('button[type="button"]');
      await expect(btns).toHaveCount(3);
      await expect(btns.locator('.sf__bratio')).toHaveText(['9:16', '1:1', '16:9']);
      await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
      await expect(btns.nth(0)).toHaveAttribute('aria-pressed', 'true');
      await expect(sec.locator('[data-sf-ratio]')).toHaveText('9:16');
      await expect(sec.locator('[data-sf-size]')).toContainText('1080 × 1920');
    });

    test('clicking changes format and frame aspect', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${lang}/services/video/`);
      const sec = page.locator('[data-svc-formats]');
      const btns = sec.locator('.sf__btn');
      const aspect = () => sec.locator('[data-sf-frame]').evaluate((e) => { const r = e.getBoundingClientRect(); return r.width / r.height; });
      await btns.nth(1).click();
      await expect(btns.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(sec.locator('.sf__btn[aria-pressed="true"]')).toHaveCount(1);
      await expect(sec.locator('[data-sf-ratio]')).toHaveText('1:1');
      await expect(sec.locator('[data-sf-size]')).toContainText('1080 × 1080');
      expect(Math.abs((await aspect()) - 1)).toBeLessThan(0.05);
      await btns.nth(2).click();
      await expect(sec.locator('[data-sf-ratio]')).toHaveText('16:9');
      await expect(sec.locator('[data-sf-size]')).toContainText('1920 × 1080');
      expect(Math.abs((await aspect()) - 16 / 9)).toBeLessThan(0.05);
      await btns.nth(0).click();
      expect(Math.abs((await aspect()) - 9 / 16)).toBeLessThan(0.05);
    });

    test('reduced motion: no auto-advance and no transition', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${lang}/services/video/`);
      const sec = page.locator('[data-svc-formats]');
      await sec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(3800);
      await expect(sec.locator('.sf__btn').nth(0)).toHaveAttribute('aria-pressed', 'true');
      const st = await sec.locator('[data-sf-frame]').evaluate((e) => { const c = getComputedStyle(e); return { td: c.transitionDuration, an: c.animationName }; });
      // The global reduced-motion reset may clamp durations to ~0 (e.g. 1e-05s) instead of exactly 0s.
      expect(Math.max(...st.td.split(',').map((v) => parseFloat(v)))).toBeLessThan(0.001);
      expect(st.an).toBe('none');
    });

    test('motion allowed: auto-advance while in view, pauses on hover', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/${lang}/services/video/`);
      const sec = page.locator('[data-svc-formats]');
      await sec.locator('[data-sf-picker]').scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await expect(sec.locator('.sf__btn').nth(1)).toHaveAttribute('aria-pressed', 'true', { timeout: 6000 });
      await sec.locator('.sf__stage').hover();
      const before = await sec.locator('[data-sf-ratio]').textContent();
      await page.waitForTimeout(3800);
      expect(await sec.locator('[data-sf-ratio]').textContent()).toBe(before);
    });

    test('pause button: label, toggle, stops auto-advance', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/${lang}/services/video/`);
      const sec = page.locator('[data-svc-formats]');
      const pause = sec.locator('[data-sf-picker] > button[data-sf-pause]');
      await expect(pause).toHaveCount(1);
      await expect(pause).toBeVisible();
      await expect(pause).toHaveAccessibleName(pauseLabels[lang]);
      await expect(pause).toHaveAttribute('aria-pressed', 'false');
      await sec.locator('[data-sf-picker]').scrollIntoViewIfNeeded();
      await pause.click();
      await expect(pause).toHaveAttribute('aria-pressed', 'true');
      await page.mouse.move(0, 0);
      await page.waitForTimeout(3800);
      await expect(sec.locator('.sf__btn').nth(0)).toHaveAttribute('aria-pressed', 'true');
      await expect(sec.locator('[data-sf-ratio]')).toHaveText('9:16');
      await pause.click();
      await expect(pause).toHaveAttribute('aria-pressed', 'false');
      await page.mouse.move(0, 0);
      await expect(sec.locator('.sf__btn').nth(1)).toHaveAttribute('aria-pressed', 'true', { timeout: 6000 });
    });

    test('pointerdown and focusin stop auto-advance', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/${lang}/services/video/`);
      const sec = page.locator('[data-svc-formats]');
      const pause = sec.locator('[data-sf-pause]');
      await sec.locator('[data-sf-picker]').scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await sec.locator('.sf__stage').dispatchEvent('pointerdown');
      await expect(pause).toHaveAttribute('aria-pressed', 'true');
      await page.waitForTimeout(3800);
      await expect(sec.locator('[data-sf-ratio]')).toHaveText('9:16');

      await page.reload();
      await sec.locator('[data-sf-picker]').scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await sec.locator('.sf__btn').nth(0).focus();
      await expect(pause).toHaveAttribute('aria-pressed', 'true');
      await sec.locator('.sf__btn').nth(0).blur();
      await page.waitForTimeout(3800);
      await expect(sec.locator('[data-sf-ratio]')).toHaveText('9:16');
      await expect(pause).toHaveAttribute('aria-pressed', 'true');
    });

    test('no horizontal overflow', async ({ page }) => {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/services/video/`);
        const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(ok).toBe(true);
      }
    });
  });
}

test('formats section is absent on non-video service pages', async ({ page }) => {
  for (const id of ['web', 'local', 'ads']) {
    await page.goto(`/en/services/${id}/`);
    await expect(page.locator('[data-svc-formats]')).toHaveCount(0);
  }
});

const proc = {
  es: { a: 'De la idea a tu', em: 'perfil', steps: ['Idea', 'Guion', 'Producción con IA y edición', 'Publicación'] },
  en: { a: 'From idea to your', em: 'profile', steps: ['Idea', 'Script', 'AI production and editing', 'Publishing'] },
  de: { a: 'Von der Idee in Ihr', em: 'Profil', steps: ['Idee', 'Skript', 'KI-Produktion und Schnitt', 'Veröffentlichung'] },
} as const;

for (const lang of ['es', 'en', 'de'] as const) {
  test(`${lang} video process variant`, async ({ page }) => {
    await page.goto(`/${lang}/services/video/`);
    const sec = page.locator('[data-svc-process]');
    await expect(sec.locator('h2')).toContainText(proc[lang].a);
    await expect(sec.locator('h2 em')).toContainText(proc[lang].em);
    const titles = sec.locator('.sp__t');
    await expect(titles).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(titles.nth(i)).toContainText(proc[lang].steps[i]);
      await expect(sec.locator('.sp__step p').nth(i)).not.toBeEmpty();
    }
    const after = await page.evaluate(() => {
      const f = document.querySelector('[data-svc-formats]');
      const p = document.querySelector('[data-svc-process]');
      return !!f && !!p && !!(f.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(after).toBe(true);
  });

  test(`${lang} non-video service keeps generic process`, async ({ page }) => {
    await page.goto(`/${lang}/services/web/`);
    const sec = page.locator('[data-svc-process]');
    await expect(sec.locator('.sp__t')).toHaveCount(4);
    await expect(sec.locator('h2')).not.toContainText(proc[lang].a);
  });
}

const pm = {
  es: { cap: 'Un mes del plan Captación', dow: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] },
  en: { cap: 'One month of the Captación plan', dow: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] },
  de: { cap: 'Ein Monat im Plan Captación', dow: ['M', 'D', 'M', 'D', 'F', 'S', 'S'] },
} as const;

for (const lang of ['es', 'en', 'de'] as const) {
  test(`${lang} plan-month block`, async ({ page }) => {
    await page.goto(`/${lang}/services/video/`);
    const sec = page.locator('[data-svc-plan-month]');
    await expect(sec).toHaveCount(1);
    const order = await page.evaluate(() => {
      const pos = (a: string, b: string) => {
        const x = document.querySelector(a);
        const y = document.querySelector(b);
        return !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
      };
      return pos('[data-svc-process]', '[data-svc-plan-month]') && pos('[data-svc-plan-month]', '[data-svc-plan]');
    });
    expect(order).toBe(true);
    const [emColor, refColor] = await page.evaluate(() => {
      const e = document.querySelector('[data-svc-plan-month] h2 em') as HTMLElement;
      const o = document.querySelector('[data-svc-formats] h2 em') as HTMLElement;
      return [getComputedStyle(e).color, getComputedStyle(o).color];
    });
    expect(emColor).toBe(refColor);
    await expect(sec.locator('.spm__text')).toContainText('Captación');
    await expect(sec.locator('.spm__text')).not.toContainText('{plan}');
    await expect(sec.locator('figcaption')).toHaveText(pm[lang].cap);
    await expect(sec.locator(`a[href="/${lang}/plans/"]`)).toHaveCount(1);
    await expect(sec.locator('[data-pm-dow]')).toHaveText([...pm[lang].dow]);
    await expect(sec.locator('[data-pm-day]')).toHaveCount(28);
    await expect(sec.locator('[data-pm-reel]')).toHaveCount(2);
    await expect(sec.locator('[data-pm-day="10"] [data-pm-reel]')).toHaveCount(1);
    await expect(sec.locator('[data-pm-day="24"] [data-pm-reel]')).toHaveCount(1);
    await expect(sec.locator('figure .sr-only')).toContainText('2 × Reel');
    await expect(sec.locator('figure .sr-only')).not.toContainText('{plan}');
  });

  test(`${lang} plan-month reduced motion and overflow`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/services/video/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    const st = await page.locator('[data-pm-day]').first().evaluate((e) => {
      const c = getComputedStyle(e);
      return { an: c.animationName, td: c.transitionDuration };
    });
    expect(st.an).toBe('none');
    expect(Math.max(...st.td.split(',').map((v) => parseFloat(v)))).toBeLessThan(0.001);
  });
}

test('plan-month block is absent on non-video service pages', async ({ page }) => {
  for (const id of ['web', 'local', 'ads']) {
    await page.goto(`/en/services/${id}/`);
    await expect(page.locator('[data-svc-plan-month]')).toHaveCount(0);
  }
});
