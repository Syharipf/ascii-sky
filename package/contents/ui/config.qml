import QtQuick
import QtQuick.Controls as Controls
import QtQuick.Layouts
import org.kde.kirigami as Kirigami

Kirigami.FormLayout {
    id: root

    property string cfg_birdKind: "all"
    property alias cfg_showClouds: cloudCheck.checked
    property alias cfg_showWeather: weatherCheck.checked
    property alias cfg_mouseInteraction: mouseCheck.checked
    property alias cfg_pauseOnAppOpen: pauseCheck.checked
    property int cfg_fps: 30

    Controls.ComboBox {
        id: birdCombo
        implicitWidth: 380
        Kirigami.FormData.label: "Avian Wildlife:"
        textRole: "text"
        valueRole: "value"
        model: [
            { text: "Rotating — All Birds (Wild, Ornamental, Mythic)", value: "all" },
            { text: "Rotating — Wild & Ornamental (No Mythic)", value: "real" },
            { text: "Rotating — Mythic Fly-bys Only", value: "mythic" },
            { text: "Sparrow (Pipit)", value: "sparrow" },
            { text: "Swallow (Walet)", value: "swallow" },
            { text: "Dove (Merpati)", value: "dove" },
            { text: "Crow (Gagak)", value: "crow" },
            { text: "Kingfisher (Raja Udang)", value: "kingfisher" },
            { text: "Eagle (Elang)", value: "eagle" },
            { text: "Hornbill (Rangkong)", value: "hornbill" },
            { text: "Parrot (Nuri)", value: "parrot" },
            { text: "Cockatoo (Kakatua)", value: "cockatoo" },
            { text: "Bird of Paradise (Cendrawasih)", value: "paradise" },
            { text: "Pterodactyl", value: "pterodactyl" },
            { text: "Dragon (Naga)", value: "dragon" },
            { text: "Phoenix", value: "phoenix" }
        ]
        currentIndex: Math.max(0, indexOfValue(root.cfg_birdKind))
        onActivated: root.cfg_birdKind = currentValue
    }

    Controls.CheckBox {
        id: cloudCheck
        Kirigami.FormData.label: "Drifting Clouds:"
        text: "Display soft side-view ASCII clouds drifting across the sky"
    }

    Controls.CheckBox {
        id: weatherCheck
        Kirigami.FormData.label: "Dynamic Weather:"
        text: "Allow stochastic rain showers and gentle snowfall with ground splashes"
    }

    Controls.CheckBox {
        id: mouseCheck
        Kirigami.FormData.label: "Mouse Interaction:"
        text: "Hover startles flying birds and clicks flush perched birds"
    }

    Controls.CheckBox {
        id: pauseCheck
        Kirigami.FormData.label: "Battery Saver & Auto-Pause:"
        text: "Freeze wallpaper animation when application windows are visible on desktop"
    }

    Controls.ComboBox {
        id: fpsCombo
        implicitWidth: 260
        Kirigami.FormData.label: "Target Frame Rate:"
        textRole: "text"
        valueRole: "value"
        model: [
            { text: "30 FPS (lower CPU load)", value: 30 },
            { text: "40 FPS", value: 40 },
            { text: "60 FPS (higher smoothness)", value: 60 }
        ]
        currentIndex: Math.max(0, indexOfValue(root.cfg_fps))
        onActivated: root.cfg_fps = currentValue
    }
}
