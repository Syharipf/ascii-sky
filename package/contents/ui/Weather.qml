import QtQuick

Item {
    id: weatherRoot

    property var frame: null
    property int frameSerial: 0
    property int rainQuota: 70
    property int snowQuota: 80
    property real light: 1.0
    property bool showWeather: true
    property var palette: null

    visible: showWeather

    readonly property color rainColor: palette ? palette.rain : "#d6f1ff"
    readonly property color snowColor: palette ? palette.snow : "#ffffff"

    // Rain layer
    Repeater {
        id: rainRepeater
        model: {
            weatherRoot.frameSerial;
            if (!weatherRoot.frame || !weatherRoot.frame.rainDrops || weatherRoot.frame.rainIntensity <= 0) return 0;
            return Math.min(weatherRoot.rainQuota, weatherRoot.frame.rainDrops.length);
        }

        Item {
            id: dropItem
            required property int index

            readonly property var dropData: {
                weatherRoot.frameSerial;
                return weatherRoot.frame.rainDrops[index];
            }

            x: {
                weatherRoot.frameSerial;
                return dropData ? dropData.x : 0;
            }
            y: {
                weatherRoot.frameSerial;
                return dropData ? dropData.y : 0;
            }

            opacity: {
                weatherRoot.frameSerial;
                if (!dropData) return 0;
                return dropData.alpha * weatherRoot.frame.rainIntensity;
            }

            // Falling streak
            Rectangle {
                visible: {
                    weatherRoot.frameSerial;
                    return dropItem.dropData && dropItem.dropData.state === 0;
                }
                width: 1.2
                height: {
                    weatherRoot.frameSerial;
                    return dropItem.dropData ? dropItem.dropData.length : 8;
                }
                rotation: -12
                color: weatherRoot.rainColor
            }

            // Splash glyph on impact
            Text {
                visible: {
                    weatherRoot.frameSerial;
                    return dropItem.dropData && dropItem.dropData.state === 1;
                }
                text: "'"
                font.family: "Noto Sans Mono"
                font.pixelSize: 10
                lineHeight: 10
                lineHeightMode: Text.FixedHeight
                font.kerning: false
                color: weatherRoot.rainColor
                scale: {
                    weatherRoot.frameSerial;
                    if (!dropItem.dropData) return 1;
                    return 1 + dropItem.dropData.splashAge * 4;
                }
                opacity: {
                    weatherRoot.frameSerial;
                    if (!dropItem.dropData) return 1;
                    return Math.max(0, 1 - dropItem.dropData.splashAge * 4);
                }
            }
        }
    }

    // Snow layer
    Repeater {
        id: snowRepeater
        model: {
            weatherRoot.frameSerial;
            if (!weatherRoot.frame || !weatherRoot.frame.snowFlakes || weatherRoot.frame.snowIntensity <= 0) return 0;
            return Math.min(weatherRoot.snowQuota, weatherRoot.frame.snowFlakes.length);
        }

        Text {
            required property int index

            readonly property var flakeData: {
                weatherRoot.frameSerial;
                return weatherRoot.frame.snowFlakes[index];
            }

            x: {
                weatherRoot.frameSerial;
                return flakeData ? flakeData.x : 0;
            }
            y: {
                weatherRoot.frameSerial;
                return flakeData ? flakeData.y : 0;
            }
            text: {
                weatherRoot.frameSerial;
                return flakeData ? flakeData.glyph : "*";
            }

            font.family: "Noto Sans Mono"
            font.pixelSize: {
                weatherRoot.frameSerial;
                return flakeData ? flakeData.size : 10;
            }
            lineHeight: {
                weatherRoot.frameSerial;
                return flakeData ? flakeData.size : 10;
            }
            lineHeightMode: Text.FixedHeight
            font.kerning: false
            wrapMode: Text.NoWrap
            textFormat: Text.PlainText
            color: weatherRoot.snowColor
            opacity: {
                weatherRoot.frameSerial;
                if (!flakeData) return 0;
                return flakeData.alpha * weatherRoot.frame.snowIntensity * weatherRoot.light;
            }
        }
    }
}
