# ESP32-S3 Greenhouse Environmental Control & Irrigation Controller

ESPHome-first, Home Assistant friendly greenhouse controller for the Waveshare ESP32-S3 industrial Ethernet relay platform.

## Project Purpose

This repository is the main implementation repo for a local-first greenhouse controller that:

- monitors greenhouse environmental conditions
- evaluates a deterministic local automation rule table
- controls fans, irrigation, and a window actuator
- exposes state and controls to Home Assistant through the ESPHome API
- publishes supplementary telemetry to MQTT when configured
- stores and serves a lightweight rolling 7-day event log
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
- `docs/rule-engine-design.md`: local rule-table automation design and arbitration model
- `docs/event-log-design.md`: bounded 7-day logging design and event schema
- `docs/home-assistant-implementation.md`: Home Assistant entity map, helper patterns, YAML examples, and dashboard guidance
- `firmware/esphome/`: primary ESPHome configuration and reusable packages
- `firmware/esphome/components/greenhouse_runtime/`: custom external component for flash-backed rule storage and bounded event logging
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

Primary ESPHome entrypoints:

- [firmware/esphome/device-ethernet.yaml](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/firmware/esphome/device-ethernet.yaml): Ethernet-first build profile
- [firmware/esphome/device-wifi.yaml](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/firmware/esphome/device-wifi.yaml): Wi-Fi/AP build profile
- [firmware/esphome/device.yaml](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/firmware/esphome/device.yaml): compatibility wrapper currently pointing at the Ethernet profile

Shared configuration lives in [firmware/esphome/device-common.yaml](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/firmware/esphome/device-common.yaml), with transport-specific packages layered on top.

Current package layout:

- `packages/sensors.yaml`: environmental and input sensors
- `packages/control.yaml`: relays, automation controls, window logic, and irrigation state
- `packages/rule_engine.yaml`: rule-engine entity and policy scaffolding
- `packages/logging.yaml`: bounded event-log health and retention scaffolding
- `packages/diagnostics.yaml`: connectivity, fault, and runtime diagnostics

Planned next package/layout expansion for the updated specification:

- `packages/rule_engine.yaml` or equivalent custom component support for ordered local rule-table evaluation
- persistent rule-table storage and validation layer
- bounded event log storage and local log-view surface
- configuration-origin metadata for local-web, Home Assistant, restore, and fallback values

Runtime component status:

- `components/greenhouse_runtime` now provides a flash-backed on-device rule-table store
- the same component maintains a bounded event log with oldest-first pruning by age, entry count, and serialized byte budget
- retained log entries are intentionally limited to rule-table changes and sensor fault/fault-clear transitions
- the component serves a dedicated local runtime UI on `http://<device-ip>:8081/`

## Build, Validate, and Deploy

Basic local workflow:

1. Run `./scripts/setup.sh`
2. Copy `firmware/esphome/secrets.example.yaml` to `firmware/esphome/secrets.yaml`
3. Choose the correct entrypoint for the deployment:
   `firmware/esphome/device-ethernet.yaml` for Ethernet-first installations
   `firmware/esphome/device-wifi.yaml` for Wi-Fi/AP installations
4. Update shared settings in `firmware/esphome/device-common.yaml` and hardware pin assumptions in the package files
5. Run `./scripts/validate.sh` or validate the chosen entrypoint directly
6. Build or upload with ESPHome tooling, for example:

```bash
esphome config firmware/esphome/device-ethernet.yaml
esphome compile firmware/esphome/device-ethernet.yaml
esphome run firmware/esphome/device-ethernet.yaml
```

Wi-Fi profile example:

```bash
esphome config firmware/esphome/device-wifi.yaml
esphome compile firmware/esphome/device-wifi.yaml
esphome run firmware/esphome/device-wifi.yaml
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
- rule-engine status, automation source, and last-decision diagnostics
- writable supervisory values that Home Assistant can sync into the device
- restart and factory reset actions where safely supported

See [docs/home-assistant-integration.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/home-assistant-integration.md) for the planned entity model and dashboard guidance, and [docs/home-assistant-implementation.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/home-assistant-implementation.md) for the required helper and YAML handoff.

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

Structured solution for the updated specification:

- move from fixed threshold logic toward an explicit deterministic local rule-table engine
- keep the device as final decision-maker for ventilation, irrigation, and window actions
- treat Home Assistant as a supervisory writer of thresholds, profiles, and enable states
- add a bounded 7-day event log for significant transitions and decisions only
- expose rule-engine state, config source, and logging health as diagnostics
- provide a local web rule editor and local log viewer alongside existing status/admin flows

Current scaffold progress for that updated direction:

- firmware entity/model scaffolding now includes rule-engine enable states, conflict/precedence controls, and logging health entities
- firmware now includes a custom `greenhouse_runtime` external component for persisted rules and bounded flash-backed logs
- the local browser prototype now includes a rule editor page and an event log viewer page
- the browser prototype event log uses a hard bounded capacity with rollover pruning so logs cannot grow without limit in memory

Current assumptions and known implementation limits:

- relay GPIO mapping and Ethernet pins are still placeholders until exact board validation
- ESPHome web server currently serves as the local status/admin surface for the first implementation pass
- simultaneous Ethernet plus dedicated Wi-Fi AP behavior may require follow-up validation or targeted customization
- display hardware is not implemented yet because the exact display model and bus were left open in the specification
- single-relay actuator mode is exposed as a configuration option, but final hardware-specific behavior still needs validation
- the updated local rule editor and rolling event log likely require targeted custom storage/UI handling beyond plain ESPHome entities alone
- Home Assistant-origin tracking and precedence metadata will require explicit persistence and source-tagging design
