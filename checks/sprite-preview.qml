import QtQuick
import QtQuick.Window
import "../package/contents/ui" as UI
import "../package/contents/ui/sprites.mjs" as Sprites

Window {
    id: sheet
    width: 1280
    height: 800
    visible: true
    title: "Langit ASCII — Species Sheet"

    Item {
        id: rootItem
        anchors.fill: parent

        Rectangle {
            anchors.fill: parent
            color: "#161b22"
        }

        Flickable {
            anchors.fill: parent
            contentWidth: mainCol.width + 40
            contentHeight: mainCol.height + 40

            Column {
                id: mainCol
                x: 20
                y: 20
                spacing: 16

                Text {
                    text: "Langit ASCII — 13 Species (Far: 8px, Mid: 14px, Near: 26px)"
                    color: "#ffb86c"
                    font.family: "Noto Sans Mono"
                    font.pixelSize: 18
                    font.bold: true
                }

                Repeater {
                    model: Sprites.SPECIES.length

                    Column {
                        required property int index
                        readonly property var sp: Sprites.SPECIES[index]
                        spacing: 6

                        Text {
                            text: sp.id.toUpperCase() + " (" + sp.vernacular + ") — " + sp.group + " | cruise: " + sp.cruise + " px/s | flap: " + sp.flapHz + " Hz"
                            color: "#a0eaff"
                            font.family: "Noto Sans Mono"
                            font.pixelSize: 13
                            font.bold: true
                        }

                        Row {
                            spacing: 24

                            // Far: 8px
                            Column {
                                spacing: 4
                                Text { text: "Far (8px)"; color: "#8aa6b8"; font.family: "Noto Sans Mono"; font.pixelSize: 10 }
                                Row {
                                    spacing: 8
                                    Repeater {
                                        model: sp.framesText.length
                                        Text {
                                            required property int index
                                            text: sp.framesText[index]
                                            font.family: "Noto Sans Mono"
                                            font.pixelSize: 8
                                            lineHeight: 8
                                            lineHeightMode: Text.FixedHeight
                                            font.kerning: false
                                            color: sp.accent
                                        }
                                    }
                                }
                            }

                            // Mid: 14px
                            Column {
                                spacing: 4
                                Text { text: "Mid (14px)"; color: "#8aa6b8"; font.family: "Noto Sans Mono"; font.pixelSize: 10 }
                                Row {
                                    spacing: 10
                                    Repeater {
                                        model: sp.framesText.length
                                        Text {
                                            required property int index
                                            text: sp.framesText[index]
                                            font.family: "Noto Sans Mono"
                                            font.pixelSize: 14
                                            lineHeight: 14
                                            lineHeightMode: Text.FixedHeight
                                            font.kerning: false
                                            color: sp.accent
                                        }
                                    }
                                }
                            }

                            // Near: 26px
                            Column {
                                spacing: 4
                                Text { text: "Near (26px)"; color: "#8aa6b8"; font.family: "Noto Sans Mono"; font.pixelSize: 10 }
                                Row {
                                    spacing: 14
                                    Repeater {
                                        model: sp.framesText.length
                                        Text {
                                            required property int index
                                            text: sp.framesText[index]
                                            font.family: "Noto Sans Mono"
                                            font.pixelSize: 26
                                            lineHeight: 26
                                            lineHeightMode: Text.FixedHeight
                                            font.kerning: false
                                            color: sp.accent
                                        }
                                    }
                                    // Perched frames if available
                                    Repeater {
                                        model: sp.perchText ? sp.perchText.length : 0
                                        Text {
                                            required property int index
                                            text: sp.perchText[index]
                                            font.family: "Noto Sans Mono"
                                            font.pixelSize: 26
                                            lineHeight: 26
                                            lineHeightMode: Text.FixedHeight
                                            font.kerning: false
                                            color: "#f0a868"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Timer {
        interval: 500
        running: true
        onTriggered: {
            rootItem.grabToImage(function(result) {
                result.saveToFile("/tmp/langit-species.png");
                console.log("Captured /tmp/langit-species.png");
                Qt.quit();
            });
        }
    }
}
