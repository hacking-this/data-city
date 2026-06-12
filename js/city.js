/* =====================================================================
   CITY ENGINE — a dense, neon, isometric data metropolis.
   Pure 2D canvas (no libraries). A full skyline of buildings sits on a
   glowing street grid with light-trails flowing through the avenues.
   Six of the buildings are bright, interactive DISTRICT LANDMARKS.
   ===================================================================== */

class CityEngine {
  constructor(canvas, districts, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.districts = districts;
    this.onHover = opts.onHover || (() => {});
    this.onSelect = opts.onSelect || (() => {});

    this.TILE = 30;            // base iso tile size (world fit handles scaling)
    this.PLOT = 1.5;           // building footprint side (grid units)
    this.GAP = 1.45;           // street width between plots (more breathing room)
    this.PITCH = this.PLOT + this.GAP;
    this.R = 5;                // plot grid radius -> (2R+1)^2 plots

    this.cam = { x: 0, y: 0, scale: 1, targetScale: 1, tx: 0, ty: 0 };
    this.intro = 0;
    this.t = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.hoverId = null;
    this.activeId = null;
    this.pointer = { x: -9999, y: -9999, down: false, dragging: false };
    this.dragStart = null;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // the moon — Spotify "Sound District", draggable, sits diagonally over the city
    this.moon = { accent: "#a7ffcf", glow: "#e6fff0", r: 50, hover: false };
    this.moonHover = false;
    this.moonDrag = null;
    this.moonOffset = { x: 360, y: -36 }; // diagonal: up & to the right of center (scene units)

    this._buildWorld();
    this._bindEvents();
    this._resize();
  }

  /* ---- world: landmarks, filler skyline, roads, traffic ------------ */
  _buildWorld() {
    const rng = mulberry32(20260611);
    const P = this.PITCH, PL = this.PLOT;

    // landmark slots: 3 columns x 2 rows of 2x2 blocks, evenly spaced
    const slots = {
      "hq":         [-1, -1], // dead center — the heart of the city
      "ai-lab":     [-4, 1],
      "databricks": [-1, 1],
      "snowflake":  [ 2, 1],
      "pipeline":   [-4, -3],
      "skills":     [-1, -3],
      "analytics":  [ 2, -3],
      "platform-eng": [4, -1], // frontier: new construction on the city's edge
    };
    const occupied = new Set(); // plot cells taken by landmarks

    this.buildings = [];

    // place landmarks (2x2 plot footprint)
    this.districts.forEach((d) => {
      const [pi, pj] = slots[d.id] || [0, 0];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) occupied.add(`${pi + a},${pj + b}`);
      const w = 2 * PL + this.GAP, dd = w;        // spans the 2 plots + middle gap
      const gx = pi * P - PL / 2;
      const gy = pj * P - PL / 2;
      const b = {
        id: d.id, kind: "land", district: d,
        accent: d.accent, glow: d.glow,
        grid: { x: gx, y: gy, w, d: dd, h: d.grid.h },
      };
      d._b = b;
      this.buildings.push(b);
    });

    // filler skyline — quiet neon buildings on every free plot
    const fillerPalette = [
      ["#1d2750", "#5d77c8"], ["#241f4e", "#8a6fd6"],
      ["#142a48", "#4aa7e6"], ["#1a2340", "#6f88d0"],
      ["#28203f", "#a07fd0"], ["#102338", "#3f9fd6"],
    ];
    for (let pi = -this.R; pi <= this.R; pi++) {
      for (let pj = -this.R; pj <= this.R; pj++) {
        // is this plot inside any landmark footprint? skip
        if (occupied.has(`${pi},${pj}`)) continue;
        // leave plenty of open plazas/parks for a spacious skyline
        if (rng() < 0.66) continue;
        const sz = PL * (0.6 + rng() * 0.34);
        const cx = pi * P, cy = pj * P;
        let h = 26 + rng() * 78;
        if (rng() < 0.14) h += 70 + rng() * 80; // occasional spire
        const pal = fillerPalette[(Math.floor(rng() * fillerPalette.length))];
        this.buildings.push({
          kind: "filler",
          accent: pal[0], glow: pal[1],
          litSeed: Math.floor(rng() * 999),
          grid: { x: cx - sz / 2, y: cy - sz / 2, w: sz, d: sz, h },
        });
      }
    }

    // street grid + light-trails (traffic) -----------------------------
    const lo = -this.R * P - P / 2, hi = this.R * P + P / 2;
    this.avenues = [];
    for (let k = -this.R; k <= this.R; k++) {
      const c = (k + 0.5) * P; // centerline between plot k and k+1
      if (c > hi || c < lo) continue;
      this.avenues.push({ axis: "v", at: c, lo, hi }); // varies in gy
      this.avenues.push({ axis: "h", at: c, lo, hi }); // varies in gx
    }
    this.cars = [];
    const carsPerAve = window.innerWidth < 900 ? 2 : 3; // fewer streaks = lighter frames
    this.avenues.forEach((av) => {
      const n = carsPerAve;
      for (let i = 0; i < n; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        this.cars.push({
          av, p: rng(), dir,
          speed: 0.05 + rng() * 0.07,
          warm: dir > 0, // taillights vs headlights
          len: 0.018 + rng() * 0.014,
        });
      }
    });

    // starfield
    this.stars = Array.from({ length: 110 }, () => ({
      x: Math.random(), y: Math.random() * 0.55,
      r: Math.random() * 1.3 + 0.2, a: Math.random() * 0.5 + 0.1,
      tw: Math.random() * Math.PI * 2,
    }));

