#!/usr/bin/env bash
set -euo pipefail
# ---- config ----
GO_VERSION=1.23.2
NODE_VERSION=20.18.0
NVM_VERSION=0.39.7
REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# ---- helpers ----
need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1" >&2; exit 1; }; }
install_go() {
  if go version 2>/dev/null | grep -q "$GO_VERSION"; then
    echo "Go $GO_VERSION already installed"
    return
  fi
  wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tgz
  sudo rm -rf /usr/local/go
  sudo tar -C /usr/local -xzf /tmp/go.tgz
  rm /tmp/go.tgz
}
install_nvm_node() {
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | bash
  fi
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
}
ensure_deps() {
  sudo apt-get update
  sudo apt-get install -y \
    build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev libappindicator3-dev libnotify-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev
}
install_wails() {
  export PATH="/usr/local/go/bin:$PATH"
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
}
build() {
  export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  nvm use "$NODE_VERSION"
  pushd "$REPO_ROOT/frontend"
  pnpm install
  popd
  wails build
}
main() {
  ensure_deps
  install_go
  install_nvm_node
  install_wails
  build
  echo "Build complete. Check ./build/bin/ for the new executable."
}
main "$@"
