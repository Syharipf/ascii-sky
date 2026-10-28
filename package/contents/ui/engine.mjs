// engine.mjs — simulation engine for Langit ASCII

import { Environment, blendHex } from "./environment.mjs";
import {
  SPECIES,
  TREE_TEMPLATES,
  CLOUD_TEMPLATES,
  DISTANT_CANOPY,
  ADVANCE_RATIO,
  pickSpecies,
  birdCellPx
} from "./sprites.mjs";

const FLY_SLOTS = 10;
const MAX_PERCHED = 4;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Depth tier assignments: slots 0-3 near, 4-6 mid, 7-9 far
function defaultSlotDepth(slot, random) {
  if (slot < 4) {
    return 0.82 + random() * (1.0 - 0.82);
  }
  if (slot < 7) {
    return 0.50 + random() * (0.78 - 0.50);
  }
  return 0.24 + random() * (0.42 - 0.24);
}

class RainSystem {
  constructor(maxDrops = 70, random = Math.random) {
    this.maxDrops = maxDrops;
    this.random = random;
    this.drops = [];
    for (let i = 0; i < maxDrops; i++) {
      this.drops.push({
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        dx: 0,
        dy: 0,
        speed: 0,
        state: 0, // 0 = falling, 1 = splash
        age: 0,
        duration: 0.45,
        splashAge: 0,
        alpha: 0,
        length: 8
      });
    }
  }

  reset(w, h) {
    for (const d of this.drops) {
      this.respawn(d, w, h);
    }
  }

  respawn(d, w, h) {
    d.state = 0;
    d.age = 0;
    d.splashAge = 0;
    d.x = this.random() * w;
    d.y = -20 - this.random() * 40;
    d.tx = this.random() * w;
    d.ty = (0.55 + this.random() * 0.43) * h;
    d.duration = 0.35 + this.random() * 0.25;
    d.length = 6 + this.random() * 6;
    d.alpha = 0.3 + this.random() * 0.5;
  }

  step(dt, intensity, w, h) {
    if (intensity <= 0) return;
    for (const d of this.drops) {
      if (d.state === 0) {
        d.age += dt;
        const p = d.age / d.duration;
        if (p >= 1) {
          d.state = 1;
          d.splashAge = 0;
          d.x = d.tx;
          d.y = d.ty;
        } else {
          d.x += (d.tx - d.x) * dt * 8;
          d.y += (d.ty - d.y) * dt * 8;
        }
      } else {
        d.splashAge += dt;
        if (d.splashAge > 0.25) {
          this.respawn(d, w, h);
        }
      }
    }
  }
}

class SnowSystem {
  constructor(maxFlakes = 80, random = Math.random) {
    this.maxFlakes = maxFlakes;
    this.random = random;
    this.glyphs = ["*", "·", "+"];
    this.flakes = [];
    for (let i = 0; i < maxFlakes; i++) {
      this.flakes.push({
        x: 0,
        y: 0,
        baseX: 0,
        vy: 40,
        sway: 10,
        phase: 0,
        glyph: "*",
        size: 10,
        state: 0, // 0 = falling, 1 = settled
        age: 0,
        settle: 1.5,
        alpha: 0
      });
    }
  }

  reset(w, h) {
    for (const f of this.flakes) {
      this.respawn(f, w, h);
    }
  }

  respawn(f, w, h) {
    f.state = 0;
    f.age = 0;
    f.baseX = this.random() * w;
    f.x = f.baseX;
    f.y = -10 - this.random() * 50;
    f.vy = 35 + this.random() * 40;
    f.sway = 6 + this.random() * 12;
    f.phase = this.random() * Math.PI * 2;
    f.glyph = this.glyphs[Math.floor(this.random() * this.glyphs.length)];
    f.size = Math.round(9 + this.random() * 5);
    f.settle = 1.2 + this.random() * 1.2;
    f.alpha = 0.35 + this.random() * 0.55;
  }

  step(dt, intensity, w, h) {
    if (intensity <= 0) return;
    for (const f of this.flakes) {
      if (f.state === 0) {
        f.age += dt;
        f.y += f.vy * dt;
        f.x = f.baseX + Math.sin(f.age * 2.2 + f.phase) * f.sway;
        if (f.y >= (0.55 + 0.43 * ((f.phase % 1) || 0.5)) * h) {
          f.state = 1;
          f.age = 0;
        }
      } else {
        f.age += dt;
        if (f.age > f.settle) {
          this.respawn(f, w, h);
        }
      }
    }
  }
}

