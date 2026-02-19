#!/usr/bin/env bash
set -euo pipefail

REPO="travislindahl/nugman"
INSTALL_DIR="${HOME}/.local/bin"

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux)  OS_NAME="linux" ;;
  Darwin) OS_NAME="darwin" ;;
  *)
    echo "Error: Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

case "${OS_NAME}-${ARCH}" in
  linux-x86_64)   ARCH_NAME="x64" ;;
  darwin-arm64)   ARCH_NAME="arm64" ;;
  linux-aarch64)  ARCH_NAME="x64" ;; # fallback — no linux-arm64 binary yet
  *)
    echo "Error: No prebuilt binary for ${OS} ${ARCH}. Install via npm instead:" >&2
    echo "  npm install -g nugman" >&2
    exit 1
    ;;
esac

BINARY="nugman-${OS_NAME}-${ARCH_NAME}"

# Get latest release tag
echo "Fetching latest release..."
TAG="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')"

if [[ -z "$TAG" ]]; then
  echo "Error: Could not determine latest release" >&2
  exit 1
fi

echo "Installing nugman ${TAG} (${OS_NAME}-${ARCH_NAME})..."

# Download binary
URL="https://github.com/${REPO}/releases/download/${TAG}/${BINARY}"
mkdir -p "$INSTALL_DIR"
curl -fsSL "$URL" -o "${INSTALL_DIR}/nugman"
chmod +x "${INSTALL_DIR}/nugman"

# Check PATH
if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
  echo ""
  echo "Warning: ${INSTALL_DIR} is not on your PATH."
  echo "Add it with:"
  echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
  echo ""
fi

echo "nugman ${TAG} installed to ${INSTALL_DIR}/nugman"
