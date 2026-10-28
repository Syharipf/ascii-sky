import QtQuick
import QtQuick.Window
import "../package/contents/ui" as UI

Window {
    id: check
    width: 960
    height: 600
    flags: Qt.Window | Qt.FramelessWindowHint
    visible: true

    property int stage: 0
    property double frozenWorldTime: 0
    property double frozenEnvElapsed: 0
    property int frozenSerial: 0
    property double resumeStart: 0

    function verify(ok, message) {
        if (!ok) {
            console.error("FAIL: " + message);
            Qt.exit(1);
            throw new Error(message);
        }
    }

    UI.DesktopVisibility { id: desktopVisibility }

    UI.Sky {
        id: sky
        anchors.fill: parent
        pauseOnAppOpen: false
        hasVisibleWindows: desktopVisibility.hasVisibleWindows
    }

    Timer {
        interval: 500
        repeat: true
        running: true
        onTriggered: {
            if (check.stage === 0) {
                // Ensure scene is running and 10 slots initialized
                check.verify(sky.engine !== null, "engine initialized");
                check.verify(sky.frameSerial > 0, "frameSerial advances on native FrameAnimation");
                check.verify(sky.engine.birds.length === 10, "exact 10 bird slots invariant");

                const perched = sky.engine.birds.filter(b => b.mode === "perched");
                check.verify(perched.length === 3, "seeded 3 perched birds");

                // Tree crown tops below 55% screen height
                for (const tree of sky.engine.trees) {
                    check.verify(tree.y >= 0.55 * check.height - 1, "tree crown top >= 0.55*height");
                }

                // Perches inside viewport
                for (const p of sky.engine.perches) {
                    check.verify(p.x >= 0 && p.x <= check.width, "perch x inside viewport");
                    check.verify(p.y >= 0 && p.y <= check.height, "perch y inside viewport");
                }

                // Guard advance ratio: find first tree's woodLayer Text
                const firstTree = sky.engine.trees[0];
                function findWood(node) {
                    if (node.objectName === "woodLayer") return node;
                    for (let i = 0; i < (node.children ? node.children.length : 0); i++) {
                        const hit = findWood(node.children[i]);
                        if (hit) return hit;
                    }
                    return null;
                }
                const woodText = findWood(sky);
                check.verify(woodText !== null, "found woodLayer Text");
                const expectedWidth = firstTree.cols * firstTree.cellW;
                const actualWidth = woodText.implicitWidth;
                check.verify(
                    Math.abs(actualWidth - expectedWidth) <= 0.02 * actualWidth,
                    "advance ratio matches font within 2% (" + actualWidth + " vs " + expectedWidth + ")"
                );

                // Grab test image before pause
                check.verify(sky.grabToImage(function(result) {
                    check.verify(result.saveToFile("/tmp/langit-before.png"), "save before image");
                }), "request before image");

                // Pause
                sky.running = false;
                check.frozenWorldTime = sky.engine.environment.elapsed;
                check.frozenSerial = sky.frameSerial;
            } else if (check.stage === 1) {
                // Check frozen state after 500ms
                check.verify(sky.engine.environment.elapsed === check.frozenWorldTime, "no simulation while paused");
                check.verify(sky.frameSerial === check.frozenSerial, "no frame updates while paused");
            } else if (check.stage === 2) {
                // Check frozen state after 1000ms
                check.verify(sky.engine.environment.elapsed === check.frozenWorldTime, "no simulation after 1000ms pause");
                check.verify(sky.frameSerial === check.frozenSerial, "no frame updates after 1000ms pause");

                // Resume
                sky.running = true;
                check.resumeStart = Date.now();
            } else if (check.stage === 3) {
                // Verify resume doesn't replay paused time
                const advanced = sky.engine.environment.elapsed - check.frozenWorldTime;
                check.verify(advanced > 0, "resume advances");
                check.verify(advanced <= (Date.now() - check.resumeStart) / 1000 + 0.15,
                             "resume advances without replaying pause time");
                check.verify(sky.frameSerial > check.frozenSerial, "frameSerial resumed");

                // Resize
                check.width = 1366;
                check.height = 768;
            } else if (check.stage === 4) {
                // Verify resize propagation
                check.verify(sky.engine.w === 1366 && sky.engine.h === 768, "resize propagates");
                check.verify(sky.engine.birds.length === 10, "exact 10 bird slots after resize");
                for (const b of sky.engine.birds) {
                    check.verify(Number.isFinite(b.x), "finite bird x");
                    check.verify(Number.isFinite(b.y), "finite bird y");
                }

                // Grab resized image
                check.verify(sky.grabToImage(function(result) {
                    check.verify(result.saveToFile("/tmp/langit-after.png"), "save resized image");
                }), "request resized image");

                // Test auto-freeze on visible windows
                sky.pauseOnAppOpen = true;
            } else if (check.stage === 5) {
                check.verify(sky.hasVisibleWindows && !sky.animating, "app window automatically freezes wallpaper");
                check.frozenWorldTime = sky.engine.environment.elapsed;
                check.frozenSerial = sky.frameSerial;
            } else if (check.stage === 6) {
                check.verify(sky.engine.environment.elapsed === check.frozenWorldTime, "auto-freeze stops simulation");
                check.verify(sky.frameSerial === check.frozenSerial, "auto-freeze stops frame update");
                sky.pauseOnAppOpen = false;
            } else if (check.stage === 7) {
                check.verify(sky.animating && sky.engine.environment.elapsed > check.frozenWorldTime, "disabling auto-freeze resumes");
                console.log("PASS");
                Qt.quit();
            }
            check.stage++;
        }
    }

    Timer {
        interval: 20000
        running: true
        onTriggered: {
            console.error("FAIL: timeout deadline 20s");
            Qt.exit(1);
        }
    }
}
