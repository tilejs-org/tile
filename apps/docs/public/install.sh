#!/usr/bin/env sh
set -e

API_URL="https://api-tilejs.vercel.app/versions/root"

echo "Installing Tile CLI..."

VERSION=$(curl -fsSL "$API_URL" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')

if [ -z "$VERSION" ]; then
  echo "Failed to fetch version from API"
  exit 1
fi

echo "Latest version: $VERSION"

DOWNLOAD_URL="https://github.com/tilejs-org/tile/releases/download/v$VERSION/install.sh"

echo "Downloading installer from $DOWNLOAD_URL"

curl -fsSL "$DOWNLOAD_URL" | sh

echo "Tile CLI v$VERSION installed successfully."