import QtQuick
import "texture.mjs" as Texture
import "environment.mjs" as Env

Item {
    id: birdRoot
    transformOrigin: Item.Center

    property var bird: null
    property int epoch: 0
    property color sunTint: "#fff3b0"
    property real sunIntensity: 0

    readonly property bool perched: {
        epoch;
        return bird !== null && bird.mode === "perched";
    }

    readonly property var cellFrame: {
        epoch;
        if (!bird || !bird.sprite) return null;
        return perched
            ? Texture.birdFrame(bird.sprite.id, "perch", bird.idleFrame)
            : Texture.birdFrame(bird.sprite.id, "flight", bird.frameIndex);
    }

    readonly property real cellH: {
        epoch;
        return bird ? bird.cellPx : 12;
    }

    readonly property real cellW: cellH * Texture.ADVANCE_RATIO

    visible: {
        epoch;
        return bird !== null && bird.mode !== "wait";
    }

    opacity: {
        epoch;
        return bird ? bird.opacity : 1.0;
    }

    rotation: {
        epoch;
        return bird ? bird.rotation : 0;
    }

    width: cellFrame ? cellFrame.cols * cellW : 0
    height: cellFrame ? cellFrame.rows * cellH : 0

    x: {
        epoch;
        return bird ? bird.x - width / 2 : 0;
    }

    y: {
        epoch;
        if (!bird) return 0;
        return perched ? bird.y - height + 2 : bird.y - height / 2;
    }

    AsciiCells {
        id: cellsItem
        cells: birdRoot.cellFrame
        cellW: birdRoot.cellW
        cellH: birdRoot.cellH
        fillCells: false
        baseColor: {
            birdRoot.epoch;
            return birdRoot.bird ? birdRoot.bird.color : "#7f97ad";
        }
        accentColor: {
            birdRoot.epoch;
            return birdRoot.bird ? Env.blendHex(birdRoot.bird.sprite.accent, "#ffffff", 0.25) : "#ffffff";
        }
        inkMix: 0.34
        rimLight: 0.60
        rimTint: birdRoot.sunTint
        rimTintMix: 0.55 * birdRoot.sunIntensity
        repaintKey: {
            birdRoot.epoch;
            if (!birdRoot.bird || !birdRoot.bird.sprite) return "";
            return birdRoot.bird.sprite.id + "|" + birdRoot.perched + "|" + birdRoot.bird.frameIndex + "|" + birdRoot.bird.idleFrame + "|" + Math.round(birdRoot.cellH);
        }
        transform: Scale {
            origin.x: cellsItem.width / 2
            origin.y: cellsItem.height / 2
            xScale: {
                birdRoot.epoch;
                return birdRoot.bird && birdRoot.bird.facing < 0 ? -1 : 1;
            }
        }
    }
}
