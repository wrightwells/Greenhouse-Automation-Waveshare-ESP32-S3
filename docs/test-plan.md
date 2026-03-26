# Test Plan

This test plan is the day-one validation scaffold derived from the functional specification. It is intended to guide bench work, Home Assistant integration testing, OTA validation, and safe-failure testing as implementation proceeds.

## Test Strategy

Validation should combine:

- bench testing for sensors, relays, networking, and display
- integration testing with Home Assistant, MQTT, and local web access
- OTA testing for both success and interrupted update paths
- recovery testing for AP fallback, degraded operation, and field maintenance flows

## Priority Test Areas

### Safe Boot

- all controlled outputs OFF on power-up
- no unsafe relay restore after reboot or brownout
- automatic logic held until configuration and sensor validation complete

### Networking

- Ethernet DHCP preferred when available
- Wi-Fi client fallback when Ethernet is absent
- AP fallback when no other network path succeeds
- local status access available in each supported connectivity mode

### Core Sensing

- both DHT22 sensors report usable values
- DS18B20 intake sensor reports correctly
- soil moisture input is calibrated and bounded
- flow pulses convert to a stable usable rate
- reed switch reports reliable open/closed state

### Control Logic

- actuator interlock prevents conflicting open/close relay activation
- ventilation thresholds use hysteresis to prevent chatter
- irrigation logic honours minimum run, maximum run, cooldown, and settle delay
- flow validation can fault irrigation safely when configured

### Recovery and Maintenance

- manual maintenance mode suspends automation clearly
- direct maintenance controls reflect state in local UI and Home Assistant
- factory reset returns the device to safe recovery defaults
- faults remain visible locally and through Home Assistant diagnostics

### OTA

- OTA requires credentials kept outside source control
- outputs move to safe OFF before update
- configuration survives successful update
- failed or interrupted OTA leaves the device recoverable and safe

## Initial Test Matrix

| ID | Area | Summary |
| --- | --- | --- |
| TC-F-001 | Safe boot | Verify all controlled outputs remain OFF at boot |
| TC-F-003 | Networking | Verify Ethernet priority with DHCP |
| TC-F-005 | Networking | Verify AP fallback with no valid network |
| TC-F-009 | HA integration | Verify expected entity exposure via ESPHome |
| TC-F-010 | Manual mode | Verify maintenance mode suspends automation |
| TC-F-013 | Ventilation | Verify threshold-driven ventilation response |
| TC-F-015 | Irrigation | Verify soil-moisture-driven irrigation with safeguards |
| TC-F-018 | Irrigation fault | Verify no-flow detection safe behaviour |
| TC-F-020 | Window control | Verify full-open actuator behaviour without conflicts |
| TC-OTA-001 | OTA | Verify successful OTA safe path |
| TC-OTA-003 | OTA fault | Verify interrupted OTA safe recovery |
| TC-N-003 | Sensor fault | Verify missing critical sensor triggers safe degradation |

## Bench Notes

- start with relay and sensor testing on the bench before connecting real greenhouse loads
- use dummy loads or safe lamp-style relay indicators where possible
- validate inductive load protection and actuator wiring before field use

## Evidence To Capture

- screenshots of Home Assistant entities and dashboards
- local web UI screenshots for status and admin pages
- OTA logs for success and failure scenarios
- bench notes for pin validation and signal integrity

## Expansion

As implementation progresses, expand this file into runnable test procedures and link per-area notes under `test/bench`, `test/integration`, and `test/ota`.

## Current Validation Notes

The repository now includes a first implementation pass for:

- safe boot output shutdown
- relay entities for all five controlled outputs
- template-based maintenance and automation controls
- DHT22, DS18B20, soil moisture, flow, and reed-switch entities
- timed window position estimation
- basic ventilation and irrigation automation loops
- OTA safe-state hook handling
- connectivity and fault diagnostics

Immediate next validation priorities:

- confirm the exact Waveshare Ethernet and relay pin mapping
- run `esphome config firmware/esphome/device.yaml` once the ESPHome CLI is installed
- bench-test relay polarity and interlocking before connecting real loads
- verify flow sensor scaling and soil moisture calibration against actual hardware
- verify whether Ethernet and AP recovery behavior fully match the target board and ESPHome version
