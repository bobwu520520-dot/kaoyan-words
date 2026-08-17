#!/bin/bash
# 同步 kaoyan3 站点文件到 Electron 源与 Android www
set -e
SRC="/c/Users/86178/AppData/Local/Temp/kaoyan3"
ELEC="/c/Users/86178/AppData/Local/Temp/kaoyan-app/asar-src"
AND="/c/kaoyan-android/app/www"

FILES="index.html study.html words.html search.html gate.html sw.js worker.js manifest.webmanifest robots.txt icon-192.png icon-512.png"
DIRS="css js data"

for T in "$ELEC" "$AND"; do
  echo "==> $T"
  for f in $FILES; do cp -f "$SRC/$f" "$T/$f"; done
  for d in $DIRS; do rm -rf "$T/$d" && cp -r "$SRC/$d" "$T/$d"; done
done
echo "OK"
