import { describe, expect, it } from "vitest";
import {
  buildCalendarPageMetadata,
  resolveCalendarSeoFromPathname,
} from "./calendar-seo-metadata";

describe("resolveCalendarSeoFromPathname", () => {
  it("returns program title for grid program routes", () => {
    const seo = resolveCalendarSeoFromPathname("/bachelor");
    expect(seo.title).toBe("Bachelor - Kalendar Akademik");
    expect(seo.canonical).toBe("https://bilauitmcuti.com/bachelor");
  });

  it("returns program title for list program routes", () => {
    const seo = resolveCalendarSeoFromPathname("/diploma/list");
    expect(seo.title).toBe("Diploma - Kalendar Akademik");
    expect(seo.canonical).toBe("https://bilauitmcuti.com/diploma/list");
  });

  it("returns homepage title for / and /list", () => {
    expect(resolveCalendarSeoFromPathname("/").title).toBe(
      "Bila UiTM Cuti - Kalendar Akademik"
    );
    expect(resolveCalendarSeoFromPathname("/list").title).toBe(
      "Bila UiTM Cuti - Kalendar Akademik"
    );
  });

  it("uses different Malay descriptions for program grid vs list", () => {
    const grid = resolveCalendarSeoFromPathname("/bachelor");
    const list = resolveCalendarSeoFromPathname("/bachelor/list");
    expect(grid.description).not.toBe(list.description);
    expect(grid.description).toContain("Sarjana Muda");
    expect(list.description).toContain("Senarai");
  });

  it("uses different Malay descriptions for homepage grid vs /list", () => {
    const grid = resolveCalendarSeoFromPathname("/");
    const list = resolveCalendarSeoFromPathname("/list");
    expect(grid.description).not.toBe(list.description);
    expect(list.description).toContain("senarai");
  });
});

describe("buildCalendarPageMetadata list routes", () => {
  it("uses clean og:url for /list without session query", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: {},
    });
    expect(metadata.openGraph?.url).toBe("https://bilauitmcuti.com/list");
    expect(metadata.alternates?.canonical).toBe("https://bilauitmcuti.com/list");
  });

  it("includes session query in og:url for /list?B-20263", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: { "B-20263": "" },
    });
    expect(metadata.openGraph?.url).toBe("https://bilauitmcuti.com/list?B-20263");
    expect(metadata.alternates?.canonical).toBe("https://bilauitmcuti.com/list");
  });

  it("uses clean og:url for /diploma/list without session query", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/diploma/list",
      viewMode: "list",
      programSlug: "diploma",
      searchParams: {},
    });
    expect(metadata.openGraph?.url).toBe("https://bilauitmcuti.com/diploma/list");
  });

  it("includes session query in og:url for /diploma/list?B-20263&B-20264", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/diploma/list",
      viewMode: "list",
      programSlug: "diploma",
      searchParams: { "B-20263": "", "B-20264": "" },
    });
    expect(metadata.openGraph?.url).toBe(
      "https://bilauitmcuti.com/diploma/list?B-20263&B-20264"
    );
  });

  it("includes filter query in og:url for /list?lecture&exam", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: { lecture: "", exam: "" },
    });
    expect(metadata.openGraph?.url).toBe(
      "https://bilauitmcuti.com/list?lecture&exam"
    );
    expect(metadata.alternates?.canonical).toBe("https://bilauitmcuti.com/list");
  });

  it("includes session and filter query in og:url", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/diploma",
      viewMode: "grid",
      programSlug: "diploma",
      searchParams: { "B-20263": "", lecture: "", break: "" },
    });
    expect(metadata.openGraph?.url).toBe(
      "https://bilauitmcuti.com/diploma?B-20263&lecture&break"
    );
  });

  it("includes site branding metadata on program routes", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/bachelor",
      viewMode: "grid",
      programSlug: "bachelor",
      searchParams: {},
    });
    expect(metadata.applicationName).toBe("Bila UiTM Cuti");
    expect(metadata.other?.site_name).toBe("Bila UiTM Cuti");
    expect(metadata.openGraph?.siteName).toBe("Bila UiTM Cuti");
  });

  it("uses list cover image for list viewMode", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: {},
    });
    const images = metadata.openGraph?.images;
    const imageUrl = Array.isArray(images) ? images[0] : images;
    expect(typeof imageUrl === "object" && imageUrl !== null && "url" in imageUrl
      ? imageUrl.url
      : imageUrl).toContain("og/list.png");
  });
});
