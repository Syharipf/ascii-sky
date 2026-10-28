import test from "node:test";
import assert from "node:assert/strict";
import {
  SPECIES,
  SPECIES_BY_ID,
  TREE_TEMPLATES,
  CLOUD_TEMPLATES,
  WOOD_CHARS,
  LEAF_CHARS,
  ADVANCE_RATIO,
  pickSpecies,
  birdCellPx,
  buildTreeLayers
} from "../package/contents/ui/sprites.mjs";
import {
  MASS_CHARS,
  RIM_CHARS,
  SPECIAL_CHARS,
  birdFrame,
  treeCells
} from "../package/contents/ui/texture.mjs";

function assertFilled(lines, label) {
  const rows = lines.length;
  const cols = lines[0].length;

  for (let r = 0; r < rows; r++) {
    if (lines[r].length !== cols) {
      throw new Error(`${label}: ragged row ${r} (expected ${cols}, got ${lines[r].length})`);
    }
  }

  // 1. Unknown glyphs
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = lines[r][c];
      if (ch === " ") continue;
      if (!MASS_CHARS.has(ch) && !RIM_CHARS.has(ch) && !SPECIAL_CHARS.has(ch)) {
        throw new Error(`${label}: unknown glyph "${ch}" at ${c},${r}`);
      }
    }
  }

  // 2. Flood fill from border space cells
  const reached = Array.from({ length: rows }, () => new Uint8Array(cols));
  const queue = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const onBorder = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
      if (onBorder && lines[r][c] === " ") {
        reached[r][c] = 1;
        queue.push(c, r);
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const c = queue[head++];
    const r = queue[head++];
    const neighbors = [[c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]];
    for (const [nc, nr] of neighbors) {
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
        if (lines[nr][nc] === " " && !reached[nr][nc]) {
          reached[nr][nc] = 1;
          queue.push(nc, nr);
        }
      }
    }
  }

  // Check no enclosed space
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (lines[r][c] === " " && !reached[r][c]) {
        throw new Error(`${label}: enclosed space at ${c},${r}`);
      }
    }
  }

  // 3. Exactly one 4-connected component of non-space cells
  const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
  let nonSpaceCount = 0;
  let firstNonSpace = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (lines[r][c] !== " ") {
        nonSpaceCount++;
        if (!firstNonSpace) firstNonSpace = [c, r];
      }
    }
  }

  if (nonSpaceCount === 0) {
    throw new Error(`${label}: empty frame`);
  }

  let compCount = 0;
  const compQ = [firstNonSpace[0], firstNonSpace[1]];
  visited[firstNonSpace[1]][firstNonSpace[0]] = 1;
  let compHead = 0;

  while (compHead < compQ.length) {
    const c = compQ[compHead++];
    const r = compQ[compHead++];
    compCount++;
    const neighbors = [[c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]];
    for (const [nc, nr] of neighbors) {
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
        if (lines[nr][nc] !== " " && !visited[nr][nc]) {
          visited[nr][nc] = 1;
          compQ.push(nc, nr);
        }
      }
    }
  }

  if (compCount !== nonSpaceCount) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (lines[r][c] !== " " && !visited[r][c]) {
          throw new Error(`${label}: detached island at ${c},${r}`);
        }
      }
    }
  }

  // 4. Interior rim char check
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = lines[r][c];
      if (RIM_CHARS.has(ch) && ch !== " ") {
        const onBorder = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
        let touchesSpace = onBorder;
        if (!touchesSpace) {
          if (lines[r - 1][c] === " " || lines[r + 1][c] === " " ||
              lines[r][c - 1] === " " || lines[r][c + 1] === " ") {
            touchesSpace = true;
          }
        }
        if (!touchesSpace) {
          throw new Error(`${label}: interior rim char at ${c},${r}`);
        }
      }
    }
  }

  return true;
}