class SkyEngine {
  constructor(options = {}) {
    this.birdKind = options.birdKind || "all";
    this.showClouds = options.showClouds !== undefined ? options.showClouds : true;
    this.showWeather = options.showWeather !== undefined ? options.showWeather : true;
    this.mouseInteraction = options.mouseInteraction !== undefined ? options.mouseInteraction : true;
    this.random = options.random || Math.random;

    this.environment = new Environment({ random: this.random });

    this.w = 0;
    this.h = 0;
    this.treeFont = 16;
    this.birdBaseFont = 12;

    this.pointer = { x: -999, y: -999, active: false };

    this.trees = [];
    this.perches = [];
    this.distant = { cellW: 10, cellH: 10, y: 0, tiles: [] };
    this.stars = [];
    this.clouds = [];
    this.rain = new RainSystem(70, this.random);
    this.snow = new SnowSystem(80, this.random);

    this.birds = [];
    this.sortedBirds = [];

    // Reusable snapshot object
    this.frame = {
      time: 0,
      birds: [],
      trees: [],
      distant: this.distant,
      perches: this.perches,
      stars: [],
      clouds: [],
      rainDrops: [],
      snowFlakes: [],
      environment: null,
      palette: null,
      celestial: {
        sun: { x: 0, y: 0, alpha: 0, radius: 14, squash: 1, phase: 0 },
        moon: { x: 0, y: 0, alpha: 0, radius: 13, squash: 1, phase: 0 }
      },
      cloudColor: "#ffffff",
      rainIntensity: 0,
      snowIntensity: 0
    };

    // Initialize 10 bird slots
    for (let i = 0; i < FLY_SLOTS; i++) {
      this.birds.push({
        slot: i,
        species: SPECIES[0],
        sprite: SPECIES[0],
        mode: "fly", // wait, fly, land, perched, takeoff
        depth: 0.5,
        slotDepth: 0.5,
        cellPx: 12,
        spriteW: 60,
        x: 0,
        y: 0,
        baseY: 0,
        facing: 1, // 1 = right, -1 = left
        phase: 0,
        flyTime: 0,
        speed: 100,
        glideUntil: 0,
        startleUntil: 0,
        perchInterest: false,
        perchId: -1,
        land: { x0: 0, y0: 0, cx: 0, cy: 0, px: 0, py: 0, t: 0, dur: 2 },
        take: { t: 0, dur: 1, y0: 0, y1: 0 },
        perchAt: 0,
        perchUntil: 0,
        idleFrame: 0,
        frameIndex: 0,
        cooldown: 0,
        rotation: 0,
        color: "#ffffff",
        opacity: 1
      });
      this.sortedBirds.push(this.birds[i]);
    }
  }

  resetStep() {
    // Hook called when animating toggles
  }

  setBirdKind(kind) {
    this.birdKind = kind;
    if (this.w > 0 && this.h > 0) {
      this.seedBirds(true);
    }
  }

  setShowClouds(bool) {
    this.showClouds = bool;
  }

  setShowWeather(bool) {
    this.showWeather = bool;
  }

  onPointerMove(x, y) {
    if (!this.mouseInteraction) return;
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = true;
  }

  onPointerLeave() {
    this.pointer.active = false;
    this.pointer.x = -999;
    this.pointer.y = -999;
  }

  onPointerDown(x, y) {
    if (!this.mouseInteraction) return;
    const time = this.environment.elapsed;
    // Flush perched birds within 360px
    for (const b of this.birds) {
      if (b.mode === "perched") {
        const dx = b.x - x;
        const dy = b.y - y;
        if (dx * dx + dy * dy <= 360 * 360) {
          this.triggerTakeoff(b);
        }
      } else if (b.mode === "fly") {
        const dx = b.x - x;
        const dy = b.y - y;
        if (dx * dx + dy * dy <= 200 * 200) {
          b.startleUntil = time + 1.2;
          b.facing = b.x < x ? -1 : 1;
        }
      }
    }
  }

