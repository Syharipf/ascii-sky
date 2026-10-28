import test from "node:test";
import assert from "node:assert/strict";
import { SkyEngine, FLY_SLOTS, MAX_PERCHED } from "../package/contents/ui/engine.mjs";
import { SPECIES_BY_ID } from "../package/contents/ui/sprites.mjs";

// Deterministic LCG
function makeLCG(seed = 123456789) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test("resize rules and structure", () => {
  const lcg = makeLCG();
  const engine = new SkyEngine({ random: lcg });

  // Invalid sizes do nothing
  engine.resize(0, 0);
  assert.equal(engine.w, 0);
  assert.equal(engine.h, 0);

  engine.resize(-1920, 1080);
  assert.equal(engine.w, 0);

  // Valid 1920x1080
  engine.resize(1920, 1080);
  assert.equal(engine.w, 1920);
  assert.equal(engine.h, 1080);
  assert.equal(engine.birds.length, 10);
  assert.equal(engine.trees.length, 10);
  assert.equal(engine.stars.length, 80);
  assert.equal(engine.clouds.length, 7);
  assert(engine.perches.length >= 12 && engine.perches.length <= 18,
         `perch count out of range: ${engine.perches.length}`);

  // 3 seeded perched
  const perched = engine.birds.filter(b => b.mode === "perched");
  assert.equal(perched.length, 3);
});

test("run 30 seconds: finite coordinates, perch uniqueness and bounds", () => {
  const lcg = makeLCG(42);
  const engine = new SkyEngine({ random: lcg });
  engine.resize(1920, 1080);

  const dt = 1 / 30;
  for (let step = 0; step < 30 * 30; step++) {
    const frame = engine.advance(dt);
    assert.equal(frame.birds.length, 10);

    const perchedOccupants = new Set();
    for (const b of frame.birds) {
      assert(Number.isFinite(b.x), `b.x not finite at step ${step}: ${b.x}`);
      assert(Number.isFinite(b.y), `b.y not finite: ${b.y}`);
      assert(Number.isFinite(b.depth), `b.depth not finite: ${b.depth}`);
      assert(Number.isFinite(b.cellPx), `b.cellPx not finite: ${b.cellPx}`);

      if (b.mode === "perched") {
        assert(b.perchId !== -1);
        assert(!perchedOccupants.has(b.perchId), `Duplicate perched bird on perch ${b.perchId}`);
        perchedOccupants.add(b.perchId);

        const perch = engine.perches.find(p => p.id === b.perchId);
        assert(perch, `Perch ${b.perchId} not found`);
        assert(Math.abs(b.x - perch.x) < 0.01, `Perched b.x ${b.x} != perch.x ${perch.x}`);
        assert(Math.abs(b.y - perch.y) < 0.01, `Perched b.y ${b.y} != perch.y ${perch.y}`);
      }

      if (b.mode !== "wait") {
        // inside expanded viewport
        assert(b.x >= -b.spriteW - 100 && b.x <= 1920 + b.spriteW + 100);
        assert(b.y >= -100 && b.y <= 1080 + 100);
      }
    }
  }
});

test("perspective scaling check", () => {
  const engine = new SkyEngine();
  engine.resize(1920, 1080);

  const sparrow = SPECIES_BY_ID.get("sparrow");
  const dragon = SPECIES_BY_ID.get("dragon");

  for (const s of [sparrow, dragon]) {
    const pxFar = Math.round(engine.birdBaseFont * s.size * (0.5 + 0.6 * 0.25));
    const pxMid = Math.round(engine.birdBaseFont * s.size * (0.5 + 0.6 * 0.60));
    const pxNear = Math.round(engine.birdBaseFont * s.size * (0.5 + 0.6 * 1.00));

    assert(pxNear > pxMid);
    assert(pxMid > pxFar);
    assert(pxNear / pxFar >= 1.25);
  }
});

