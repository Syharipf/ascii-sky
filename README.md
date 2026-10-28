# Langit ASCII

Side-view ASCII sky wallpaper for KDE Plasma 6 featuring wild, ornamental, and mythic birds, branch perching, distance scaling, drifting clouds, a 20-minute day/night cycle, and dynamic weather (rain and snow).

Sibling project of [Laut ASCII](https://github.com/syharipf/ascii-ocean).

## Features

- **13 Handcrafted Avian Species**:
  - *Wild*: Sparrow (Pipit), Swallow (Walet), Dove (Merpati), Crow (Gagak), Kingfisher (Raja Udang), Eagle (Elang), Hornbill (Rangkong)
  - *Ornamental*: Parrot (Nuri), Cockatoo (Kakatua), Bird of Paradise (Cendrawasih)
  - *Mythic / Rare*: Pterodactyl, Dragon (Naga), Phoenix
- **True Side-View Profiles**: Horizontal flight with 3-phase wing flapping (up, level, down), gliding, perch idle & preening animations.
- **Tree Branch Perching**: Trees rooted at the bottom edge with branches and anchors where birds land, idle, preen, and launch back into flight.
- **Perspective Depth Tiers**: Near, mid, and far tiers with proportional font sizing (`Noto Sans Mono`), speed scaling, and depth sorting.
- **20-Minute Atmospheric Cycle**: Smooth 30-second transitions between morning, day, evening, and night palettes, with celestial sun and moon arcs.
- **Dynamic Weather**: Stochastic rain showers with splash impacts and drifting gentle snowfall settling on branches.
- **Interactive**: Cursor hover startles flying birds; clicks flush perched birds into flight.
- **Efficiency & Auto-Pause**: Adaptive quality level and automatic freezing when application windows are visible on the desktop.

## Installation

Install the Plasma 6 wallpaper package using `kpackagetool6`:

```bash
kpackagetool6 --type Plasma/Wallpaper --install ./package
```

To update an existing installation:

```bash
kpackagetool6 --type Plasma/Wallpaper --upgrade ./package
```

To activate:
1. Right-click on your desktop and select **Configure Desktop and Wallpaper...**
2. In the **Wallpaper Type** dropdown, select **Langit ASCII**.
3. Choose your preferred bird pool, effects, and frame rate, then click **Apply**.

## Standalone Preview

Preview the wallpaper interactively without installing:

```bash
qml6 preview.qml
```

Controls in preview overlay:
- Species dropdown (All, Wild & Ornamental, Mythic Only, or individual species)
- Toggle clouds, dynamic weather, and mouse interaction
- Force morning / day / evening / night phases or clear / rain / snow weather
- Automated 12-stage tour mode (2s per stage)

## Checks & Verification

Run automated test suites and visual sheet generators:

```bash
# Node test suites
node --test checks/sprite-check.mjs
node --test checks/environment-check.mjs
node --test checks/sky-check.mjs

# Visual sprite preview sheet (captures to /tmp/langit-species.png)
qml6 checks/sprite-preview.qml

# Native Qt life cycle and verification check
qml6 checks/preview-check.qml

# 240-frame atmospheric tour capture (writes /tmp/langit-frames/*.png)
qml6 checks/capture-frames.qml

# Performance benchmark
qml6 checks/benchmark.qml
```

## License

MIT License. Copyright (c) 2026 Syharipf.
