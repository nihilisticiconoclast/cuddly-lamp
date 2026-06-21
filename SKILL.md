---
name: tunnel-aesthetic
description: >-
  Apply the in-house "Tunnel" visual identity to ANY web/visual deliverable —
  HTML pages, React/Vue/Svelte components, landing pages, dashboards, static
  sites, slide-style HTML, GitHub Pages, or HTML reports. It is a cartography ×
  phase-space system: a locked palette (chart-paper, contour brown, teal,
  amber, route red), Fraunces / Public Sans / IBM Plex Mono type, hard edges,
  a fixed house logo and a SEEDED per-page doodle (a contour map with a route
  tunnelling through a barrier ridge). Use whenever a frontend or visual artifact is
  requested, even if the style is not named. Do NOT use for backend code, data
  pipelines, SQL, or non-visual output.
---

# Tunnel — house web aesthetic

A design *system*, not a template. Two things must always be true: every page
is unmistakably part of this family (the **locked layer**), and no two pages
carry the same picture (the **seeded layer**). Static per page, different per
implementation.

The idea underneath it: **a contour line is a level set, and an energy
landscape is terrain.** An Ordnance-Survey map and a probability surface are
the same mathematics. The signature motif — a route passing *through* a barrier
ridge rather than over it — is the OS tunnel symbol and quantum tunnelling read
as one picture. Keep that concept visible; it is the point, not decoration.

---

## 1. The locked layer — never change these

Pull these from `assets/tokens.css`. Treat them as identity, not preference.

**Palette (exact hex; do not substitute or add brand colours):**

| token        | hex       | role                                                        |
|--------------|-----------|-------------------------------------------------------------|
| `--paper`    | `#EDE7D3` | ground / chart paper                                        |
| `--ink`      | `#4A3823` | primary text                                                |
| `--contour`  | `#7A5C3E` | hairline contours, secondary text, captions                |
| `--index`    | `#5A4225` | index contours, heading emphasis, borders                  |
| `--incident` | `#3E7C8C` | teal — links, the "incident" accent, any data-viz line     |
| `--amber`    | `#E0922B` | **only** where a scalar field runs high (energy/height/amplitude) |
| `--route`    | `#C0432B` | the route — primary action, the single red line on a page  |

**Type:** display **Fraunces** (optical serif, weight ~560, set tight); body
**Public Sans**; data/labels/annotations **IBM Plex Mono**. No other families.

**Form rules:**
- Hard edges everywhere. `border-radius: 0`. No rounded "card" corners.
- No drop shadows, no glows, no gradient fills on UI. Warmth comes from the
  paper and the ink, never from a gradient.
- Linework, not boxes: dividers are hairline rules that read as isolines.
- Exactly **one** red `--route` element per view — the primary action or path.
  Amber is reserved for "high ground" in the figure; never use it for buttons.
- Real labels, never lorem: grid references, spot heights, `V₀`, `ψ`, `κ`,
  `−∇U`, units. Copy is precise and ideas-first; if you must write filler, make
  it true to the subject.

This is deliberately **not** the default AI look: not cream-with-coral, not
near-black-with-acid, not a rounded SaaS hero. If a draft drifts toward those,
it has left the system.

---

## 2. The signature — a fixed logo AND a per-page doodle

There are **two different jobs**, and they are not the same picture:

- the **logo** (`mark`) — the recognisable house mark: one ridge, two wells, one
  route tunnelling through. **Identical on every page** (the seed is ignored).
  It's the masthead/footer brand, the thing that says "same family".
- the **doodle** (`doodle`) — a genuinely **different little scribble per page**:
  the ridge wanders and tilts, there are two to four wells, the route runs at a
  different angle. Deterministic once the page loads (same slug → same doodle),
  but noticeably unlike the next page's. It's the connective *quirk*, dropped
  **between sections and off to one side** — never boxed, never captioned, never
  its own section.

**Hard rules (an earlier version got these wrong — do not repeat):**
- Small and marginal: a masthead corner / footer (logo), an off-centre scribble
  between sections (doodle), or a faint full-bleed watermark (background).
  **Never** a full-width, full-screen, or "boxed image" treatment, and never a
  dedicated section.
