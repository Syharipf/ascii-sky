import QtQuick
import "environment.mjs" as Env

Item {
    id: cellsRoot

    property var cells: null          // { cols, rows, cells }
    property real cellW: 8
    property real cellH: 14
    property color baseColor: "#7f97ad"
    property color accentColor: "#ffffff"
    property real highlight: 0.20     // blend toward white for the lit fill
    property real inkMix: 0.30        // glyph darkness blend toward baseColor
    property real rimLight: 0.55      // rim glyph blend toward white
    property real shade: 0.62         // fill blend toward near-black
    property int tintSteps: 16
    property string repaintKey: ""
    property bool fillCells: true          // false = glyph-only (birds)
    property color rimTint: "#ffffff"     // warm/cool light colour on silhouette edges
    property real rimTintMix: 0.0         // 0..1 blend of rimInk toward rimTint

    readonly property color fillLow:  Env.blendHex(baseColor, "#05070b", shade)
    readonly property color fillHigh: Env.blendHex(baseColor, "#ffffff", highlight)
    readonly property color ink:      Env.blendHex("#05070b", baseColor, inkMix)
    readonly property color rimInk:   Env.blendHex(Env.blendHex(baseColor, "#ffffff", rimLight), rimTint, rimTintMix)
    readonly property string tintKey: cellsRoot.quantize(baseColor) + "|" + cellsRoot.quantize(accentColor)

    function quantize(c) {
        if (!c) return "0,0,0";
        const s = cellsRoot.tintSteps;
        const q = v => Math.round((v !== undefined ? v : 0) * 255 / s) * s;
        return q(c.r) + "," + q(c.g) + "," + q(c.b);
    }

    width: cells ? cells.cols * cellW : 0
    height: cells ? cells.rows * cellH : 0

    Canvas {
        id: cellsCanvas
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Immediate
        anchors.fill: parent

        property string paintKey: cellsRoot.repaintKey + "|" + cellsRoot.tintKey + "|" + cellsRoot.cellW + "|" + cellsRoot.cellH
                                  + "|" + cellsRoot.fillCells + "|" + cellsRoot.rimTint + "|" + Math.round(cellsRoot.rimTintMix * 20)
        onPaintKeyChanged: requestPaint()
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()
        Component.onCompleted: requestPaint()

        onPaint: {
            const ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);
            if (!cellsRoot.cells || !cellsRoot.cells.cells || cellsRoot.cells.cells.length === 0) return;
            ctx.font = "600 " + Math.round(cellsRoot.cellH * 0.80) + "px 'Noto Sans Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const cw = cellsRoot.cellW, ch = cellsRoot.cellH;
            const list = cellsRoot.cells.cells;
            for (let i = 0; i < list.length; i++) {
                const c = list[i];
                if (cellsRoot.fillCells) {
                    ctx.fillStyle = Env.blendHex(cellsRoot.fillLow, cellsRoot.fillHigh, c.tone);
                    ctx.fillRect(c.col * cw, c.row * ch, cw + 0.5, ch + 0.5);
                }
                ctx.fillStyle = c.accent
                    ? cellsRoot.accentColor
                    : (c.rim ? cellsRoot.rimInk
                             : Env.blendHex(cellsRoot.ink, cellsRoot.rimInk, 0.30 * (1 - c.tone)));
                ctx.fillText(c.glyph, Math.round(c.col * cw + cw * 0.5), Math.round(c.row * ch + ch * 0.52));
            }
        }
    }
}
