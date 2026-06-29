#!/usr/bin/env sh

set -e

REQUIRED_NODE_VERSION=24
PACKAGE="@tile.js/cli@latest"

CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
GRAY='\033[90m'
RESET='\033[0m'

info() {
    printf "${CYAN}%s${RESET}\n" "$1"
}

success() {
    printf "${GREEN}%s${RESET}\n" "$1"
}

warning() {
    printf "${YELLOW}%s${RESET}\n" "$1"
}

error() {
    printf "${RED}%s${RESET}\n" "$1"
}

clear_line() {
    printf "\r\033[K"
}

spinner() {
    pid=$1
    message=$2

    frames='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    i=0

    while kill -0 "$pid" 2>/dev/null; do
        frame=$(printf "%s" "$frames" | cut -c $((i + 1)))
        printf "\r%s %s" "$frame" "$message"
        i=$(((i + 1) % 10))
        sleep 0.08
    done

    clear_line
}

info "Installing Tile CLI"
echo

# Node.js
if ! command -v node >/dev/null 2>&1; then
    error "Node.js is not installed."
    echo
    echo "Please install Node.js $REQUIRED_NODE_VERSION or newer:"
    echo "https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/^v//' | cut -d. -f1)

if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    error "Node.js $REQUIRED_NODE_VERSION or newer is required."
    echo
    echo "Current version: $(node -v)"
    echo
    echo "Please update Node.js:"
    echo "https://nodejs.org/"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    error "npm was not found."
    exit 1
fi

LOG="$(mktemp)"

(
    npm install -g "$PACKAGE" >"$LOG" 2>&1
) &
PID=$!

spinner "$PID" "Installing package..."

wait "$PID"
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
    echo
    error "Installation failed."
    echo
    cat "$LOG"
    rm -f "$LOG"
    exit "$STATUS"
fi

rm -f "$LOG"

success "Tile CLI installed successfully."
echo

if command -v tile >/dev/null 2>&1; then
    tile version
else
    warning "The 'tile' command is not available in the current terminal."
    echo
    printf "${GRAY}Open a new terminal and run:${RESET}\n\n"
    printf "    tile version\n"
fi