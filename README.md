# ESP32-S3 Greenhouse Environmental Control & Irrigation Controller

ESPHome-first, Home Assistant friendly greenhouse controller for the Waveshare ESP32-S3 industrial Ethernet relay platform.

## Project Purpose

This repository is the main implementation repo for a local-first greenhouse controller that:

- monitors greenhouse environmental conditions
- controls fans, irrigation, and a window actuator
- exposes state and controls to Home Assistant through the ESPHome API
- publishes supplementary telemetry to MQTT when configured
- remains operational locally if Home Assistant or MQTT are unavailable
- supports OTA updates, AP fallback, and recovery-oriented maintenance workflows

## Hardware Summary

Target hardware for v1:

- Waveshare ESP32-S3-ETH-8DI-8RO family, Ethernet-capable variant
- Relay outputs 1-5 reserved for:
  - window actuator open
  - window actuator close
  - intake fan
  - exhaust fan
  - irrigation pump
- Sensors:
  - 2 x DHT22 / AM2302
  - 1 x DS18B20
  - 1 x analog capacitive soil moisture sensor
  - 1 x hall-effect flow sensor
  - 1 x normally closed reed switch
- Small 2-line class display

See [hardware/pinout.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/hardware/pinout.md) and [hardware/bom.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/hardware/bom.md) for implementation notes and early planning.

## Repo Layout

- `docs/`: specification, test planning, hardware notes, and Home Assistant integration notes
- `firmware/esphome/`: primary ESPHome configuration and reusable packages
- `firmware/custom_components/`: reserved for targeted extensions if ESPHome-native features prove insufficient
- `hardware/`: pin planning, BOM notes, enclosure and wiring reminders
- `test/`: bench, integration, and OTA validation notes
- `scripts/`: setup and validation helpers for local development
- `.github/workflows/`: CI placeholder for config validation and linting

## Secrets and Configuration

Do not commit real secrets.

Use [firmware/esphome/secrets.example.yaml](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/firmware/esphome/secrets.example.yaml) as the template:

1. Copy it to `firmware/esphome/secrets.yaml`
2. Fill in Wi-Fi, OTA, API, and MQTT values
3. Keep `secrets.yaml` local only

Project-specific settings that are expected to evolve live in [firmware/esphome/device.yaml](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/firmware/esphome/device.yaml). Hardware pin assumptions should be validated before deployment.

Current package layout:

- `packages/sensors.yaml`: environmental and input sensors
- `packages/control.yaml`: relays, automation controls, window logic, and irrigation state
- `packages/diagnostics.yaml`: connectivity, fault, and runtime diagnostics

## Build, Validate, and Deploy

Basic local workflow:

1. Run `./scripts/setup.sh`
2. Copy `firmware/esphome/secrets.example.yaml` to `firmware/esphome/secrets.yaml`
3. Update device-specific settings and pin assignments in `firmware/esphome/device.yaml`
4. Run `./scripts/validate.sh`
5. Build or upload with ESPHome tooling, for example:

```bash
esphome config firmware/esphome/device.yaml
esphome compile firmware/esphome/device.yaml
esphome run firmware/esphome/device.yaml
```

## OTA Expectations

OTA is expected to use the standard ESPHome OTA mechanism with authentication stored in `secrets.yaml`.

Operational intent:

- outputs default safe OFF before update
- automatic control suspends during OTA
- reboot follows a safe boot sequence
- connectivity returns by Ethernet-first, then Wi-Fi client, then AP fallback
- automation resumes only after health checks pass

OTA validation scenarios are documented in [docs/test-plan.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/test-plan.md).

## Home Assistant Integration

Primary integration is the ESPHome native API. MQTT is supplementary and must not be required for core control.

Planned Home Assistant exposure includes:

- environmental sensors
- relay switches
- window position and maintenance controls
- configuration numbers and selects
- connectivity and fault diagnostics
- restart and factory reset actions where safely supported

See [docs/home-assistant-integration.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/home-assistant-integration.md) for the planned entity model and dashboard guidance.

## Implementation Notes

- ESPHome-first is the default approach
- safe boot and fault handling take priority over feature breadth
- pin mapping and optional hardware features should remain adjustable without large rewrites
- custom components are reserved for requirements ESPHome cannot express cleanly

## Current Implementation Status

Implemented in the current ESPHome configuration:

- safe boot with all five controlled outputs forced OFF
- Ethernet, Wi-Fi, captive portal, web server, API, OTA, and MQTT scaffolding
- environmental sensors for two DHT22 inputs, one DS18B20, soil moisture, flow, and reed switch
- Home Assistant friendly entities for relays, buttons, numbers, selects, diagnostics, and template state
- estimated window position state with timed open/close motion tracking
- basic threshold-based ventilation automation
- basic soil-moisture-based irrigation automation with cooldown, settle delay, and no-flow fault handling
- OTA begin-hook safe state handling

Current assumptions and known implementation limits:

- relay GPIO mapping and Ethernet pins are still placeholders until exact board validation
- ESPHome web server currently serves as the local status/admin surface for the first implementation pass
- simultaneous Ethernet plus dedicated Wi-Fi AP behavior may require follow-up validation or targeted customization
- display hardware is not implemented yet because the exact display model and bus were left open in the specification
- single-relay actuator mode is exposed as a configuration option, but final hardware-specific behavior still needs validation
