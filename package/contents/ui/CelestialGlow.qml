import QtQuick

Item {
    id: glowRoot

    property string kind: "sun"        // "sun" | "moon"
    property real centerX: 0
    property real centerY: 0
    property real discR: 14            // body radius in px
    property real intensity: 0         // 0..1 body opacity
    property real squash: 1.0          // vertical flattening near the horizon
    property real phase: 0.5           // 0..1 cycle progress (moon phase)
    property real revolve: 0           // sun shaft rotation, turns
    property color coreColor: "#fff3b0"
    property color glowColor: "#ffd27a"
    property int rayCount: 14

    readonly property color discCore: "#ffffff"

    readonly property real lit: Math.sin(Math.PI * phase)
    readonly property string sizeKey: Math.round(discR * 4) + "|" + Math.round(intensity * 20)

    width: Math.max(8, Math.round(discR * 22))
    height: width
    visible: intensity > 0.01 && discR > 0
    x: Math.round(centerX - width / 2)
    y: Math.round(centerY - height / 2)
    transform: Scale {
        origin.x: glowRoot.width / 2
        origin.y: glowRoot.height / 2
        yScale: glowRoot.squash
    }

    // c MUST be a color-typed value (a `color` property or a Qt.rgba/Qt.darker
    // result), never a hex string: reading .r/.g/.b off a string yields NaN.
    function rgba(c, a) {
        return Qt.rgba(c.r, c.g, c.b, Math.max(0, Math.min(1, a)));
    }

    // Rotating shafts: drawn once, rotated by the item transform (never repainted per frame)
    Canvas {
        id: raysCanvas
        anchors.fill: parent
        visible: glowRoot.kind === "sun" && glowRoot.rayCount > 0
        rotation: glowRoot.revolve * 360
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Immediate

        property string paintKey: glowRoot.sizeKey + "|" + glowRoot.rayCount + "|" + glowRoot.glowColor
        onPaintKeyChanged: requestPaint()
        onWidthChanged: requestPaint()
        Component.onCompleted: requestPaint()

        onPaint: {
            const ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);
            if (!glowRoot.visible) return;
            const cx = width / 2, cy = height / 2, R = glowRoot.discR, a = glowRoot.intensity;
            const n = glowRoot.rayCount;
            for (let i = 0; i < n; i++) {
                const ang = (i / n) * Math.PI * 2 + 0.13;
                const half = 0.045 + 0.025 * ((i % 3) / 2);
                const r0 = R * 1.25, r1 = R * (4.2 + 2.6 * ((i % 4) / 3));
                const g = ctx.createLinearGradient(
                    cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0,
                    cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
                g.addColorStop(0, glowRoot.rgba(glowRoot.glowColor, 0.24 * a));
                g.addColorStop(1, glowRoot.rgba(glowRoot.glowColor, 0));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(ang - half) * r0, cy + Math.sin(ang - half) * r0);
                ctx.lineTo(cx + Math.cos(ang + half) * r0, cy + Math.sin(ang + half) * r0);
                ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // Multi-stop halo: the light falloff that replaces the flat circle
    Canvas {
        id: haloCanvas
        anchors.fill: parent
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Immediate

        property string paintKey: glowRoot.sizeKey + "|" + glowRoot.kind + "|" + glowRoot.glowColor
        onPaintKeyChanged: requestPaint()
        onWidthChanged: requestPaint()
        Component.onCompleted: requestPaint()

        onPaint: {
            const ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);
            if (!glowRoot.visible) return;
            const cx = width / 2, cy = height / 2, R = glowRoot.discR, a = glowRoot.intensity;
            const g = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 10);
            g.addColorStop(0.00, glowRoot.rgba(glowRoot.glowColor, 0.50 * a));
            g.addColorStop(0.12, glowRoot.rgba(glowRoot.glowColor, 0.28 * a));
            g.addColorStop(0.34, glowRoot.rgba(glowRoot.glowColor, 0.12 * a));
            g.addColorStop(0.66, glowRoot.rgba(glowRoot.glowColor, 0.045 * a));
            g.addColorStop(1.00, glowRoot.rgba(glowRoot.glowColor, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Disc: limb darkening, moon craters and phase shadow
    Canvas {
        id: discCanvas
        width: Math.max(4, Math.round(glowRoot.discR * 3))
        height: width
        anchors.centerIn: parent
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Immediate

        readonly property var craters: [
            [-0.34, -0.12, 0.17], [0.10, 0.34, 0.13], [0.30, -0.28, 0.10],
            [-0.06, -0.44, 0.08], [-0.44, 0.30, 0.09]
        ]

        property string paintKey: glowRoot.sizeKey + "|" + glowRoot.kind
                                  + "|" + Math.round(glowRoot.lit * 100) + "|" + glowRoot.coreColor
        onPaintKeyChanged: requestPaint()
        onWidthChanged: requestPaint()
        Component.onCompleted: requestPaint()

        onPaint: {
            const ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);
            if (!glowRoot.visible) return;
            const cx = width / 2, cy = height / 2, R = glowRoot.discR, a = glowRoot.intensity;
            const disc = ctx.createRadialGradient(cx - R * 0.26, cy - R * 0.26, R * 0.08, cx, cy, R);
            disc.addColorStop(0.00, glowRoot.rgba(glowRoot.discCore, 0.95 * a));
            disc.addColorStop(0.55, glowRoot.rgba(glowRoot.coreColor, 0.95 * a));
            disc.addColorStop(1.00, glowRoot.rgba(Qt.darker(glowRoot.coreColor, 1.55), 0.92 * a));
            ctx.fillStyle = disc;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();

            if (glowRoot.kind === "moon") {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = Qt.rgba(0, 0, 0, 0.16 * a);
                for (let i = 0; i < craters.length; i++) {
                    const c = craters[i];
                    ctx.beginPath();
                    ctx.arc(cx + c[0] * R, cy + c[1] * R, c[2] * R, 0, Math.PI * 2);
                    ctx.fill();
                }
                const shadowX = cx + R * (0.02 + 2.2 * glowRoot.lit);
                ctx.fillStyle = Qt.rgba(0.02, 0.03, 0.05, 0.88);
                ctx.beginPath();
                ctx.arc(shadowX, cy - R * 0.08, R * 1.02, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
}
