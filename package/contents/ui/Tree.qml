import QtQuick
import "texture.mjs" as Texture
import "environment.mjs" as Env

Item {
    id: treeRoot

    property var tree: null
    property var palette: null
    property int frameSerial: 0
    property real sunIntensity: 0

    readonly property var layers: {
        frameSerial;
        return tree ? Texture.treeCells(tree.id) : null;
    }

    x: {
        frameSerial;
        return tree ? tree.x : 0;
    }
    y: {
        frameSerial;
        return tree ? tree.y : 0;
    }
    width: {
        frameSerial;
        return tree ? tree.cols * tree.cellW : 0;
    }
    height: {
        frameSerial;
        return tree ? tree.rows * tree.cellH : 0;
    }

    opacity: {
        frameSerial;
        return tree ? 0.42 + 0.58 * tree.depth : 1.0;
    }

    AsciiCells {
        id: leafCanvas
        objectName: "leafCanvas"
        cells: treeRoot.layers ? treeRoot.layers.leaf : null
        cellW: treeRoot.tree ? treeRoot.tree.cellW : 8
        cellH: treeRoot.tree ? treeRoot.tree.cellH : 14
        baseColor: {
            treeRoot.frameSerial;
            if (!treeRoot.palette || !treeRoot.tree) return "#2f4732";
            const green = Env.blendHex(treeRoot.palette.leaf, "#0a120e", 0.15);
            return Env.blendHex(green, treeRoot.palette.haze, 0.30 * (1 - treeRoot.tree.depth));
        }
        accentColor: treeRoot.palette ? treeRoot.palette.glow : "#a0eaff"
        highlight: 0.34
        inkMix: 0.42
        rimLight: 0.62
        rimTint: treeRoot.palette ? treeRoot.palette.sun : "#fff3b0"
        rimTintMix: 0.45 * treeRoot.sunIntensity
        shade: 0.50
        tintSteps: 24
        repaintKey: treeRoot.tree ? treeRoot.tree.id + "|leaf" : ""
    }

    AsciiCells {
        id: woodCanvas
        objectName: "woodCanvas"
        cells: treeRoot.layers ? treeRoot.layers.wood : null
        cellW: treeRoot.tree ? treeRoot.tree.cellW : 8
        cellH: treeRoot.tree ? treeRoot.tree.cellH : 14
        baseColor: {
            treeRoot.frameSerial;
            if (!treeRoot.palette || !treeRoot.tree) return "#1d241f";
            const bark = Env.blendHex(treeRoot.palette.wood, "#2a2118", 0.25);
            return Env.blendHex(bark, treeRoot.palette.haze, 0.18 * (1 - treeRoot.tree.depth));
        }
        accentColor: treeRoot.palette ? treeRoot.palette.haze : "#f7d6a8"
        highlight: 0.26
        inkMix: 0.22
        rimLight: 0.30
        rimTint: treeRoot.palette ? treeRoot.palette.sun : "#fff3b0"
        rimTintMix: 0.45 * treeRoot.sunIntensity
        shade: 0.55
        tintSteps: 24
        repaintKey: treeRoot.tree ? treeRoot.tree.id + "|wood" : ""
    }

    Text {
        id: woodLayerProbe
        objectName: "woodLayer"
        visible: false
        opacity: 0
        text: treeRoot.tree ? "M".repeat(treeRoot.tree.cols) : ""
        font.family: "Noto Sans Mono"
        font.kerning: false
        font.pixelSize: treeRoot.tree ? treeRoot.tree.cellH : 14
    }
}
