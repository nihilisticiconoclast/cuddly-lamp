---
name: tunnel-aesthetic
description: >-
  Apply the in-house "Tunnel" visual identity to ANY web/visual deliverable —
  HTML pages, React/Vue/Svelte components, landing pages, dashboards, static
  sites, slide-style HTML, GitHub Pages, or HTML reports. It is a cartography ×
  phase-space system: a locked palette (chart-paper, contour brown, teal,
  amber, route red), Fraunces / Public Sans / IBM Plex Mono type, hard edges,
  and a SEEDED per-page signature figure (a contour map with a route tunnelling
  through a barrier ridge). Use whenever a frontend or visual artifact is
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

## 2. The signature — a quiet recurring mark, NOT a centrepiece

The figure is the *connective doodle* that ties every page together — like a
colophon or a mark in the margin. Its job is recurrence and style, not size.

**Hard rules (an earlier version got these wrong — do not repeat):**
- Small and marginal by default: a masthead corner, a footer, or a faint
  full-bleed watermark. **Never** a full-width, full-screen, or "boxed image"
  treatment, and never its own dedicated section.
- **No caption on a content page.** Never print "Terrain seeded from this page",
  "barrier crossing", grid references, or `ψ ∝ e^(−κx)` on a normal page — those
  belong only to the `full` variant on pages that are *about* that.
- The mark is **topic-neutral identity**: it may sit on any page regardless of
  subject (a Bayesian card problem, a reading list, a dashboard). But the loud
  `full` variant must appear only where the landscape / sampling / tunnelling
  concept is the actual subject, or the graphic will contradict the content.

**Variants** (`opts.variant`):

| variant          | draws                                      | use for                                                   |
|------------------|--------------------------------------------|-----------------------------------------------------------|
| `mark` (default) | seeded contours + the red route; silent    | every page — the recurring corner / footer doodle         |
| `background`     | faint contours only                        | a whole-page watermark behind content                     |
| `full`           | mark + WKB inset + labels + caption         | only pages genuinely about terrain / sampling / tunnelling |

**Always seed it per page** so the terrain is deterministic for that page but
different from the next:

```html
<!-- the default: a small mark in the masthead corner -->
<span class="sig" id="sig"></span>
<script src="assets/tunnel-figure.js"></script>
<script>
  // seed = stable + unique per page (slug/path/title) — never random, never constant
  const seed = document.body.dataset.seed || location.pathname || document.title;
  document.getElementById('sig').innerHTML = TunnelFigure.tunnelFigureSVG(seed);
</script>
```

Or a faint watermark: `<div class="sig-bg" id="bg"></div>` filled with
`tunnelFigureSVG(seed, { variant: 'background' })`. Pick **one** signature per
page — a corner mark *or* a watermark, not both.

Seed policy: use the page slug / path / title (stable across reloads, unique
across pages). Never pass nothing or `Math.random()` — that breaks "static per
page". Optional sizing: `tunnelFigureSVG(seed, { width, height })`.

Allowed to vary per page: layout, where the small mark sits, the copy. Never
varies: the palette, the type, the hard edges, the motif itself.

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

1. Link the locked layer: `<link rel="stylesheet" href="assets/tokens.css">`
   (adjust the path; copy `assets/` next to the page if needed).
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
- [ ] The signature is a **small mark** (corner/footer) or a faint watermark — not a hero, not full-width, not its own section.
- [ ] It is seeded from the page slug/title (not random, not constant).
- [ ] No self-describing caption or physics labels on a content page; `full` variant only where the topic warrants it.
- [ ] Labels are real; copy is precise, not placeholder.
- [ ] It does not resemble the generic cream-coral / dark-acid / rounded-SaaS look.
