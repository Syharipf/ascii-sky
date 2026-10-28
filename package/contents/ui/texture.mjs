// texture.mjs — cell grids from art masks for Langit ASCII
import {
  SPECIES_BY_ID,
  TREE_TEMPLATES,
  ADVANCE_RATIO,
  WOOD_CHARS,
  LEAF_CHARS
} from "./sprites.mjs";

const SKIN_RAMP = "#@%";    // 3 steps, bodies/heads — dense so interior never dithers to holes
const WING_RAMP = "%#";     // 2 steps, wing feathers
const TAIL_RAMP  = "~-:)t";       // 5 steps, tail streamers
const BARK_RAMP  = "|!:;=#";      // 6 steps, trunk/branch interior
const LEAF_RAMP  = ".,'o*#%@";    // 8 steps, canopy interior
const MASS_CHARS = new Set("#@%*~");
const RIM_CHARS  = new Set("/\\|()_-=<>, '");
const SPECIAL_CHARS = new Set("o");

const BIRD_TONE_BIAS = {
  "@": 0.16,
  "*": 0.20,
  "%": 0.05,
  "#": 0,
  "~": -0.12
};

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function hash(x, y, s) {
  const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function buildFrame(lines, spec = {}) {
  const rows = lines.length;
  const cols = lines[0].length;
  for (let r = 0; r < rows; r++) {
    if (lines[r].length !== cols) {
      throw new Error("texture: ragged frame");
    }
  }

  const bodyRamp = spec.bodyRamp || SKIN_RAMP;
  const wingRamp = spec.wingRamp || WING_RAMP;
  const tailRamp = spec.tailRamp || TAIL_RAMP;
  const accentRate = spec.accentRate !== undefined ? spec.accentRate : 0.10;
  const seed = spec.seed !== undefined ? spec.seed : 11;
  const toneBias = spec.toneBias || {};
  const rimChars = spec.rimChars || RIM_CHARS;
  const massChars = spec.massChars || MASS_CHARS;
  const specialChars = spec.specialChars !== undefined ? spec.specialChars : SPECIAL_CHARS;

  // 2. Validate roles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = lines[r][c];
      if (ch === " ") continue;
      if (massChars.has(ch) || specialChars.has(ch) || rimChars.has(ch)) continue;
      throw new Error("texture: unknown char " + ch);
    }
  }

  // 3. Boundary set
  const isBoundary = Array.from({ length: rows }, () => new Uint8Array(cols));
  const queue = [];
  const dist = Array.from({ length: rows }, () => new Int32Array(cols).fill(-1));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = lines[r][c];
      if (ch === " ") continue;
      let onBorder = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
      if (!onBorder) {
        if (lines[r - 1][c] === " " || lines[r + 1][c] === " " ||
            lines[r][c - 1] === " " || lines[r][c + 1] === " ") {
          onBorder = true;
        }
      }
      if (onBorder) {
        isBoundary[r][c] = 1;
        dist[r][c] = 0;
        queue.push(c, r);
      }
    }
  }

  // 4. BFS
  let head = 0;
  let dMax = 0;
  while (head < queue.length) {
    const c = queue[head++];
    const r = queue[head++];
    const d = dist[r][c];
    if (d > dMax) dMax = d;

    const neighbors = [
      [c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]
    ];
    for (let i = 0; i < 4; i++) {
      const nc = neighbors[i][0];
      const nr = neighbors[i][1];
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
        if (lines[nr][nc] !== " " && dist[nr][nc] === -1) {
          dist[nr][nc] = d + 1;
          queue.push(nc, nr);
        }
      }
    }
  }

  // 5 & 6. Cells
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = lines[r][c];
      if (ch === " ") continue;

      let tone = dMax > 0 ? dist[r][c] / dMax : 1;
      if (toneBias[ch] !== undefined) {
        tone += toneBias[ch];
      }
      tone = clamp(tone, 0, 1);

      const jitter = ((hash(c, r, seed + 2) * 3) | 0) - 1;
      let glyph = ch;
      let rim = false;
      let accent = false;

      const boundary = isBoundary[r][c] === 1;

      if (specialChars.has(ch)) {
        glyph = "o";
        rim = false;
        accent = false;
        tone = 0.15;
      } else if (boundary && (spec.keepBoundaryChars || !massChars.has(ch))) {
        glyph = ch;
        rim = true;
        accent = false;
      } else if (ch === "#" || ch === "@") {
        const idx = clamp(Math.floor(tone * (bodyRamp.length - 0.01)) + jitter, 0, bodyRamp.length - 1);
        glyph = bodyRamp[idx];
        rim = false;
        accent = hash(c, r, seed) < accentRate;
      } else if (ch === "%") {
        const idx = clamp(Math.floor(tone * (wingRamp.length - 0.01)) + jitter, 0, wingRamp.length - 1);
        glyph = wingRamp[idx];
        rim = false;
        accent = hash(c, r, seed + 1) < accentRate;
      } else if (ch === "*") {
        const idx = clamp(Math.floor(tone * (bodyRamp.length - 0.01)) + jitter, 0, bodyRamp.length - 1);
        glyph = bodyRamp[idx];
        rim = false;
        accent = true;
      } else if (ch === "~") {
        const idx = clamp(Math.floor(tone * (tailRamp.length - 0.01)), 0, tailRamp.length - 1);
        glyph = tailRamp[idx];
        rim = false;
        accent = false;
      } else {
        if (boundary) {
          glyph = ch;
          rim = true;
          accent = false;
        } else {
          const idx = clamp(Math.floor(tone * (bodyRamp.length - 0.01)) + jitter, 0, bodyRamp.length - 1);
          glyph = bodyRamp[idx];
          rim = false;
          accent = hash(c, r, seed) < accentRate;
        }
      }

      cells.push({ col: c, row: r, glyph, tone, rim, accent });
    }
  }

  return { cols, rows, cells };
}

