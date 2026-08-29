import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

async function shot(htmlPath, outPath, width, height) {
  const browser = await chromium.launch({ args: ["--disable-web-security"] });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((res) => {
      img.addEventListener("load", res);
      img.addEventListener("error", res);
    }))));
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.screenshot({ path: outPath, type: "png" });
  await browser.close();
}

await shot("/workspace/.grok/og-card.html", "/workspace/.grok/og-raw.png", 1200, 630);
await shot("/workspace/.grok/x-banner.html", "/workspace/.grok/x-banner-raw.png", 1200, 264);
console.log("screenshots written");