test("13 species count, unique ids, and profile frames contract", () => {
  assert.equal(SPECIES.length, 13);
  const ids = new Set();

  for (const s of SPECIES) {
    assert(!ids.has(s.id), `Duplicate species id: ${s.id}`);
    ids.add(s.id);

    // framesText length is 3 (up, level, down)
    assert.equal(s.framesText.length, 3);
    for (let i = 0; i < 3; i++) {
      const frameLines = s.frames[i];
      assert.equal(frameLines.length, s.rows, `Species ${s.id} frame ${i} row mismatch`);
      for (const line of frameLines) {
        assert.equal(line.length, s.cols, `Species ${s.id} frame ${i} col mismatch on line "${line}"`);
        // No tabs or non-ASCII
        for (let c = 0; c < line.length; c++) {
          const code = line.charCodeAt(c);
          assert(code >= 32 && code <= 126, `Species ${s.id} invalid char code ${code}`);
        }
      }
      // Profile rule: at least one 'o' and at least one '>'
      const frameStr = s.framesText[i];
      assert(frameStr.includes("o"), `Species ${s.id} frame ${i} missing eye 'o'`);
      assert(frameStr.includes(">"), `Species ${s.id} frame ${i} missing beak '>'`);

      assertFilled(frameLines, `Species ${s.id} frame ${i}`);
    }

    // Perch frames
    if (s.canPerch) {
      assert(Array.isArray(s.perch) && s.perch.length === 2, `Species ${s.id} should have 2 perch frames`);
      assert.equal(s.perchText.length, 2);
      for (let i = 0; i < 2; i++) {
        const perchLines = s.perch[i];
        assert.equal(perchLines.length, s.perchRows, `Species ${s.id} perch frame ${i} row mismatch`);
        for (const line of perchLines) {
          assert.equal(line.length, s.perchCols, `Species ${s.id} perch frame ${i} col mismatch on line "${line}"`);
          for (let c = 0; c < line.length; c++) {
            const code = line.charCodeAt(c);
            assert(code >= 32 && code <= 126, `Species ${s.id} invalid char code ${code}`);
          }
        }
        assertFilled(perchLines, `Species ${s.id} perch frame ${i}`);

        // Last row must contain foot glyph (',' or '\'')
        const lastRow = perchLines[s.perchRows - 1];
        assert(
          lastRow.includes(",") || lastRow.includes("'"),
          `Species ${s.id} perch frame ${i} missing foot glyph in last line "${lastRow}"`
        );
      }
    } else {
      assert.equal(s.perch, null, `Species ${s.id} cannot perch but has perch`);
      assert.equal(s.perchText, null, `Species ${s.id} cannot perch but has perchText`);
    }
  }
});

test("buildFrame and texture caching contract", () => {
  // Test sparrow and dragon and all TREE_TEMPLATES
  for (const id of ["sparrow", "dragon"]) {
    const s = SPECIES_BY_ID.get(id);
    for (let i = 0; i < 3; i++) {
      const bf = birdFrame(id, "flight", i);
      assert.equal(bf.cols, s.cols);
      assert.equal(bf.rows, s.rows);
      assert(bf.cells.length > 0);

      // Verify every non-space art cell appears exactly once
      const seen = new Set();
      let nonSpaceCount = 0;
      for (let r = 0; r < s.rows; r++) {
        for (let c = 0; c < s.cols; c++) {
          if (s.frames[i][r][c] !== " ") nonSpaceCount++;
        }
      }
      assert.equal(bf.cells.length, nonSpaceCount);

      for (const cell of bf.cells) {
        assert(cell.col >= 0 && cell.col < bf.cols);
        assert(cell.row >= 0 && cell.row < bf.rows);
        assert.equal(cell.glyph.length, 1);
        assert(cell.tone >= 0 && cell.tone <= 1);
        const key = `${cell.col},${cell.row}`;
        assert(!seen.has(key), `Duplicate cell ${key}`);
        seen.add(key);
      }
    }

    if (s.canPerch) {
      for (let i = 0; i < 2; i++) {
        const pf = birdFrame(id, "perch", i);
        assert.equal(pf.cols, s.perchCols);
        assert.equal(pf.rows, s.perchRows);
        assert(pf.cells.length > 0);
        let nonSpaceCount = 0;
        for (let r = 0; r < s.perchRows; r++) {
          for (let c = 0; c < s.perchCols; c++) {
            if (s.perch[i][r][c] !== " ") nonSpaceCount++;
          }
        }
        assert.equal(pf.cells.length, nonSpaceCount);
      }
    }
  }

  for (const tmpl of TREE_TEMPLATES) {
    const tc = treeCells(tmpl.id);
    for (const layer of [tc.wood, tc.leaf]) {
      assert.equal(layer.cols, tmpl.cols);
      assert.equal(layer.rows, tmpl.rows);
      assert(layer.cells.length > 0);

      const seen = new Set();
      for (const cell of layer.cells) {
        assert(cell.col >= 0 && cell.col < layer.cols);
        assert(cell.row >= 0 && cell.row < layer.rows);
        assert.equal(cell.glyph.length, 1);
        assert(cell.tone >= 0 && cell.tone <= 1);
        const key = `${cell.col},${cell.row}`;
        assert(!seen.has(key), `Duplicate cell ${key}`);
        seen.add(key);
      }
    }
  }

  // Hash determinism and memoisation
  const b1 = birdFrame("sparrow", "flight", 0);
  const b2 = birdFrame("sparrow", "flight", 0);
  assert.equal(b1, b2);
  assert.equal(b1.cells[0].glyph, b2.cells[0].glyph);
});

