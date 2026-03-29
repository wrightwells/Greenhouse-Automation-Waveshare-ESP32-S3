# Home Assistant Setup Guide

This guide starts from the point where:

- the firmware is already flashed to the ESP32
- the controller has booted successfully
- the controller and Home Assistant are on the same local network

This is the practical bring-up path for getting the greenhouse controller into Home Assistant and making it useful quickly.

## 1. Confirm The Device Is Reachable

Before adding the controller to Home Assistant, confirm the device is actually alive on the network.

Check one of these:

- open the ESPHome web UI at `http://<device-ip>/`
- open the runtime UI at `http://<device-ip>:8081/`
- ping the device IP
- confirm the device appears in your router or DHCP lease table

If you built the Ethernet profile, the device is expected to prefer Ethernet.

If you built the Wi-Fi profile, confirm the device joined the expected SSID.

If normal network join failed, the controller may be in AP recovery mode instead.

## 2. Make Sure Home Assistant Can Discover It

The primary Home Assistant integration path is the ESPHome native API.

Requirements:

- Home Assistant is on the same local subnet or can route to the device
- the ESP32 is online and not isolated by guest Wi-Fi or VLAN firewall rules
- the API encryption key in the firmware is valid

If mDNS is working on your network, the controller may appear automatically in Home Assistant as a discovered ESPHome device.

The current default hostname/device name is:

- `greenhouse-controller`

So it may appear as something like:

- `greenhouse-controller.local`

## 3. Add The Device To Home Assistant

In Home Assistant:

1. Go to `Settings` -> `Devices & Services`
2. If the controller appears under discovered devices, choose `Configure`
3. If it does not appear automatically, click `Add Integration`
4. Search for `ESPHome`
5. Enter the device address:
   - IP address is safest
   - hostname such as `greenhouse-controller.local` may also work if mDNS is healthy
6. When prompted, provide the API encryption key that matches the one used in the firmware secrets

After pairing succeeds, Home Assistant should create the device and its entities.

## 4. Verify The Core Entities

After the integration is added, open the device page and confirm the important entities exist.

Minimum things to check:

- temperatures:
  - high air temperature
  - low air temperature
  - intake air temperature
- humidity:
  - high air humidity
  - low air humidity
- irrigation-related sensors:
  - soil moisture
  - flow rate
- binary sensors:
  - door state
  - sensor fault active
  - irrigation fault active
  - Ethernet connected / Wi-Fi connected / AP mode active
- control entities:
  - intake fan relay
  - exhaust fan relay
  - irrigation pump relay
  - window open / close relays
- mode and automation entities:
  - manual mode
  - rule engine enable
  - irrigation automation enable
  - ventilation automation enable
  - window automation enable
- diagnostics:
  - current rule engine state
  - current automation source
  - last automation action
  - last failure reason
  - log storage status

If these are present, the ESPHome API connection is working.

## 5. Recommended First Checks

Before creating helpers or automations, verify the device behaves sensibly.

Check:

- the device is `available` in Home Assistant
- no unexpected fault entity is active
- relay entities are present but not unexpectedly on
- sensor values look realistic
- network mode diagnostics match the actual deployment mode

If the device is visible but values look wrong, open the runtime UI on port `8081` and compare the live rule/log/test state there.

## 6. Configure Basic Control From Home Assistant

Home Assistant is intended to be supervisory, not the real-time decision-maker.

Use Home Assistant mainly for:

- viewing status
- changing thresholds and targets
- enabling or disabling automation classes
- entering or leaving manual mode
- triggering maintenance actions
- notifications and dashboards

Recommended writable device-side entities to use directly:

- ventilation thresholds
- soil moisture threshold
- requested window position
- actuator mode
- active control profile
- configuration precedence mode
- rule engine enable
- irrigation / ventilation / window automation enables

These values should be written into the device and then used locally by the controller.

## 7. Optional Helper-Based Home Assistant Setup

If you want nicer dashboards and seasonal presets, create Home Assistant helpers and sync them into the ESPHome device.

Recommended helpers:

- `input_select.greenhouse_profile`
- `input_number.greenhouse_day_vent_open`
- `input_number.greenhouse_day_vent_close`
- `input_number.greenhouse_soil_target`
- `input_number.greenhouse_window_target`
- `input_boolean.greenhouse_supervised_manual_mode`

Recommended flow:

1. user changes a helper in Home Assistant
2. HA automation writes the helper value into the corresponding ESPHome entity
3. the device persists the new value locally
4. the device rule engine uses it in later evaluations

This keeps the controller autonomous if Home Assistant later goes offline.

## 8. Example Home Assistant Service Calls

Set a ventilation threshold:

```yaml
service: number.set_value
target:
  entity_id: number.greenhouse_controller_ventilation_open_threshold
data:
  value: 28
```

Set the requested window position:

```yaml
service: number.set_value
target:
  entity_id: number.greenhouse_controller_requested_window_position
data:
  value: 60
```

Enable manual mode:

```yaml
service: switch.turn_on
target:
  entity_id: switch.greenhouse_controller_manual_mode
```

Disable the rule engine:

```yaml
service: switch.turn_off
target:
  entity_id: switch.greenhouse_controller_rule_engine_enable
```

## 9. Suggested First Automations

Good first Home Assistant automations:

- notify when AP recovery mode becomes active
- notify when irrigation fault becomes active
- notify when sensor fault becomes active
- remind if manual mode stays enabled too long
- copy helper/profile values into device number/select entities

Avoid putting the actual per-cycle irrigation or ventilation logic in Home Assistant. That logic belongs on the device.

## 10. Recommended Dashboard Sections

A practical dashboard usually works best when split into:

- environment:
  - temperatures
  - humidity
  - soil moisture
  - flow
- controls:
  - manual mode
  - relay outputs
  - requested window position
- automation:
  - rule engine enable
  - per-class automation enables
  - threshold values
- diagnostics:
  - network mode
  - fault state
  - last automation action
  - log storage status

## 11. If The Device Does Not Appear In Home Assistant

Check these first:

- the ESP32 and Home Assistant are on the same reachable network
- the device has a valid IP address
- the API encryption key entered in Home Assistant matches the firmware
- mDNS is not blocked on your network
- the device is not stuck in AP recovery mode
- Ethernet/Wi-Fi diagnostics in the device UI match reality

If needed:

- add the device by direct IP instead of hostname
- reboot the device
- restart Home Assistant
- open the device runtime UI on port `8081` to confirm the controller itself is healthy

## 12. Recommended Next Documents

After the initial Home Assistant connection is working, continue with:

- [Home Assistant implementation details](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/home-assistant-implementation.md)
- [Home Assistant integration design](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/home-assistant-integration.md)
- [Test plan](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/test-plan.md)

## 13. Responsibility Split Reminder

Device-local responsibilities:

- sensor reads
- local rule evaluation
- output arbitration
- safe-state handling
- local persistence
- local logging

Home Assistant responsibilities:

- dashboards
- helper presets
- supervisory value changes
- notifications
- scheduling or seasonal profile assistance

That split is important. The device should keep operating safely even if Home Assistant is unavailable.
