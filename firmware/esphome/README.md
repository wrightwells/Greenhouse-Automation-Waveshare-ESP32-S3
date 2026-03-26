# ESPHome Firmware Layout

This directory contains the ESPHome-first firmware scaffold for the greenhouse controller.

## Files

- `device.yaml`: main node configuration and high-level services
- `packages/sensors.yaml`: sensor and input definitions
- `packages/control.yaml`: relays, automation controls, and window/irrigation logic
- `packages/diagnostics.yaml`: connectivity and diagnostic entities
- `secrets.example.yaml`: template for local secrets

## Workflow

1. Copy `secrets.example.yaml` to `secrets.yaml`
2. Validate pin mappings against the exact Waveshare board revision
3. Update relay polarity, Ethernet pins, and display settings as hardware is confirmed
4. Run `esphome config device.yaml`
5. Compile and test incrementally on the bench before greenhouse deployment

## Notes

- current pin assignments are planning placeholders and must be validated
- `restore_mode: ALWAYS_OFF` is used for safety on controlled outputs
- custom components should only be added if the required behaviour cannot be expressed cleanly with ESPHome-native features
- first-pass local admin/status access is provided by the ESPHome web server and exposed entities
- display support remains a follow-up once the exact hardware model is fixed
