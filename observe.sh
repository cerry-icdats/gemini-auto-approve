#!/bin/sh
set -eu
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
config="$dir/config.json"
if [ ! -e "$config" ]; then
  config="$dir/config.example.json"
fi
exec /usr/bin/osascript -l JavaScript "$dir/gemini-auto-approve.jxa.js" "--config=$config" "$@"
