#!/bin/sh
set -eu
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
printf '%s\n' 'WARNING: Automatic approval does not review request contents. Use only in an isolated trusted environment. Ctrl-C stops the monitor.' >&2
exec /usr/bin/osascript -l JavaScript "$dir/gemini-auto-approve.jxa.js" --approve-all "$@"
