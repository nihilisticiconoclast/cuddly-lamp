# cuddly-lamp

Home of **Tunnel** — an in-house web/visual design system, packaged as a
Claude skill (`tunnel-aesthetic`).

It's a *cartography × phase-space* identity: a locked palette (chart-paper,
contour brown, teal, amber, route red), Fraunces / Public Sans / IBM Plex Mono
type, hard edges, and a **seeded signature mark** — a small contour-map doodle
with a route tunnelling through a barrier ridge. The same seed always produces
the same mark, so every page is unmistakably part of the family while no two
pages carry the same picture.

The concept underneath: a contour line is a level set, and an energy landscape
is terrain — an Ordnance-Survey map and a probability surface are the same
mathematics. The motif (a route going *through* the ridge, not over it) reads
the OS tunnel symbol and quantum tunnelling as one picture.

## The signature is a *mark*, not a hero

The most common way to get this wrong is to blow the figure up into a big,
boxed centrepiece with a self-describing caption ("Terrain seeded from this
page…", grid references, `ψ ∝ e^(−κx)`). **Don't.** By default the signature is
a small recurring colophon — a doodle in a masthead corner or footer — that
ties the family together by *recurrence*, not size. It carries three variants:

| variant          | draws                                   | use for                                                    |
|------------------|-----------------------------------------|------------------------------------------------------------|
| `mark` (default) | seeded contours + the red route; silent | every page — the small corner / footer doodle              |
| `background`     | faint contours only                     | a whole-page watermark behind content                      |
| `full`           | mark + WKB inset + labels + caption      | only pages genuinely about terrain / sampling / tunnelling |

The loud `full` figure (caption and physics labels) is reserved for pages whose
*subject* is the landscape, or the graphic contradicts the content.

## What's in the repo

```
tunnel-aesthetic/
├─ SKILL.md                    ← the design-system brief (rules + how to apply)
├─ assets/
│  ├─ tokens.css               ← the locked layer: palette, type, hard edges
│  └─ tunnel-figure.js         ← the seeded signature generator (no dependencies)
└─ examples/
   └─ example.html             ← a full assembled reference page
```

| File | What it is |
|------|------------|
| [`SKILL.md`](SKILL.md) | The brief. The locked layer (never change), the signature mark (small, seeded, three variants), the files, how to apply it, and a pre-ship checklist. |
| [`assets/tokens.css`](assets/tokens.css) | The non-negotiable identity — CSS variables for the palette and type, plus the recurring component/scaffold classes (incl. `.sig`, `.sig-bg`, `.figure`). Link this on every page. |
| [`assets/tunnel-figure.js`](assets/tunnel-figure.js) | Generates the signature SVG from a seed using marching-squares contouring of a seeded scalar field, the tunnel route, and (in the `full` variant) a WKB amplitude inset. Runs in the browser (`window.TunnelFigure`) and Node (`require`). |
| [`examples/example.html`](examples/example.html) | A complete reference page wiring `tokens.css` and `tunnel-figure.js` together, with the signature as a small masthead mark. |

## Quick start

Link the locked layer and mount the small seeded mark:

```html
<link rel="stylesheet" href="assets/tokens.css">

<!-- the default: a small mark in a masthead corner or footer -->
<span class="sig" id="sig"></span>
<script src="assets/tunnel-figure.js"></script>
<script>
  // seed = something stable and unique to THIS page (slug / path / title)
  const seed = document.body.dataset.seed || location.pathname || document.title;
  document.getElementById('sig').innerHTML = TunnelFigure.tunnelFigureSVG(seed);
</script>
```

For a faint full-page watermark instead, fill `<div class="sig-bg">` with
`tunnelFigureSVG(seed, { variant: 'background' })`. Pick **one** signature per
page — a corner mark *or* a watermark, not both. Use the `full` variant only on
pages that are actually about terrain / sampling / tunnelling.

In Node:

```js
const { tunnelFigureSVG } = require("./assets/tunnel-figure.js");
const svg = tunnelFigureSVG("my-page-slug"); // deterministic SVG string (mark)
```

See [`SKILL.md`](SKILL.md) for the full rules (one red `--route` element per
view, amber only in the figure, square corners, real labels, the small-mark
signature) and [`examples/example.html`](examples/example.html) for a worked
page.
