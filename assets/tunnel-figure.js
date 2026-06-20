/* ─────────────────────────────────────────────────────────────────────────
   tunnel-figure.js — the seeded signature generator for the "Tunnel" house
   aesthetic (cartography × phase-space).

   Returns a deterministic SVG *string* from a seed (typically a page slug).
   No dependencies; runs unchanged in the browser and in Node.

       same seed  -> identical figure   (static per page)
       new  seed  -> different terrain  (of a theme, not a clone)

   VARIANTS (opts.variant) — choose how loud the motif is:
     'mark'       (DEFAULT) a small, SILENT doodle: seeded contours + the red
                  route tunnelling through a ridge. No inset, no labels, no
                  caption. This is the recurring quirk that ties pages together
                  — place it small, in a masthead corner or footer. NOT a hero.
     'background' an even fainter version (contours only) for a full-bleed
                  watermark behind content.
     'full'      the explanatory figure: adds the WKB amplitude inset, the grid
                  reference, the spot height and the caption. Use ONLY when the
                  page is actually about terrain / sampling / optimisation /
                  tunnelling, so the graphic doesn't contradict the content.

   Usage (browser):
       el.innerHTML = TunnelFigure.tunnelFigureSVG("three-card-problem");           // mark
       el.innerHTML = TunnelFigure.tunnelFigureSVG("mcmc", { variant: "full" });    // full
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

  function tunnelFigureSVG(seed, opts) {
    opts = opts || {};
    const W = opts.width  || 640;
    const H = opts.height || 640;
    const variant = opts.variant || "mark";       // 'mark' | 'background' | 'full'
    const opK = variant === "background" ? 0.5 : 1;
    const rng = mulberry32(hashSeed(seed == null ? "tunnel" : seed));
    const rand = (a, b) => a + (b - a) * rng();

    // ── seeded scalar field: a barrier ridge between two basins ─────────────
    const ridgeX     = rand(0.42, 0.58);
    const ridgeWidth = rand(0.065, 0.115);
    const ridgeBend  = rand(-0.18, 0.18);
    const ridgeTilt  = rand(-0.45, 0.45);
    const ridgeH     = rand(1.00, 1.35);
    const bx1 = rand(0.13, 0.30), by1 = rand(0.34, 0.66);
    const bx2 = rand(0.70, 0.87), by2 = rand(0.34, 0.66);

    function fieldAt(u, v) {
      const cx = ridgeX + ridgeBend * Math.sin((v - 0.5) * Math.PI) + ridgeTilt * (v - 0.5);
      const d  = u - cx;
      let f = ridgeH * Math.exp(-(d * d) / (2 * ridgeWidth * ridgeWidth));
      f -= 0.55 * Math.exp(-(((u - bx1) ** 2 + (v - by1) ** 2) / (2 * 0.10 * 0.10)));
      f -= 0.45 * Math.exp(-(((u - bx2) ** 2 + (v - by2) ** 2) / (2 * 0.10 * 0.10)));
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

    // ── the route: basin 1 → through the ridge crest → basin 2 ──────────────
    // (drawn for 'mark' and 'full'; omitted for the quiet 'background' wash)
    let defs = "", routeSVG = "", insetSVG = "", labelSVG = "";

    if (variant !== "background") {
      defs = '<defs><marker id="tnl-ar" markerWidth="9" markerHeight="9" refX="6" refY="4.5" '
           + 'orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="' + PAL.route + '"/></marker></defs>';

      const crestLevel = fmin + 0.72 * (fmax - fmin);
      const steps = 60;
      const route = [];
      for (let s = 0; s <= steps; s++) {
        const tt = s / steps;
        const u = bx1 + (bx2 - bx1) * tt;
        const v = by1 + (by2 - by1) * tt + 0.04 * Math.sin(tt * Math.PI);
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
              + '\u03C8 \u221D e^(\u2212\u03BAx)</text>';

        const gref = "SO " + Math.floor(rand(80, 90)) + " "
                   + String(Math.floor(rand(0, 10))) + String(Math.floor(rand(0, 10)));
        const spot = Math.floor(rand(180, 420));
        labelSVG =
            '<text x="' + pad + '" y="26" fill="' + PAL.contour + '" opacity="0.75" '
              + 'font-family="IBM Plex Mono, monospace" font-size="12" letter-spacing="1">' + gref + '</text>'
          + '<text x="' + (W - pad) + '" y="26" text-anchor="end" fill="' + PAL.contour + '" opacity="0.75" '
              + 'font-family="IBM Plex Mono, monospace" font-size="12">\u25B2 ' + spot + 'm</text>'
          + '<text x="' + pad + '" y="' + (H - 14) + '" fill="' + PAL.contour + '" opacity="0.7" '
              + 'font-family="IBM Plex Mono, monospace" font-size="12">barrier crossing \u2014 the amplitude survives the wall</text>';
      }
    }

    const isDecor = variant !== "full";
    const open = '<svg viewBox="0 0 ' + W + ' ' + H + '" fill="none" xmlns="http://www.w3.org/2000/svg" '
      + (isDecor ? 'aria-hidden="true" focusable="false"'
                 : 'role="img" aria-label="Contour terrain with a route tunnelling through a barrier ridge"')
      + '>';

    return open + defs + contourSVG + routeSVG + insetSVG + labelSVG + "</svg>";
  }

  return { tunnelFigureSVG, palette: PAL, _hashSeed: hashSeed };
});
