# Detailed Test Cases

This document keeps the detailed test cases separate from the higher-level [test plan](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/test-plan.md).

It combines:

- retained test cases from the original functional specification
- revised test cases from the updated functional specification
- code-derived validation cases for the current repository implementation

Use this document as the practical checklist for bench, integration, OTA, and recovery testing.

## Test Groups

- `Functional`: expected normal behavior
- `OTA`: update and recovery behavior
- `Negative`: invalid inputs and fault conditions
- `Current Implementation`: tests added from the actual code and runtime UI now in the repo

## Functional Test Cases

### TC-F-001 Safe boot output state

- Preconditions: device powered off, outputs connected to safe bench loads
- Steps: power on device
- Expected: all controlled outputs remain OFF during and after boot until logic explicitly enables them

### TC-F-002 Load persisted configuration on boot

- Preconditions: valid configuration previously saved
- Steps: reboot device
- Expected: saved thresholds, mode settings, and configuration are restored

### TC-F-003 Ethernet priority with DHCP

- Preconditions: Ethernet connected to DHCP network, Wi-Fi credentials present
- Steps: boot Ethernet profile
- Expected: device acquires Ethernet connectivity and reports Ethernet-active mode

### TC-F-004 Wi-Fi client fallback when Ethernet absent

- Preconditions: Wi-Fi profile built, valid Wi-Fi credentials saved
- Steps: boot device
- Expected: device connects to Wi-Fi client mode and local services are reachable

### TC-F-005 AP fallback without valid network

- Preconditions: no valid Ethernet or Wi-Fi client connection available
- Steps: boot appropriate profile
- Expected: AP recovery mode starts and recovery/config access is available

### TC-F-006 Local status page content

- Preconditions: device operational
- Steps: open local status page or ESPHome local web surface
- Expected: key readings, relay states, network mode, control mode, and fault indicators are visible

### TC-F-007 Update Wi-Fi credentials from local admin

- Preconditions: local admin path available
- Steps: change Wi-Fi credentials and save
- Expected: credentials are stored and used on the next valid network attempt

### TC-F-008 Update MQTT settings from local admin

- Preconditions: device operational
- Steps: change MQTT settings and save
- Expected: new MQTT settings are stored and used safely

### TC-F-009 Home Assistant entity exposure

- Preconditions: Home Assistant available
- Steps: add device through ESPHome integration
- Expected: expected sensors, switches, numbers, buttons, selects, and diagnostics appear

### TC-F-010 Manual maintenance mode enable

- Preconditions: automatic mode active
- Steps: enable manual mode from Home Assistant or local UI
- Expected: automatic logic is suspended and state is clearly visible

### TC-F-011 Manual maintenance mode cancel

- Preconditions: manual mode active
- Steps: cancel manual mode
- Expected: automatic logic resumes using valid current state

### TC-F-012 Direct manual relay control in manual mode

- Preconditions: manual mode active
- Steps: switch fan or pump output on and off
- Expected: output changes immediately and state reflects correctly in Home Assistant and local UI

### TC-F-013 Automatic ventilation threshold trigger

- Preconditions: valid temperature readings and automation enabled
- Steps: raise high temperature above threshold
- Expected: ventilation/window logic responds according to configuration

### TC-F-014 Ventilation hysteresis

- Preconditions: ventilation already active
- Steps: reduce temperature slightly without crossing close threshold
- Expected: outputs do not chatter

### TC-F-015 Irrigation trigger from low soil moisture

- Preconditions: valid soil reading below threshold
- Steps: allow control cycle to evaluate
- Expected: pump starts under irrigation rules

### TC-F-016 Moisture settling delay after irrigation

- Preconditions: irrigation cycle completed
- Steps: continue control loop before settle delay expires
- Expected: irrigation does not immediately retrigger

### TC-F-017 Flow validation during irrigation

- Preconditions: flow sensor connected and flow validation enabled
- Steps: start irrigation with valid flow
- Expected: flow is detected and no fault is raised

### TC-F-018 No-flow fault during irrigation

- Preconditions: irrigation active, flow expected
- Steps: run irrigation with no actual flow pulses
- Expected: irrigation stops or faults according to policy and safe behavior is maintained

### TC-F-019 Door reed switch reporting

- Preconditions: reed switch connected
- Steps: open and close the monitored door
- Expected: door state updates correctly

