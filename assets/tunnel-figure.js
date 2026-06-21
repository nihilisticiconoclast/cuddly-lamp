/* ─────────────────────────────────────────────────────────────────────────
   tunnel-figure.js — the signature generator for the "Tunnel" house aesthetic
   (cartography × phase-space). Returns a deterministic SVG *string*. No
   dependencies; runs unchanged in the browser and in Node.

   There are two distinct jobs here, and they are NOT the same picture:

     1. a fixed LOGO  — the recognisable house mark (one ridge, two wells, one
        route tunnelling through). Identical on every page. Seed is ignored.
     2. a per-page DOODLE — a genuinely different little scribble for each page,
        deterministic once the page loads. This is the "random per page, but
        static once set" connective quirk.

   VARIANTS (opts.variant):
     'mark'       (DEFAULT) the LOGO. Fixed composition, seed ignored — the same
                  small house mark everywhere. Put it in a masthead/footer.
     'doodle'     a per-page RANDOM composition (seeded): ridge + 2 wells that
                  straddle it + 0–2 extra wells + the red route between them.
                  Noticeably different per page, static once loaded. Decorative;
                  no labels, no caption. Sits off-centre / between sections.
     'background' a seeded, contours-only watermark for behind content. The
                  composition varies per page (less loudly than 'doodle'); drawn
                  faint-but-visible (pair with .sig-bg, which no longer crushes
                  it to nothing).
     'full'      the explanatory figure (seeded): doodle composition + the red
                  route + WKB amplitude inset + grid reference + spot height +
                  caption. Use ONLY when the page is actually about terrain /
                  sampling / optimisation / tunnelling.

       same seed  -> identical figure   (static per page)
       new  seed  -> different terrain  ('doodle'/'background'/'full' only;
                                         'mark' is fixed by design)

   Usage (browser):
       el.innerHTML = TunnelFigure.tunnelFigureSVG("any");                          // logo
       el.innerHTML = TunnelFigure.tunnelFigureSVG("three-card-problem",
                                                    { variant: "doodle" });         // per-page doodle
       el.innerHTML = TunnelFigure.tunnelFigureSVG("mcmc", { variant: "full" });    // explanatory
   ───────────────────────────────────────────────────────────────────────── */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.TunnelFigure = api;
})(typeof window !== "undefined" ? window
   : (typeof globalThis !== "undefined" ? globalThis : this), function () {

  // Locked palette — MUST stay in lock-step with tokens.css. Do not substitute.
  const PAL = {
    paper:    "#EDE7D3",
    ink:      "#4A3823",
    contour:  "#7A5C3E",
    index:    "#5A4225",
    incident: "#3E7C8C",
    amber:    "#E0922B",
    route:    "#C0432B",
  };

  // ── seeded PRNG (deterministic) ──────────────────────────────────────────
  function hashSeed(str) {
    str = String(str);
    let h = 2166136261 >>> 0;            // FNV-1a
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── compositions ─────────────────────────────────────────────────────────
  // A composition is { ridge, wells, link } in the unit square. The route runs
  // between wells[link.a] and wells[link.b]. fieldAt() sums one ridge (positive)
  // and the wells (negative) into the scalar terrain that gets contoured.

  // The FIXED logo: one central ridge, two balanced wells, one route. This is
  // the house mark — deliberately symmetric and always the same.
  function fixedComposition() {
    return {
      ridge: { x: 0.50, width: 0.085, bend: 0.0, tilt: 0.0, h: 1.22 },
      wells: [
        { x: 0.24, y: 0.50, depth: 0.55, sigma: 0.105 },
        { x: 0.76, y: 0.50, depth: 0.47, sigma: 0.105 },
      ],
      link: { a: 0, b: 1 },
    };
  }

  // The per-page composition: everything moves. The ridge wanders and tilts;
  // the two route-wells straddle it (so the route still tunnels THROUGH the
  // ridge); 0–2 extra wells drop in anywhere for terrain variety. `spread`
  // scales how far things roam — 'doodle'/'full' roam fully; 'background' a bit
  // less so the watermark stays calm.
  function seededComposition(rng, spread) {
    const rand = (a, b) => a + (b - a) * rng();
    const s = spread == null ? 1 : spread;
    const mid = (a, b, k) => {                 // pull a range toward its centre by (1-k)
      const c = (a + b) / 2, h = (b - a) / 2;
      return [c - h * k, c + h * k];
    };

    const [rxA, rxB] = mid(0.30, 0.70, s);
    const ridgeX = rand(rxA, rxB);
    const ridge = {
      x:     ridgeX,
      width: rand(0.052, 0.115),
      bend:  rand(-0.30, 0.30) * s,
      tilt:  rand(-0.75, 0.75) * s,
      h:     rand(0.95, 1.50),
    };

    // two wells that straddle the ridge — these are the route's endpoints
    const wells = [
      { x: rand(0.10, ridgeX - 0.12), y: rand(0.22, 0.78), depth: rand(0.45, 0.62), sigma: rand(0.085, 0.130) },
      { x: rand(ridgeX + 0.12, 0.90), y: rand(0.22, 0.78), depth: rand(0.45, 0.62), sigma: rand(0.085, 0.130) },
    ];

    // 0–2 extra wells anywhere — pure terrain variety, not route endpoints
    const extra = Math.floor(rand(0, 2.999) * s);
    for (let i = 0; i < extra; i++) {
      wells.push({ x: rand(0.12, 0.88), y: rand(0.16, 0.84), depth: rand(0.30, 0.55), sigma: rand(0.070, 0.120) });
    }

    return { ridge, wells, link: { a: 0, b: 1 } };
  }

  function tunnelFigureSVG(seed, opts) {
    opts = opts || {};
    const W = opts.width  || 640;
    const H = opts.height || 640;
    const variant = opts.variant || "mark";   // 'mark' | 'doodle' | 'background' | 'full'

    const rng = mulberry32(hashSeed(seed == null ? "tunnel" : seed));
    const rand = (a, b) => a + (b - a) * rng();

    // mark = fixed logo (seed ignored); everything else = seeded composition.
    const comp = variant === "mark"
      ? fixedComposition()
      : seededComposition(rng, variant === "background" ? 0.78 : 1);
    const { ridge, wells, link } = comp;

    // background is the only contours-only variant; it is drawn faint-but-visible
    // (the old 0.5 multiplier + a 0.06 container made it invisible — see tokens.css).
    const opK = variant === "background" ? 0.72 : 1;
    const drawRoute = variant !== "background";

    // ── scalar field: ridge (high) minus the wells (low) ────────────────────
    function fieldAt(u, v) {
      const cx = ridge.x + ridge.bend * Math.sin((v - 0.5) * Math.PI) + ridge.tilt * (v - 0.5);
      const d  = u - cx;
      let f = ridge.h * Math.exp(-(d * d) / (2 * ridge.width * ridge.width));
      for (const w of wells) {
        f -= w.depth * Math.exp(-(((u - w.x) ** 2 + (v - w.y) ** 2) / (2 * w.sigma * w.sigma)));
      }
      f += 0.12 * (v - 0.5);
      return f;
    }

    const NX = 72, NY = 72;
    const field = new Float64Array(NX * NY);
    let fmin = Infinity, fmax = -Infinity;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const val = fieldAt(i / (NX - 1), j / (NY - 1));
      field[j * NX + i] = val;
      if (val < fmin) fmin = val;
      if (val > fmax) fmax = val;
    }

    const pad = 40;
    const gx = i => pad + (i / (NX - 1)) * (W - 2 * pad);
    const gy = j => pad + (j / (NY - 1)) * (H - 2 * pad);

    // ── marching squares: contour one level into segments ───────────────────
    function march(level) {
      const segs = [];
      const v = (i, j) => field[j * NX + i];
      for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
        const tl = v(i, j), tr = v(i + 1, j), br = v(i + 1, j + 1), bl = v(i, j + 1);
        let idx = 0;
        if (tl > level) idx |= 8;
        if (tr > level) idx |= 4;
        if (br > level) idx |= 2;
        if (bl > level) idx |= 1;
        if (idx === 0 || idx === 15) continue;
        const f = (a, b) => (level - a) / (b - a);
        const T = [i + f(tl, tr), j];
        const R = [i + 1, j + f(tr, br)];
        const B = [i + f(bl, br), j + 1];
        const L = [i, j + f(tl, bl)];
        switch (idx) {
          case 1: case 14: segs.push([L, B]); break;
          case 2: case 13: segs.push([B, R]); break;
          case 3: case 12: segs.push([L, R]); break;
          case 4: case 11: segs.push([T, R]); break;
          case 6: case 9:  segs.push([T, B]); break;
          case 7: case 8:  segs.push([L, T]); break;
          case 5:  segs.push([L, T]); segs.push([B, R]); break;
          case 10: segs.push([T, R]); segs.push([L, B]); break;
        }
      }
      return segs;
    }
    function segsToPath(segs) {
      let d = "";
      for (const s of segs) {
        d += "M" + gx(s[0][0]).toFixed(1) + " " + gy(s[0][1]).toFixed(1)
           + "L" + gx(s[1][0]).toFixed(1) + " " + gy(s[1][1]).toFixed(1);
      }
      return d;
    }

    const NLEV = 8;
    const indexK = Math.round(NLEV * 0.45);
    let contourSVG = "";
    for (let k = 1; k < NLEV; k++) {
      const level = fmin + (k / NLEV) * (fmax - fmin);
      const d = segsToPath(march(level));
      if (!d) continue;
      const t = k / NLEV;
      let stroke = PAL.contour, w = 1.1, op = 0.62;
      if (t > 0.72)          { stroke = PAL.amber; w = 1.4; op = 0.9;  }
      else if (k === indexK) { stroke = PAL.index; w = 1.7; op = 0.85; }
      contourSVG += '<path d="' + d + '" fill="none" stroke="' + stroke
                 + '" stroke-width="' + w + '" opacity="' + (op * opK).toFixed(2) + '"/>';
    }

    // ── the route: well A → through the ridge crest → well B ─────────────────
    // (drawn for mark / doodle / full; omitted for the quiet background wash)
    let defs = "", routeSVG = "", insetSVG = "", labelSVG = "";

    if (drawRoute) {
      defs = '<defs><marker id="tnl-ar" markerWidth="9" markerHeight="9" refX="6" refY="4.5" '
           + 'orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="' + PAL.route + '"/></marker></defs>';

      const A = wells[link.a], B = wells[link.b];
      const crestLevel = fmin + 0.72 * (fmax - fmin);
      const steps = 60;
      const route = [];
      for (let s = 0; s <= steps; s++) {
        const tt = s / steps;
        const u = A.x + (B.x - A.x) * tt;
        const v = A.y + (B.y - A.y) * tt + 0.04 * Math.sin(tt * Math.PI);
        route.push([u, v, fieldAt(u, v)]);
      }
      let entry = -1, exit = -1;
      for (let s = 0; s < route.length; s++) {
        if (route[s][2] > crestLevel) { if (entry < 0) entry = s; exit = s; }
      }
      const rx = p => gx(p[0] * (NX - 1));
      const ry = p => gy(p[1] * (NY - 1));
      function polyD(a, b) {
        let d = "";
        for (let s = a; s <= b; s++) d += (s === a ? "M" : "L") + rx(route[s]).toFixed(1) + " " + ry(route[s]).toFixed(1) + " ";
        return d;
      }
      if (entry < 0) {
        routeSVG = '<path d="' + polyD(0, steps) + '" fill="none" stroke="' + PAL.route
                 + '" stroke-width="2.2" marker-end="url(#tnl-ar)"/>';
      } else {
        routeSVG += '<path d="' + polyD(0, entry) + '" fill="none" stroke="' + PAL.route + '" stroke-width="2.2"/>';
        routeSVG += '<path d="' + polyD(entry, exit) + '" fill="none" stroke="' + PAL.route
                  + '" stroke-width="2" stroke-dasharray="6 6" opacity="0.95"/>';
        routeSVG += '<path d="' + polyD(exit, steps) + '" fill="none" stroke="' + PAL.route
                  + '" stroke-width="2.2" marker-end="url(#tnl-ar)"/>';
        const portal = s => {
          const x = rx(route[s]).toFixed(1), y = ry(route[s]);
          return '<line x1="' + x + '" y1="' + (y - 9).toFixed(1) + '" x2="' + x + '" y2="'
               + (y + 9).toFixed(1) + '" stroke="' + PAL.route + '" stroke-width="2.2"/>';
        };
        routeSVG += portal(entry) + portal(exit);
      }

      // ── 'full' only: WKB amplitude inset + survey labels + caption ─────────
      if (variant === "full") {
        const barrierWidth = (entry < 0) ? 0.18 : (route[exit][0] - route[entry][0]);
        const kappa  = 2.0 + 12.0 * Math.max(0.05, barrierWidth);
        const wl     = rand(26, 40);
        const insetW = 280, insetX = pad + 6, insetY = H - 58, amp0 = 30;
        const bX0 = insetW * 0.42;
        const bW  = insetW * Math.min(0.34, Math.max(0.16, barrierWidth * 1.6));
        const ampAt = x => {
          if (x < bX0)      return amp0;
          if (x < bX0 + bW) return amp0 * Math.exp(-(kappa / insetW) * (x - bX0) * 3.2);
          return amp0 * Math.exp(-(kappa / insetW) * bW * 3.2);
        };
        let wkb = "M" + insetX.toFixed(1) + " " + insetY.toFixed(1);
        for (let x = 0; x <= insetW; x += 4) {
          const y = insetY - ampAt(x) * Math.sin((x / wl) * 2 * Math.PI);
          wkb += "L" + (insetX + x).toFixed(1) + " " + y.toFixed(1);
        }
        insetSVG =
            '<rect x="' + (insetX + bX0).toFixed(1) + '" y="' + (insetY - amp0 - 6).toFixed(1)
              + '" width="' + bW.toFixed(1) + '" height="' + (2 * amp0 + 12).toFixed(1)
              + '" fill="' + PAL.contour + '" opacity="0.08"/>'
          + '<line x1="' + insetX + '" y1="' + insetY + '" x2="' + (insetX + insetW) + '" y2="' + insetY
              + '" stroke="' + PAL.contour + '" stroke-width="0.8" opacity="0.4"/>'
          + '<path d="' + wkb + '" fill="none" stroke="' + PAL.incident + '" stroke-width="2"/>'
          + '<text x="' + (insetX + bX0).toFixed(1) + '" y="' + (insetY - amp0 - 12).toFixed(1)
              + '" fill="' + PAL.amber + '" font-family="IBM Plex Mono, monospace" font-size="12">'
              + 'ψ ∝ e^(−κx)</text>';

        const gref = "SO " + Math.floor(rand(80, 90)) + " "
                   + String(Math.floor(rand(0, 10))) + String(Math.floor(rand(0, 10)));
        const spot = Math.floor(rand(180, 420));
        labelSVG =
            '<text x="' + pad + '" y="26" fill="' + PAL.contour + '" opacity="0.75" '
              + 'font-family="IBM Plex Mono, monospace" font-size="12" letter-spacing="1">' + gref + '</text>'
          + '<text x="' + (W - pad) + '" y="26" text-anchor="end" fill="' + PAL.contour + '" opacity="0.75" '
              + 'font-family="IBM Plex Mono, monospace" font-size="12">▲ ' + spot + 'm</text>'
          + '<text x="' + pad + '" y="' + (H - 14) + '" fill="' + PAL.contour + '" opacity="0.7" '
              + 'font-family="IBM Plex Mono, monospace" font-size="12">barrier crossing — the amplitude survives the wall</text>';
      }
    }

    const isDecor = variant !== "full";
    const open = '<svg viewBox="0 0 ' + W + ' ' + H + '" fill="none" xmlns="http://www.w3.org/2000/svg" '
      + (isDecor ? 'aria-hidden="true" focusable="false"'
                 : 'role="img" aria-label="Contour terrain with a route tunnelling through a barrier ridge"')
      + '>';

    return open + defs + contourSVG + routeSVG + insetSVG + labelSVG + "</svg>";
  }

  // ── doodle placement ──────────────────────────────────────────────────────
  // The per-page doodle must NOT live at a fixed spot — a fixed position reads as
  // static across the family and can sit behind the text. placeDoodle drops the
  // element into one of six EDGE slots — {left,right} × {top,middle,bottom} —
  // bleeding into the page gutter, so the visible part stays in the margin and
  // never lands behind the reading column. Pairs with the `.doodle` rule in
  // tokens.css (position:absolute; z-index:-1; behind content) and
  // body{position:relative} as the offset parent.
  //
  //   TunnelFigure.placeDoodle(el);                 // fresh random slot each load
  //   TunnelFigure.placeDoodle(el, { seed: slug }); // stable-but-varied per page
  //
  // Returns the chosen { side, vert }.
  function placeDoodle(el, opts) {
    if (!el) return null;
    opts = opts || {};
    const rng = opts.seed == null ? Math.random : mulberry32(hashSeed(opts.seed));
    const side = rng() < 0.5 ? "left" : "right";
    const vert = ["top", "middle", "bottom"][Math.floor(rng() * 3)];

    el.style.position = "absolute";   // so it works even before tokens.css lands
    el.style.top = el.style.bottom = el.style.left = el.style.right = "auto";
    let tx, ty = "";
    if (side === "left") { el.style.left  = "0"; tx = "translateX(-42%)"; }
    else                 { el.style.right = "0"; tx = "translateX(42%)";  }
    if (vert === "top")         el.style.top = "clamp(80px,12vh,140px)";
    else if (vert === "middle") { el.style.top = "50%"; ty = " translateY(-50%)"; }
    else                        el.style.bottom = "clamp(40px,8vh,100px)";
    el.style.transform = tx + ty;
    return { side, vert };
  }

  return { tunnelFigureSVG, placeDoodle, palette: PAL, _hashSeed: hashSeed };
});
