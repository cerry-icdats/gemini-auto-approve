#!/bin/sh
set -eu
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
config="$dir/config.preset.local.json"
if [ ! -e "$config" ]; then
  config="$dir/config.preset.json"
fi
for arg in "$@"; do
  case "$arg" in
    --once|--self-test|--check-config)
      exec /usr/bin/osascript -l JavaScript "$dir/gemini-auto-approve.jxa.js" "--config=$config" "$@"
      ;;
  esac
done
trap 'exit 130' INT
trap 'exit 143' TERM
while true; do
  rc=0
  /usr/bin/osascript -l JavaScript "$dir/gemini-auto-approve.jxa.js" "--config=$config" "$@" >/dev/null || rc=$?
  if [ "$rc" -ne 0 ]; then
    exit "$rc"
  fi
done