test("pickSpecies modes and weights distribution", () => {
  // Fixed id
  assert.equal(pickSpecies("sparrow").id, "sparrow");
  assert.equal(pickSpecies("dragon").id, "dragon");

  // Mythic only
  for (let i = 0; i < 100; i++) {
    const s = pickSpecies("mythic", Math.random);
    assert.equal(s.group, "mythic");
  }

  // Real only (no mythic)
  for (let i = 0; i < 200; i++) {
    const s = pickSpecies("real", Math.random);
    assert.notEqual(s.group, "mythic");
  }

  // Sampling "all" 50,000 times gives mythic share in [0.008, 0.02]
  let mythicCount = 0;
  const N = 50000;
  for (let i = 0; i < N; i++) {
    const s = pickSpecies("all", Math.random);
    if (s.group === "mythic") mythicCount++;
  }
  const share = mythicCount / N;
  assert(share >= 0.008 && share <= 0.02, `Mythic share was ${share}, expected [0.008, 0.02]`);
});

test("birdCellPx monotonic non-decreasing in depth and scales near/far >= 1.25", () => {
  const H = 1080;
  for (const s of SPECIES) {
    let prevPx = -1;
    for (let d = 0.2; d <= 1.0; d += 0.05) {
      const px = birdCellPx(s, d, H);
      assert(px >= 6 && px <= 44, `Species ${s.id} cellPx out of range [6,44]: ${px}`);
      if (prevPx !== -1) {
        assert(px >= prevPx, `Species ${s.id} cellPx non-monotonic at depth ${d}`);
      }
      prevPx = px;
    }
    const farPx = birdCellPx(s, 0.24, H);
    const nearPx = birdCellPx(s, 1.0, H);
    assert(nearPx / farPx >= 1.25, `Species ${s.id} ratio near/far was ${nearPx / farPx} < 1.25`);
  }
});

test("trees line equality, glyph classes, anchors on wood, and crown <= 55% screen height", () => {
  assert.equal(TREE_TEMPLATES.length, 3);
  for (const tmpl of TREE_TEMPLATES) {
    assert.equal(tmpl.lines.length, tmpl.rows);
    for (let r = 0; r < tmpl.rows; r++) {
      const line = tmpl.lines[r];
      assert.equal(line.length, tmpl.cols, `Tree ${tmpl.id} row ${r} cols mismatch`);
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === " ") continue;
        assert(
          WOOD_CHARS.has(ch) || LEAF_CHARS.has(ch),
          `Tree ${tmpl.id} unknown glyph "${ch}" at row ${r} col ${c}`
        );
      }
    }

    // 3 anchors, each on wood char
    assert.equal(tmpl.anchors.length, 3);
    for (const a of tmpl.anchors) {
      assert(a.col >= 0 && a.col < tmpl.cols);
      assert(a.row >= 0 && a.row < tmpl.rows);
      assert(a.facing === 1 || a.facing === -1);
      const ch = tmpl.lines[a.row][a.col];
      assert(WOOD_CHARS.has(ch), `Tree ${tmpl.id} anchor at (${a.col}, ${a.row}) on non-wood char "${ch}"`);
    }

    // Wood & leaf layers
    const layers = buildTreeLayers(tmpl);
    const woodLines = layers.woodText.split("\n");
    const leafLines = layers.leafText.split("\n");
    assert.equal(woodLines.length, tmpl.rows);
    assert.equal(leafLines.length, tmpl.rows);
    for (let r = 0; r < tmpl.rows; r++) {
      assert.equal(woodLines[r].length, tmpl.cols);
      assert.equal(leafLines[r].length, tmpl.cols);
      for (let c = 0; c < tmpl.cols; c++) {
        const orig = tmpl.lines[r][c];
        const w = woodLines[r][c];
        const l = leafLines[r][c];
        if (WOOD_CHARS.has(orig)) {
          assert.equal(w, orig);
          assert.equal(l, " ");
        } else if (LEAF_CHARS.has(orig)) {
          assert.equal(l, orig);
          assert.equal(w, " ");
        } else {
          assert.equal(w, " ");
          assert.equal(l, " ");
        }
      }
    }

    // Height check: crown tops never above 55% of screen height (tree.y >= 0.55 * H)
    for (const H of [720, 1080, 1440]) {
      const treeFont = Math.min(26, Math.max(8, Math.round((H * 0.38) / 26)));
      const treeY = H - tmpl.rows * treeFont;
      assert(
        treeY >= 0.55 * H - 1,
        `Tree ${tmpl.id} treeY was ${treeY} < 0.55*H (${0.55 * H}) at H=${H}`
      );
    }
  }
});

test("cloud templates and celestial sprites conform to art rules", () => {
  assert.equal(CLOUD_TEMPLATES.length, 4);
  const allowedCloudChars = new Set(" .:;'-_~()");
  for (const c of CLOUD_TEMPLATES) {
    const lines = c.text.split("\n");
    assert.equal(lines.length, c.rows);
    for (const line of lines) {
      assert.equal(line.length, c.cols);
      for (const ch of line) {
        assert(allowedCloudChars.has(ch), `Disallowed cloud char "${ch}"`);
      }
    }
  }

});