const BIRD_FRAME_CACHE = new Map();

function birdFrame(id, kind, index) {
  const key = id + "|" + kind + "|" + index;
  const cached = BIRD_FRAME_CACHE.get(key);
  if (cached !== undefined) return cached;

  const species = SPECIES_BY_ID.get(id);
  if (!species) {
    throw new Error("texture: unknown species " + id);
  }

  let lines = null;
  if (kind === "flight") {
    lines = species.frames[index];
  } else if (kind === "perch") {
    if (!species.perch) {
      BIRD_FRAME_CACHE.set(key, null);
      return null;
    }
    lines = species.perch[index];
  } else {
    throw new Error("texture: unknown frame kind " + kind);
  }

  if (!lines) {
    BIRD_FRAME_CACHE.set(key, null);
    return null;
  }

  const spec = {
    bodyRamp: SKIN_RAMP,
    wingRamp: WING_RAMP,
    tailRamp: TAIL_RAMP,
    accentRate: 0.04,
    seed: 11,
    toneBias: BIRD_TONE_BIAS
  };

  const frame = buildFrame(lines, spec);
  BIRD_FRAME_CACHE.set(key, frame);
  return frame;
}

const TREE_CELLS_CACHE = new Map();

function treeCells(id) {
  const cached = TREE_CELLS_CACHE.get(id);
  if (cached !== undefined) return cached;

  const tmpl = TREE_TEMPLATES.find(t => t.id === id);
  if (!tmpl) {
    throw new Error("texture: unknown tree template " + id);
  }

  // Wood mask: replace LEAF_CHARS with space
  const woodLines = tmpl.lines.map(line => {
    let out = "";
    for (let i = 0; i < line.length; i++) {
      out += LEAF_CHARS.has(line[i]) ? " " : line[i];
    }
    return out;
  });

  // Leaf mask: replace WOOD_CHARS with space
  const leafLines = tmpl.lines.map(line => {
    let out = "";
    for (let i = 0; i < line.length; i++) {
      out += WOOD_CHARS.has(line[i]) ? " " : line[i];
    }
    return out;
  });

  const woodSpec = {
    bodyRamp: BARK_RAMP,
    wingRamp: BARK_RAMP,
    tailRamp: BARK_RAMP,
    accentRate: 0.05,
    seed: 23
  };
  const wood = buildFrame(woodLines, woodSpec);
  for (const c of wood.cells) {
    if (c.row % 3 === 1) {
      c.tone = clamp(c.tone * 0.78, 0, 1);
    }
  }

  const leafSpec = {
    bodyRamp: LEAF_RAMP,
    wingRamp: LEAF_RAMP,
    tailRamp: LEAF_RAMP,
    accentRate: 0.12,
    seed: 37,
    rimChars: new Set(".,'*o"),
    massChars: new Set("*o"),
    specialChars: new Set(),
    keepBoundaryChars: true
  };
  const leaf = buildFrame(leafLines, leafSpec);

  const result = { wood, leaf };
  TREE_CELLS_CACHE.set(id, result);
  return result;
}

export {
  SKIN_RAMP,
  WING_RAMP,
  TAIL_RAMP,
  BARK_RAMP,
  LEAF_RAMP,
  MASS_CHARS,
  RIM_CHARS,
  SPECIAL_CHARS,
  ADVANCE_RATIO,
  buildFrame,
  birdFrame,
  treeCells
};