- **The doodle's position varies, never fixed.** Mount it with `TunnelFigure.placeDoodle(el)`, which drops it into one of six edge slots ({left,right} × {top,middle,bottom}) that bleed into the gutter, behind the content — so it shows only in the margin, never behind the text. A hard-coded corner reads as static across the family; do not do it.
- **No caption on a content page.** Never print "Terrain seeded from this page",
  "barrier crossing", grid references, or `ψ ∝ e^(−κx)` on a normal page — those
  belong only to the `full` variant on pages that are *about* that.
- Topic-neutral identity: logo and doodle may sit on any page regardless of
  subject. But the loud `full` variant must appear only where the landscape /
  sampling / tunnelling concept is the actual subject.

**Variants** (`opts.variant`):

| variant          | seeded?            | draws                                       | use for                                                    |
|------------------|--------------------|---------------------------------------------|------------------------------------------------------------|
| `mark` (default) | **no** — fixed logo| the house mark: ridge + 2 wells + route     | the masthead / footer brand, the same on every page        |
| `doodle`         | yes, per page      | a varied composition + the red route        | the off-centre, between-sections scribble — unique per page |
| `background`     | yes, per page      | varied contours only (faint but visible)    | a whole-page watermark behind content                      |
| `full`           | yes, per page      | composition + route + WKB inset + labels    | only pages genuinely about terrain / sampling / tunnelling |

```html
<!-- the fixed house logo in the masthead (seed ignored) -->
<span class="sig" id="sig"></span>

<!-- the per-page doodle: off-centre, between sections -->
<div class="doodle" id="doodle"></div>

<script src="assets/tunnel-figure.js"></script>
<script>
  document.getElementById('sig').innerHTML =
    TunnelFigure.tunnelFigureSVG(null, { variant: 'mark' });
  // seed = stable + unique per page (slug/path/title) — never random, never constant
  const seed = document.body.dataset.seed || location.pathname || document.title;
  document.getElementById('doodle').innerHTML =
    TunnelFigure.tunnelFigureSVG(seed, { variant: 'doodle' });
  TunnelFigure.placeDoodle(document.getElementById('doodle'));   // random edge slot — never a fixed spot
</script>
```

Or a faint watermark instead of the doodle: `<div class="sig-bg" id="bg"></div>`
filled with `tunnelFigureSVG(seed, { variant: 'background' })`. Pick at most one
per-page figure — a doodle *or* a watermark, not both (the fixed logo can sit
alongside either).

Seed policy (for `doodle` / `background` / `full`): use the page slug / path /
title (stable across reloads, unique across pages). Never pass `Math.random()` —
that breaks "static per page". Optional sizing: `tunnelFigureSVG(seed, { width,
height, variant })`.

Allowed to vary per page: layout, where the figures sit, the copy, and the
**doodle composition** itself. Never varies: the palette, the type, the hard
edges, the motif (ridge + route tunnelling through), and the logo.

---

## 3. Files in this skill

```
tunnel-aesthetic/
├─ SKILL.md                 ← this brief
├─ assets/
│  ├─ tokens.css            ← the locked layer (link this on every page)
│  └─ tunnel-figure.js      ← the seeded signature generator (no dependencies)
└─ examples/
   └─ example.html          ← a full assembled reference page
```

`tunnel-figure.js` runs in the browser (`window.TunnelFigure`) and in Node
(`require`). It returns an SVG **string**; insert it via `innerHTML` (HTML) or
`dangerouslySetInnerHTML` (React). Same seed → identical SVG.

---

## 4. How to apply it

1. **Link the shared assets from the CDN — do NOT paste/inline them** (see
   section 6). In short: one `<link>` for `tokens.css` and one `<script>` for
   `tunnel-figure.js`, both from `cdn.jsdelivr.net/gh/...@main`. Inlining is what
   makes every page a stale fork; linking means an update to this repo reaches
   every page.
2. Build the page with the token classes: `.wrap`, `.eyebrow`, `h1`, `.lede`,
   `.btn` / `.btn--route`, `.figure`, hairline `hr`/`.rule`, `.caption`.
