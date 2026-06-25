import { CONFIG } from "./config.js";

const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeHash(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededUnit(seed) {
  const x = Math.sin(seed * 999.91) * 10000;
  return x - Math.floor(x);
}

export class VisualSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.time = 0;
    this.current = null;
    this.target = null;
    this.params = {
      spiral: 0.25,
      network: 0.2,
      architecture: 0.2,
      archive: 0,
      stability: 0.2,
      intensity: 0.4,
    };
    this.colors = ["#ffb43b", "#46ead2", "#f6f1e8"];
    this.particles = Array.from({ length: CONFIG.particleCount }, (_, i) => ({
      seed: i + 1,
      x: seededUnit(i + 4),
      y: seededUnit(i + 18),
      px: 0,
      py: 0,
      size: 1 + seededUnit(i + 54) * 2.2,
      lane: i % 3,
      drift: seededUnit(i + 88) * TAU,
    }));
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setMoment(moment) {
    this.current = moment;
    this.target = {
      ...moment.behavior,
      intensity: moment.intensity,
    };
    this.colors = moment.colors;
    this.momentHash = makeHash(moment.id);
  }

  update() {
    this.time += 1 / 60;
    if (!this.target) return;
    for (const key of Object.keys(this.params)) {
      this.params[key] = lerp(this.params[key], this.target[key], CONFIG.transitionSpeed);
    }
  }

  render() {
    this.update();
    const ctx = this.ctx;
    const hasBackgroundAsset = this.current?.asset?.placement === "background";
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx, hasBackgroundAsset);
    this.drawSpatialMotifs(ctx);
    this.drawArchive(ctx);
    this.drawArchitecture(ctx);
    this.updateParticles();
    this.drawConnections(ctx);
    this.drawSpiral(ctx);
    this.drawParticles(ctx);
    this.drawStateGesture(ctx);
  }

  drawBackground(ctx, hasBackgroundAsset = false) {
    if (hasBackgroundAsset) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const haze = ctx.createRadialGradient(
        this.width * 0.64,
        this.height * 0.48,
        0,
        this.width * 0.64,
        this.height * 0.48,
        this.width * 0.48,
      );
      haze.addColorStop(0, rgba(this.colors[1], 0.14 + this.params.intensity * 0.08));
      haze.addColorStop(0.54, rgba(this.colors[0], 0.04));
      haze.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, "#050607");
    gradient.addColorStop(0.44, rgba(this.colors[0], 0.12 + this.params.intensity * 0.08));
    gradient.addColorStop(1, "#111315");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const glow = ctx.createRadialGradient(
      this.width * 0.72,
      this.height * 0.44,
      0,
      this.width * 0.72,
      this.height * 0.44,
      this.width * 0.56,
    );
    glow.addColorStop(0, rgba(this.colors[1], 0.16 * this.params.intensity));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawSpatialMotifs(ctx) {
    const state = this.current?.state;
    if (state === "latent") {
      this.drawLatentPotential(ctx);
      return;
    }

    if (state === "architecture" || state === "opening") {
      return;
    }

    if (state === "triad" || state === "impact") {
      this.drawTriadFields(ctx, state === "impact");
      return;
    }

    if (state === "community" || state === "trust") {
      this.drawOrbitalNet(ctx);
      return;
    }

    if (state === "routes") {
      this.drawForumVolume(ctx, 0.55);
      return;
    }

    if (state === "duality") {
      this.drawDualGenerationField(ctx, false);
      return;
    }

    if (state === "convergence") {
      this.drawDualGenerationField(ctx, true);
      this.drawOrbitalNet(ctx, 0.78);
      return;
    }

    if (state === "present") {
      this.drawEnergyTraces(ctx, 0.86);
      return;
    }

    if (state === "qr") {
      this.drawOrbitalNet(ctx, 0.42);
      return;
    }

    this.drawForumVolume(ctx);
    this.drawOrbitalNet(ctx);
    this.drawEnergyTraces(ctx);
  }

  drawLatentPotential(ctx) {
    const cx = this.width * 0.66;
    const cy = this.height * 0.47;
    const base = Math.min(this.width, this.height);
    const amount = 0.08 + this.params.intensity * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i += 1) {
      const phase = (this.time * 0.045 + i / 3) % 1;
      const r = base * (0.24 + phase * 0.28);
      ctx.strokeStyle = rgba(this.colors[i], (1 - phase) * amount);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.5, -0.08, 0.2 * TAU, 0.86 * TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTriadFields(ctx, converging = false) {
    const anchors = [
      [this.width * 0.58, this.height * 0.3],
      [this.width * 0.78, this.height * 0.62],
      [this.width * 0.43, this.height * 0.66],
    ];
    const colors = [CONFIG.palette.eventCyan, CONFIG.palette.eventRed, CONFIG.palette.eventMagenta];
    const center = [this.width * 0.64, this.height * 0.5];
    const amount = converging ? 0.18 : 0.12;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < anchors.length; i += 1) {
      const anchor = anchors[i];
      const pulse = 0.5 + Math.sin(this.time * 0.9 + i) * 0.5;
      const x = converging ? lerp(anchor[0], center[0], 0.34 + pulse * 0.08) : anchor[0];
      const y = converging ? lerp(anchor[1], center[1], 0.34 + pulse * 0.08) : anchor[1];
      const r = Math.min(this.width, this.height) * (converging ? 0.095 : 0.075);

      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, rgba(colors[i], amount));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);

      if (converging) {
        ctx.strokeStyle = rgba(colors[i], 0.12);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(center[0], center[1] - 18, center[0], center[1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawDualGenerationField(ctx, converged = false) {
    const base = Math.min(this.width, this.height);
    const left = [this.width * 0.54, this.height * 0.48];
    const right = [this.width * 0.76, this.height * 0.5];
    const merge = converged ? 0.52 : 0;
    const centers = [
      [lerp(left[0], this.width * 0.65, merge), lerp(left[1], this.height * 0.48, merge)],
      [lerp(right[0], this.width * 0.65, merge), lerp(right[1], this.height * 0.48, merge)],
    ];
    const colors = [CONFIG.palette.eventSilver, CONFIG.palette.eventCyan];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let c = 0; c < centers.length; c += 1) {
      const [cx, cy] = centers[c];
      ctx.strokeStyle = rgba(colors[c], converged ? 0.14 : 0.11);
      ctx.lineWidth = converged ? 1.4 : 1;
      for (let i = 0; i < 4; i += 1) {
        const r = base * (0.1 + i * 0.045);
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.48, c === 0 ? -0.16 : 0.18, 0, TAU);
        ctx.stroke();
      }
    }

    if (converged) {
      ctx.strokeStyle = rgba(CONFIG.palette.eventMagenta, 0.13);
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i += 1) {
        const y = this.height * (0.34 + i * 0.045);
        ctx.beginPath();
        ctx.moveTo(centers[0][0] - base * 0.14, y);
        ctx.bezierCurveTo(this.width * 0.6, y - 24, this.width * 0.7, y + 24, centers[1][0] + base * 0.14, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawForumVolume(ctx, scale = 1) {
    const amount = (0.035 + this.params.architecture * 0.12 + this.params.stability * 0.035) * scale;
    const cx = this.width * 0.64;
    const cy = this.height * 0.48;
    const base = Math.min(this.width, this.height);

    ctx.save();
    ctx.strokeStyle = rgba(CONFIG.palette.eventSilver, amount);
    ctx.lineWidth = 1;

    for (let i = 0; i < 7; i += 1) {
      const depth = i / 6;
      const w = base * (0.18 + depth * 0.62);
      const h = base * (0.08 + depth * 0.28);
      const y = cy + base * (0.22 - depth * 0.18);
      ctx.beginPath();
      ctx.ellipse(cx, y, w, h, -0.16, Math.PI * 1.05, Math.PI * 1.92);
      ctx.stroke();
    }

    for (let i = -4; i <= 4; i += 1) {
      const angle = -0.72 + i * 0.18;
      const nearX = cx + Math.cos(angle) * base * 0.58;
      const nearY = cy + Math.sin(angle) * base * 0.2 + base * 0.16;
      const farX = cx + Math.cos(angle * 0.7) * base * 0.18;
      const farY = cy + Math.sin(angle * 0.7) * base * 0.06 - base * 0.06;
      ctx.beginPath();
      ctx.moveTo(nearX, nearY);
      ctx.quadraticCurveTo(cx + i * base * 0.025, cy + base * 0.03, farX, farY);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawOrbitalNet(ctx, scale = 1) {
    const amount = (0.05 + this.params.network * 0.14 + this.params.spiral * 0.08) * scale;
    const cx = this.width * 0.66;
    const cy = this.height * 0.47;
    const base = Math.min(this.width, this.height);
    const strands = 9;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1;

    for (let i = 0; i < strands; i += 1) {
      const phase = i / strands;
      ctx.beginPath();
      for (let j = 0; j <= 80; j += 1) {
        const t = j / 80;
        const angle = t * TAU * 0.92 + phase * TAU + this.time * 0.04;
        const r = base * (0.1 + t * 0.4 + Math.sin(t * TAU + phase * TAU) * 0.035);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.46;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(i % 3 === 0 ? this.colors[1] : CONFIG.palette.eventSilver, amount * (0.55 + phase * 0.35));
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEnergyTraces(ctx, scale = 1) {
    const amount = (0.12 + this.params.intensity * 0.18) * scale;
    const cx = this.width * 0.66;
    const cy = this.height * 0.47;
    const base = Math.min(this.width, this.height);
    const colors = [CONFIG.palette.eventCyan, CONFIG.palette.eventRed, CONFIG.palette.eventMagenta];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < 16; i += 1) {
      const lane = i % 3;
      const phase = i / 18;
      const angle = phase * TAU * 2.15 + this.time * (0.22 + lane * 0.06);
      const r = base * (0.14 + lane * 0.055 + seededUnit(i + this.momentHash) * 0.22);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.5;
      const tail = base * (0.018 + seededUnit(i + 31) * 0.02);
      const tx = x - Math.sin(angle) * tail;
      const ty = y + Math.cos(angle) * tail * 0.5;
      ctx.strokeStyle = rgba(colors[lane], amount);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = rgba(colors[lane], amount * 1.25);
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + seededUnit(i + 47) * 1.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  updateParticles() {
    const cx = this.width * 0.64;
    const cy = this.height * 0.46;
    const radiusBase = Math.min(this.width, this.height) * 0.16;
    const routePull = this.params.network;
    const spiralPull = this.params.spiral;
    const stability = this.params.stability;
    const state = this.current?.state || "latent";

    for (const p of this.particles) {
      const seed = p.seed + this.momentHash * 0.01;
      const depth = 0.5 + seededUnit(seed + 9) * 0.86;
      const angle =
        seededUnit(seed) * TAU +
        this.time * (0.06 + spiralPull * 0.36) * (p.lane % 2 === 0 ? 1 : -1);
      const wave = Math.sin(this.time * (0.4 + routePull) + p.drift) * 0.5 + 0.5;
      let rx = radiusBase * (1.2 + p.lane * 0.42 + spiralPull * 1.95 + wave * 0.28);
      let ry = radiusBase * (0.56 + p.lane * 0.18 + spiralPull * 1.12);

      if (state === "latent") {
        const orbit = seededUnit(seed + 2) * TAU + this.time * (0.008 + p.lane * 0.003);
        const outer = radiusBase * (2.05 + seededUnit(seed + 21) * 1.7);
        const invitation = Math.sin(this.time * 0.55 + p.drift) * radiusBase * 0.06;
        const tx = cx + Math.cos(orbit) * (outer + invitation);
        const ty = cy + Math.sin(orbit) * (outer * 0.52 + invitation * 0.5);
        p.px = lerp(p.px || tx, tx, 0.018 + stability * 0.006);
        p.py = lerp(p.py || ty, ty, 0.018 + stability * 0.006);
        continue;
      }

      if (state === "architecture") {
        const column = (p.seed % 11) / 10;
        const row = Math.floor(p.seed % 31) / 30;
        p.px = lerp(p.px || this.width * p.x, this.width * (0.52 + column * 0.32), 0.045);
        p.py = lerp(p.py || this.height * p.y, this.height * (0.22 + row * 0.48), 0.045);
        continue;
      }

      if (state === "opening") {
        const outbound = p.seed % 2 === 0;
        const edgeAngle = seededUnit(seed + 5) * TAU;
        const edgeX = cx + Math.cos(edgeAngle) * this.width * 0.55;
        const edgeY = cy + Math.sin(edgeAngle) * this.height * 0.42;
        const centerX = cx + Math.cos(angle) * radiusBase * (0.5 + seededUnit(seed + 12));
        const centerY = cy + Math.sin(angle) * radiusBase * (0.32 + seededUnit(seed + 13) * 0.5);
        const travel = (Math.sin(this.time * 0.42 + p.drift) + 1) / 2;
        const t = outbound ? travel : 1 - travel;
        const tx = lerp(centerX, edgeX, t);
        const ty = lerp(centerY, edgeY, t);
        p.px = lerp(p.px || tx, tx, 0.026);
        p.py = lerp(p.py || ty, ty, 0.026);
        continue;
      }

      if (state === "triad") {
        const anchors = [
          [this.width * 0.58, this.height * 0.28],
          [this.width * 0.78, this.height * 0.62],
          [this.width * 0.43, this.height * 0.66],
        ];
        const anchor = anchors[p.lane];
        rx *= 0.42;
        ry *= 0.36;
        p.px = lerp(p.px || anchor[0], anchor[0] + Math.cos(angle) * rx, 0.042);
        p.py = lerp(p.py || anchor[1], anchor[1] + Math.sin(angle) * ry, 0.042);
        continue;
      }

      if (state === "impact") {
        const anchors = [
          [this.width * 0.58, this.height * 0.28],
          [this.width * 0.78, this.height * 0.62],
          [this.width * 0.43, this.height * 0.66],
        ];
        const anchor = anchors[p.lane];
        const impactPull = 0.4 + (Math.sin(this.time * 0.56 + p.drift) + 1) * 0.12;
        const localCx = lerp(anchor[0], cx, impactPull);
        const localCy = lerp(anchor[1], cy, impactPull);
        rx *= 0.34;
        ry *= 0.3;
        p.px = lerp(p.px || localCx, localCx + Math.cos(angle) * rx, 0.044);
        p.py = lerp(p.py || localCy, localCy + Math.sin(angle) * ry, 0.044);
        continue;
      }

      if (state === "community") {
        const communityAngle = seededUnit(seed) * TAU + this.time * (0.08 + p.lane * 0.012);
        const ring = radiusBase * (1.08 + (p.seed % 5) * 0.18);
        const tx = cx + Math.cos(communityAngle) * ring;
        const ty = cy + Math.sin(communityAngle) * ring * 0.56;
        p.px = lerp(p.px || tx, tx, 0.05);
        p.py = lerp(p.py || ty, ty, 0.05);
        continue;
      }

      if (state === "trust") {
        const trustAngle = seededUnit(seed) * TAU + this.time * 0.045;
        const laneRadius = radiusBase * (0.85 + p.lane * 0.24 + (p.seed % 4) * 0.04);
        const tx = cx + Math.cos(trustAngle) * laneRadius;
        const ty = cy + Math.sin(trustAngle) * laneRadius * 0.48;
        p.px = lerp(p.px || tx, tx, 0.064);
        p.py = lerp(p.py || ty, ty, 0.064);
        continue;
      }

      if (state === "routes") {
        const route = p.seed % 4;
        const progress = (seededUnit(seed + 6) + this.time * (0.035 + route * 0.005)) % 1;
        const startX = this.width * (0.44 + route * 0.08);
        const x = startX + progress * this.width * 0.32;
        const y =
          this.height * (0.28 + route * 0.12) +
          Math.sin(progress * TAU * (1.2 + route * 0.2) + p.drift) * this.height * 0.045;
        p.px = lerp(p.px || x, x, 0.052);
        p.py = lerp(p.py || y, y, 0.052);
        continue;
      }

      if (state === "duality" || state === "convergence") {
        const side = p.seed % 2 === 0 ? -1 : 1;
        const merge = state === "convergence" ? 0.68 : 0.24;
        const localCx = cx + side * this.width * (0.18 * (1 - merge));
        p.px = lerp(p.px || localCx, localCx + Math.cos(angle) * rx, 0.036 + stability * 0.016);
        p.py = lerp(p.py || cy, cy + Math.sin(angle * 1.35) * ry, 0.036 + stability * 0.016);
        continue;
      }

      if (state === "present") {
        rx *= 0.78;
        ry *= 0.78;
        const front = 1.12 + (p.seed % 4) * 0.1;
        p.px = lerp(p.px || cx, cx + Math.cos(angle) * rx * front, 0.05);
        p.py = lerp(p.py || cy, cy + Math.sin(angle * 1.18) * ry * front, 0.05);
        continue;
      }

      if (state === "future") {
        rx *= 1.4 + depth * 0.38;
        ry *= 1.2 + depth * 0.28;
      }

      if (state === "qr") {
        const calmAngle = seededUnit(seed) * TAU + this.time * 0.025;
        const ring = radiusBase * (0.85 + seededUnit(seed + 12) * 1.4);
        const tx = cx + Math.cos(calmAngle) * ring;
        const ty = cy + Math.sin(calmAngle) * ring * 0.52;
        p.px = lerp(p.px || tx, tx, 0.035);
        p.py = lerp(p.py || ty, ty, 0.035);
        continue;
      }

      const routeX =
        Math.sin(this.time * 0.22 + seed) * this.width * 0.05 * routePull +
        (seededUnit(seed + 8) - 0.5) * this.width * 0.1 * (1 - stability);
      const routeY =
        Math.cos(this.time * 0.18 + seed * 0.6) * this.height * 0.05 * routePull;

      p.px = lerp(p.px || this.width * p.x, cx + Math.cos(angle) * rx + routeX, 0.032 + stability * 0.018);
      p.py = lerp(p.py || this.height * p.y, cy + Math.sin(angle * (1.05 + spiralPull * 0.3)) * ry + routeY, 0.032 + stability * 0.018);
    }
  }

  drawConnections(ctx) {
    const state = this.current?.state;
    const isLatent = state === "latent";
    const distanceScale =
      {
        architecture: 0.18,
        opening: 0.22,
        triad: 0.72,
        impact: 0.78,
        community: 1.28,
        trust: 1.08,
        routes: 0.42,
        qr: 0.55,
      }[state] ?? 1;
    const alphaScale =
      {
        architecture: 0.08,
        opening: 0.14,
        triad: 0.72,
        impact: 0.9,
        community: 1.55,
        trust: 1.25,
        routes: 0.42,
        qr: 0.42,
      }[state] ?? 1;
    const maxDist = CONFIG.connectionDistance * (0.42 + this.params.network * 1.18) * (isLatent ? 0.56 : distanceScale);
    const boost = this.current?.asset?.placement === "background" ? 1.9 : 1;
    ctx.lineWidth = 1;
    for (let i = 0; i < this.particles.length; i += 1) {
      const a = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j += 5) {
        const b = this.particles[j];
        if (isLatent && (a.seed + b.seed) % 11 !== 0) continue;
        if ((state === "triad" || state === "impact") && a.lane !== b.lane) continue;
        const dx = a.px - b.px;
        const dy = a.py - b.py;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const alpha =
            (1 - dist / maxDist) *
            (0.08 + this.params.network * 0.26) *
            boost *
            (isLatent ? 0.42 : alphaScale);
          ctx.strokeStyle = rgba(this.colors[(a.lane + b.lane) % this.colors.length], alpha);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }
      }
    }
  }

  drawParticles(ctx) {
    const alphaBoost = this.current?.asset?.placement === "background" ? 1.45 : 1;
    const sizeBoost = this.current?.asset?.placement === "background" ? 0.82 : 1;
    const isLatent = this.current?.state === "latent";
    for (const p of this.particles) {
      const color = this.colors[p.lane % this.colors.length];
      const pulse = isLatent
        ? 0.6 + Math.max(0, Math.sin(this.time * 1.15 + p.drift)) * 0.62
        : 0.72 + Math.sin(this.time * 1.8 + p.drift) * 0.28;
      ctx.fillStyle = rgba(color, Math.min(0.86, (0.42 + this.params.intensity * 0.38) * alphaBoost * (isLatent ? 0.86 : 1)));
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.size * pulse * (1 + this.params.intensity * 0.52) * sizeBoost * (isLatent ? 0.86 : 1), 0, TAU);
      ctx.fill();
    }
  }

  drawSpiral(ctx) {
    const cx = this.width * 0.66;
    const cy = this.height * 0.47;
    const turns = 4.8 + this.params.spiral * 3.4;
    const points = 340;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const boost = this.current?.asset?.placement === "background" ? 1.8 : 1;
    for (let lane = 0; lane < 3; lane += 1) {
      ctx.beginPath();
      for (let i = 0; i < points; i += 1) {
        const t = i / (points - 1);
        const angle = t * TAU * turns + this.time * (0.18 + lane * 0.025);
        const radius = t * Math.min(this.width, this.height) * (0.18 + this.params.spiral * 0.26);
        const wobble = Math.sin(t * 18 + this.time * 0.8 + lane) * 10 * this.params.intensity;
        const x = cx + Math.cos(angle) * (radius + wobble);
        const y = cy + Math.sin(angle) * (radius * 0.58 + wobble * 0.24);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(this.colors[lane], (0.08 + this.params.spiral * 0.16) * boost);
      ctx.lineWidth = (1.2 + lane * 0.45) * boost;
      ctx.stroke();
    }
    const coreColors = [CONFIG.palette.eventRed, CONFIG.palette.eventMagenta, CONFIG.palette.eventCyan];
    for (let lane = 0; lane < 3; lane += 1) {
      ctx.beginPath();
      const offset = (lane / 3) * TAU + this.time * 0.25;
      for (let i = 0; i < 96; i += 1) {
        const t = i / 95;
        const angle = offset + t * TAU * 0.82;
        const radius = Math.min(this.width, this.height) * (0.03 + t * 0.16);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * 0.68;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(coreColors[lane], (0.08 + this.params.spiral * 0.12) * boost);
      ctx.lineWidth = (5.2 - lane * 0.9) * boost;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArchitecture(ctx) {
    const state = this.current?.state;
    if (state !== "routes" && state !== "future") return;
    const amount = this.params.architecture;
    if (amount < 0.04) return;
    ctx.save();
    ctx.translate(this.width * 0.5, this.height * 0.5);
    ctx.strokeStyle = rgba(CONFIG.palette.ink, 0.05 + amount * 0.16);
    ctx.lineWidth = 1.2;
    const w = this.width * (0.34 + amount * 0.16);
    const h = this.height * (0.36 + amount * 0.12);
    const skew = this.width * 0.07;
    for (let i = 0; i < 8; i += 1) {
      const y = -h / 2 + (h / 7) * i;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + skew * (i / 8), y);
      ctx.lineTo(w / 2 + skew * (i / 8), y - this.height * 0.08);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i += 1) {
      const x = -w / 2 + (w / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, -h / 2);
      ctx.lineTo(x + skew, h / 2 - this.height * 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArchive(ctx) {
    const amount = this.params.archive;
    if (amount < 0.04) return;
    ctx.save();
    ctx.globalAlpha = amount * 0.82;
    for (let i = 0; i < 5; i += 1) {
      const seed = this.momentHash + i * 23;
      const x = this.width * (0.56 + seededUnit(seed) * 0.34);
      const y = this.height * (0.18 + seededUnit(seed + 1) * 0.55);
      const w = this.width * (0.08 + seededUnit(seed + 2) * 0.08);
      const h = w * (0.58 + seededUnit(seed + 3) * 0.28);
      ctx.strokeStyle = rgba(this.colors[i % this.colors.length], 0.18);
      ctx.fillStyle = rgba(CONFIG.palette.ink, 0.035);
      ctx.lineWidth = 1;
      ctx.translate(0, Math.sin(this.time * 0.35 + i) * 2);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.18, y + h * 0.66);
      ctx.lineTo(x + w * 0.4, y + h * 0.42);
      ctx.lineTo(x + w * 0.62, y + h * 0.56);
      ctx.lineTo(x + w * 0.84, y + h * 0.28);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawStateGesture(ctx) {
    const state = this.current?.state;
    if (state === "impact") {
      this.drawImpactRings(ctx, 0.7);
    }
    if (state === "community") {
      this.drawCommunityPulse(ctx);
    }
    if (state === "future") {
      this.drawImpactRings(ctx, 1);
      this.drawRoutes(ctx, 0.62);
      this.drawConstructionLattice(ctx);
    }
    if (state === "routes") {
      this.drawRoutes(ctx, 1);
    }
    if (state === "trust") {
      this.drawTrustBridges(ctx);
    }
    if (state === "present") {
      this.drawPresentReveal(ctx);
    }
    if (state === "qr") {
      this.drawContinuityHalo(ctx);
    }
  }

  drawImpactRings(ctx, scale) {
    const cx = this.width * 0.68;
    const cy = this.height * 0.48;
    ctx.save();
    for (let i = 0; i < 7; i += 1) {
      const phase = (this.time * 0.18 + i / 7) % 1;
      const r = phase * Math.min(this.width, this.height) * 0.62 * scale;
      ctx.strokeStyle = rgba(this.colors[i % this.colors.length], (1 - phase) * 0.16 * this.params.intensity);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.58, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCommunityPulse(ctx) {
    const cx = this.width * 0.66;
    const cy = this.height * 0.47;
    const base = Math.min(this.width, this.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i += 1) {
      const phase = (this.time * 0.12 + i / 4) % 1;
      ctx.strokeStyle = rgba(this.colors[i % this.colors.length], (1 - phase) * 0.12);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, base * (0.16 + phase * 0.24), base * (0.08 + phase * 0.13), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRoutes(ctx, scale = 1) {
    ctx.save();
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 9; i += 1) {
      const y = this.height * (0.22 + i * 0.064);
      const startX = this.width * (0.48 + seededUnit(i + 44) * 0.12);
      ctx.beginPath();
      for (let j = 0; j < 7; j += 1) {
        const x = startX + j * this.width * 0.065;
        const yy = y + Math.sin(this.time * 0.9 + i + j * 0.7) * this.height * 0.018;
        if (j === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = rgba(this.colors[i % 3], (0.08 + this.params.intensity * 0.1) * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTrustBridges(ctx) {
    ctx.save();
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const y = this.height * (0.28 + i * 0.07);
      const x1 = this.width * 0.48;
      const x2 = this.width * 0.86;
      const cp = this.width * (0.62 + Math.sin(this.time * 0.3 + i) * 0.02);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.quadraticCurveTo(cp, y - this.height * 0.08, x2, y + this.height * 0.02);
      ctx.strokeStyle = rgba(this.colors[i % 3], 0.1 + this.params.stability * 0.14);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPresentReveal(ctx) {
    const cx = this.width * 0.66;
    const cy = this.height * 0.47;
    const base = Math.min(this.width, this.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.36);
    glow.addColorStop(0, rgba(CONFIG.palette.eventRed, 0.16));
    glow.addColorStop(0.45, rgba(CONFIG.palette.eventCyan, 0.08));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - base * 0.36, cy - base * 0.36, base * 0.72, base * 0.72);
    ctx.restore();
  }

  drawConstructionLattice(ctx) {
    const cx = this.width * 0.66;
    const cy = this.height * 0.48;
    const base = Math.min(this.width, this.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(CONFIG.palette.eventSilver, 0.1);
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i += 1) {
      const x = cx + i * base * 0.07;
      ctx.beginPath();
      ctx.moveTo(x - base * 0.22, cy + base * 0.22);
      ctx.lineTo(x + base * 0.18, cy - base * 0.18);
      ctx.stroke();
    }
    for (let i = -3; i <= 3; i += 1) {
      const y = cy + i * base * 0.045;
      ctx.beginPath();
      ctx.moveTo(cx - base * 0.34, y);
      ctx.lineTo(cx + base * 0.36, y + base * 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawContinuityHalo(ctx) {
    const cx = this.width * 0.76;
    const cy = this.height * 0.52;
    const base = Math.min(this.width, this.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = rgba(this.colors[i], 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, base * (0.18 + i * 0.07), base * (0.08 + i * 0.035), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}
