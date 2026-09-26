import { describe, expect, it } from "vitest";
import {
  buildSiteNavigationSchemaElements,
  CHAT_SEO_DESCRIPTION,
  CHAT_SEO_TITLE,
  HOMEPAGE_SEO_DESCRIPTION,
  INTERNSHIP_SEO_DESCRIPTION,
  INTERNSHIP_SEO_TITLE,
  MCP_SEO_DESCRIPTION,
  MCP_SEO_TITLE,
  SITE_ORIGIN,
} from "./page-seo";

describe("buildSiteNavigationSchemaElements", () => {
  it("includes homepage, all program grid routes, chat, then mcp and internship at the bottom", () => {
    const parts = buildSiteNavigationSchemaElements();
    const urls = parts.map((p) => p.url);
    expect(urls[0]).toBe(SITE_ORIGIN);
    expect(urls).toContain(`${SITE_ORIGIN}/chat`);
    expect(urls).toContain(`${SITE_ORIGIN}/bachelor`);
    expect(urls.at(-2)).toBe(`${SITE_ORIGIN}/mcp`);
    expect(urls.at(-1)).toBe(`${SITE_ORIGIN}/internship`);

    const home = parts.find((p) => p.url === SITE_ORIGIN);
    expect(home?.description).toBe(HOMEPAGE_SEO_DESCRIPTION);

    const chat = parts.find((p) => p.url === `${SITE_ORIGIN}/chat`);
    expect(chat?.name).toBe(CHAT_SEO_TITLE);
    expect(chat?.description).toBe(CHAT_SEO_DESCRIPTION);

    const mcp = parts.find((p) => p.url === `${SITE_ORIGIN}/mcp`);
    expect(mcp?.name).toBe(MCP_SEO_TITLE);
    expect(mcp?.description).toBe(MCP_SEO_DESCRIPTION);

    const internship = parts.find((p) => p.url === `${SITE_ORIGIN}/internship`);
    expect(internship?.name).toBe(INTERNSHIP_SEO_TITLE);
    expect(internship?.description).toBe(INTERNSHIP_SEO_DESCRIPTION);
  });
});