test("forced landing, perching, and pointer takeoff sequence", () => {
  const engine = new SkyEngine();
  engine.resize(1920, 1080);

  // Clear all perches & birds
  for (const p of engine.perches) {
    p.occupant = -1;
    p.reserved = -1;
  }
  for (const b of engine.birds) {
    b.mode = "fly";
    b.perchInterest = false;
    b.perchId = -1;
  }

  // Force bird 0 to land on perch 0
  const b0 = engine.birds[0];
  b0.species = SPECIES_BY_ID.get("sparrow");
  b0.sprite = b0.species;
  b0.mode = "fly";
  b0.flyTime = 5;
  b0.perchInterest = true;
  b0.x = engine.perches[0].x + 300;
  b0.y = 0.25 * engine.h;

  let reachedLand = false;
  let reachedPerched = false;

  for (let i = 0; i < 300; i++) {
    engine.advance(1 / 30);
    if (b0.mode === "land") reachedLand = true;
    if (b0.mode === "perched") {
      reachedPerched = true;
      break;
    }
  }

  assert(reachedLand, "Bird 0 did not transition to land");
  assert(reachedPerched, "Bird 0 did not transition to perched");
  assert.equal(b0.mode, "perched");
  assert.notEqual(b0.perchId, -1);
  const p = engine.perches.find(perch => perch.id === b0.perchId);
  assert.equal(p.occupant, b0.slot);

  // Move pointer directly over the perched bird to scare it
  engine.onPointerMove(b0.x, b0.y);
  let reachedTakeoff = false;
  let returnedToFly = false;

  for (let i = 0; i < 90; i++) {
    engine.advance(1 / 30);
    if (b0.mode === "takeoff") reachedTakeoff = true;
    if (b0.mode === "fly") {
      returnedToFly = true;
      break;
    }
  }

  assert(reachedTakeoff, "Bird 0 did not take off when startled");
  assert(returnedToFly, "Bird 0 did not return to fly mode after takeoff");
  assert.equal(p.occupant, -1, "Perch occupant was not cleared");
});

test("click flush test", () => {
  const engine = new SkyEngine();
  engine.resize(1920, 1080);

  // Ensure 2 birds are perched on perches 0 and 1
  const b0 = engine.birds[0];
  const b1 = engine.birds[1];
  const p0 = engine.perches[0];
  const p1 = engine.perches[1];

  b0.mode = "perched";
  b0.perchId = p0.id;
  b0.x = p0.x;
  b0.y = p0.y;
  p0.occupant = b0.slot;

  b1.mode = "perched";
  b1.perchId = p1.id;
  b1.x = p1.x;
  b1.y = p1.y;
  p1.occupant = b1.slot;

  // Click between them
  const midX = (p0.x + p1.x) / 2;
  const midY = (p0.y + p1.y) / 2;
  engine.onPointerDown(midX, midY);

  // Advance 2s (60 steps)
  for (let i = 0; i < 60; i++) {
    engine.advance(1 / 30);
  }

  assert.notEqual(b0.mode, "perched", "Bird 0 should have flushed");
  assert.notEqual(b1.mode, "perched", "Bird 1 should have flushed");
});

test("fixed kind selection and pool filtering", () => {
  const engine = new SkyEngine();
  engine.resize(1920, 1080);

  engine.setBirdKind("dragon");
  // Dragon cannot perch; advance 4s (120 steps)
  for (let i = 0; i < 120; i++) {
    engine.advance(1 / 30);
  }
  for (const b of engine.birds) {
    assert.equal(b.species.id, "dragon");
    assert.notEqual(b.mode, "perched");
  }

  engine.setBirdKind("mythic");
  for (let i = 0; i < 60; i++) {
    engine.advance(1 / 30);
  }
  for (const b of engine.birds) {
    assert.equal(b.species.group, "mythic");
  }
});

test("advance dt clamping, zero advance, showWeather flag, and NaN recovery", () => {
  const engine = new SkyEngine();
  engine.resize(1920, 1080);

  const t0 = engine.environment.elapsed;
  engine.advance(0);
  assert.equal(engine.environment.elapsed, t0);

  // Single large advance of 0.5s clamped to 0.1s
  engine.advance(0.5);
  assert.equal(Math.round((engine.environment.elapsed - t0) * 1000) / 1000, 0.1);

  // showWeather false forces rainIntensity and snowIntensity to 0
  engine.setShowWeather(false);
  const frame = engine.advance(0.1, { weather: "rain" });
  assert.equal(frame.rainIntensity, 0);
  assert.equal(frame.snowIntensity, 0);

  // NaN recovery
  engine.birds[0].x = NaN;
  engine.advance(0.1);
  assert(Number.isFinite(engine.birds[0].x), "NaN bird coordinate was not recovered");
});
