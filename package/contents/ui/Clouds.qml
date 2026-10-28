import QtQuick

Item {
    id: cloudsRoot

    property var frame: null
    property int frameSerial: 0
    property int qualityQuota: 7
    property real light: 1.0
    property bool showClouds: true
    property var palette: null

    visible: showClouds

    Repeater {
        id: cloudsRepeater
        model: {
            cloudsRoot.frameSerial;
            if (!cloudsRoot.frame || !cloudsRoot.frame.clouds) return 0;
            return Math.min(cloudsRoot.qualityQuota, cloudsRoot.frame.clouds.length);
        }

        Text {
            required property int index

            readonly property var cloudData: {
                cloudsRoot.frameSerial;
                return cloudsRoot.frame.clouds[index];
            }

            x: {
                cloudsRoot.frameSerial;
                return cloudData ? cloudData.x : 0;
            }
            y: {
                cloudsRoot.frameSerial;
                return cloudData ? cloudData.y : 0;
            }
            text: {
                cloudsRoot.frameSerial;
                return cloudData ? cloudData.text : "";
            }

            font.family: "Noto Sans Mono"
            font.pixelSize: 12
            lineHeight: 12
            lineHeightMode: Text.FixedHeight
            font.kerning: false
            wrapMode: Text.NoWrap
            textFormat: Text.PlainText
            color: cloudsRoot.frame ? cloudsRoot.frame.cloudColor : "#ffffff"
            opacity: {
                cloudsRoot.frameSerial;
                return cloudData ? cloudData.alpha * cloudsRoot.light : 0;
            }
        }
    }
}
