#!/bin/sh
set -eu
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec /usr/bin/osascript -l JavaScript "$dir/gemini-auto-approve.jxa.js" --dry-run "$@"
