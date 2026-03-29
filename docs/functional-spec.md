# Functional Specification

## Project

ESP32-S3 Greenhouse Environmental Control & Irrigation Controller

## Overview

This repository is scaffolded from the supplied functional specification for a Home Assistant friendly, ESPHome-first greenhouse controller built around a Waveshare ESP32-S3 Ethernet relay board.

### Purpose

Build a local-first greenhouse controller that can:

- monitor environmental conditions
- evaluate a local automation rule table
- control ventilation and irrigation equipment
- provide local web access for configuration and recovery
- allow local editing of thresholds and automation rules
- expose state to Home Assistant
- accept supervisory configuration updates from Home Assistant
- store and serve a lightweight rolling 7-day event/state log
- continue core operation when Home Assistant or MQTT are unavailable

This condensed functional specification has been refreshed to reflect the current repository implementation state as of March 29, 2026. The full long-form functional specification remains the original source of intent, while this file reflects what the repo is currently designed and scaffolded to do.

### Intended Users

- homelab users
- Home Assistant users
- greenhouse hobbyists
- maintainers who want an ESPHome-first, recoverable controller

## Scope Summary

### In Scope

- Waveshare ESP32-S3 Ethernet relay board deployment
- ESPHome-first firmware
- dual build-profile layout:
  - Ethernet-first profile
  - Wi-Fi/AP profile
- relay outputs for actuator, fans, and irrigation
- DHT22, DS18B20, soil moisture, flow, and reed-switch sensing
- Ethernet/Wi-Fi/AP fallback logic
- local web status and admin surfaces
- local device-resident automation rule engine
- local web rule editor
- compile-time-enabled local automation test page for bench work
- Home Assistant integration through ESPHome
- Home Assistant-assisted configuration path
- supplementary MQTT telemetry
- manual maintenance mode
- OTA updates
- safe-state boot and failure behaviour
- rolling 7-day local event log and log viewer
- bounded flash-backed storage for persisted rules and retained logs
- small local display support

### Out of Scope

- full bespoke firmware unless ESPHome or targeted custom extensions prove insufficient
- cloud dependency
- mobile apps
- camera, audio, Bluetooth, and advanced graphical UI features
- full 8-relay expansion in v1
- long-term on-device analytics or graphing beyond the bounded troubleshooting/event log

## Architecture Summary

Planned logical areas:

- network manager
- configuration manager
- sensor acquisition
- rule-table control engine
- output arbitration and safe relay handling
- window actuator abstraction
- local status/admin web interface
- local web rule editor
- local automation test interface
- event/state logging subsystem
- local log viewer
- Home Assistant entity layer
- supplementary MQTT telemetry
- OTA/update manager
- diagnostics and fault reporting
- local display rendering
- flash-backed runtime persistence component

## Current Repository Architecture

The current repo is organized around a shared ESPHome core plus transport-specific entrypoints:

- `firmware/esphome/device-common.yaml`
- `firmware/esphome/device-ethernet.yaml`
- `firmware/esphome/device-wifi.yaml`
- `firmware/esphome/device.yaml`

The implementation also includes a custom ESPHome external component:

- `firmware/esphome/components/greenhouse_runtime/`

That runtime component currently provides:

- persisted rule-table storage
- bounded flash-backed event log retention
- local runtime HTTP UI on port `8081`
- local rule editing
- local log viewing
- compile-time-enabled sensor override test controls for bench testing

## Core Behaviour Summary

- all five controlled outputs boot OFF
- configuration loads before automatic logic becomes active
- Ethernet is preferred when available
- Wi-Fi client is the fallback
- AP recovery mode is the last network fallback
- local status access should remain available on the active path
- automation remains local-first and safe under faults
- rule-table configuration persists locally
- event log is bounded and pruned automatically
- retained log scope is intentionally narrow in the current implementation:
  - persisted rule-table changes
  - sensor fault transitions
  - sensor fault clear transitions
- per-sensor manual test overrides are available in the embedded runtime UI when enabled at compile time
- OTA must not leave outputs active

