#!/usr/bin/env bash
# Builds TexasHoldem.exe for Windows (64-bit) from macOS/Linux/WSL.
# Needs Go 1.24+. Output: dist/Games/TexasHoldem/
# Then compile installer/TexasHoldemSetup.iss with Inno Setup 6.3+ (Windows)
# to get Output/TexasHoldem-Setup-v<version>.exe.
set -euo pipefail
cd "$(dirname "$0")"
ROOT=$PWD
OUT=$ROOT/dist/Games/TexasHoldem
B=$ROOT/build
rm -rf "$ROOT/dist" "$B" && mkdir -p "$OUT" "$B/app"

VERSION=$(grep -m1 -oE '^## \[[0-9.]+' web/CHANGELOG.md | tr -d '#[ ')
TITLE="Texas Hold'em"

# Icon + version info resource
( cd tools/mkres && go mod tidy && go build -o "$B/mkres" . )

cp shell/*.go "$B/app/"
cp -r web "$B/app/web"
printf 'module ironite/holdem\n\ngo 1.24\n' > "$B/app/go.mod"
"$B/mkres" -version "$VERSION" -icon icon-1024.png -out "$B/app/rsrc_windows_amd64.syso" \
  -name "$TITLE" -exe TexasHoldem.exe -internal TexasHoldem -identity Ironite.TexasHoldem \
  -desc "Texas Hold'em - Pecos Creek Saloon"

( cd "$B/app" && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath \
    -ldflags "-H windowsgui -s -w -X main.gameID=TexasHoldem -X \"main.title=$TITLE\" -X main.version=$VERSION" \
    -o "$OUT/TexasHoldem.exe" . )

crlf() { sed 's/\r$//; s/$/\r/' "$1" > "$2"; }
crlf web/CHANGELOG.md "$OUT/CHANGELOG.txt"
crlf web/fonts/OFL.txt "$OUT/OFL.txt"
for f in README CREDITS; do
  sed "s/@VERSION@/$VERSION/g" "$f.txt" > "$B/$f.tmp" && crlf "$B/$f.tmp" "$OUT/$f.txt"
done
printf '%s\r\n' "$VERSION" > "$OUT/VERSION"
rm -rf "$B"
echo "Texas Hold'em $VERSION -> $OUT/TexasHoldem.exe"
