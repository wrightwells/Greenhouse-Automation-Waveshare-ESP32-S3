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

### Intended Users

- homelab users
- Home Assistant users
- greenhouse hobbyists
- maintainers who want an ESPHome-first, recoverable controller

## Scope Summary

### In Scope

- Waveshare ESP32-S3 Ethernet relay board deployment
- ESPHome-first firmware
- relay outputs for actuator, fans, and irrigation
- DHT22, DS18B20, soil moisture, flow, and reed-switch sensing
- Ethernet/Wi-Fi/AP fallback logic
- local web status and admin surfaces
- local device-resident automation rule engine
- local web rule editor
- Home Assistant integration through ESPHome
- Home Assistant-assisted configuration path
- supplementary MQTT telemetry
- manual maintenance mode
- OTA updates
- safe-state boot and failure behaviour
- rolling 7-day local event log and log viewer
- small local display support

### Out of Scope

- full bespoke firmware unless ESPHome or targeted custom extensions prove insufficient
- cloud dependency
- mobile apps
- camera, audio, Bluetooth, and advanced graphical UI features
- full 8-relay expansion in v1

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
- event/state logging subsystem
- local log viewer
- Home Assistant entity layer
- supplementary MQTT telemetry
- OTA/update manager
- diagnostics and fault reporting
- local display rendering

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
- OTA must not leave outputs active

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

## Notes For Implementation

- keep secrets out of source control
- keep pin assumptions easy to revise
- prefer ESPHome-native components first
- use custom components only where requirements cannot be expressed cleanly
- make fault states explicit
- preserve local-first operation
- treat the device as final automation decision-maker
- keep Home Assistant as supervisory configuration and notification layer

## Source of Truth

The full functional specification provided during repository preparation is the source of truth for implementation decisions. This scaffold intentionally keeps the project ready for coding while avoiding premature custom code.