### TC-F-020 Window full open command

- Preconditions: actuator wiring valid
- Steps: request full open
- Expected: correct relay sequence occurs without conflicting relay state

### TC-F-021 Window full close command

- Preconditions: window partially open
- Steps: request full close
- Expected: correct relay sequence occurs and estimated position returns to closed

### TC-F-022 Window move to partial target position

- Preconditions: travel times configured
- Steps: request a partial position such as 50%
- Expected: actuator runs for expected duration and estimated position updates

### TC-F-023 Single-relay actuator mode

- Preconditions: single-relay mode configured
- Steps: issue actuator command
- Expected: controller uses only allowed single-relay behavior

### TC-F-024 Conflicting actuator prevention

- Preconditions: actuator available
- Steps: attempt simultaneous open and close requests
- Expected: conflicting relay activation is prevented

### TC-F-025 Display rendering

- Preconditions: display hardware and feature enabled
- Steps: observe display during normal operation
- Expected: configured values and state summary are shown

### TC-F-026 Factory reset from local admin

- Preconditions: device configured
- Steps: trigger factory reset and confirm
- Expected: configuration clears safely and recovery defaults are restored

### TC-F-027 Home Assistant offline local autonomy

- Preconditions: device previously operating with Home Assistant
- Steps: disconnect Home Assistant
- Expected: local automation continues

### TC-F-028 MQTT offline non-blocking behavior

- Preconditions: MQTT configured
- Steps: stop MQTT broker
- Expected: local control and Home Assistant API continue

### TC-F-029 Local rule table edit and save

- Preconditions: runtime UI available
- Steps: add or modify a rule row and save
- Expected: rule is validated, persisted, and used by subsequent evaluations

### TC-F-030 Invalid rule row rejected

- Preconditions: runtime UI available
- Steps: enter contradictory or incomplete rule data and save
- Expected: save is rejected and prior valid rules remain active

### TC-F-031 Rule ordering affects decision deterministically

- Preconditions: two rules capable of matching the same condition
- Steps: reorder rules and trigger the same sensor condition
- Expected: configured ordering/precedence is applied consistently

### TC-F-032 Conflicting rules arbitrated safely

- Preconditions: matching rules with conflicting actions
- Steps: trigger both in the same cycle
- Expected: safe arbitration policy is applied and unsafe outputs are prevented

### TC-F-033 High/low temperature combined ventilation decision

- Preconditions: both temperature levels available
- Steps: simulate stratification condition
- Expected: decision follows configured ventilation strategy

### TC-F-034 Home Assistant writes threshold value to device

- Preconditions: Home Assistant connected, writable entity exposed
- Steps: change threshold in Home Assistant
- Expected: device accepts and uses new value locally

### TC-F-035 Home Assistant disconnect after config sync

- Preconditions: Home Assistant previously synced values
- Steps: disconnect Home Assistant
- Expected: device continues with last valid locally stored settings

### TC-F-036 Local-web precedence over Home Assistant setting

- Preconditions: precedence mode set to local-web-wins
- Steps: change same setting in both paths
- Expected: local-web value wins and source is clear

### TC-F-037 Home Assistant precedence over local-web setting

- Preconditions: precedence mode set to HA-wins
- Steps: change same setting in both paths
- Expected: Home Assistant value wins and source is clear

### TC-F-038 7-day event log retention

- Preconditions: logging enabled
- Steps: generate events past retention/capacity limits
- Expected: oldest entries are pruned automatically

### TC-F-039 Log page displays recent events

- Preconditions: several retained events exist
- Steps: open local log page
- Expected: entries are shown newest first with timestamp and category

### TC-F-040 Output state changes are logged

- Preconditions: logging enabled in a build/config that logs those transitions
- Steps: trigger pump, fan, and window changes
- Expected: each configured significant transition generates an event

### TC-F-041 Manual mode transitions are logged

- Preconditions: automatic mode active
- Steps: enable and disable manual mode
- Expected: transitions appear in the configured log

### TC-F-042 Sensor fault and recovery are logged

- Preconditions: device operating normally
- Steps: disconnect and reconnect a critical sensor
- Expected: fault and recovery events appear in retained logging

### TC-F-043 Logging fault does not stop control

- Preconditions: simulated logging storage issue
- Steps: induce logging problem
- Expected: safe control continues and logging fault is exposed

