#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ESPHOME_FILE="$ROOT_DIR/firmware/esphome/device.yaml"

if ! command -v esphome >/dev/null 2>&1; then
  echo "ESPHome CLI is required for validation."
  echo "Install with: pip install esphome"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/firmware/esphome/secrets.yaml" ]]; then
  echo "Missing firmware/esphome/secrets.yaml"
  echo "Copy firmware/esphome/secrets.example.yaml to firmware/esphome/secrets.yaml first."
  exit 1
fi

echo "Validating ESPHome configuration..."
esphome config "$ESPHOME_FILE"
echo "Validation complete."
