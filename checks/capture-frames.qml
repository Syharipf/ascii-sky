import QtQuick
import QtQuick.Window
import "../package/contents/ui" as UI

Window {
    id: win
    width: 960
    height: 600
    visible: true
    flags: Qt.Window | Qt.FramelessWindowHint

    property string outDir: "/tmp/langit-frames"
    property int frameCount: 0
    property int maxFrames: 240 // 24s at 10fps
    property int currentSegment: 0

    // 12 segments: 4 phases × 3 weathers
    readonly property var segments: [
        { phase: "morning", weather: "clear", kind: "all" },
        { phase: "morning", weather: "rain", kind: "real" },
        { phase: "morning", weather: "snow", kind: "real" },
        { phase: "day", weather: "clear", kind: "all" },
        { phase: "day", weather: "rain", kind: "dragon" },
        { phase: "day", weather: "snow", kind: "real" },
        { phase: "evening", weather: "clear", kind: "phoenix" },
        { phase: "evening", weather: "rain", kind: "all" },
        { phase: "evening", weather: "snow", kind: "cockatoo" },
        { phase: "night", weather: "clear", kind: "pterodactyl" },
        { phase: "night", weather: "rain", kind: "mythic" },
        { phase: "night", weather: "snow", kind: "all" }
    ]

    UI.Sky {
        id: sky
        anchors.fill: parent
        pauseOnAppOpen: false
        previewPhase: win.segments[win.currentSegment].phase
        previewWeather: win.segments[win.currentSegment].weather
        birdKind: win.segments[win.currentSegment].kind
        mouseInteraction: false
    }

    function applySegment(idx) {
        currentSegment = idx;
        const seg = segments[idx];
        sky.previewPhase = seg.phase;
        sky.previewWeather = seg.weather;
        sky.birdKind = seg.kind;
    }

    function captureNext() {
        if (win.frameCount >= win.maxFrames) {
            console.log("CAPTURED_ALL_FRAMES: " + win.frameCount);
            Qt.quit();
            return;
        }

        const targetSegment = Math.floor(win.frameCount / 20);
        if (targetSegment !== win.currentSegment) {
            win.applySegment(targetSegment);
        }

        sky.advanceFrame(0.1);

        const frameNum = String(win.frameCount).padStart(4, "0");
        const filePath = win.outDir + "/frame_" + frameNum + ".png";

        sky.grabToImage(function(result) {
            result.saveToFile(filePath);
            win.frameCount++;
            stepTimer.start();
        });
    }

    Timer {
        id: stepTimer
        interval: 10
        repeat: false
        onTriggered: win.captureNext()
    }

    Timer {
        interval: 500
        running: true
        onTriggered: {
            sky.running = false;
            win.applySegment(0);
            win.captureNext();
        }
    }
}
