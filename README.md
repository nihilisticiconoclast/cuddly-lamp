# cuddly-lamp

Home of **Tunnel** — an in-house web/visual design system, packaged as a
Claude skill (`tunnel-aesthetic`).

It's a *cartography × phase-space* identity: a locked palette (chart-paper,
contour brown, teal, amber, route red), Fraunces / Public Sans / IBM Plex Mono
type, hard edges, and a contour-map signature — a route tunnelling through a
barrier ridge. The signature comes in two jobs: a **fixed house logo** that's
the same on every page, and a **per-page doodle** that's different on every page
but stable once the page loads. Together they make every page unmistakably part
of the family while no two pages carry the same picture.

The concept underneath: a contour line is a level set, and an energy landscape
is terrain — an Ordnance-Survey map and a probability surface are the same
mathematics. The motif (a route going *through* the ridge, not over it) reads
the OS tunnel symbol and quantum tunnelling as one picture.

## A logo *and* a doodle — never a hero

The most common way to get this wrong is to blow the figure up into a big,
boxed centrepiece with a self-describing caption ("Terrain seeded from this
page…", grid references, `ψ ∝ e^(−κx)`). **Don't.** The signature is connective
tissue, not a centrepiece. Four variants:

| variant          | seeded?             | draws                                    | use for                                                    |
|------------------|---------------------|------------------------------------------|------------------------------------------------------------|
| `mark` (default) | **no** — fixed logo | the house mark: ridge + 2 wells + route  | the masthead / footer brand, identical on every page       |
| `doodle`         | yes, per page       | a varied composition + the red route     | the off-centre margin scribble (via `placeDoodle`) — unique per page |
| `background`     | yes, per page       | varied contours only (faint but visible) | a whole-page watermark behind content                      |
| `full`           | yes, per page       | composition + route + WKB inset + labels | only pages genuinely about terrain / sampling / tunnelling |

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
| [`SKILL.md`](SKILL.md) | The brief. The locked layer (never change), the signature (fixed logo + per-page doodle, four variants), the files, how to apply it, and a pre-ship checklist. |
| [`assets/tokens.css`](assets/tokens.css) | The non-negotiable identity — CSS variables for the palette and type, plus the recurring component/scaffold classes (incl. `.sig`, `.doodle`, `.sig-bg`, `.figure`). Link this on every page. |
| [`assets/tunnel-figure.js`](assets/tunnel-figure.js) | Generates the signature SVG using marching-squares contouring of a scalar field, the tunnel route, and (in the `full` variant) a WKB amplitude inset. `mark` is a fixed logo; `doodle` / `background` / `full` are seeded per page. Runs in the browser (`window.TunnelFigure`) and Node (`require`). |
| [`examples/example.html`](examples/example.html) | A complete reference page wiring `tokens.css` and `tunnel-figure.js` together — the fixed logo in the masthead and a per-page doodle placed in the margins. |

## Quick start

Link the locked layer, mount the fixed logo, and drop a per-page doodle:

```html
<link rel="stylesheet" href="assets/tokens.css">

<!-- the fixed house logo (seed ignored — same on every page) -->
<span class="sig" id="sig"></span>

<!-- the per-page doodle: out of flow, placed in a random margin slot (placeDoodle) -->
<div class="doodle" id="doodle"></div>

<script src="assets/tunnel-figure.js"></script>
<script>
  document.getElementById('sig').innerHTML =
    TunnelFigure.tunnelFigureSVG(null, { variant: 'mark' });
  // seed = something stable and unique to THIS page (slug / path / title)
  const seed = document.body.dataset.seed || location.pathname || document.title;
  document.getElementById('doodle').innerHTML =
    TunnelFigure.tunnelFigureSVG(seed, { variant: 'doodle' });
  TunnelFigure.placeDoodle(document.getElementById('doodle'));   // random edge slot — never a fixed spot
</script>
```

For a faint full-page watermark instead of the doodle, fill `<div class="sig-bg">`
with `tunnelFigureSVG(seed, { variant: 'background' })`. Pick at most one per-page
figure — a doodle *or* a watermark (the fixed logo can sit alongside either). Use
the `full` variant only on pages that are actually about terrain / sampling /
tunnelling.

In Node:

```js
const { tunnelFigureSVG } = require("./assets/tunnel-figure.js");
const logo   = tunnelFigureSVG(null, { variant: "mark" });               // fixed logo
const doodle = tunnelFigureSVG("my-page-slug", { variant: "doodle" });   // per-page, deterministic
```

## Use it in another repo (link, don't inline)

This is a style guide, so there should be **one source of truth**. Don't copy
the files into other repos or paste them inline — link the hosted copy, served
from this public repo via jsDelivr (tracking `@main`), so an update here reaches
every page:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tokens.css">
<script src="https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tunnel-figure.js"></script>
```

jsDelivr caches `@main` for up to 7 days; after pushing an update you want live,
GET the purge URLs once:
`https://purge.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/assets/tokens.css`
(and the same for `tunnel-figure.js`).

**Stop adding this repo to the Claude Code window** by installing it as a skill.
A ready-to-copy thin version lives in [`dist/skill/`](dist/skill/) — it links
the CDN assets and points at this brief, so it never goes stale. For the
**terminal**, install it once:

```bash
mkdir -p ~/.claude/skills/tunnel-aesthetic
curl -fsSL https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/dist/skill/SKILL.md \
  -o ~/.claude/skills/tunnel-aesthetic/SKILL.md
```

For **Claude Code on the web**, a cloud session only sees what's in the repo or
placed by the environment setup script — not your laptop's `~/.claude`. So
commit `dist/skill/` into the target repo as `.claude/skills/tunnel-aesthetic/`,
or have the environment's setup script fetch it (use the `raw.githubusercontent.com`
URL there — jsDelivr isn't on the cloud allowlist by default). See
[`dist/skill/README.md`](dist/skill/README.md) for the table, and
[`SKILL.md`](SKILL.md) section 6 for the full distribution notes.

See [`SKILL.md`](SKILL.md) for the full rules (one red `--route` element per
view, amber only in the figure, square corners, real labels, the fixed logo +
per-page doodle signature) and [`examples/example.html`](examples/example.html)
for a worked page.
