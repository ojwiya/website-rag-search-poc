import { test, expect, type Page } from '@playwright/test';

// Helpers ------------------------------------------------------------------
// The results bar first renders "0–0 of 0 matches" then updates once data loads.
async function waitForResults(page: Page) {
  // Wait until the results bar shows a non-zero total (data has loaded),
  // not merely that the "matches" text node exists (it renders "0 of 0" first).
  await expect(async () => {
    expect(await resultCount(page)).toBeGreaterThan(0);
  }).toPass();
}

async function resultCount(page: Page): Promise<number> {
  const barText = await page
    .getByText('matches')
    .first()
    .locator('xpath=..')
    .innerText();
  const m = barText.match(/([\d,]+)\s*matches/);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : -1;
}

// Every property card shows exactly one price node like "€1,120,977".
async function visibleCardPrices(page: Page): Promise<number[]> {
  const texts = await page.getByText(/€[\d,]+/).allInnerTexts();
  return texts.map((t) => parseInt(t.replace(/[^\d]/g, ''), 10)).filter((n) => n > 0);
}

// Tests ---------------------------------------------------------------------
test.describe('Homes in the Sun — e2e', () => {
  test('homepage loads without module/hydration errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find your next home in Spain' })).toBeVisible();
    await waitForResults(page);

    const bad = errors.filter((e) =>
      /Cannot find module|MODULE_NOT_FOUND|276\.js|hydrat/i.test(e)
    );
    expect(bad, `unexpected runtime errors: ${bad.join(' | ')}`).toHaveLength(0);
  });

  test('default view shows all listings with working pagination', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const total = await resultCount(page);
    expect(total).toBeGreaterThan(1000); // full dataset

    const next = page.getByRole('button', { name: 'Next →' });
    await expect(next).toBeVisible();
    await next.click();
    await waitForResults(page);
    await expect(page.getByText(/Page 2/)).toBeVisible();
  });

  test('search "apartment" filters and paginates correctly', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);

    const box = page.getByPlaceholder(/3-bed villa/);
    await box.fill('apartment');
    await box.press('Enter');
    await expect(page.getByText('"apartment"')).toBeVisible(); // results re-rendered for this query
    await waitForResults(page);

    const total = await resultCount(page);
    expect(total).toBeGreaterThan(100);   // many apartments
    expect(total).toBeLessThan(12000);     // fewer than all listings

    // Echoed query appears (quoted) in the results bar.
    await expect(page.getByText('"apartment"')).toBeVisible();

    // Pagination works after filtering.
    await page.getByRole('button', { name: 'Next →' }).click();
    await waitForResults(page);
    await expect(page.getByText(/Page 2/)).toBeVisible();
  });

  test('price filter "apartment under €300,000" caps results at 300k', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);

    const box = page.getByPlaceholder(/3-bed villa/);
    await box.fill('apartment under €300,000');
    await box.press('Enter');
    await expect(page.getByText('"apartment under €300,000"')).toBeVisible(); // results re-rendered
    // Wait until the count reflects the FILTERED set (unfiltered is 11,960; capped query is ~4,170).
    await expect(async () => {
      expect(await resultCount(page)).toBeLessThan(5000);
    }).toPass();
    await waitForResults(page);

    const prices = await visibleCardPrices(page);
    expect(prices.length, 'expected at least one card price').toBeGreaterThan(0);
    for (const v of prices) {
      expect(v, `price ${v} exceeds €300,000 cap`).toBeLessThanOrEqual(300000);
    }
  });

  test('FAQ accordion expands on click', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Frequently asked questions' })
    ).toBeVisible();

    await page.getByText('What is the average price of an apartment in Spain?').click();
    await expect(page.getByText(/Average apartment prices vary/)).toBeVisible();
  });

  test('navigating to a property detail page works', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    await page.locator('a:has-text("View details")').first().click();
    await expect(page).toHaveURL(/\/properties\/\d+/);
    await expect(page.getByText('About this property')).toBeVisible();
  });
});
