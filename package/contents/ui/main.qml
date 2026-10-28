import QtQuick
import org.kde.plasma.plasmoid

WallpaperItem {
    id: root

    DesktopVisibility { id: desktopVisibility }

    Sky {
        anchors.fill: parent
        hasVisibleWindows: desktopVisibility.hasVisibleWindows
        birdKind: (root.configuration && root.configuration.birdKind) ? root.configuration.birdKind : "all"
        showClouds: (root.configuration && root.configuration.showClouds !== undefined) ? root.configuration.showClouds : true
        showWeather: (root.configuration && root.configuration.showWeather !== undefined) ? root.configuration.showWeather : true
        mouseInteraction: (root.configuration && root.configuration.mouseInteraction !== undefined) ? root.configuration.mouseInteraction : true
        fps: (root.configuration && root.configuration.fps) ? root.configuration.fps : 30
        pauseOnAppOpen: (root.configuration && root.configuration.pauseOnAppOpen !== undefined) ? root.configuration.pauseOnAppOpen : true
    }
}
