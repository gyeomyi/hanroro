#!/usr/bin/env bash
# 화면 확인용 헬퍼 — 빌드가 없으니 헤드리스 크롬으로 렌더해서 눈으로 본다.
#   ./shot.sh index.html dark 1280 2400
# 테마 인자를 주면 theme.js를 뺀 임시 복사본(.shot-*.html)을 만들어 그 테마로 고정한다
# (theme.js가 prefers-color-scheme를 읽어 헤드리스에서는 늘 낮으로 가버리기 때문).
set -euo pipefail

PAGE="${1:-index.html}"
THEME="${2:-}"
W="${3:-1280}"
H="${4:-2400}"
OUT="${OUT:-shot.png}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

TARGET="$PAGE"
if [ -n "$THEME" ]; then
  TARGET=".shot-${PAGE}"
  sed -e "s|<html lang=\"ko\"|<html lang=\"ko\" data-theme=\"$THEME\"|" \
      -e '/js\/theme.js/d' "$ROOT/$PAGE" > "$ROOT/$TARGET"
  trap 'rm -f "$ROOT/$TARGET"' EXIT
fi

curl -sf -o /dev/null "http://localhost:8000/$PAGE" || {
  echo "8000 포트에 서버가 없다: python -m http.server 8000 --directory ." >&2; exit 1; }

"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --user-data-dir="${TMPDIR:-/tmp}/hanroro-shot" \
  --window-size="$W,$H" --virtual-time-budget=6000 \
  --screenshot="$(cygpath -w "$ROOT/$OUT" 2>/dev/null || echo "$ROOT/$OUT")" \
  "http://localhost:8000/$TARGET" 2>&1 | tail -1
