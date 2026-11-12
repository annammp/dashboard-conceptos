#!/usr/bin/env bash
# Instala Node y GitHub CLI en ~/.local sin sudo. Idempotente: correrlo dos
# veces deja el sistema igual que correrlo una vez.
set -euo pipefail

NODE_VERSION="26.13.1"
GH_VERSION="2.103.3"
PREFIX="${HOME}/.local"
BIN="${PREFIX}/bin"

log() { printf '%s\n' "  $*"; }

case "$(uname -m)" in
  arm64) NODE_ARCH="arm64"; GH_ARCH="arm64" ;;
  *)     NODE_ARCH="x64";   GH_ARCH="amd64" ;;
esac

mkdir -p "$BIN" "$PREFIX/share/man/man1"

install_node() {
  if [ -x "$BIN/node" ] && [ "$("$BIN/node" -v 2>/dev/null || true)" = "v${NODE_VERSION}" ]; then
    log "node v${NODE_VERSION} ya instalado, no hago nada"
    return 0
  fi
  local tarball tmp dir
  tarball="node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.xz"
  tmp="$(mktemp -d)"
  log "descargando ${tarball}"
  curl -fsSL -o "${tmp}/${tarball}" "https://nodejs.org/dist/v${NODE_VERSION}/${tarball}"
  curl -fsSL -o "${tmp}/SHASUMS256.txt" "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
  ( cd "$tmp" && grep " ${tarball}\$" SHASUMS256.txt | shasum -a 256 -c - >/dev/null )
  log "checksum de node verificado"
  dir="node-v${NODE_VERSION}-darwin-${NODE_ARCH}"
  rm -rf "${PREFIX}/${dir}"
  tar -xJf "${tmp}/${tarball}" -C "$PREFIX"
  ln -sfn "${PREFIX}/${dir}" "${PREFIX}/node"
  for b in node npm npx; do ln -sfn "${PREFIX}/node/bin/${b}" "${BIN}/${b}"; done
  rm -rf "$tmp"
  log "node $("$BIN/node" -v) + npm $("$BIN/npm" -v) instalados"
}

install_gh() {
  if [ -x "$BIN/gh" ] && "$BIN/gh" --version 2>/dev/null | head -1 | grep -q "${GH_VERSION}"; then
    log "gh ${GH_VERSION} ya instalado, no hago nada"
    return 0
  fi
  local zip tmp base
  zip="gh_${GH_VERSION}_macOS_${GH_ARCH}.zip"
  base="gh_${GH_VERSION}_macOS_${GH_ARCH}"
  tmp="$(mktemp -d)"
  log "descargando ${zip}"
  curl -fsSL -o "${tmp}/${zip}" \
    "https://github.com/cli/cli/releases/download/v${GH_VERSION}/${zip}"
  curl -fsSL -o "${tmp}/checksums.txt" \
    "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_checksums.txt"
  ( cd "$tmp" && grep " ${zip}\$" checksums.txt | shasum -a 256 -c - >/dev/null )
  log "checksum de gh verificado"
  unzip -q -o "${tmp}/${zip}" -d "$tmp"
  install -m 755 "${tmp}/${base}/bin/gh" "${BIN}/gh"
  cp -f "${tmp}/${base}/share/man/man1/"*.1 "${PREFIX}/share/man/man1/" 2>/dev/null || true
  rm -rf "$tmp"
  log "$("$BIN/gh" --version | head -1) instalado"
}

install_node
install_gh
log "listo"