## Current Implemented Behaviors

The repository currently implements or scaffolds the following behaviors explicitly:

- all five controlled outputs boot safe OFF
- Ethernet-first and Wi-Fi/AP-first firmware builds are separated into valid ESPHome profiles
- relay outputs are driven via the board expander instead of placeholder direct GPIO relay assumptions
- the device exposes Home Assistant friendly entities through the ESPHome API
- the local runtime component persists rules and stores a bounded retained event log in flash-backed storage
- the runtime UI is available on port `8081`
- the runtime UI includes:
  - rule editor
  - log viewer
  - compile-time-enabled sensor test page
- the embedded test page supports per-sensor `live/manual` selection for the currently supported testable sensors
- manual test values feed the same effective sensor path used by the local automation logic
- test overrides are RAM-only and do not rewrite the persisted rule table
- logging is bounded by:
  - retention window
  - maximum retained entries
  - maximum serialized JSON storage budget
- oldest entries are pruned first
- logging faults are designed not to block core safe control

## Functional Requirements Summary

Key requirements from the source specification include:

- safe boot output state
- persistent configuration
- Ethernet-first networking with Wi-Fi/AP fallback
- local web status and admin access
- local rule-table editing
- Home Assistant entity exposure via ESPHome
- Home Assistant supervisory configuration support
- supplementary MQTT reporting
- DHT22, DS18B20, soil moisture, flow, and reed-switch support
- coordinated window actuator control with interlocking
- irrigation safeguards using timing and optional flow validation
- deterministic rule-table conflict handling
- rolling local event logging
- selective safe degradation on sensor failure
- OTA with safe output handling
- local display support

Current repository-aligned clarifications:

- the rule engine and persistence model are implemented through a targeted custom runtime component rather than plain ESPHome YAML alone
- the event log currently uses a narrowed event scope to reduce write amplification and avoid risking control stability
- local sensor override testing is embedded in the device runtime UI rather than requiring Home Assistant
- Home Assistant remains supervisory and is not required for real-time actuation decisions

## Notes For Implementation

- keep secrets out of source control
- keep pin assumptions easy to revise
- prefer ESPHome-native components first
- use custom components only where requirements cannot be expressed cleanly
- make fault states explicit
- preserve local-first operation
- treat the device as final automation decision-maker
- keep Home Assistant as supervisory configuration and notification layer
- keep build profiles valid independently in CI and local validation
- keep logging bounded and lightweight so retained troubleshooting data cannot crowd out core control behavior
- prefer explicit bench-test controls over ad-hoc sensor simulation

## Logging Scope Clarification

The original long-form specification described a broader retained event log. The current repository implementation intentionally narrows retained flash-backed logging scope to reduce write amplification and implementation risk before hardware testing.

Current retained log scope:

- persisted rule-table changes
- sensor fault transitions
- sensor fault clear transitions

This is the current code-aligned behavior and should be treated as the implemented baseline unless broadened deliberately later.

## Build Profile Clarification

The current implementation uses separate build entrypoints because plain ESPHome does not support the originally desired simultaneous `ethernet:` and `wifi:` configuration in a single valid node definition.

Current profile model:

- `device-ethernet.yaml`: Ethernet-first deployment
- `device-wifi.yaml`: Wi-Fi/AP deployment
- `device.yaml`: compatibility wrapper currently including the Ethernet profile

This is now the intended repository behavior and is considered part of the implementation specification for testing.

## Embedded Test Page Clarification

The current runtime UI supports an optional compile-time test page controlled by `test_ui_enabled`.

When enabled, the embedded test page allows supported sensors to be switched individually between:

- live source
- manual source

The page displays:

- effective value
- live value
- manual value
- active source

This feature is intended for bench testing and rule-engine verification. Test overrides are RAM-only and are not part of the persisted rule-table store.

## Source of Truth

The full functional specification provided during repository preparation remains the source of truth for project intent. This document is the repo-aligned functional summary for the current implementation state and should be updated whenever implementation behavior changes materially.