### TC-F-044 Flow-rate-based irrigation validation

- Preconditions: irrigation rule active, flow sensor present
- Steps: test valid flow and invalid flow conditions
- Expected: valid flow allows run, invalid flow triggers safe response

### TC-F-045 Local rule engine disable separate from manual mode

- Preconditions: automatic mode active
- Steps: disable rule engine without entering manual mode
- Expected: automatic actuation stops according to design and state is exposed clearly

## OTA Test Cases

### TC-OTA-001 Successful OTA update

- Preconditions: device reachable, valid OTA credentials
- Steps: perform OTA update
- Expected: outputs go safe OFF, update completes, reboot succeeds, device reconnects

### TC-OTA-002 Incorrect OTA credentials

- Preconditions: device online
- Steps: attempt OTA with wrong credentials
- Expected: update is rejected and running firmware remains intact

### TC-OTA-003 Interrupted OTA update

- Preconditions: OTA in progress
- Steps: interrupt power or network
- Expected: outputs are not left active and recovery path remains available

### TC-OTA-004 Post-update reconnect to Wi-Fi

- Preconditions: Wi-Fi profile deployment
- Steps: complete OTA and reboot
- Expected: device reconnects using saved Wi-Fi settings

### TC-OTA-005 Post-update reconnect to Ethernet

- Preconditions: Ethernet profile deployment
- Steps: complete OTA and reboot
- Expected: device reacquires Ethernet connectivity

### TC-OTA-006 Post-update reconnect to Home Assistant

- Preconditions: Home Assistant available
- Steps: complete OTA
- Expected: entities return in Home Assistant

### TC-OTA-007 Entity availability after update

- Preconditions: entity set known before OTA
- Steps: compare before/after OTA
- Expected: entities restore correctly or unavailable states are explicit

### TC-OTA-008 Configuration persistence after update

- Preconditions: non-default values saved
- Steps: perform OTA
- Expected: values remain intact

### TC-OTA-009 Device recovery after failed OTA

- Preconditions: failed OTA induced
- Steps: reboot and recover
- Expected: device remains safe and reachable through supported path

### TC-OTA-010 Repeat OTA update between valid versions

- Preconditions: previous successful OTA already performed
- Steps: perform another valid OTA cycle
- Expected: repeat OTA works without configuration corruption

### TC-OTA-011 Rule table persistence across OTA

- Preconditions: custom rule table saved
- Steps: perform OTA
- Expected: rule table persists and remains valid

### TC-OTA-012 Event log subsystem recovers after OTA

- Preconditions: retained entries exist
- Steps: perform OTA and reboot
- Expected: logging subsystem initializes or faults explicitly without stopping control

### TC-OTA-013 OTA events are logged

- Preconditions: build/config intended to log OTA events
- Steps: perform successful OTA
- Expected: OTA start and OTA success events are present

## Negative And Fault Test Cases

### TC-N-001 Wi-Fi unavailable at boot

- Preconditions: no Ethernet, invalid or unreachable Wi-Fi
- Steps: boot Wi-Fi profile
- Expected: AP recovery mode starts

### TC-N-002 Home Assistant unavailable

- Preconditions: device previously operating with Home Assistant
- Steps: stop or isolate Home Assistant
- Expected: local automation continues

### TC-N-003 Sensor missing at boot

- Preconditions: one critical sensor disconnected
- Steps: boot device
- Expected: dependent automation degrades safely and unaffected functions continue

### TC-N-004 Sensor failure during operation

- Preconditions: device running normally
- Steps: disconnect or invalidate a critical sensor
- Expected: related outputs move to safe behavior

### TC-N-005 Invalid configuration submission

- Preconditions: local config path available
- Steps: submit out-of-range value
- Expected: save is rejected or safely clamped

### TC-N-006 Unexpected reboot during active automation

- Preconditions: pump or fan active
- Steps: force reboot
- Expected: outputs return OFF on startup and only resume after checks

### TC-N-007 Brownout or power interruption

- Preconditions: device operating
- Steps: remove and restore power
- Expected: safe reboot sequence occurs

### TC-N-008 Display absent or failed

- Preconditions: display disconnected or disabled
- Steps: boot and operate device
- Expected: core control remains operational

### TC-N-009 Flow sensor pulse noise / invalid readings

