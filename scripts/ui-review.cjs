// Run with the absolute path of a locally available Playwright package.
const { chromium } = require(process.argv[2] || "playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1100 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const settled = async () => {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      );
    });
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate(() =>
        [...document.images].every((img) => img.naturalWidth > 0),
      ),
      true,
    );
  };
  fs.mkdirSync("output/ui-review", { recursive: true });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".evidence img").waitFor({ state: "attached" });
  await settled();
  await page.screenshot({
    path: "output/ui-review/desktop.png",
    fullPage: true,
  });
  assert.equal(await page.locator("tbody tr").count(), 5);
  await page.locator("tbody tr").first().click();
  assert.equal(await page.locator(".inline-detail-panel").isVisible(), true);
  await page.screenshot({ path: "output/ui-review/detail-modal.png" });
  await page.locator(".fields label").filter({ hasText: "조치 상태" }).locator("select").selectOption("조치완료");
  await page.getByRole("button", { name: "변경 저장", exact: true }).click();
  assert.match(await page.locator("tbody tr").first().innerText(), /조치완료/);
  await page
    .getByRole("button", { name: "이벤트 등록", exact: true })
    .click();
  await page.getByRole("button", { name: "등록", exact: true }).click();
  assert.equal(await page.locator("tbody tr").count(), 6);
  assert.equal(await page.getByRole("button", { name: "다음 페이지" }).isDisabled(), true);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "엑셀 내보내기" }).click();
  assert.match((await download).suggestedFilename(), /csv$/);
  await page.getByRole("button", { name: "샘플 스냅샷 확대" }).click();
  assert.equal(await page.locator("dialog:not(.detail-dialog)").isVisible(), true);
  await page.keyboard.press("Escape");
  await page.getByLabel("시작일").fill("2026-10-09");
  await page.getByLabel("종료일").fill("2026-10-10");
  await page.waitForTimeout(100);
  assert.equal(await page.locator("tbody tr").count(), 0);
  await page.getByRole("button", { name: "조건 초기화", exact: true }).click();
  await page.getByLabel("메뉴 검색").fill("");
  for (const name of ["AI CCTV 관리", "시스템 관리"])
    await page.getByRole("button", { name, exact: true }).click();
  const labels = await page.locator(".nav-items button").allTextContents();
  assert.equal(labels.length, 22);
  for (const label of labels) {
    await page.locator(".nav-items button").filter({ hasText: label }).click();
    assert.equal(await page.locator("h1").innerText(), label);
    if (label.includes("점검 문서·목차"))
      assert.equal(await page.locator(".tree-editor-panel").isVisible(), true);
    else assert.equal((await page.locator("tbody tr").count()) > 0, true);
    if (label === "이벤트 클립 추출")
      await page.screenshot({ path: "output/ui-review/snapshot-layout.png" });
    if (label === "점검 문서·목차 관리")
      await page.screenshot({ path: "output/ui-review/tree-layout.png" });
    if (label === "장비별 이벤트 조회")
      await page.screenshot({ path: "output/ui-review/equipment-layout.png" });
  }
  await page
    .locator(".nav-items button")
    .filter({ hasText: "위험 이벤트 관리" })
    .click();
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await settled();
  await page.screenshot({
    path: "output/ui-review/mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByLabel("메뉴 검색").fill("영상");
  assert.equal(await page.locator(".nav-items button").count(), 1);
  await page.locator(".nav-items button").click();
  await page.setViewportSize({ width: 768, height: 900 });
  await settled();
  await page.screenshot({
    path: "output/ui-review/tablet.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement !== document.body),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        screens: labels.length,
        checks: [
          "filter",
          "edit/save",
          "create",
          "pagination",
          "csv download",
          "dialog Escape",
          "empty/reset",
          "mobile navigation",
          "tablet overflow",
          "keyboard focus",
        ],
        runtimeErrors: errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
