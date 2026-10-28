import QtQuick
import QtQuick.Window
import QtQuick.Controls as Controls
import "package/contents/ui" as UI

Window {
    id: previewWin
    width: 1280
    height: 800
    minimumWidth: 640
    minimumHeight: 480
    visible: true
    title: "Langit ASCII — Preview"

    property bool tourActive: tourCheck.checked
    property int tourIndex: 0
    readonly property var tourPhases: ["morning", "day", "evening", "night"]
    readonly property var tourWeathers: ["clear", "rain", "snow"]
    readonly property string tourPhase: tourPhases[Math.floor(tourIndex / 3) % tourPhases.length]
    readonly property string tourWeather: tourWeathers[tourIndex % tourWeathers.length]

    Timer {
        interval: 2000
        repeat: true
        running: previewWin.tourActive
        onTriggered: previewWin.tourIndex = (previewWin.tourIndex + 1) % 12
    }

    UI.Sky {
        id: sky
        anchors.fill: parent
        birdKind: kindSelector.currentValue
        previewPhase: tourCheck.checked ? previewWin.tourPhase : phaseSelector.currentValue
        previewWeather: tourCheck.checked ? previewWin.tourWeather : weatherSelector.currentValue
        pauseOnAppOpen: false
        showClouds: cloudCheck.checked
        showWeather: weatherCheck.checked
        mouseInteraction: mouseCheck.checked
    }

    Rectangle {
        id: controlBar
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.margins: 16
        width: Math.min(previewWin.width - 32, controlCol.implicitWidth + 24)
        height: controlCol.implicitHeight + 20
        radius: 8
        color: Qt.rgba(0.01, 0.05, 0.09, 0.88)
        border.color: Qt.rgba(0.5, 0.83, 0.81, 0.35)
        border.width: 1

        Column {
            id: controlCol
            anchors.centerIn: parent
            spacing: 8
            padding: 4

            Row {
                spacing: 12

                Controls.Label {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Birds:"
                    color: "#80d5d0"
                    font.family: "monospace"
                    font.bold: true
                }

                Controls.ComboBox {
                    id: kindSelector
                    anchors.verticalCenter: parent.verticalCenter
                    implicitWidth: 320
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
                }

                Controls.CheckBox {
                    id: cloudCheck
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Clouds"
                    checked: true
                }

                Controls.CheckBox {
                    id: weatherCheck
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Weather"
                    checked: true
                }

                Controls.CheckBox {
                    id: mouseCheck
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Mouse"
                    checked: true
                }
            }

            Row {
                spacing: 12

                Controls.Label {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Phase:"
                    color: "#80d5d0"
                    font.family: "monospace"
                    font.bold: true
                }

                Controls.ComboBox {
                    id: phaseSelector
                    anchors.verticalCenter: parent.verticalCenter
                    implicitWidth: 140
                    enabled: !tourCheck.checked
                    textRole: "text"
                    valueRole: "value"
                    model: [
                        { text: "Auto Cycle", value: "auto" },
                        { text: "Morning", value: "morning" },
                        { text: "Day", value: "day" },
                        { text: "Evening", value: "evening" },
                        { text: "Night", value: "night" }
                    ]
                }

                Controls.Label {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Weather:"
                    color: "#80d5d0"
                    font.family: "monospace"
                    font.bold: true
                }

                Controls.ComboBox {
                    id: weatherSelector
                    anchors.verticalCenter: parent.verticalCenter
                    implicitWidth: 130
                    enabled: !tourCheck.checked
                    textRole: "text"
                    valueRole: "value"
                    model: [
                        { text: "Auto Weather", value: "auto" },
                        { text: "Clear", value: "clear" },
                        { text: "Rain", value: "rain" },
                        { text: "Snow", value: "snow" }
                    ]
                }

                Controls.CheckBox {
                    id: tourCheck
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Tour 12 × 2 s"
                    checked: false
                }

                Controls.Label {
                    anchors.verticalCenter: parent.verticalCenter
                    visible: tourCheck.checked
                    text: previewWin.tourPhase + " · " + previewWin.tourWeather + " [" + (previewWin.tourIndex + 1) + "/12]"
                    color: "#ffb86c"
                    font.family: "monospace"
                    font.bold: true
                }
            }
        }
    }
}
