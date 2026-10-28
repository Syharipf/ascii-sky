const TAU = Math.PI * 2;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function parseHex(hex) {
  const str = typeof hex === "string" ? hex : (hex ? String(hex) : "#000000");
  const h = str.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0
  ];
}

function toHex(r, g, b) {
  const R = clamp(Math.round(r), 0, 255).toString(16).padStart(2, "0");
  const G = clamp(Math.round(g), 0, 255).toString(16).padStart(2, "0");
  const B = clamp(Math.round(b), 0, 255).toString(16).padStart(2, "0");
  return `#${R}${G}${B}`;
}

function lerpColor(c1, c2, t) {
  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);
  return toHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t
  );
}

function blendHex(a, b, t) {
  return lerpColor(a, b, clamp(t, 0, 1));
}

const PALETTES = {
  morning: {
    skyTop: "#1b2a4a",
    skyMid: "#6c86ad",
    skyHorizon: "#f0a868",
    haze: "#f7d6a8",
    cloud: "#f7d9c4",
    cloudShadow: "#a06e78",
    sun: "#ffd27a",
    moon: "#cfe0ff",
    star: "#cfd8ff",
    rain: "#dce9f5",
    snow: "#ffffff",
    wood: "#171b22",
    leaf: "#22302a",
    bird: "#6f8296",
    glow: "#ffb86c",
    light: 0.92,
    nightness: 0.0
  },
  day: {
    skyTop: "#2b6aa6",
    skyMid: "#72b4dd",
    skyHorizon: "#cfefff",
    haze: "#dff4ff",
    cloud: "#ffffff",
    cloudShadow: "#a7c2d4",
    sun: "#fff3b0",
    moon: "#d8e8ff",
    star: "#cfe6ff",
    rain: "#d6f1ff",
    snow: "#ffffff",
    wood: "#1d241f",
    leaf: "#2f4732",
    bird: "#5f7a8c",
    glow: "#a0eaff",
    light: 1.05,
    nightness: 0.0
  },
  evening: {
    skyTop: "#241a3f",
    skyMid: "#6a406f",
    skyHorizon: "#e8735a",
    haze: "#e7a27f",
    cloud: "#d9a2b2",
    cloudShadow: "#6e4a5e",
    sun: "#ff9a5a",
    moon: "#d8e8ff",
    star: "#cfe6ff",
    rain: "#e9b3b6",
    snow: "#f6dfe6",
    wood: "#16111c",
    leaf: "#2a2030",
    bird: "#8a7288",
    glow: "#ff7052",
    light: 0.86,
    nightness: 0.55
  },
  night: {
    skyTop: "#03050f",
    skyMid: "#0a1430",
    skyHorizon: "#16294a",
    haze: "#1d3350",
    cloud: "#33445f",
    cloudShadow: "#1a2438",
    sun: "#ffd27a",
    moon: "#d8e8ff",
    star: "#cfe6ff",
    rain: "#7fa7c9",
    snow: "#dcecff",
    wood: "#05090f",
    leaf: "#0c1520",
    bird: "#4a5c72",
    glow: "#36b0cc",
    light: 0.70,
    nightness: 1.0
  }
};

const PHASE_SEQUENCE = ["morning", "day", "evening", "night"];

function lerpPalette(p1, p2, t) {
  const result = {};
  for (const k of Object.keys(p1)) {
    if (typeof p1[k] === "number") {
      result[k] = p1[k] + (p2[k] - p1[k]) * t;
    } else {
      result[k] = lerpColor(p1[k], p2[k], t);
    }
  }
  return result;
}

class Environment {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.elapsed = 0;

    // Weather schedule
    this.weatherKind = "clear"; // "clear" | "rain" | "snow"
    this.intervalStart = 0;
    this.intervalDuration = 180 + this.random() * 180; // dry 180-360s
    this.peakIntensity = 0.45 + this.random() * 0.40;  // 0.45-0.85
  }

  advance(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    this.elapsed += seconds;

    while (this.elapsed >= this.intervalStart + this.intervalDuration) {
      this.intervalStart += this.intervalDuration;
      if (this.weatherKind === "clear") {
        this.weatherKind = this.random() < 0.35 ? "snow" : "rain";
        this.intervalDuration = 60 + this.random() * 60;   // wet 60-120s
        this.peakIntensity = 0.45 + this.random() * 0.40;  // peak 0.45-0.85
      } else {
        this.weatherKind = "clear";
        this.intervalDuration = 180 + this.random() * 180; // dry 180-360s
      }
    }
  }

  currentPrecipitationIntensity() {
    if (this.weatherKind === "clear") return 0;
    const t = this.elapsed - this.intervalStart;
    const dur = this.intervalDuration;
    const fade = 10;
    if (t < fade) {
      return this.peakIntensity * smoothstep(0, fade, t);
    }
    if (t > dur - fade) {
      return this.peakIntensity * (1 - smoothstep(dur - fade, dur, t));
    }
    return this.peakIntensity;
  }

  snapshot({ phase = "auto", weather = "auto" } = {}) {
    const cycleSeconds = this.elapsed % 1200;
    let autoPhaseIndex = Math.floor(cycleSeconds / 300);
    if (autoPhaseIndex > 3) autoPhaseIndex = 3;
    const autoPhase = PHASE_SEQUENCE[autoPhaseIndex];

    const phaseOffset = cycleSeconds - autoPhaseIndex * 300;
    let transition = 0;
    if (phaseOffset >= 270) {
      transition = smoothstep(270, 300, phaseOffset);
    }

    const nextPhaseIndex = (autoPhaseIndex + 1) % 4;
    const basePalette = PALETTES[autoPhase];
    const targetPalette = PALETTES[PHASE_SEQUENCE[nextPhaseIndex]];
    const autoPalette = transition > 0 ? lerpPalette(basePalette, targetPalette, transition) : basePalette;

    let effectivePhase = autoPhase;
    let effectivePalette = autoPalette;
    let effectiveTransition = transition;
    let effectiveCycleSeconds = cycleSeconds;

    if (phase !== "auto" && PALETTES[phase]) {
      effectivePhase = phase;
      effectivePalette = PALETTES[phase];
      effectiveTransition = 0;
      effectiveCycleSeconds = PHASE_SEQUENCE.indexOf(phase) * 300 + 150;
    }

    let resolvedWeather = this.weatherKind;
    let rainIntensity = 0;
    let snowIntensity = 0;
    if (weather === "clear") {
      resolvedWeather = "clear";
    } else if (weather === "rain") {
      resolvedWeather = "rain";
      rainIntensity = 0.65;
    } else if (weather === "snow") {
      resolvedWeather = "snow";
      snowIntensity = 0.65;
    } else {
      const precip = this.currentPrecipitationIntensity();
      if (this.weatherKind === "rain") {
        rainIntensity = precip;
      } else if (this.weatherKind === "snow") {
        snowIntensity = precip;
      }
    }

    return {
      phase: effectivePhase,
      weather: resolvedWeather,
      cycleSeconds,
      effectiveCycleSeconds,
      transition: effectiveTransition,
      rainIntensity,
      snowIntensity,
      palette: effectivePalette
    };
  }
}

export {
  Environment,
  PALETTES,
  PHASE_SEQUENCE,
  lerpPalette,
  lerpColor,
  blendHex
};
