# Home Assistant Integration

Primary integration is ESPHome native API. MQTT is supplementary and optional.

## Entity Naming

Use a stable device prefix such as `greenhouse_controller_*`.

Examples:

- `greenhouse_controller_high_air_temperature`
- `greenhouse_controller_window_position`
- `greenhouse_controller_manual_mode`
- `greenhouse_controller_network_mode`

## Expected Entity Groups

### Sensors

- high air temperature
- high air humidity
- low air temperature
- low air humidity
- intake air temperature
- soil moisture
- flow rate
- estimated window position
- uptime
- optional Wi-Fi RSSI when relevant

### Binary Sensors

- door state
- Ethernet connected
- Wi-Fi connected
- AP mode active
- sensor fault active
- irrigation fault active
- manual mode active

### Switches / Controls

- intake fan relay
- exhaust fan relay
- irrigation pump relay
- window open relay
- window close relay
- automation enable

### Buttons / Actions

- restart
- factory reset
- cancel manual mode
- fully open window
- fully close window
- stop window

## Integration Notes

- Home Assistant availability must not disable local automation
- unavailable sensors should show unavailable, not stale-valid values
- diagnostics should make recovery states explicit
