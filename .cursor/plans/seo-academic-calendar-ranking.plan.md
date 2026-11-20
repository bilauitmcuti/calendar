# Plan: Rank bilauitmcuti.com for UiTM academic calendar searches

## Overview

Make bilauitmcuti.com rank top 3 (and #1 where winnable) for "kalendar akademik uitm" and related searches. Today `/` sits at position 8–9 for these searches, with a 0.52% CTR.

**Root cause:** the calendar data loads, but Google can't read the dates as text. The `/list` pages already have the full text, but they're set to `noindex`.

**Strategy:** make the existing text indexable first, then strengthen `/`, then grow with new pages.

---

## Context

| | |
|---|---|
| Project | bilauitmcuti.com |
| Data | Google Search Console `sc-domain:bilauitmcuti.com`, GA4 `properties/521207399`, Firecrawl (20 Nov 2026) |
| Current range | 20 Oct – 16 Nov 2026 |
| Previous range | 22 Sep – 19 Oct 2026 |
| Timezone | MYT (Search Console dates are US Pacific) |

### Key numbers

| Metric | Previous | Current | Change |
|---|---|---|---|
| Search clicks | 1,529 | 1,753 | +14.7% |
| Search impressions | 11,653 | 21,371 | +83.4% |
| Search CTR | 13.12% | 8.20% | −4.92 pp |
| Avg position | 7.45 | 7.29 | better |
| GA4 sessions | 16,951 | 16,288 | −3.9% |
| GA4 users | 7,613 | 6,010 | −21.1% |
| Engagement rate | 72.40% | 76.90% | +4.49 pp |
| Referral sessions | 1,261 | 355 | −71.8% |

### Target searches (all landing on `/`)

| Group | Impressions | Clicks | Position |
|---|---|---|---|
| Calendar (10 queries) | 7,512 | 39 | 7.7–9.2 |
| Midsem 2026 | 805 | 8 | 5.75–8.06 |
| Deepavali | 503 | 0 | 7.37–9.60 |
| Sem break 2027 | 287 | 7 | — |

### Competition (Firecrawl search, not Google's live results)

| Search | #1 | bilauitmcuti.com |
|---|---|---|
| kalendar akademik uitm | HEA UiTM | #4 |
| jadual akademik uitm | HEA UiTM | #5 |
| uitm kalendar akademik | HEA UiTM | #5 |
| uitm calendar | UiTM Google Site | not in top 10 |
| kalendar uitm | Studocu (2021/22) | not in top 10 |

HEA wins because every date is written out in text tables. "uitm calendar" and "kalendar uitm" are dominated by old documents and spam, so #1 is winnable there.

---

## Findings

- [ ] `/` shows only day numbers and month names to crawlers, with no event names
- [ ] `/list`, `/diploma/list` and `/bachelor/list` are set to `noindex`, aren't in `sitemap.xml`, and have about 3,400–3,800 words of date text each
- [ ] `/list` uses the same title as `/`
- [ ] `/` has 4 H1s and 0 H2s, and "takwim" and "calendar" each appear 0 times
- [ ] `/` has no year in the title and no update date or source line
- [ ] `lang="en"` on BM content
- [ ] `/pre-diploma`, `/foundation-professional` and the part-time pages aren't linked from `/`
- [ ] `sitemap.xml` has 12 warnings, and breadcrumbs show "Unnamed item"
- [ ] GA4 counts 18 events as key events (44,901 of 51,245 are `view_calendar_date`), and `purchase` has never fired
- [ ] 685 sessions have a `(not set)` landing page, at 21.75% engagement
- [ ] Semester break start date differs: the site shows 8 Feb 2027, HEA's page text shows 5 Feb 2027

---

## Implementation

### Phase 1: Make the dates indexable (week 1)

- [ ] **Index the list pages** `technical`
  - Remove `noindex` from `/list` and every `/<program>/list`
  - Add them to `sitemap.xml`
  - Unique title and H1, e.g. `Senarai Penuh Tarikh Kalendar Akademik UiTM 2026/2027`
  - Link each calendar page to its list page and back ("Lihat senarai penuh tarikh")
- [ ] **Show the key dates as text on `/`** `technical`
  - A table per group (A/B) under the interactive calendar, built from data already loaded
- [ ] **Rewrite the title and meta on `/`** `SEO`
  - Title: `Kalendar Akademik UiTM 2026/2027 – Jadual & Takwim Cuti | Bila UiTM Cuti`
  - Meta: `Kalendar akademik UiTM 2026/2027 (Kumpulan A & B): tarikh kuliah, cuti pertengahan semester, peperiksaan akhir dan cuti semester. Dikemas kini mengikut takwim rasmi HEA UiTM.`
- [ ] **Fix the headings on `/`** `SEO`
  - H1: `Kalendar Akademik UiTM 2026/2027`
  - H2s: `Jadual Akademik UiTM Sesi I 2026/2027` · `Takwim Cuti UiTM: Cuti Pertengahan Semester & Cuti Semester` · `Kalendar Akademik Ikut Program` · `UiTM Academic Calendar 2026/2027 (English)`
- [ ] **Add a "next date" answer box** above the fold on `/` and the programme pages `UX`
- [ ] **Set `lang="ms"`** site-wide `technical`
- [ ] **Check the 8 Feb vs 5 Feb 2027 date** against the HEA PDF `content`

### Phase 2: Trust and structure (week 2)

- [ ] **Add a source and update line** on `/`, e.g. `Dikemas kini: [tarikh] · Sumber: HEA UiTM`, with links `content`
- [ ] **Link `/` to every programme page** with descriptive anchor text `SEO`
- [ ] **Add a Soalan Lazim (FAQ) section as plain text** on `/` `content`
- [ ] **Fix the 12 sitemap warnings and name the breadcrumb items** `technical`
- [ ] **Clean up GA4 key events** so only real goals count, and archive `purchase` `tracking`
- [ ] **Fix `page_view` on the first load and route changes** `tracking`

### Phase 3: Grow coverage (weeks 3–4)

- [ ] **Break pages:** `/cuti-pertengahan-semester`, `/cuti-semester-2027`, `/peperiksaan-akhir` `content`
- [ ] **Session archive:** `/kalendar/2025-2026`, `/kalendar/2026-2027` `content`
- [ ] **English calendar section or page** `content`
- [ ] **PDF and ICS downloads** on `/download` `technical`

### Phase 4: Ongoing

- [ ] **Get links from UiTM student councils, faculty pages and Google Sites** `SEO`
- [ ] **Add a GA4 annotation for each change on the day it goes live** `tracking`

---

## Success metrics

| Metric | Baseline | Target | Check |
|---|---|---|---|
| List pages indexed | noindex | "Submitted and indexed" | ~2 weeks after Phase 1 |
| Calendar group position | 7.7–9.2 | < 7, then top 3 | 4 and 6 weeks after Phase 1 |
| Calendar group CTR | 0.52% | > 0.52% | 4 weeks after Phase 1 |
| Homepage CTR | 8.07% | back toward 13% | 4 weeks after Phase 1 |
| Midsem, 2027 and Deepavali clicks | 15 | more clicks | next break period |
| Organic engagement on /diploma | 56.29% | closer to `/` (80.43%) | 28 days after Phase 1 |
| Organic engagement on /bachelor | 53.09% | closer to `/` (80.43%) | 28 days after Phase 1 |
| `(not set)` landing sessions | 685 | lower | 14 days after Phase 2 |
| Sitemap warnings | 12 | 0 | next sitemap download |

---

## Risks

- **`/list` competing with `/`.** If `/` drops while `/list` rises for the same searches, pick one main target or merge the text into `/`.
- **HEA is the official source.** #1 for "kalendar akademik uitm" may not be reachable, so top 3 is the realistic goal there.
- **Firecrawl results aren't Google's.** Use Search Console as the source of truth.

---

## Out of scope (for now)

- A new `/kalendar-akademik-uitm` page. Revisit only if `/` stays around position 5–9 for a whole quarter after Phase 1.
- Brand or domain changes.

---

## Sources

- [HEA UiTM Academic Calendar](https://hea.uitm.edu.my/v4/index.php/calendars/academic-calendar)
- [UiTM Penang Group B PDF 2025/2026](https://penang.uitm.edu.my/images/hea/KALENDARAKADEMIK/Group_B_-_Summary_Schedule_Session_2025_2026.pdf)
- [Studocu Kalender Akademik UiTM](https://www.studocu.com/my/document/universiti-teknologi-mara/study-skills/kalender-akademik-uitm/21784501)
- [UiTM Terengganu calendar](https://sites.google.com/view/hepuitmct/calendar)
- [FPA UiTM academic calendar](https://fpa.uitm.edu.my/index.php/ms/academic-calendar)
- [bilauitmcuti.com](https://bilauitmcuti.com/) (checked live 20 Nov 2026)
