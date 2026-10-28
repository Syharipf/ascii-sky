import subprocess, os

# Let's inspect test-full-eng.qml that succeeded earlier!
# In test-diff22.py:
# with open("package/contents/ui/test-full-eng.qml", "w") as f:
#     f.write('import QtQuick\nimport "engine.mjs" as M\nItem { Component.onCompleted: { const e = new M.SkyEngine(); e.resize(1920, 1080); e.advance(0.016); Qt.exit(10); } }\n')
# Why did that succeed in test-diff22.py?
# Because test-diff22 rewrote package/contents/ui/sprites.mjs!
# BUT then git checkout or edit happened? Let's check package/contents/ui/sprites.mjs!

