#!/bin/bash
# Build Windows 98 nostalgia app for macOS
set -euo pipefail
cd "$(dirname "$0")"

APP="Windows 98.app"
CONTENTS="$APP/Contents"

echo "==> Cleaning"
rm -rf "$APP"
mkdir -p "$CONTENTS/MacOS" "$CONTENTS/Resources"

echo "==> Compiling Swift shell"
swiftc -O -o "$CONTENTS/MacOS/Win98" native/main.swift -framework Cocoa -framework WebKit

echo "==> Copying web resources"
cp -R web "$CONTENTS/Resources/web"
cp native/Info.plist "$CONTENTS/Info.plist"

echo "==> Generating icon"
ICONDIR="$(mktemp -d)/AppIcon.iconset"
mkdir -p "$ICONDIR"
if [ -f native/icon_1024.png ]; then
  cp native/icon_1024.png "$ICONDIR/icon_1024.png"   # pre-rendered high-fidelity icon
else
  python3 native/make_icon.py "$ICONDIR/icon_1024.png"
fi
sips -z 512 512 "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_512x512@2x.png" >/dev/null
sips -z 256 256 "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_256x256.png" >/dev/null
sips -z 512 512 "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_256x256@2x.png" >/dev/null
sips -z 128 128 "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_128x128.png" >/dev/null
sips -z 256 256 "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_128x128@2x.png" >/dev/null
sips -z 32 32   "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_32x32.png" >/dev/null
sips -z 64 64   "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_32x32@2x.png" >/dev/null
sips -z 16 16   "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_16x16.png" >/dev/null
sips -z 32 32   "$ICONDIR/icon_1024.png" --out "$ICONDIR/icon_16x16@2x.png" >/dev/null
rm "$ICONDIR/icon_1024.png"
iconutil -c icns "$ICONDIR" -o "$CONTENTS/Resources/AppIcon.icns"

echo "==> Signing (ad hoc)"
codesign --force --deep -s - "$APP"

echo "==> Done: $APP"
