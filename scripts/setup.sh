#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ESPHOME_DIR="$ROOT_DIR/firmware/esphome"

echo "Project root: $ROOT_DIR"

if ! command -v esphome >/dev/null 2>&1; then
  echo "ESPHome CLI not found."
  echo "Install with: pip install esphome"
else
  echo "ESPHome CLI detected: $(esphome version)"
fi

if [[ ! -f "$ESPHOME_DIR/secrets.yaml" ]]; then
  cp "$ESPHOME_DIR/secrets.example.yaml" "$ESPHOME_DIR/secrets.yaml"
  echo "Created local secrets file at firmware/esphome/secrets.yaml"
  echo "Update it with your real values before compiling or uploading."
else
  echo "Local secrets file already exists."
fi

echo "Setup complete."
