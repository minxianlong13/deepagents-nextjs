import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { chromium } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 15_000;

const turndownService = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

function parseWebpageUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Provide a valid webpage URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS webpage URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Webpage URLs must not include credentials.");
  }

  return url;
}

async function assertPublicWebpageHost(url) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private and local webpage hosts are not allowed.");
  }

  let addresses;
  if (ipaddr.isValid(hostname)) {
    addresses = [{ address: hostname }];
  } else {
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error("The webpage host could not be resolved.");
    }
  }

  if (
    addresses.length === 0 ||
    addresses.some(
      ({ address }) => ipaddr.process(address).range() !== "unicast",
    )
  ) {
    throw new Error("Private and local webpage hosts are not allowed.");
  }
}

export async function renderWebpage(url) {
  const initialUrl = parseWebpageUrl(url);
  await assertPublicWebpageHost(initialUrl);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      userAgent: "Mozilla/5.0 (compatible; DeepAgentsWebpageIngest/1.0)",
    });
    page.setDefaultNavigationTimeout(REQUEST_TIMEOUT_MS);

    await page.route("**/*", async (route) => {
      const request = route.request();
      if (["image", "media", "font"].includes(request.resourceType())) {
        await route.abort();
        return;
      }

      try {
        const requestUrl = parseWebpageUrl(request.url());
        const redirectSource = request.redirectedFrom()?.url();
        let redirectCount = 0;
        let previousRequest = request.redirectedFrom();
        while (previousRequest) {
          redirectCount += 1;
          previousRequest = previousRequest.redirectedFrom();
        }
        if (redirectCount > MAX_REDIRECTS) {
          throw new Error("The webpage exceeded the redirect limit.");
        }
        if (redirectSource) {
          const previousUrl = parseWebpageUrl(redirectSource);
          if (
            previousUrl.protocol === "https:" &&
            requestUrl.protocol === "http:"
          ) {
            throw new Error("HTTPS-to-HTTP webpage redirects are not allowed.");
          }
        }
        await assertPublicWebpageHost(requestUrl);
        await route.continue();
      } catch {
        await route.abort();
      }
    });

    const response = await page.goto(initialUrl.href, {
      waitUntil: "domcontentloaded",
    });
    if (response && !response.ok()) {
      throw new Error(`Webpage request failed with HTTP ${response.status()}.`);
    }

    await page
      .waitForLoadState("networkidle", { timeout: 5_000 })
      .catch(() => {});
    const finalUrl = parseWebpageUrl(page.url());
    await assertPublicWebpageHost(finalUrl);
    const html = await page.content();
    if (Buffer.byteLength(html, "utf8") > MAX_RESPONSE_BYTES) {
      throw new Error("The rendered webpage exceeds the 5 MB size limit.");
    }

    return { url: finalUrl.href, html };
  } finally {
    await browser.close();
  }
}

export function extractWebpageContent(html, pageUrl) {
  const dom = new JSDOM(html, { url: pageUrl });
  let article;
  try {
    article = new Readability(dom.window.document).parse();
  } finally {
    dom.window.close();
  }

  if (!article?.content) {
    throw new Error("Could not identify the webpage's main content.");
  }

  const articleMarkdown = turndownService.turndown(article.content).trim();
  if (!articleMarkdown) {
    throw new Error("The webpage's main content was empty.");
  }

  const title = article.title?.trim() || null;
  return {
    title,
    markdown: title ? `# ${title}\n\n${articleMarkdown}` : articleMarkdown,
  };
}
