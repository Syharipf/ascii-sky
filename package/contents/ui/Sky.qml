import QtQuick
import "engine.mjs" as Engine

Item {
    id: sky
    clip: true

    property string birdKind: "all"
    property bool showClouds: true
    property bool showWeather: true
    property bool mouseInteraction: true
    property int fps: 30
    property bool pauseOnAppOpen: true
    property bool running: true
    property double speed: 1.0

    // Preview overrides
    property string previewPhase: "auto"
    property string previewWeather: "auto"
    onPreviewPhaseChanged: advanceFrame(0.001)
    onPreviewWeatherChanged: advanceFrame(0.001)

    readonly property int targetFps: Math.max(15, Math.min(60, fps))
    property bool hasVisibleWindows: false
    readonly property bool animating: running && visible && width > 0 && height > 0
                                      && (!pauseOnAppOpen || !hasVisibleWindows)

    property var engine: null
    property var frame: null
    property int frameSerial: 0
    property double lastUpdateMs: 0
    property int qualityLevel: 0

    // Evaluation window for qualityLevel (every 5s active)
    property var updateCosts: []
    property double lastQualityCheckMs: 0
    property double lowCostDuration: 0

    // Palette & Phase state from engine.frame
    property var currentPalette: {
        sky.frameSerial;
        return frame ? frame.palette : null;
    }
    property real currentLight: {
        sky.frameSerial;
        return sky.currentPalette ? sky.currentPalette.light : 1.0;
    }
    property real nightness: {
        sky.frameSerial;
        return sky.currentPalette ? sky.currentPalette.nightness : 0.0;
    }

    // Quality quotas
    readonly property var starQuotas: [80, 56, 36]
    readonly property var cloudQuotas: [7, 6, 4]
    readonly property var rainQuotas: [70, 55, 40]
    readonly property var snowQuotas: [80, 62, 45]

    readonly property int currentStarQuota: starQuotas[qualityLevel]
    readonly property int currentCloudQuota: cloudQuotas[qualityLevel]
    readonly property int currentRainQuota: rainQuotas[qualityLevel]
    readonly property int currentSnowQuota: snowQuotas[qualityLevel]

    onBirdKindChanged: if (engine) engine.setBirdKind(birdKind)
    onShowCloudsChanged: if (engine) engine.setShowClouds(showClouds)
    onShowWeatherChanged: if (engine) engine.setShowWeather(showWeather)
    onMouseInteractionChanged: if (engine) {
        engine.mouseInteraction = mouseInteraction;
        if (!mouseInteraction) engine.onPointerLeave();
    }
    onWidthChanged: resizeScene.restart()
    onHeightChanged: resizeScene.restart()

    onAnimatingChanged: {
        lastFrameTime = 0;
        frameAccumulator = 0;
        if (engine) {
            engine.resetStep();
            engine.onPointerLeave();
        }
    }

    Component.onCompleted: {
        engine = new Engine.SkyEngine({
            birdKind: birdKind,
            showClouds: showClouds,
            showWeather: showWeather,
            mouseInteraction: mouseInteraction
        });
        resizeScene.restart();
    }


    Timer {
        id: resizeScene
        interval: 16
        repeat: false
        onTriggered: {
            if (engine && sky.width > 0 && sky.height > 0) {
                engine.resize(sky.width, sky.height);
                sky.advanceFrame(0.001);
            }
        }
    }

    property double lastFrameTime: 0
    property double frameAccumulator: 0

    FrameAnimation {
        running: sky.animating
        onTriggered: {
            const now = Date.now();
            if (sky.lastFrameTime === 0) {
                sky.lastFrameTime = now;
                return;
            }
            const dtSec = Math.min(0.1, (now - sky.lastFrameTime) / 1000.0) * sky.speed;
            sky.lastFrameTime = now;

            sky.frameAccumulator += dtSec;
            const targetDt = 1.0 / sky.targetFps;

            if (sky.frameAccumulator >= targetDt) {
                const step = Math.min(sky.frameAccumulator, 0.1);
                sky.frameAccumulator = 0;
                sky.advanceFrame(step);
            }
        }
    }

    function advanceFrame(dt) {
        if (!engine) return;
        const t0 = Date.now();
        const overrides = {};
        if (previewPhase !== "auto") overrides.phase = previewPhase;
        if (previewWeather !== "auto") overrides.weather = previewWeather;

        sky.frame = engine.advance(dt, overrides);
        sky.frameSerial++;
        const updateMs = Date.now() - t0;
        sky.lastUpdateMs = updateMs;

        // Quality evaluator
        sky.updateCosts.push(updateMs);
        if (t0 - sky.lastQualityCheckMs >= 5000) {
            sky.lastQualityCheckMs = t0;
            if (sky.updateCosts.length > 0) {
                let sum = 0;
                for (let i = 0; i < sky.updateCosts.length; i++) sum += sky.updateCosts[i];
                const avg = sum / sky.updateCosts.length;
                sky.updateCosts = [];

                if (avg > 14.0 && sky.qualityLevel < 2) {
                    sky.qualityLevel++;
                    sky.lowCostDuration = 0;
                } else if (avg < 8.0 && sky.qualityLevel > 0) {
                    sky.lowCostDuration += 5;
                    if (sky.lowCostDuration >= 15) {
                        sky.qualityLevel--;
                        sky.lowCostDuration = 0;
                    }
                } else {
                    sky.lowCostDuration = 0;
                }
            }
        }
    }

    // 1. Background Rectangle
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop {
                position: 0.0
                color: sky.currentPalette ? sky.currentPalette.skyTop : "#2b6aa6"
            }
            GradientStop {
                position: 0.55
                color: sky.currentPalette ? sky.currentPalette.skyMid : "#72b4dd"
            }
            GradientStop {
                position: 1.0
                color: sky.currentPalette ? sky.currentPalette.skyHorizon : "#cfefff"
            }
        }
    }

    // 2. Horizon haze band
    Rectangle {
        x: 0
        y: sky.height * 0.35
        width: sky.width
        height: sky.height * 0.30
        opacity: 0.22 * sky.currentLight
        gradient: Gradient {
            GradientStop { position: 0.0; color: "transparent" }
            GradientStop {
                position: 0.5
                color: sky.currentPalette ? sky.currentPalette.haze : "#dff4ff"
            }
            GradientStop { position: 1.0; color: "transparent" }
        }
    }

    readonly property var sunData: {
        sky.frameSerial;
        return (sky.frame && sky.frame.celestial) ? sky.frame.celestial.sun : null;
    }
    readonly property var moonData: {
        sky.frameSerial;
        return (sky.frame && sky.frame.celestial) ? sky.frame.celestial.moon : null;
    }
    readonly property real sunIntensity: sunData ? sunData.alpha : 0

    // 3. Sun and moon light
    CelestialGlow {
        kind: "sun"
        centerX: sky.sunData ? sky.sunData.x : 0
        centerY: sky.sunData ? sky.sunData.y : 0
        discR: sky.sunData ? sky.sunData.radius : 14
        intensity: sky.sunData ? sky.sunData.alpha : 0
        squash: sky.sunData ? sky.sunData.squash : 1
        phase: sky.sunData ? sky.sunData.phase : 0
        revolve: {
            sky.frameSerial;
            return sky.frame ? (sky.frame.time * 0.006) % 1 : 0;
        }
        coreColor: sky.currentPalette ? sky.currentPalette.sun : "#fff3b0"
        glowColor: sky.currentPalette ? sky.currentPalette.sun : "#ffd27a"
        rayCount: 14
    }

    CelestialGlow {
        kind: "moon"
        centerX: sky.moonData ? sky.moonData.x : 0
        centerY: sky.moonData ? sky.moonData.y : 0
        discR: sky.moonData ? sky.moonData.radius : 13
        intensity: sky.moonData ? sky.moonData.alpha : 0
        squash: sky.moonData ? sky.moonData.squash : 1
        phase: sky.moonData ? sky.moonData.phase : 0
        coreColor: sky.currentPalette ? sky.currentPalette.moon : "#d8e8ff"
        glowColor: sky.currentPalette ? sky.currentPalette.glow : "#36b0cc"
        rayCount: 0
    }

    // 5. Stars
    Repeater {
        id: starRepeater
        model: {
            sky.frameSerial;
            if (!sky.frame || !sky.frame.stars || sky.nightness <= 0.01) return 0;
            return Math.min(sky.currentStarQuota, sky.frame.stars.length);
        }

        Text {
            required property int index

            readonly property var starData: {
                sky.frameSerial;
                return sky.frame.stars[index];
            }

            x: {
                sky.frameSerial;
                return starData ? starData.x : 0;
            }
            y: {
                sky.frameSerial;
                return starData ? starData.y : 0;
            }
            text: {
                sky.frameSerial;
                return starData ? starData.glyph : "·";
            }
            font.family: "Noto Sans Mono"
            font.pixelSize: {
                sky.frameSerial;
                return starData ? starData.size : 10;
            }
            lineHeight: {
                sky.frameSerial;
                return starData ? starData.size : 10;
            }
            lineHeightMode: Text.FixedHeight
            font.kerning: false
            wrapMode: Text.NoWrap
            textFormat: Text.PlainText
            color: sky.currentPalette ? sky.currentPalette.star : "#cfe6ff"
            opacity: {
                sky.frameSerial;
                if (!starData) return 0;
                const twinkle = 0.35 + 0.65 * Math.max(0, Math.sin(sky.frame.time * starData.freq + starData.phase));
                return starData.alpha * sky.nightness * twinkle;
            }
        }
    }

    // 6. Clouds
    Clouds {
        anchors.fill: parent
        frame: sky.frame
        frameSerial: sky.frameSerial
        qualityQuota: sky.currentCloudQuota
        light: sky.currentLight
        showClouds: sky.showClouds
        palette: sky.currentPalette
    }

    // 7. Distant canopy tiles
    Repeater {
        id: distantRepeater
        model: {
            sky.frameSerial;
            return (sky.frame && sky.frame.distant && sky.frame.distant.tiles) ? sky.frame.distant.tiles.length : 0;
        }

        Text {
            required property int index

            readonly property var tileData: {
                sky.frameSerial;
                return sky.frame.distant.tiles[index];
            }

            x: {
                sky.frameSerial;
                return tileData ? tileData.x : 0;
            }
            y: {
                sky.frameSerial;
                return sky.frame ? sky.frame.distant.y : 0;
            }
            text: {
                sky.frameSerial;
                return tileData ? tileData.text : "";
            }
            font.family: "Noto Sans Mono"
            font.pixelSize: {
                sky.frameSerial;
                return sky.frame ? sky.frame.distant.cellH : 10;
            }
            lineHeight: {
                sky.frameSerial;
                return sky.frame ? sky.frame.distant.cellH : 10;
            }
            lineHeightMode: Text.FixedHeight
            font.kerning: false
            wrapMode: Text.NoWrap
            textFormat: Text.PlainText
            color: sky.currentPalette ? sky.currentPalette.leaf : "#2f4732"
            opacity: 0.45
        }
    }

    // 8. Trees
    Repeater {
        id: treeRepeater
        model: {
            sky.frameSerial;
            return (sky.frame && sky.frame.trees) ? sky.frame.trees.length : 0;
        }

        Tree {
            required property int index
            tree: {
                sky.frameSerial;
                return sky.frame.trees[index];
            }
            palette: sky.currentPalette
            frameSerial: sky.frameSerial
            sunIntensity: sky.sunIntensity
        }
    }

    // 9. Birds
    Repeater {
        id: birdRepeater
        model: {
            sky.frameSerial;
            return (sky.frame && sky.frame.birds) ? sky.frame.birds.length : 0;
        }

        Bird {
            required property int index
            bird: {
                sky.frameSerial;
                return sky.frame.birds[index];
            }
            epoch: sky.frameSerial
            sunIntensity: sky.sunIntensity
            sunTint: sky.currentPalette ? sky.currentPalette.sun : "#fff3b0"
        }
    }

    // 10. Weather
    Weather {
        anchors.fill: parent
        frame: sky.frame
        frameSerial: sky.frameSerial
        rainQuota: sky.currentRainQuota
        snowQuota: sky.currentSnowQuota
        light: sky.currentLight
        showWeather: sky.showWeather
        palette: sky.currentPalette
    }

    // Pointer interaction handlers
    HoverHandler {
        enabled: sky.mouseInteraction && sky.animating
        onPointChanged: {
            if (sky.engine) {
                sky.engine.onPointerMove(point.position.x, point.position.y);
            }
        }
    }

    TapHandler {
        enabled: sky.mouseInteraction && sky.animating
        onTapped: (point) => {
            if (sky.engine) {
                sky.engine.onPointerDown(point.position.x, point.position.y);
            }
        }
    }
}
