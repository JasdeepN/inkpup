#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-warm}"
shift || true

IMAGES_RAW="${ACT_IMAGE_CACHE_IMAGES:-ghcr.io/catthehacker/ubuntu:act-latest}"
IFS=' ' read -r -a IMAGES <<< "$IMAGES_RAW"

CACHE_DIR="${ACT_IMAGE_CACHE_DIR:-$HOME/.cache/act-images}"
mkdir -p "$CACHE_DIR"

trap 'echo "Aborted" >&2; exit 1' INT

usage() {
  cat <<'USAGE'
Usage: act-cache-images.sh [command]

Commands:
  warm|pull   Pull images and refresh the compressed cache archive for each
  load        Restore images from the local cache into Docker
  list        Show cache status for each configured image
  prune       Remove cached archives from the cache directory
  help        Show this message

Environment:
  ACT_IMAGE_CACHE_IMAGES  Space-delimited list of Docker images to cache
  ACT_IMAGE_CACHE_DIR     Directory used to store compressed image archives

Examples:
  ./scripts/act-cache-images.sh warm
  ./scripts/act-cache-images.sh load
  ACT_IMAGE_CACHE_IMAGES="ghcr.io/catthehacker/ubuntu:act-latest node:20" ./scripts/act-cache-images.sh warm
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found in PATH" >&2
    exit 1
  fi
}

cache_path() {
  local image="$1"
  local safe
  safe="${image//\//__}"
  safe="${safe//:/__}"
  echo "$CACHE_DIR/${safe}.tar.gz"
}

warm_cache() {
  require_cmd docker
  require_cmd gzip
  for image in "${IMAGES[@]}"; do
    echo "Pulling ${image}..."
    docker pull "$image" >/dev/null
    local archive
    archive="$(cache_path "$image")"
    echo "Saving ${image} -> ${archive}"
    docker save "$image" | gzip -c > "${archive}.tmp"
    mv "${archive}.tmp" "$archive"
  done
}

load_cache() {
  require_cmd docker
  require_cmd gzip
  for image in "${IMAGES[@]}"; do
    local archive
    archive="$(cache_path "$image")"
    if [[ -f "$archive" ]]; then
      echo "Loading ${image} from cache..."
      gzip -dc "$archive" | docker load >/dev/null
    else
      echo "Cache miss for ${image} (${archive})" >&2
    fi
  done
}

list_cache() {
  for image in "${IMAGES[@]}"; do
    local archive
    archive="$(cache_path "$image")"
    if [[ -f "$archive" ]]; then
      local size
      size="$(du -h "$archive" | cut -f1)"
      echo "✔ ${image} — ${size} (${archive})"
    else
      echo "✘ ${image} — not cached (${archive})"
    fi
  done
}

prune_cache() {
  if [[ -d "$CACHE_DIR" ]]; then
    echo "Removing cached archives in $CACHE_DIR"
    rm -f "$CACHE_DIR"/*.tar.gz 2>/dev/null || true
  fi
}

case "$COMMAND" in
  warm|pull)
    warm_cache
    ;;
  load)
    load_cache
    ;;
  list)
    list_cache
    ;;
  prune)
    prune_cache
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    usage
    exit 1
    ;;
esac
