# cuddly-lamp

Home of **Tunnel** — an in-house web/visual design system, packaged as a
Claude skill (`tunnel-aesthetic`).

It's a *cartography × phase-space* identity: a locked palette (chart-paper,
contour brown, teal, amber, route red), Fraunces / Public Sans / IBM Plex Mono
type, hard edges, and a **seeded per-page signature figure** — a contour map
with a route tunnelling through a barrier ridge. The same seed always produces
the same figure, so every page is unmistakably part of the family while no two
pages carry the same picture.

The concept underneath: a contour line is a level set, and an energy landscape
is terrain — an Ordnance-Survey map and a probability surface are the same
mathematics. The motif (a route going *through* the ridge, not over it) reads
the OS tunnel symbol and quantum tunnelling as one picture.

## What's in the repo

```
cuddly-lamp/
├─ SKILL.md                    ← the design-system brief (rules + how to apply)
├─ assets/
│  ├─ tokens.css               ← the locked layer: palette, type, hard edges
│  └─ tunnel-figure.js         ← the seeded signature generator (no dependencies)
└─ examples/
   └─ example.html             ← a full assembled reference page
```

| File | What it is |
|------|------------|
| [`SKILL.md`](SKILL.md) | The brief. The locked layer (never change), the seeded layer (must differ per page), the files, how to apply it, and a pre-ship checklist. |
| [`assets/tokens.css`](assets/tokens.css) | The non-negotiable identity — CSS variables for the palette and type, plus the recurring component/scaffold classes. Link this on every page. |
| [`assets/tunnel-figure.js`](assets/tunnel-figure.js) | Generates the signature SVG from a seed using marching-squares contouring of a seeded scalar field, the tunnel route, and a WKB amplitude inset. Runs in the browser (`window.TunnelFigure`) and Node (`require`). |
| [`examples/example.html`](examples/example.html) | A complete reference page wiring `tokens.css` and `tunnel-figure.js` together. |

## Quick start

Link the locked layer and mount the seeded figure:

```html
<link rel="stylesheet" href="assets/tokens.css">

<div class="figure" id="sig"></div>
<script src="assets/tunnel-figure.js"></script>
<script>
  // seed = something stable and unique to THIS page (slug / path / title)
  const seed = document.body.dataset.seed || location.pathname || document.title;
  document.getElementById('sig').innerHTML = TunnelFigure.tunnelFigureSVG(seed);
</script>
```

In Node:

```js
const { tunnelFigureSVG } = require("./assets/tunnel-figure.js");
const svg = tunnelFigureSVG("my-page-slug"); // returns a deterministic SVG string
```

See [`SKILL.md`](SKILL.md) for the full rules (one red `--route` element per
view, amber only in the figure, square corners, real labels) and
[`examples/example.html`](examples/example.html) for a worked page.