  resize(w, h) {
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    this.w = w;
    this.h = h;

    const fullFont = clamp(Math.round((h * 0.38) / 26), 8, 26);
    this.treeFont = fullFont;

    // Back to front: far band, mid band, near band. frac = left edge as a fraction of width.
    const treeConfigs = [
      { tmpl: TREE_TEMPLATES[2], frac: 0.04, scale: 0.46, depth: 0.32 },
      { tmpl: TREE_TEMPLATES[1], frac: 0.26, scale: 0.50, depth: 0.36 },
      { tmpl: TREE_TEMPLATES[2], frac: 0.47, scale: 0.44, depth: 0.30 },
      { tmpl: TREE_TEMPLATES[0], frac: 0.68, scale: 0.52, depth: 0.38 },
      { tmpl: TREE_TEMPLATES[1], frac: 0.90, scale: 0.48, depth: 0.34 },
      { tmpl: TREE_TEMPLATES[1], frac: 0.14, scale: 0.74, depth: 0.66 },
      { tmpl: TREE_TEMPLATES[2], frac: 0.58, scale: 0.78, depth: 0.70 },
      { tmpl: TREE_TEMPLATES[0], frac: 0.00, scale: 1.00, depth: 1.00 },
      { tmpl: TREE_TEMPLATES[1], frac: 0.36, scale: 0.94, depth: 0.92 },
      { tmpl: TREE_TEMPLATES[2], frac: 0.76, scale: 0.88, depth: 0.86 }
    ];

    let perchIdx = 0;
    for (const { tmpl, frac, scale, depth } of treeConfigs) {
      const font = clamp(Math.round(fullFont * scale), 8, 26);
      const cellW = font * ADVANCE_RATIO;
      const treeW = tmpl.cols * cellW;
      const treeH = tmpl.rows * font;
      const treeX = clamp(Math.round(frac * w), -0.25 * treeW, w - 0.55 * treeW);
      const treeY = h - treeH;

      this.trees.push({
        id: tmpl.id,
        x: treeX,
        y: treeY,
        cols: tmpl.cols,
        rows: tmpl.rows,
        cellW,
        cellH: font,
        depth,
        woodText: tmpl.woodText,
        leafText: tmpl.leafText
      });

      // Birds only perch on mid/near trunks: far perches would draw on top of nearer trees.
      if (depth < 0.6) continue;
      for (const a of tmpl.anchors) {
        const px = treeX + (a.col + 0.5) * cellW;
        const py = treeY + (a.row + 0.5) * font;
        if (px >= 8 && px <= w - 8 && py >= 0.55 * h && py <= h - 4) {
          this.perches.push({ id: perchIdx++, x: px, y: py, facing: a.facing, depth, occupant: -1, reserved: -1 });
        }
      }
    }

    // Distant canopy
    const distFont = Math.max(8, Math.round(this.treeFont * 0.65));
    const distW = distFont * ADVANCE_RATIO;
    const distH = distFont;
    const distY = h - 6 * distH;
    const tileW = 64 * distW;
    const tileCount = Math.ceil(w / tileW) + 1;
    const tiles = [];
    for (let i = 0; i < tileCount; i++) {
      tiles.push({ x: i * tileW, text: DISTANT_CANOPY.text });
    }
    this.distant = { cellW: distW, cellH: distH, y: distY, tiles };

    // Stars: 80
    const starGlyphs = ["·", "*", "+"];
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        glyph: starGlyphs[Math.floor(this.random() * starGlyphs.length)],
        x: this.random() * w,
        y: (0.03 + this.random() * 0.52) * h,
        size: Math.round(9 + this.random() * 5),
        phase: this.random() * Math.PI * 2,
        freq: 0.6 + this.random() * 1.8,
        alpha: 0.35 + 0.65 * this.random()
      });
    }

    // Clouds: 7 (2 far, 3 mid, 2 near)
    const cloudDepths = [0.3, 0.3, 0.6, 0.6, 0.6, 0.9, 0.9];
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      const d = cloudDepths[i];
      const tmpl = CLOUD_TEMPLATES[Math.floor(this.random() * CLOUD_TEMPLATES.length)];
      const dir = this.random() < 0.5 ? -1 : 1;
      this.clouds.push({
        text: tmpl.text,
        depth: d,
        x: this.random() * w,
        baseY: (0.05 + this.random() * 0.37) * h,
        y: 0,
        vx: (8 + 18 * d) * dir,
        bobAmp: 3 + this.random() * 5,
        phase: this.random() * Math.PI * 2,
        alpha: 0.14 + 0.16 * d
      });
    }

    this.rain.reset(w, h);
    this.snow.reset(w, h);

    this.seedBirds(true);
  }

  seedBirds(initial = false) {
    const time = this.environment.elapsed;

    // Reset perches
    for (const p of this.perches) {
      p.occupant = -1;
      p.reserved = -1;
    }

    // Assign slot depths
    for (let i = 0; i < FLY_SLOTS; i++) {
      const b = this.birds[i];
      b.slot = i;
      b.depth = defaultSlotDepth(i, this.random);
      b.slotDepth = b.depth;
      b.perchId = -1;
    }

    // Available perching pool
    const canPerchSpecies = SPECIES.filter(s => s.canPerch);
    let perchPool = canPerchSpecies;
    if (this.birdKind !== "all") {
      if (this.birdKind === "real") {
        perchPool = canPerchSpecies.filter(s => s.group !== "mythic");
      } else if (this.birdKind === "mythic") {
        perchPool = canPerchSpecies.filter(s => s.group === "mythic");
      } else {
        const fixed = pickSpecies(this.birdKind);
        perchPool = fixed.canPerch ? [fixed] : [];
      }
    }

    // Perch up to 3 birds initially if perches and perching species available
    const perchTarget = Math.min(3, this.perches.length, perchPool.length > 0 ? 3 : 0);
    const chosenPerches = [];
    if (perchTarget > 0) {
      const avail = [...this.perches];
      for (let i = 0; i < perchTarget; i++) {
        const idx = Math.floor(this.random() * avail.length);
        chosenPerches.push(avail[idx]);
        avail.splice(idx, 1);
      }
    }

    for (let i = 0; i < FLY_SLOTS; i++) {
      const b = this.birds[i];
      if (i < chosenPerches.length) {
        // Seed perched
        const p = chosenPerches[i];
        const s = pickSpecies(this.birdKind === "all" || this.birdKind === "real" || this.birdKind === "mythic" ? this.birdKind : this.birdKind, this.random);
        const species = s.canPerch ? s : (perchPool[Math.floor(this.random() * perchPool.length)] || SPECIES[0]);
        b.species = species;
        b.sprite = species;
        b.mode = "perched";
        b.depth = p.depth;
        b.cellPx = birdCellPx(species, b.depth, this.h);
        b.spriteW = species.cols * ADVANCE_RATIO * b.cellPx;
        b.x = p.x;
        b.y = p.y;
        b.baseY = p.y;
        b.facing = p.facing;
        b.phase = this.random() * Math.PI * 2;
        b.flyTime = 0;
        b.speed = species.cruise * (0.55 + 0.9 * b.depth);
        b.glideUntil = 0;
        b.startleUntil = 0;
        b.perchInterest = true;
        b.perchId = p.id;
        p.occupant = i;
        p.reserved = -1;
        b.perchAt = time;
        b.perchUntil = time + 8 + this.random() * 10;
        b.idleFrame = 0;
        b.frameIndex = 0;
        b.cooldown = 0;
        b.rotation = 0;
      } else {
        // Seed flying
        this.spawnBird(b, initial);
      }
    }
  }

  spawnBird(b, initial = false) {
    const s = pickSpecies(this.birdKind, this.random);
    b.species = s;
    b.sprite = s;
    b.depth = b.slotDepth;
    b.cellPx = birdCellPx(s, b.depth, this.h);
    b.spriteW = s.cols * ADVANCE_RATIO * b.cellPx;
    b.facing = this.random() < 0.5 ? 1 : -1;

    if (initial) {
      b.x = this.random() * this.w;
    } else {
      b.x = b.facing > 0 ? -b.spriteW - 10 : this.w + b.spriteW + 10;
    }
    b.baseY = (0.08 + this.random() * 0.40) * this.h;
    b.y = b.baseY;
    b.phase = this.random() * Math.PI * 2;
    b.flyTime = 0;
    b.speed = s.cruise * (0.55 + 0.9 * b.depth);
    b.glideUntil = this.environment.elapsed + (this.random() < s.glide ? 1.5 + this.random() * 2.0 : 0);
    b.startleUntil = 0;
    b.perchInterest = s.canPerch && this.random() < (s.id === "phoenix" ? 0.25 : 0.45);
    b.perchId = -1;
    b.mode = "fly";
    b.cooldown = 0;
    b.rotation = 0;
    b.idleFrame = 0;
    b.frameIndex = 0;
  }

  triggerTakeoff(b) {
    if (b.perchId !== -1) {
      const p = this.perches.find(perch => perch.id === b.perchId);
      if (p) {
        p.occupant = -1;
        p.reserved = -1;
      }
    }
    b.mode = "takeoff";
    b.take.t = 0;
    b.take.dur = 1.0;
    b.take.y0 = b.y;
    b.take.y1 = clamp(b.y - (0.14 + this.random() * 0.10) * this.h, 0.10 * this.h, 0.46 * this.h);
    b.facing = b.x < 0.5 * this.w ? -1 : 1;
    b.perchId = -1;
  }

  stepBirds(dt) {
    const time = this.environment.elapsed;
    const hasPointer = this.mouseInteraction && this.pointer.active;

    // Count occupied + reserved perches
    let perchedOrReserved = 0;
    for (const p of this.perches) {
      if (p.occupant !== -1 || p.reserved !== -1) perchedOrReserved++;
    }

    let depthChanged = false;

    for (const b of this.birds) {
      // NaN guard
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y) || !Number.isFinite(b.depth) || !Number.isFinite(b.cellPx)) {
        if (b.perchId !== -1) {
          const p = this.perches.find(perch => perch.id === b.perchId);
          if (p) {
            p.occupant = -1;
            p.reserved = -1;
          }
          b.perchId = -1;
        }
        this.spawnBird(b, true);
        depthChanged = true;
        continue;
      }

      if (b.mode === "wait") {
        b.cooldown -= dt;
        if (b.cooldown <= 0) {
          this.spawnBird(b, false);
          depthChanged = true;
        }
        continue;
      }

      if (b.mode === "fly") {
        // Pointer startle
        if (hasPointer) {
          const dx = b.x - this.pointer.x;
          const dy = b.y - this.pointer.y;
          if (dx * dx + dy * dy <= 160 * 160) {
            b.startleUntil = time + 1.2;
            b.facing = b.x < this.pointer.x ? -1 : 1;
          }
        }

        const isStartled = time < b.startleUntil;
        const currentSpeed = b.species.cruise * (0.55 + 0.9 * b.depth) * (isStartled ? 1.8 : 1.0);
        b.speed = currentSpeed;
        b.x += b.facing * currentSpeed * dt;
        b.y = b.baseY + Math.sin(time * 1.1 + b.phase) * (4 + 10 * b.depth);
        b.rotation = clamp(Math.cos(time * 1.1 + b.phase) * (2 + 3 * b.depth), -6, 6);
        b.flyTime += dt;

        // Wing flap animation
        if (time < b.glideUntil && !isStartled) {
          b.frameIndex = 1; // level
        } else {
          b.phase += dt * b.species.flapHz * Math.PI * 2;
          const flapSteps = [0, 1, 2, 1];
          const step = Math.floor(b.phase / (Math.PI / 2)) % 4;
          b.frameIndex = flapSteps[(step + 4) % 4];
        }

        // Landing check
        if (
          b.flyTime > 2.5 &&
          b.perchInterest &&
          perchedOrReserved < MAX_PERCHED &&
          this.random() < dt * 0.3
        ) {
          // Find closest free perch within 0.65 * W
          let bestP = null;
          let bestDist = Infinity;
          for (const p of this.perches) {
            if (p.occupant === -1 && p.reserved === -1) {
              const dist = Math.abs(p.x - b.x);
              if (dist < 0.65 * this.w && dist < bestDist) {
                bestDist = dist;
                bestP = p;
              }
            }
          }

          if (bestP) {
            bestP.reserved = b.slot;
            perchedOrReserved++;
            b.mode = "land";
            b.perchId = bestP.id;
            b.land.x0 = b.x;
            b.land.y0 = b.y;
            b.land.px = bestP.x;
            b.land.py = bestP.y;
            b.land.cx = (b.x + bestP.x) / 2;
            b.land.cy = Math.min(b.y, bestP.y) - Math.min(0.16 * this.h, 0.25 * Math.abs(bestP.x - b.x) + 40);
            const totalDist = Math.hypot(bestP.x - b.x, bestP.y - b.y);
            b.land.dur = clamp(totalDist / 220, 1.2, 3.0);
            b.land.t = 0;
          }
        }

        // Offscreen check
        if (b.x < -b.spriteW - 40 || b.x > this.w + b.spriteW + 40) {
          b.mode = "wait";
          b.cooldown = 0.8 + this.random() * 4.2;
        }
      } else if (b.mode === "land") {
        // Pointer startle cancels landing
        if (hasPointer) {
          const dx = b.x - this.pointer.x;
          const dy = b.y - this.pointer.y;
          if (dx * dx + dy * dy <= 160 * 160) {
            const p = this.perches.find(perch => perch.id === b.perchId);
            if (p) p.reserved = -1;
            b.mode = "fly";
            b.depth = b.slotDepth;
            b.cellPx = birdCellPx(b.species, b.depth, this.h);
            b.baseY = clamp(b.y, 0.08 * this.h, 0.48 * this.h);
            b.startleUntil = time + 1.2;
            b.facing = b.x < this.pointer.x ? -1 : 1;
            b.perchId = -1;
            depthChanged = true;
            continue;
          }
        }

        b.land.t += dt;
        const u = clamp(b.land.t / b.land.dur, 0, 1);
        const tEase = smoothstep(0, 1, u);

        // Quadratic Bezier
        const inv = 1 - tEase;
        const oldX = b.x;
        b.x = inv * inv * b.land.x0 + 2 * inv * tEase * b.land.cx + tEase * tEase * b.land.px;
        b.y = inv * inv * b.land.y0 + 2 * inv * tEase * b.land.cy + tEase * tEase * b.land.py;
        b.facing = b.x >= oldX ? 1 : -1;
        b.rotation = clamp((b.land.py - b.y) * 0.1, -12, 12);

        // Flap sequence at 1.3x flapHz
        b.phase += dt * b.species.flapHz * 1.3 * Math.PI * 2;
        const flapSteps = [0, 1, 2, 1];
        b.frameIndex = flapSteps[(Math.floor(b.phase / (Math.PI / 2)) % 4 + 4) % 4];

        // Depth transition toward perch depth
        const p = this.perches.find(perch => perch.id === b.perchId);
        const targetDepth = p ? p.depth : b.slotDepth;
        b.depth = b.slotDepth + (targetDepth - b.slotDepth) * tEase;
        b.cellPx = birdCellPx(b.species, b.depth, this.h);
        depthChanged = true;

        if (u >= 1) {
          b.mode = "perched";
          b.x = b.land.px;
          b.y = b.land.py;
          b.facing = p ? p.facing : 1;
          b.rotation = 0;
          if (p) {
            p.occupant = b.slot;
            p.reserved = -1;
          }
          b.perchAt = time;
          b.perchUntil = time + 7 + this.random() * 11;
          b.idleFrame = 0;
        }
      } else if (b.mode === "perched") {
        // Pointer startle
        if (hasPointer) {
          const dx = b.x - this.pointer.x;
          const dy = b.y - this.pointer.y;
          if (dx * dx + dy * dy <= 140 * 140) {
            this.triggerTakeoff(b);
            depthChanged = true;
            continue;
          }
        }

        if (time > b.perchUntil) {
          this.triggerTakeoff(b);
          depthChanged = true;
          continue;
        }

        b.rotation = 0;
        b.idleFrame = Math.floor((time - b.perchAt) / 2.6) % 2;
      } else if (b.mode === "takeoff") {
        b.take.t += dt;
        const u = clamp(b.take.t / b.take.dur, 0, 1);
        const tEase = smoothstep(0, 1, u);

        b.y = b.take.y0 + (b.take.y1 - b.take.y0) * tEase;
        b.x += b.facing * b.species.cruise * 1.15 * dt;
        b.rotation = -b.facing * (1 - tEase) * 8;

        // Flap sequence at 1.3x flapHz
        b.phase += dt * b.species.flapHz * 1.3 * Math.PI * 2;
        const flapSteps = [0, 1, 2, 1];
        b.frameIndex = flapSteps[(Math.floor(b.phase / (Math.PI / 2)) % 4 + 4) % 4];

        // Depth back to slot depth
        const p = this.perches.find(perch => perch.id === b.perchId);
        const originDepth = p ? p.depth : b.depth;
        b.depth = originDepth + (b.slotDepth - originDepth) * tEase;
        b.cellPx = birdCellPx(b.species, b.depth, this.h);
        depthChanged = true;

        if (u >= 1) {
          b.mode = "fly";
          b.depth = b.slotDepth;
          b.cellPx = birdCellPx(b.species, b.depth, this.h);
          b.baseY = b.take.y1;
          b.flyTime = 0;
          b.phase = -time * 1.1;
          b.rotation = 0;
          depthChanged = true;
        }
      }
    }

    if (depthChanged) {
      this.sortBirds();
    }
  }

  sortBirds() {
    // Insertion sort ascending by depth
    for (let i = 1; i < this.sortedBirds.length; i++) {
      const current = this.sortedBirds[i];
      let j = i - 1;
      while (j >= 0 && this.sortedBirds[j].depth > current.depth) {
        this.sortedBirds[j + 1] = this.sortedBirds[j];
        j--;
      }
      this.sortedBirds[j + 1] = current;
    }
  }

  stepClouds(dt) {
    if (!this.showClouds) return;
    const time = this.environment.elapsed;
    for (const c of this.clouds) {
      c.x += c.vx * dt;
      c.y = c.baseY + Math.sin(time * 0.35 + c.phase) * c.bobAmp;
      if (c.x < -0.35 * this.w) {
        c.x = 1.30 * this.w;
      } else if (c.x > 1.35 * this.w) {
        c.x = -0.30 * this.w;
      }
    }
  }

  advance(dt, overrides = {}) {
    if (!Number.isFinite(dt) || dt <= 0) {
      return this.frame;
    }

    const stepDt = Math.min(dt, 0.1);
    this.environment.advance(stepDt);
    const env = this.environment.snapshot(overrides);

    const rainIntensity = this.showWeather ? env.rainIntensity : 0;
    const snowIntensity = this.showWeather ? env.snowIntensity : 0;

    this.stepClouds(stepDt);
    if (this.showWeather) {
      this.rain.step(stepDt, rainIntensity, this.w, this.h);
      this.snow.step(stepDt, snowIntensity, this.w, this.h);
    }
    this.stepBirds(stepDt);

    // Compute celestial positions
    const c = env.effectiveCycleSeconds;
    const sun = this.frame.celestial.sun;
    const moon = this.frame.celestial.moon;
    const celR = clamp(Math.round(this.h * 0.016), 7, 19);

    if (c < 600) {
      const p = clamp(c / 600, 0, 1);
      const lift = Math.sin(Math.PI * p);
      sun.x = 0.08 * this.w + 0.84 * this.w * p;
      sun.y = 0.62 * this.h - lift * 0.54 * this.h;
      sun.alpha = smoothstep(0, 0.04, p) * (1 - smoothstep(0.96, 1, p)) * 0.9;
      sun.radius = celR;
      sun.squash = 0.72 + 0.28 * lift;
      sun.phase = p;
    } else {
      sun.alpha = 0;
    }

    if (c >= 600) {
      const p = clamp((c - 600) / 600, 0, 1);
      const lift = Math.sin(Math.PI * p);
      moon.x = 0.08 * this.w + 0.84 * this.w * p;
      moon.y = 0.62 * this.h - lift * 0.54 * this.h;
      moon.alpha = smoothstep(0, 0.04, p) * (1 - smoothstep(0.96, 1, p)) * 0.9;
      moon.radius = Math.round(celR * 0.94);
      moon.squash = 0.76 + 0.24 * lift;
      moon.phase = p;
    } else {
      moon.alpha = 0;
    }

    // Update bird snapshot fields
    const pal = env.palette;
    for (const b of this.birds) {
      b.color = blendHex(b.species.accent, pal.bird, 0.35);
      b.opacity = (0.55 + 0.45 * b.depth) * (0.72 + 0.28 * pal.light);
    }

    // Update frame
    this.frame.time = this.environment.elapsed;
    this.frame.birds = this.sortedBirds;
    this.frame.trees = this.trees;
    this.frame.distant = this.distant;
    this.frame.perches = this.perches;
    this.frame.stars = this.stars;
    this.frame.clouds = this.clouds;
    this.frame.rainDrops = this.rain.drops;
    this.frame.snowFlakes = this.snow.flakes;
    this.frame.environment = env;
    this.frame.palette = pal;
    this.frame.rainIntensity = rainIntensity;
    this.frame.snowIntensity = snowIntensity;
    this.frame.cloudColor = blendHex(
      pal.cloud,
      pal.cloudShadow,
      clamp(rainIntensity * 0.85 + snowIntensity * 0.25, 0, 0.85)
    );

    return this.frame;
  }
}

export {
  FLY_SLOTS,
  MAX_PERCHED,
  SkyEngine,
  RainSystem,
  SnowSystem
};