    this._computeBounds();
  }

  _computeBounds() {
    const T = this.TILE;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    this.buildings.forEach((b) => {
      const { x, y, w, d, h } = b.grid;
      const pts = [
        [x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0],
        [x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h],
      ];
      pts.forEach(([gx, gy, hh]) => {
        const wx = (gx - gy) * T;
        const wy = (gx + gy) * T * 0.5 - hh;
        if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
        if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
      });
    });
    this.worldCx = (minX + maxX) / 2;
    this.worldCy = (minY + maxY) / 2;
    this.worldW = maxX - minX;
    this.worldH = maxY - minY;
    this.worldMinY = minY; // top of the tallest structure (for moon placement)
  }

  /* moon hangs above the city center, just over the tallest spire */
  _moonPos() {
    const s = this.cam.scale;
    const x = this.cssW / 2 + (this.cam.x + this.moonOffset.x) * s;
    const topY = this.cssH / 2 + (this.worldMinY - this.worldCy + this.cam.y + this.moonOffset.y) * s;
    const r = this.moon.r * s;
    const drift = (this.reduceMotion || this.moonDrag) ? 0 : Math.sin(this.t * 0.25) * 6 * s;
    return { x: x + drift, y: topY - 70 * s - r, r };
  }

  /* ---- projection -------------------------------------------------- */
  project(gx, gy, h = 0) {
    const T = this.TILE;
    const wx = (gx - gy) * T;
    const wy = (gx + gy) * T * 0.5 - h;
    return {
      x: this.cssW / 2 + (wx - this.worldCx + this.cam.x) * this.cam.scale,
      y: this.cssH / 2 + (wy - this.worldCy + this.cam.y) * this.cam.scale,
    };
  }

  /* ---- events ------------------------------------------------------ */
  _bindEvents() {
    const c = this.canvas;
    window.addEventListener("resize", () => this._resize());

    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      this.pointer.x = e.clientX - r.left;
      this.pointer.y = e.clientY - r.top;
      // dragging the moon takes priority over panning the city
      if (this.moonDrag) {
        const dx = e.clientX - this.moonDrag.sx, dy = e.clientY - this.moonDrag.sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.moonDrag.moved = true;
        this.moonOffset.x = this.moonDrag.ox + dx / this.cam.scale;
        this.moonOffset.y = this.moonDrag.oy + dy / this.cam.scale;
        return;
      }
      if (this.pointer.down && this.dragStart) {
        const dx = e.clientX - this.dragStart.sx;
        const dy = e.clientY - this.dragStart.sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.pointer.dragging = true;
        this.cam.tx = this.dragStart.cx + dx / this.cam.scale;
        this.cam.ty = this.dragStart.cy + dy / this.cam.scale;
        this.cam.x = this.cam.tx; this.cam.y = this.cam.ty;
      }
    });
    c.addEventListener("pointerdown", (e) => {
      // update pointer + hit-test at the press point so TOUCH taps (which fire
      // no pointermove first) know what's under the finger.
      const r = c.getBoundingClientRect();
      this.pointer.x = e.clientX - r.left;
      this.pointer.y = e.clientY - r.top;
      this._hitTest();
      this.pointer.down = true; this.pointer.dragging = false;
      if (this.moonHover) {
        this.moonDrag = { sx: e.clientX, sy: e.clientY, ox: this.moonOffset.x, oy: this.moonOffset.y, moved: false };
      } else {
        this.dragStart = { sx: e.clientX, sy: e.clientY, cx: this.cam.tx, cy: this.cam.ty };
      }
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointerup", (e) => {
      this.pointer.down = false;
      if (this.moonDrag) {
        if (!this.moonDrag.moved) this.onSelect("spotify"); // a tap (not a drag) opens it
        this.moonDrag = null;
      } else if (!this.pointer.dragging && this.hoverId) {
        this.onSelect(this.hoverId);
      }
      this.dragStart = null;
      // touch has no lingering hover — clear it so the tooltip doesn't stick
      if (e.pointerType === "touch") {
        this.pointer.x = -9999; this.pointer.y = -9999;
        if (this.hoverId) { this.hoverId = null; this.onHover(null); }
      }
    });
    c.addEventListener("pointerleave", () => {
      this.pointer.x = -9999; this.pointer.y = -9999;
      this.pointer.down = false; this.dragStart = null; this.moonDrag = null;
    });
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.08 : 0.92;
      this.cam.targetScale = clamp(this.cam.targetScale * f, this.fitScale * 0.7, this.fitScale * 2.4);
    }, { passive: false });
  }

  _resize() {
    this.cssW = this.canvas.clientWidth;
    this.cssH = this.canvas.clientHeight;
    // cap device pixel ratio harder on phones — fewer pixels to push = smoother
    const cap = this.cssW < 900 ? 1.5 : 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.lowFx = this.cssW < 900; // phones: trim soft-glow shadow passes
    this.canvas.width = Math.floor(this.cssW * this.dpr);
    this.canvas.height = Math.floor(this.cssH * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const pad = this.cssW < 720 ? 0.96 : 0.84;
    this.fitScale = Math.min((this.cssW * pad) / this.worldW, (this.cssH * pad) / this.worldH);
    this.cam.targetScale = this.fitScale;
    if (this.intro < 0.05) this.cam.scale = this.fitScale * 0.82;
  }

  /* ---- public ------------------------------------------------------ */
  setActive(id) { this.activeId = id; }

  focus(id) {
    const d = this.districts.find((x) => x.id === id);
    if (!d || !d._b) return;
    const T = this.TILE, g = d._b.grid;
    const gx = g.x + g.w / 2, gy = g.y + g.d / 2;
    const wx = (gx - gy) * T, wy = (gx + gy) * T * 0.5 - g.h * 0.4;
    // shift target so the landmark sits a touch left of center (panel on right)
    this.cam.tx = this.worldCx - wx - (this.cssW * 0.16) / this.cam.targetScale;
    this.cam.ty = this.worldCy - wy;
    this.cam.targetScale = clamp(this.fitScale * 1.25, this.fitScale, this.fitScale * 2.4);
  }

  reset() {
    this.cam.tx = 0; this.cam.ty = 0;
    this.cam.targetScale = this.fitScale;
  }

  start() {
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      this._update(dt); this._render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---- update ------------------------------------------------------ */
  _update(dt) {
    this.t += dt;
    this.intro = Math.min(1, this.intro + dt / 1.8);
    const e = easeOutCubic(this.intro);

    this.cam.scale += (this.cam.targetScale - this.cam.scale) * 0.08;
    if (!this.pointer.down) {
      this.cam.x += (this.cam.tx - this.cam.x) * 0.08;
      this.cam.y += (this.cam.ty - this.cam.y) * 0.08;
    }
    this.floatY = this.reduceMotion ? 0 : Math.sin(this.t * 0.4) * 5 * e;

    if (!this.reduceMotion) {
      this.cars.forEach((car) => { car.p += car.speed * car.dir * dt; if (car.p > 1) car.p -= 1; if (car.p < 0) car.p += 1; });
    }
    if (!this.pointer.dragging && !this.moonDrag) this._hitTest();
    this.canvas.style.cursor = this.moonDrag ? "grabbing"
      : this.moonHover ? "grab"
      : this.hoverId ? "pointer"
      : (this.pointer.dragging ? "grabbing" : "grab");
  }

  _hitTest() {
    const px = this.pointer.x, py = this.pointer.y;
    let found = null;
    const m = this._moonPos();
    this.moonHover = Math.hypot(px - m.x, py - m.y) <= m.r * 1.15;
    if (this.moonHover) {
      found = "spotify";
    } else {
      const lands = this.buildings.filter((b) => b.kind === "land").sort((a, b) => depth(b) - depth(a));
      for (const b of lands) {
        const g = this._geo(b);
        if (pointInPoly(px, py, g.right) || pointInPoly(px, py, g.left) || pointInPoly(px, py, g.top)) { found = b.id; break; }
      }
    }
    if (found !== this.hoverId) { this.hoverId = found; this.onHover(found); }
  }

  /* ---- geometry for one building ----------------------------------- */
  _geo(b) {
    const { x, y, w, h } = b.grid; const dd = b.grid.d;
    const fy = this.floatY || 0;
    const P = (gx, gy, hh = 0) => { const p = this.project(gx, gy, hh); p.y += fy; return p; };
    const A = P(x, y), B = P(x + w, y), C = P(x + w, y + dd), D = P(x, y + dd);
    const At = P(x, y, h), Bt = P(x + w, y, h), Ct = P(x + w, y + dd, h), Dt = P(x, y + dd, h);
    return {
      base: [A, B, C, D], top: [At, Bt, Ct, Dt],
      right: [Bt, Ct, C, B], left: [Dt, Ct, C, D],
      centerBase: P(x + w / 2, y + dd / 2),
      apex: P(x + w / 2, y + dd / 2, h),
    };
  }

  /* ---- render ------------------------------------------------------ */
  _render() {
    const ctx = this.ctx;
    const e = easeOutCubic(this.intro);
    ctx.clearRect(0, 0, this.cssW, this.cssH);

    this._drawSky(ctx);
    this._drawMoon(ctx, e);
    this._drawGround(ctx, e);
    this._drawRoads(ctx, e);

    const ordered = [...this.buildings].sort((a, b) => depth(a) - depth(b));
    ordered.forEach((b) => this._drawBuilding(ctx, b, e));

    this._drawMoonlight(ctx, e);
  }

  _drawSky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, this.cssH);
    g.addColorStop(0, "rgba(8,10,24,0)");
    g.addColorStop(0.6, "rgba(20,16,48,0.16)");
    g.addColorStop(1, "rgba(8,10,24,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.cssW, this.cssH);
    const e = easeOutCubic(this.intro);
    this.stars.forEach((s) => {
      const tw = this.reduceMotion ? 1 : (0.6 + 0.4 * Math.sin(this.t * 1.5 + s.tw));
      ctx.globalAlpha = s.a * tw * e; ctx.fillStyle = "#cfe0ff";
      ctx.beginPath(); ctx.arc(s.x * this.cssW, s.y * this.cssH, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // the moon: glowing orb (Spotify "Sound District")
  _drawMoon(ctx, e) {
    const m = this._moonPos();
    const hov = this.moonHover;
    const pulse = this.reduceMotion ? 1 : (0.92 + 0.08 * Math.sin(this.t * 1.1));
    ctx.save();

    // outer halo
    const haloR = m.r * (hov ? 5.2 : 4.2) * pulse;
    const halo = ctx.createRadialGradient(m.x, m.y, m.r * 0.5, m.x, m.y, haloR);
    halo.addColorStop(0, hexA(this.moon.accent, (hov ? 0.4 : 0.28) * e));
    halo.addColorStop(0.4, hexA(this.moon.accent, 0.08 * e));
    halo.addColorStop(1, hexA(this.moon.accent, 0));
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(m.x, m.y, haloR, 0, Math.PI * 2); ctx.fill();

    // disc — soft top-lit gradient
    ctx.globalAlpha = e;
    ctx.shadowBlur = (hov ? 40 : 26) * this.cam.scale;
    ctx.shadowColor = hexA(this.moon.glow, 0.9);
    const disc = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.35, m.r * 0.2, m.x, m.y, m.r);
    disc.addColorStop(0, "#ffffff");
    disc.addColorStop(0.55, this.moon.glow);
    disc.addColorStop(1, this.moon.accent);
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // craters (subtle, clipped to disc)
    ctx.save();
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(70,120,95,0.18)";
    const craters = [[-0.25, -0.1, 0.22], [0.3, 0.18, 0.16], [0.05, 0.4, 0.13], [-0.4, 0.32, 0.1], [0.42, -0.3, 0.11]];
    craters.forEach(([dx, dy, rr]) => {
      ctx.beginPath(); ctx.arc(m.x + dx * m.r, m.y + dy * m.r, rr * m.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    // rim
    ctx.strokeStyle = hexA(this.moon.glow, hov ? 0.9 : 0.5);
    ctx.lineWidth = 1.2 * this.cam.scale;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();
  }

  // subtle additive moonlight wash over the whole scene
  _drawMoonlight(ctx, e) {
    const m = this._moonPos();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const R = Math.max(this.cssW, this.cssH) * 0.95;
    const g = ctx.createRadialGradient(m.x, m.y, m.r, m.x, m.y, R);
    g.addColorStop(0, hexA(this.moon.accent, (this.moonHover ? 0.07 : 0.045) * e));
    g.addColorStop(0.5, hexA(this.moon.accent, 0.015 * e));
    g.addColorStop(1, hexA(this.moon.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.restore();
  }

  _drawGround(ctx, e) {
    // accent ground pads under each landmark for identification
    this.districts.forEach((d) => {
      if (!d._b) return;
      const g = this._geo(d._b); const c = g.centerBase;
      const rad = (d._b.grid.w + d._b.grid.d) * this.TILE * 0.6 * this.cam.scale;
      const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rad);
      const lit = !this.activeId || this.activeId === d.id;
      grd.addColorStop(0, hexA(d.accent, (lit ? 0.32 : 0.12) * e));
      grd.addColorStop(0.5, hexA(d.accent, (lit ? 0.09 : 0.03) * e));
      grd.addColorStop(1, hexA(d.accent, 0));
      ctx.fillStyle = grd;
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, 0.5);
      ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }

  _drawRoads(ctx, e) {
    // road beds (glowing avenues) + light-trail traffic
    // roads: no shadowBlur — the wide translucent underlay + bright core fakes the glow
    ctx.save();
    ctx.lineCap = "round";
    const sc = this.cam.scale;
    this.avenues.forEach((av) => {
      let a, b;
      if (av.axis === "v") { a = this.project(av.at, av.lo); b = this.project(av.at, av.hi); }
      else { a = this.project(av.lo, av.at); b = this.project(av.hi, av.at); }
      ctx.strokeStyle = `rgba(80,130,210,${0.16 * e})`;
      ctx.lineWidth = 7 * sc; line(ctx, a, b);
      ctx.strokeStyle = `rgba(150,195,255,${0.34 * e})`;
      ctx.lineWidth = 1.3 * sc; line(ctx, a, b);
    });

    // traffic streaks: two cheap strokes (soft halo + bright core), no shadowBlur
    this.cars.forEach((car) => {
      const av = car.av;
      const lo = av.lo, hi = av.hi, at = av.at;
      const p0 = car.p, p1 = clamp(car.p + car.len * car.dir, 0, 1);
      const coord = (p) => lo + (hi - lo) * p;
      let s, t;
      if (av.axis === "v") { s = this.project(at, coord(p0)); t = this.project(at, coord(p1)); }
      else { s = this.project(coord(p0), at); t = this.project(coord(p1), at); }
      const col = car.warm ? "255,120,90" : "150,220,255";
      ctx.strokeStyle = `rgba(${col},${0.22 * e})`;
      ctx.lineWidth = 5.5 * sc; line(ctx, s, t);
      ctx.strokeStyle = `rgba(${col},${0.95 * e})`;
      ctx.lineWidth = 2.2 * sc; line(ctx, s, t);
    });
    ctx.restore();
  }

  _drawBuilding(ctx, b, e) {
    const isLand = b.kind === "land";
    const g = this._geo(b);
    const hovered = isLand && this.hoverId === b.id;
    const active = isLand && this.activeId === b.id;
    const dimmed = this.activeId && !active;

    // staggered rise-in
    const dd = (depth(b) + 12) / 30;
    const local = clamp((this.intro - dd * 0.18) / 0.5, 0, 1);
    const rise = isLand ? easeOutBack(local) : easeOutCubic(local);
    if (rise <= 0.001) return;

    const piv = g.centerBase;
    const lift = (1 - rise);
    const sq = (poly) => poly.map((p) => ({ x: p.x, y: p.y + (piv.y - p.y) * lift }));
    const top = sq(g.top), right = sq(g.right), left = sq(g.left);

    if (isLand) {
      this._drawLandmark(ctx, b, rise, hovered, active, dimmed, e);
    } else {
      // ---- quiet filler building (cheap, no heavy glow) ----
      const alpha = (dimmed ? 0.5 : 0.92) * e;
      ctx.globalAlpha = alpha;
      fillPoly(ctx, left, shade(b.accent, 0.5));
      fillPoly(ctx, right, shade(b.accent, 0.74));
      fillPoly(ctx, top, shade(b.accent, 1.0));
      this._stripWindows(ctx, right, b, alpha);
      this._stripWindows(ctx, left, b, alpha);
      ctx.strokeStyle = hexA(b.glow, 0.45 * (dimmed ? 0.5 : 1));
      ctx.lineWidth = 1 * this.cam.scale;
      strokePoly(ctx, top);
      edge(ctx, top[2], right[2]);
      ctx.globalAlpha = 1;
    }
  }

  /* ---- landmark: dispatch to a unique structure per district ------- */
  _drawLandmark(ctx, b, rise, hovered, active, dimmed, e) {
    const g = b.grid;
    const cx = g.x + g.w / 2, cy = g.y + g.d / 2;
    const H = g.h * rise;
    const hw = g.w / 2, hd = g.d / 2;
    const fy = this.floatY || 0;
    const sc = this.cam.scale;
    const PT = (gx, gy, h) => { const p = this.project(gx, gy, h); p.y += fy; return p; };
    const glowAmt = (hovered ? 1 : active ? 0.85 : 0.42) * (dimmed ? 0.45 : 1);
    const alpha = (dimmed ? 0.55 : 1) * e;
    const st = {
      accent: b.accent, glow: b.glow, glowAmt, alpha, bright: hovered || active, b, PT, sc,
      faceGlow: this.lowFx ? 0 : (hovered ? 18 : 9) * sc, edgeGlow: (hovered ? 20 : 9) * sc, lw: (hovered ? 2 : 1.4) * sc,
    };

    let apex;
    switch (b.district.shape) {
      case "tiered": {        // stepped lakehouse skyscraper
        this._prism(ctx, cx, cy, hw, hd, hw, hd, 0, H * 0.5, st, [5, 5]);
        this._prism(ctx, cx, cy, hw * 0.76, hd * 0.76, hw * 0.76, hd * 0.76, H * 0.5, H * 0.82, st, [4, 4]);
        const r3 = this._prism(ctx, cx, cy, hw * 0.5, hd * 0.5, hw * 0.5, hd * 0.5, H * 0.82, H, st, [3, 3]);
        apex = r3.apexCenter;
        break;
      }
      case "crystal": {       // tapered crystalline spire
        this._prism(ctx, cx, cy, hw, hd, hw * 0.5, hd * 0.5, 0, H * 0.72, st, [4, 7]);
        this._pyramidCap(ctx, cx, cy, hw * 0.5, hd * 0.5, H * 0.72, H, st);
        apex = PT(cx, cy, H);
        break;
      }
      case "dome": {          // research lab with glowing dome
        this._prism(ctx, cx, cy, hw, hd, hw, hd, 0, H * 0.58, st, [5, 5]);
        this._dome(ctx, cx, cy, hw * 0.99, hd * 0.99, H * 0.58, H * 0.42, st);
        apex = PT(cx, cy, H);
        break;
      }
      case "arena": {         // low circular stadium (stacked drums)
        this._cylinder(ctx, cx, cy, hw, hd, 0, H * 0.66, st, true);
        this._cylinder(ctx, cx, cy, hw * 0.64, hd * 0.64, H * 0.66, H, st, false);
        apex = PT(cx, cy, H);
        break;
      }
      case "twin": {          // transit hub: twin towers + sky bridge
        this._prism(ctx, cx, cy - hd * 0.5, hw * 0.4, hd * 0.4, hw * 0.4, hd * 0.4, 0, H, st, [2, 7]);
        this._prism(ctx, cx, cy, hw * 0.16, hd * 0.92, hw * 0.16, hd * 0.92, H * 0.46, H * 0.6, st, null);
        this._prism(ctx, cx, cy + hd * 0.5, hw * 0.4, hd * 0.4, hw * 0.4, hd * 0.4, 0, H * 0.84, st, [2, 6]);
        apex = PT(cx, cy - hd * 0.5, H);
        break;
      }
      case "reactor": {       // cylindrical reactor core + energy ring
        this._cylinder(ctx, cx, cy, hw * 0.66, hd * 0.66, 0, H, st, true);
        this._ring(ctx, cx, cy, hw * 0.98, hd * 0.98, H * 0.44, st);
        this._ring(ctx, cx, cy, hw * 0.82, hd * 0.82, H * 0.72, st);
        apex = PT(cx, cy, H);
        break;
      }
      case "hq": {            // Mission Control: command spire + rings + radar
        this._prism(ctx, cx, cy, hw, hd, hw * 0.9, hd * 0.9, 0, H * 0.1, st, [4, 2]);            // plinth
        this._prism(ctx, cx, cy, hw * 0.5, hd * 0.5, hw * 0.34, hd * 0.34, H * 0.1, H * 0.6, st, [3, 11]); // tapered shaft
        this._prism(ctx, cx, cy, hw * 0.58, hd * 0.58, hw * 0.5, hd * 0.5, H * 0.6, H * 0.72, st, [4, 2]);  // observation deck
        this._prism(ctx, cx, cy, hw * 0.3, hd * 0.3, hw * 0.16, hd * 0.16, H * 0.72, H * 0.88, st, [2, 3]); // crown
        this._ring(ctx, cx, cy, hw * 1.06, hd * 1.06, H * 0.5, st);   // holographic orbit rings
        this._ring(ctx, cx, cy, hw * 0.86, hd * 0.86, H * 0.69, st);
        this._radar(ctx, cx, cy, hw * 0.98, hd * 0.98, H * 0.66, st); // rotating sweep
        const mastTop = PT(cx, cy, H * 1.06);
        ctx.save();
        ctx.globalAlpha = alpha; ctx.shadowBlur = st.edgeGlow; ctx.shadowColor = st.glow;
        ctx.strokeStyle = hexA(st.glow, 0.92); ctx.lineWidth = st.lw;
        edge(ctx, PT(cx, cy, H * 0.88), mastTop);
        ctx.restore();
        apex = mastTop;
        break;
      }
      case "construction": {  // under-construction tower: base + scaffold + crane
        this._hazardBase(ctx, cx, cy, hw, hd, st);
        const baseH = H * 0.3;
        this._prism(ctx, cx, cy, hw, hd, hw, hd, 0, baseH, st, [4, 3]); // completed floors
        this._scaffold(ctx, cx, cy, hw, hd, baseH, H, st, 7);            // open frame above
        this._crane(ctx, cx, cy, hw, hd, H, st);
        apex = PT(cx, cy, H);
        break;
      }
      default: {
        const r = this._prism(ctx, cx, cy, hw, hd, hw, hd, 0, H, st, [5, 8]);
        apex = r.apexCenter;
      }
    }

    // beacon + light beam
    const pulse = this.reduceMotion ? 0.7 : 0.6 + 0.4 * Math.sin(this.t * 2 + g.x);
    ctx.save();
    ctx.globalAlpha = alpha * (hovered ? 1 : 0.85);
    ctx.shadowBlur = 18 * sc; ctx.shadowColor = b.glow; ctx.fillStyle = "#fff";
    const beaconR = (b.district.shape === "reactor" ? 4.6 : (hovered ? 4 : 2.6)) * pulse * sc;
    ctx.beginPath(); ctx.arc(apex.x, apex.y, beaconR, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = alpha * 0.5 * pulse; ctx.strokeStyle = hexA(b.glow, 0.6); ctx.lineWidth = 1.5 * sc;
    edge(ctx, apex, { x: apex.x, y: apex.y - 42 * sc * (hovered ? 1.4 : 1) });
    ctx.restore();

    if (rise > 0.85) this._label(ctx, b.district, apex, hovered || active, alpha);
    ctx.globalAlpha = 1;
  }

  // a box / frustum segment between two heights (top can be inset for taper)
  _prism(ctx, cx, cy, hwB, hdB, hwT, hdT, h0, h1, st, win) {
    const PT = st.PT;
    const A = PT(cx - hwB, cy - hdB, h0), B = PT(cx + hwB, cy - hdB, h0), C = PT(cx + hwB, cy + hdB, h0), D = PT(cx - hwB, cy + hdB, h0);
    const At = PT(cx - hwT, cy - hdT, h1), Bt = PT(cx + hwT, cy - hdT, h1), Ct = PT(cx + hwT, cy + hdT, h1), Dt = PT(cx - hwT, cy + hdT, h1);
    const right = [Bt, Ct, C, B], left = [Dt, Ct, C, D], top = [At, Bt, Ct, Dt];
    ctx.globalAlpha = st.alpha;
    ctx.shadowBlur = st.faceGlow; ctx.shadowColor = hexA(st.glow, 0.85);
    fillPoly(ctx, left, shade(st.accent, 0.16 + st.glowAmt * 0.05));
    fillPoly(ctx, right, shade(st.accent, 0.26 + st.glowAmt * 0.07));
    ctx.shadowBlur = 0;
    fillPoly(ctx, top, shade(st.accent, 0.40 + st.glowAmt * 0.10));
    if (win) { this._windows(ctx, right, st.b, win[0], win[1], st.bright); this._windows(ctx, left, st.b, win[0], win[1], st.bright); }
    ctx.shadowBlur = st.edgeGlow; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, st.bright ? 1 : 0.82); ctx.lineWidth = st.lw;
    strokePoly(ctx, top);
    edge(ctx, top[1], right[3]); edge(ctx, top[2], right[2]); edge(ctx, top[3], left[3]);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    return { top, apexCenter: PT(cx, cy, h1) };
  }

  // pyramidal cap (for the crystal spire)
  _pyramidCap(ctx, cx, cy, hw, hd, h0, h1, st) {
    const PT = st.PT;
    const B = PT(cx + hw, cy - hd, h0), C = PT(cx + hw, cy + hd, h0), D = PT(cx - hw, cy + hd, h0);
    const apx = PT(cx, cy, h1);
    ctx.globalAlpha = st.alpha;
    ctx.shadowBlur = st.faceGlow; ctx.shadowColor = hexA(st.glow, 0.85);
    fillPoly(ctx, [D, C, apx], shade(st.accent, 0.22 + st.glowAmt * 0.05));
    fillPoly(ctx, [B, C, apx], shade(st.accent, 0.34 + st.glowAmt * 0.07));
    ctx.shadowBlur = st.edgeGlow; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, st.bright ? 1 : 0.85); ctx.lineWidth = st.lw;
    edge(ctx, C, apx); edge(ctx, B, apx); edge(ctx, D, apx);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // vertical cylinder drum (arena / reactor) drawn as sorted segment quads
  _cylinder(ctx, cx, cy, rx, ry, h0, h1, st, ticks) {
    const N = 28, PT = st.PT;
    const ang = [];
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; ang.push({ cos: Math.cos(a), sin: Math.sin(a) }); }
    const segs = [];
    for (let i = 0; i < N; i++) {
      const mc = (ang[i].cos + ang[i + 1].cos) / 2, ms = (ang[i].sin + ang[i + 1].sin) / 2;
      segs.push({ i, facing: mc + ms, dep: (cx + rx * mc) + (cy + ry * ms) });
    }
    segs.sort((p, q) => p.dep - q.dep);
    ctx.globalAlpha = st.alpha;
    segs.forEach((s) => {
      const a0 = ang[s.i], a1 = ang[s.i + 1];
      const b0 = PT(cx + rx * a0.cos, cy + ry * a0.sin, h0);
      const b1 = PT(cx + rx * a1.cos, cy + ry * a1.sin, h0);
      const t1 = PT(cx + rx * a1.cos, cy + ry * a1.sin, h1);
      const t0 = PT(cx + rx * a0.cos, cy + ry * a0.sin, h1);
      const f = 0.5 + 0.5 * (s.facing / 1.42);
      fillPoly(ctx, [t0, t1, b1, b0], shade(st.accent, 0.16 + 0.28 * f));
      if (ticks && s.facing > 0.25 && s.i % 2 === 0) {
        const w0 = PT(cx + rx * a0.cos, cy + ry * a0.sin, h0 + (h1 - h0) * 0.14);
        const w1 = PT(cx + rx * a0.cos, cy + ry * a0.sin, h1 - (h1 - h0) * 0.14);
        ctx.strokeStyle = hexA(st.glow, 0.65); ctx.lineWidth = 1.3 * st.sc; edge(ctx, w0, w1);
      }
    });
    // top disk + rim
    const topPoly = ang.slice(0, N).map((a) => PT(cx + rx * a.cos, cy + ry * a.sin, h1));
    ctx.shadowBlur = st.faceGlow; ctx.shadowColor = hexA(st.glow, 0.8);
    fillPoly(ctx, topPoly, shade(st.accent, 0.46 + st.glowAmt * 0.1));
    ctx.shadowBlur = st.edgeGlow; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, st.bright ? 1 : 0.82); ctx.lineWidth = st.lw;
    strokePoly(ctx, topPoly);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // glowing energy ring (reactor torus band)
  _ring(ctx, cx, cy, rx, ry, h, st) {
    const N = 40, PT = st.PT, poly = [];
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; poly.push(PT(cx + rx * Math.cos(a), cy + ry * Math.sin(a), h)); }
    ctx.save();
    ctx.globalAlpha = st.alpha;
    ctx.shadowBlur = 16 * st.sc; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, st.bright ? 1 : 0.85); ctx.lineWidth = 3 * st.sc;
    strokePoly(ctx, poly);
    ctx.restore();
  }

  // glowing dome (stacked emissive rings, painted base -> top)
  _dome(ctx, cx, cy, rx, ry, h0, height, st) {
    const M = 10, N = 22, PT = st.PT;
    ctx.globalAlpha = st.alpha;
    for (let k = 0; k <= M; k++) {
      const f = k / M;
      const rh = h0 + height * Math.sin(f * Math.PI / 2);
      const rr = Math.cos(f * Math.PI / 2);
      const poly = [];
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; poly.push(PT(cx + rx * rr * Math.cos(a), cy + ry * rr * Math.sin(a), rh)); }
      if (k < M) fillPoly(ctx, poly, shade(st.accent, 0.32 + 0.5 * f + st.glowAmt * 0.08));
      if (k === 0) {
        ctx.shadowBlur = st.edgeGlow; ctx.shadowColor = st.glow;
        ctx.strokeStyle = hexA(st.glow, st.bright ? 1 : 0.82); ctx.lineWidth = st.lw; strokePoly(ctx, poly); ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
  }

  // dashed hazard footprint outline on the ground
  _hazardBase(ctx, cx, cy, hw, hd, st) {
    const PT = st.PT;
    const ring = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => PT(cx + s * hw, cy + t * hd, 0));
    ctx.save();
    ctx.globalAlpha = st.alpha * 0.75;
    ctx.setLineDash([6 * st.sc, 4 * st.sc]);
    ctx.shadowBlur = 8 * st.sc; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, 0.8); ctx.lineWidth = st.lw;
    strokePoly(ctx, ring);
    ctx.restore();
  }

  // open wireframe frame: corner struts + floor rings (the part still being built)
  _scaffold(ctx, cx, cy, hw, hd, h0, h1, st, floors) {
    const PT = st.PT;
    const corner = (s, t, h) => PT(cx + s * hw, cy + t * hd, h);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    ctx.save();
    ctx.shadowBlur = st.edgeGlow * 0.55; ctx.shadowColor = st.glow;
    // vertical corner struts
    ctx.globalAlpha = st.alpha * 0.85;
    ctx.strokeStyle = hexA(st.glow, st.bright ? 0.95 : 0.62); ctx.lineWidth = st.lw;
    corners.forEach(([s, t]) => edge(ctx, corner(s, t, h0), corner(s, t, h1)));
    // horizontal floor rings, fading toward the top (less built)
    for (let i = 0; i <= floors; i++) {
      const h = h0 + (h1 - h0) * (i / floors);
      const ring = corners.map(([s, t]) => corner(s, t, h));
      ctx.globalAlpha = st.alpha * (0.5 - 0.3 * (i / floors)) * (st.bright ? 1.3 : 1);
      strokePoly(ctx, ring);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // a tower crane on top of the structure
  _crane(ctx, cx, cy, hw, hd, H, st) {
    const PT = st.PT;
    const mast = H + 56;
    const sway = this.reduceMotion ? 0 : Math.sin(this.t * 0.6) * 0.15;
    const base = PT(cx, cy, H), top = PT(cx, cy, mast);
    const jib = PT(cx + hw * (1.7 + sway), cy + hw * sway, mast);       // long arm
    const tail = PT(cx - hw * 0.75, cy, mast);                          // counter-jib
    ctx.save();
    ctx.globalAlpha = st.alpha;
    ctx.shadowBlur = st.edgeGlow * 0.5; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, 0.88); ctx.lineWidth = st.lw * 1.05;
    edge(ctx, base, top);            // mast
    edge(ctx, tail, jib);           // jib arm
    edge(ctx, top, jib);            // tension cable
    edge(ctx, top, tail);          // counter cable
    // hook cable + block
    const hookBot = PT(cx + hw * (1.7 + sway), cy + hw * sway, H * 0.55);
    ctx.setLineDash([3 * st.sc, 3 * st.sc]); ctx.lineWidth = st.lw * 0.7;
    edge(ctx, jib, hookBot);
    ctx.setLineDash([]);
    ctx.fillStyle = hexA(st.glow, 0.95);
    ctx.beginPath(); ctx.arc(hookBot.x, hookBot.y, 2.6 * st.sc, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // rotating radar sweep at the HQ deck
  _radar(ctx, cx, cy, rx, ry, h, st) {
    const PT = st.PT;
    const ang = this.reduceMotion ? 0.7 : (this.t * 0.85) % (Math.PI * 2);
    const c0 = PT(cx, cy, h);
    ctx.save();
    ctx.globalAlpha = st.alpha;
    for (let i = 4; i >= 1; i--) {          // fading trail
      const a = ang - i * 0.13;
      const p = PT(cx + rx * Math.cos(a), cy + ry * Math.sin(a), h);
      ctx.strokeStyle = hexA(st.glow, 0.42 * (1 - i / 5)); ctx.lineWidth = st.lw;
      edge(ctx, c0, p);
    }
    const pl = PT(cx + rx * Math.cos(ang), cy + ry * Math.sin(ang), h);
    ctx.shadowBlur = this.lowFx ? 0 : 10 * st.sc; ctx.shadowColor = st.glow;
    ctx.strokeStyle = hexA(st.glow, 0.95); ctx.lineWidth = st.lw * 1.15; edge(ctx, c0, pl);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(pl.x, pl.y, 2.4 * st.sc, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // detailed emissive windows (landmarks)
  _windows(ctx, quad, b, cols, rows, bright) {
    const [tA, tB, bB, bA] = quad;
    const lerp = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols, v = (r + 0.5) / rows;
        const ctr = lerp(lerp(tA, tB, u), lerp(bA, bB, u), v);
        const lit = ((c * 7 + r * 3 + b.id.length) % 5) !== 0;
        ctx.globalAlpha = (lit ? (bright ? 0.95 : 0.62) : 0.12);
        ctx.fillStyle = lit ? b.glow : "#0a0e1c";
        const w = Math.max(1.3, Math.abs((tB.x - tA.x) / cols) * 0.5);
        const h = Math.max(1.3, Math.abs((bA.y - tA.y) / rows) * 0.45);
        ctx.beginPath(); ctx.ellipse(ctr.x, ctr.y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // stylized lit window rows for filler buildings (cheap)
  _stripWindows(ctx, quad, b, alpha) {
    const [tA, tB, bB, bA] = quad;
    const lerp = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    const rows = 6, cols = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = ((c * 3 + r * 5 + b.litSeed) % 7) < 4;
        if (!lit) continue;
        const u = (c + 0.5) / cols, v = (r + 0.5) / rows;
        const ctr = lerp(lerp(tA, tB, u), lerp(bA, bB, u), v);
        const w = Math.max(1, Math.abs((tB.x - tA.x) / cols) * 0.46);
        const h = Math.max(1, Math.abs((bA.y - tA.y) / rows) * 0.42);
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = b.glow;
        ctx.fillRect(ctr.x - w / 2, ctr.y - h / 2, w, h);
      }
    }
    ctx.globalAlpha = 1;
  }

  _label(ctx, d, apex, strong, alpha) {
    const x = apex.x, y = apex.y - 50 * this.cam.scale;
    ctx.save();
    ctx.globalAlpha = (strong ? 1 : 0) * alpha;
    if (ctx.globalAlpha < 0.02) { ctx.restore(); return; }
    ctx.textAlign = "center";
    ctx.font = `600 13px Inter, system-ui, sans-serif`;
    const w = ctx.measureText(d.name).width + 26;
    roundRect(ctx, x - w / 2, y - 16, w, 26, 13);
    ctx.fillStyle = "rgba(10,12,26,0.82)"; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = hexA(d.glow, 0.7); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillText(d.name, x, y + 2);
    ctx.restore();
  }
}

/* ---- helpers -------------------------------------------------------- */
function depth(b) { return b.grid.x + b.grid.y + (b.grid.w + b.grid.d) / 2; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function line(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
function edge(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
function fillPoly(ctx, pts, color) {
  ctx.fillStyle = color; ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath(); ctx.fill();
}
function strokePoly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath(); ctx.stroke();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function hexA(hex, a) { const c = hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
function shade(hex, amt) {
  const c = hexToRgb(hex); const base = { r: 8, g: 10, b: 24 };
  const r = Math.round(base.r + (c.r - base.r) * amt);
  const g = Math.round(base.g + (c.g - base.g) * amt);
  const b = Math.round(base.b + (c.b - base.b) * amt);
  return `rgb(${r},${g},${b})`;
}