3. Mount the signature once, seeded from the page (section 2). Lead with it
   when the figure *is* the message; otherwise place it beside the hero or as a
   section break.
4. Keep to one red element, amber only in the figure, and prose copy with no
   bullet-spam unless the content is genuinely a list.

**React note:** import the palette and call the generator in an effect or at
render:

```jsx
import { tunnelFigureSVG } from './tunnel-figure.js';
function Signature({ seed }) {
  return <div className="figure"
    dangerouslySetInnerHTML={{ __html: tunnelFigureSVG(seed) }} />;
}
```
(The CSS variables in `tokens.css` are global; load it once at the app root.)

---

## 5. Quick self-check before shipping

- [ ] Background is `--paper`, text is `--ink`; no white cards, no shadows.
- [ ] Fonts are Fraunces / Public Sans / IBM Plex Mono only.
- [ ] Exactly one `--route` red element; amber appears only in the figure.
- [ ] Corners are square (`--radius: 0`).
- [ ] The fixed `mark` logo sits in a corner/footer; any per-page `doodle` is small, off-centre, between sections — not a hero, not full-width, not its own section. Its position comes from `placeDoodle` (a random edge slot), never a fixed corner.
- [ ] The `doodle` / `background` / `full` figure is seeded from the page slug/title (not random, not constant); the `mark` logo is the same everywhere.
- [ ] No self-describing caption or physics labels on a content page; `full` variant only where the topic warrants it.
- [ ] Labels are real; copy is precise, not placeholder.
- [ ] It does not resemble the generic cream-coral / dark-acid / rounded-SaaS look.
- [ ] The assets are **linked from the CDN, not inlined** (section 6).

---

## 6. Using Tunnel in another repo (link, never inline)

The whole point of a style guide is one source of truth. **Do not copy
`tokens.css` / `tunnel-figure.js` into the consuming repo, and do not inline
them into the HTML.** Link the single hosted copy so an update here propagates
to every page everywhere.

The assets are served straight from this public repo via jsDelivr, tracking
`@main` (latest):

```html
<!-- in <head> -->
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tokens.css">

<!-- the fixed house logo + a per-page doodle -->
<span class="sig" id="sig"></span>
<div class="doodle" id="doodle"></div>

<!-- before </body> -->
<script src="https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tunnel-figure.js"></script>
<script>
  document.getElementById('sig').innerHTML =
    TunnelFigure.tunnelFigureSVG(null, { variant: 'mark' });
  var seed = document.body.dataset.seed || location.pathname || document.title;
  document.getElementById('doodle').innerHTML =
    TunnelFigure.tunnelFigureSVG(seed, { variant: 'doodle' });
  TunnelFigure.placeDoodle(document.getElementById('doodle'));   // random edge slot — never a fixed spot
</script>
```

That is the *entire* integration. Any consuming page is just: link those two
URLs, add the token classes, mount the logo + doodle.

**Propagation note (important).** jsDelivr caches `@main` at the edge for up to
7 days, so a change to this repo will not appear instantly. After pushing an
update you want live, purge the cache (one-time GET per file):

```
https://purge.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tokens.css
https://purge.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tunnel-figure.js
```

(If you ever need a hard freeze for a specific page, pin to a tag or commit SHA
instead of `@main` — but the default here is "track latest".)

### Make it apply automatically (install as a skill)

So you never have to add this repo to the Claude Code window again, install it
as a **personal skill** once, on your machine:

```bash
mkdir -p ~/.claude/skills/tunnel-aesthetic
curl -fsSL https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/SKILL.md \
  -o ~/.claude/skills/tunnel-aesthetic/SKILL.md
```

After that, every Claude Code session in every repo can use the `tunnel-aesthetic`
skill automatically — and because this brief tells it to *link the CDN*, new
pages come out referencing the shared assets instead of inlining them. Re-run the
`curl` to pull the latest brief. (The skill is just this `SKILL.md`; the actual
CSS/JS live on the CDN, so nothing else needs copying.)
