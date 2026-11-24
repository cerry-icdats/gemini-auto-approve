#!/bin/sh
set -eu
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
config="$dir/config.preset.local.json"
if [ ! -e "$config" ]; then
  config="$dir/config.preset.json"
fi
exec /usr/bin/osascript -l JavaScript "$dir/gemini-auto-approve.jxa.js" "--config=$config" "$@"
