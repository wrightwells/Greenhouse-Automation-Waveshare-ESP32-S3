# ESPHome Firmware Layout

This directory contains the ESPHome-first firmware scaffold for the greenhouse controller.

## Files

- `device-common.yaml`: shared ESPHome node, OTA, MQTT, runtime-store, and package wiring
- `device-ethernet.yaml`: Ethernet-first entrypoint
- `device-wifi.yaml`: Wi-Fi/AP entrypoint
- `device.yaml`: compatibility wrapper that currently includes the Ethernet profile
- `packages/network-ethernet.yaml`: Ethernet-only transport config
- `packages/network-wifi.yaml`: Wi-Fi/AP-only transport config
- `packages/sensors.yaml`: sensor and input definitions
- `packages/control.yaml`: relays, automation controls, and window/irrigation logic
- `packages/rule_engine.yaml`: rule-engine enable flags, policy entities, and automation-source diagnostics
- `packages/logging.yaml`: event-log diagnostics and runtime-store integration hooks
- `packages/diagnostics.yaml`: shared diagnostics
- `packages/diagnostics-ethernet.yaml`: Ethernet-specific diagnostics
- `packages/diagnostics-wifi.yaml`: Wi-Fi/AP-specific diagnostics
- `components/greenhouse_runtime/`: external component for persisted rule storage, bounded log retention, and embedded runtime UI
- `secrets.example.yaml`: template for local secrets

## Workflow

1. Copy `secrets.example.yaml` to `secrets.yaml`
2. Pick the correct entrypoint:
   `device-ethernet.yaml` for Ethernet-first hardware installs
   `device-wifi.yaml` for Wi-Fi/AP installs
3. Validate pin mappings against the exact Waveshare board revision
4. Update shared settings in `device-common.yaml` and package files as hardware is confirmed
5. Run `esphome config device-ethernet.yaml` or `esphome config device-wifi.yaml`
6. Compile and test incrementally on the bench before greenhouse deployment

## Notes

- current pin assignments are planning placeholders and must be validated
- the hostname/device slug is now `greenhouse-controller` to avoid underscore-related network issues
- `restore_mode: ALWAYS_OFF` is used for safety on controlled outputs
- custom components should only be added if the required behaviour cannot be expressed cleanly with ESPHome-native features
- first-pass local admin/status access is provided by the ESPHome web server and exposed entities
- the runtime component provides a dedicated rule-editor and log-view page on port `8081`
- the runtime component can also expose a compile-time-enabled automation test page for bench work; enable it by setting `test_ui_enabled: "true"` in `device-ethernet.yaml` or `device-wifi.yaml`
- test overrides are RAM-only and are intended to drive the live automation logic without touching the persisted rule table
- event logging is bounded and prunes oldest entries first so logging cannot grow without limit and crowd out control stability
- retained log scope is intentionally narrow: only persisted rule-table changes and sensor fault/fault-clear transitions are stored
- display support remains a follow-up once the exact hardware model is fixed
