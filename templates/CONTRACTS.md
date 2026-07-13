# Design contracts — night portfolio 2026

## 1. Product contract

- Subject: personal commercial site for Sergey Venchakov, AI agents, bots and business automation.
- Primary audience: Russian-speaking founders and small-business owners who need proof of competence before starting a conversation.
- Primary action: open `https://t.me/cvvjesuss` from a single visually dominant CTA.
- Reference language: Alessandro Argenziano — dark cinematic canvas, orbital hero, serif editorial statement, mono utility text, restrained blue glow, rounded case surfaces and deliberate motion. Reference assets and implementation code are not copied.
- Signature element: an animated AI-orbit around Sergey's identity. It replaces generic decorative bento graphics and is implemented only with CSS gradients and borders.

## 2. Visual seam

Owner: `style.css` (`blog.css` only for article/listing specifics).

### Tokens

| Role | Value |
|---|---|
| Void | `#07090c` |
| Surface | `#10141a` |
| Elevated | `#171d26` |
| Ink | `#f3f6f8` |
| Muted | `#9aa6b4` |
| Signal | `#66bfe9` |
| Signal strong | `#a6dcf5` |

- Body/display: Inter; editorial hero accent: Playfair Display; utility labels/numbers: `ui-monospace, SFMono-Regular, Consolas, monospace`.
- Base radius: 24px; pill radius: 999px; hairline: `rgba(255,255,255,.1)`.
- Content width: 1200px desktop, 100% minus 32px mobile.
- No gradients on text. Gradients are allowed only as low-contrast spatial light/noise.

Output: all 45 content pages inherit the same palette, focus style, navigation, cards, buttons and footer.

Acceptance: no light legacy surface remains; no horizontal document overflow at 360px; text contrast is at least 4.5:1.

## 3. Responsive layout seam

Breakpoints: compact `<= 820px`, medium `821–1024px`, wide `> 1024px`.

```text
WIDE                         COMPACT
┌ fixed slim nav ─────────┐  ┌ logo ───── menu 48 ┐
│ editorial orbit hero    │  │ centered orbit hero │
│ label / title / identity│  │ title / identity/CTA│
├ two-column proof ───────┤  ├ card rail →          │
├ four-step row ──────────┤  ├ step rail →          │
├ case/service grid ──────┤  ├ service rail →       │
└ compact CTA + footer ───┘  └ compact CTA + footer │
```

- Compact cards use native horizontal scrolling, `scroll-snap-type: x mandatory`, an 82–88vw card and a visible next-card edge. No drag-only custom control.
- Section rails apply to process, testimonials/cases and service lists; they reduce page height without hiding content or changing DOM order.
- Blog listing initially shows 6 cards on compact screens and exposes a 48px “Показать ещё” control. Without JS all cards remain visible.
- Article and detail pages stay single-column with 16px minimum body copy and `68ch` reading measure.
- Sticky Telegram control respects `env(safe-area-inset-bottom/right)`.

Acceptance viewports: 360×800, 390×844, 430×932, 768×1024 and 1440×900.

## 4. Navigation behavior seam

Owner: nav markup already present on 45 pages; behavior in `script.js`; presentation in `style.css`.

Input: burger click, overlay click, Escape, Tab/Shift+Tab, nav link click, viewport change.

Output:

- On compact screens the 48×48 burger opens a fixed dark sheet below the 72px header.
- While open: body scroll is locked, focus moves to the first link, Tab is trapped in the sheet, background content is inert where supported, Escape/overlay/link closes, focus returns to burger.
- `aria-expanded` and `aria-label` describe the current state.
- On wide screens the links and CTA remain inline and no overlay is active.

Error/fallback: without JS all links remain reachable in normal page flow; script must not throw if any optional element is absent.

Acceptance: keyboard-only open, full traversal, close and focus restore all work.

## 5. Motion seam

Owner: CSS for visual animation; JS only for state and observation.

- Hero orbit: 28–40s linear rotation; small nodes counter-rotate.
- Entry reveal: opacity + 16px translate, 500–700ms, one time only.
- Hover: 150–250ms border/background/translate, no layout shift.
- Native rails retain browser scrolling; no forced smooth-scroll library.
- Under `prefers-reduced-motion: reduce`: orbit, autoplay, reveal transforms and smooth scrolling are disabled; content is immediately visible.

Acceptance: no perpetual animation outside the hero signature and tiny status indicator; no hidden content when IntersectionObserver is unavailable.

## 6. Template contracts

| Group | Files | Required output |
|---|---|---|
| Home | `index.html` | New orbital hero; compact proof/process/service rails; one primary CTA |
| Listings | `services.html`, `reviews.html`, `blog.html`, `contacts.html` | Dense mobile hierarchy; rails or progressive disclosure; existing SEO text retained |
| Service details | six `service-*.html` | Shared dark hero/details/CTA, readable single column on compact screens |
| Case details | three `case-*.html`, `project-openclaw.html` | Shared dark project surfaces and compact result hierarchy |
| Articles | 30 `blog/*.html` | Shared readable article shell and responsive media/tables |

Inputs and schemas remain existing static HTML. No URLs, canonical links, CSP, JSON-LD, Yandex verification or Metrika behavior may change.

Error contract: broken relative links, missing assets, CSP drift, horizontal overflow, inaccessible interactive controls, or stale CSS cache versions fail the gate.

## 7. Cache and release seam

- `style.css` link version on all 45 pages: `?v=night2026`.
- `blog.css` link version on 31 blog pages: `?v=night2026`.
- The Yandex verification HTML is excluded.
- Shared public contracts (CSP, canonical, JSON-LD, analytics ID `110472799`) are owned by root integration and stay unchanged.

Final gate: targeted source checks, local HTTP visual passes at all acceptance widths, keyboard menu test, reduced-motion check, console check and Lighthouse accessibility/SEO audit.