- Preconditions: flow input active
- Steps: inject implausible pulses
- Expected: values are bounded or faulted safely

### TC-N-010 Window position drift due to timing mismatch

- Preconditions: travel times intentionally misconfigured
- Steps: run partial window moves
- Expected: controller still avoids conflicting drive and supports recalibration strategy

### TC-N-011 Home Assistant sends invalid threshold

- Preconditions: Home Assistant connected
- Steps: write out-of-range value
- Expected: value is rejected or safely clamped

### TC-N-012 Corrupted rule table at boot

- Preconditions: simulated corrupt stored rule data
- Steps: boot device
- Expected: safe fallback or affected automation disablement occurs

### TC-N-013 Log storage saturation

- Preconditions: logging enabled
- Steps: generate enough retained events to exceed storage budget
- Expected: oldest entries are pruned first and control remains unaffected

### TC-N-014 Conflicting Home Assistant and local configuration writes

- Preconditions: both paths available
- Steps: submit different values close together
- Expected: precedence policy is applied consistently

## Current Code-Derived Test Cases

These cases come directly from the current repository implementation and should be run even where the original specification did not spell them out explicitly.

### TC-C-001 Build profile validation

- Preconditions: local ESPHome CLI installed
- Steps:
  - run `esphome config firmware/esphome/device-ethernet.yaml`
  - run `esphome config firmware/esphome/device-wifi.yaml`
- Expected: both profiles validate independently

### TC-C-002 Build profile compilation

- Preconditions: toolchain available
- Steps:
  - compile `device-ethernet.yaml`
  - compile `device-wifi.yaml`
- Expected: both profiles compile successfully

### TC-C-003 Runtime UI availability

- Preconditions: device online
- Steps: open `http://<device-ip>:8081/`
- Expected: runtime UI loads and shows rule editor, log viewer, and test page if compiled in

### TC-C-004 Embedded test page disabled by default

- Preconditions: default build with `test_ui_enabled: "false"`
- Steps: open runtime UI
- Expected: test page is hidden

### TC-C-005 Embedded test page enabled at compile time

- Preconditions: build compiled with `test_ui_enabled: "true"`
- Steps: open runtime UI
- Expected: automation test page is visible

### TC-C-006 Per-sensor live/manual source selection

- Preconditions: test page enabled
- Steps: switch each supported sensor between `live` and `manual`
- Expected: source indicator and effective value update correctly

### TC-C-007 Manual sensor value drives effective sensor path

- Preconditions: test page enabled, automation active
- Steps: set a manual sensor value that crosses an active threshold
- Expected: local automation reacts to the manual effective value

### TC-C-008 Test overrides do not rewrite persisted rules

- Preconditions: saved rule table present
- Steps: use manual sensor overrides, reboot without saving rules
- Expected: rule table remains unchanged

### TC-C-009 Test overrides are RAM-only

- Preconditions: test overrides active
- Steps: reboot device
- Expected: overrides clear on reboot unless re-applied

### TC-C-010 Runtime log viewer filter

- Preconditions: retained log entries exist
- Steps: filter runtime log by category
- Expected: viewer shows only matching entries

### TC-C-011 Bounded retained log behavior

- Preconditions: runtime log storage active
- Steps: generate enough retained log events to exceed capacity or age window
- Expected: oldest entries prune first and runtime UI remains responsive

### TC-C-012 Narrowed retained log scope

- Preconditions: current implementation build
- Steps: trigger rule save and sensor fault/fault-clear transitions, then unrelated output changes
- Expected:
  - rule save events are retained
  - sensor fault and clear events are retained
  - unrelated output changes are not retained in the bounded flash-backed log

### TC-C-013 Embedded rule editor persists changes

- Preconditions: runtime UI available
- Steps: add, reorder, and save rules through the runtime UI
- Expected: rules persist across reboot

## Evidence To Capture

- screenshots of Home Assistant device/entities
- screenshots of runtime UI pages on port `8081`
- logs or notes from OTA success and failure tests
- notes on retained log pruning behavior
- bench notes for relay polarity, sensor scaling, and pin validation

## Execution Notes

- run high-risk tests on the bench before greenhouse deployment
- prefer dummy loads before connecting mains or inductive field hardware
- record firmware profile used for each test:
  - Ethernet profile
  - Wi-Fi profile
- record whether the test page was compiled in for the build under test
