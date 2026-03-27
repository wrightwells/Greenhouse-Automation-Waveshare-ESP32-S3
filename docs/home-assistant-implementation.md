# Home Assistant Implementation

This document is the dedicated Home Assistant handoff required by the updated functional specification.

## Responsibility Split

### Device-local responsibilities

- all sensor reading
- local rule evaluation
- output arbitration
- safe state handling
- local event logging
- configuration persistence

### Home Assistant responsibilities

- dashboards
- helper presets and profiles
- notifications
- supervisory value changes
- optional schedule or seasonal profile switching

Home Assistant must not be required for basic real-time irrigation, fan, or window actuation in normal operation.

## Required ESPHome Entity Map

Recommended stable slug prefix:

- `greenhouse_controller_*`

### Sensors

- `greenhouse_controller_high_air_temperature`
- `greenhouse_controller_high_air_humidity`
- `greenhouse_controller_low_air_temperature`
- `greenhouse_controller_low_air_humidity`
- `greenhouse_controller_intake_air_temperature`
- `greenhouse_controller_soil_moisture`
- `greenhouse_controller_flow_rate`
- `greenhouse_controller_estimated_window_position`
- `greenhouse_controller_uptime`
- `greenhouse_controller_current_rule_engine_state`
- `greenhouse_controller_current_automation_source`
- `greenhouse_controller_last_automation_decision_text`
- `greenhouse_controller_last_irrigation_event_time`
- `greenhouse_controller_last_ventilation_event_time`
- `greenhouse_controller_last_window_action_time`
- `greenhouse_controller_event_log_entry_count`
- `greenhouse_controller_oldest_retained_log_timestamp`
- `greenhouse_controller_newest_retained_log_timestamp`
- `greenhouse_controller_log_storage_status`

### Binary Sensors

- `greenhouse_controller_door_state`
- `greenhouse_controller_ethernet_connected`
- `greenhouse_controller_wifi_connected`
- `greenhouse_controller_ap_mode_active`
- `greenhouse_controller_sensor_fault_active`
- `greenhouse_controller_irrigation_fault_active`
- `greenhouse_controller_manual_mode_active`

### Switches

- `greenhouse_controller_automation_enable`
- `greenhouse_controller_rule_engine_enable`
- `greenhouse_controller_irrigation_automation_enable`
- `greenhouse_controller_ventilation_automation_enable`
- `greenhouse_controller_window_automation_enable`
- `greenhouse_controller_event_logging_enable`
- `greenhouse_controller_manual_mode`

### Buttons

- `button.greenhouse_controller_restart_device`
- `button.greenhouse_controller_factory_reset`
- `button.greenhouse_controller_cancel_manual_mode`
- `button.greenhouse_controller_fully_open_window`
- `button.greenhouse_controller_fully_close_window`
- `button.greenhouse_controller_stop_window`

### Numbers

- `number.greenhouse_controller_ventilation_open_threshold`
- `number.greenhouse_controller_ventilation_close_threshold`
- `number.greenhouse_controller_high_ground_temperature_threshold`
- `number.greenhouse_controller_low_ground_temperature_threshold`
- `number.greenhouse_controller_high_ceiling_temperature_threshold`
- `number.greenhouse_controller_low_ceiling_temperature_threshold`
- `number.greenhouse_controller_soil_moisture_trigger_threshold`
- `number.greenhouse_controller_flow_validation_minimum_threshold`
- `number.greenhouse_controller_no_flow_timeout`
- `number.greenhouse_controller_min_fan_run_time`
- `number.greenhouse_controller_min_fan_off_time`
- `number.greenhouse_controller_min_pump_run_time`
- `number.greenhouse_controller_max_pump_run_time`
- `number.greenhouse_controller_window_minimum_movement_interval`
- `number.greenhouse_controller_requested_window_position`

### Selects

- `select.greenhouse_controller_actuator_mode`
- `select.greenhouse_controller_active_control_profile`
- `select.greenhouse_controller_configuration_precedence_mode`
- `select.greenhouse_controller_irrigation_fault_policy`
- `select.greenhouse_controller_rule_conflict_policy`

### Text Sensors

- `sensor.greenhouse_controller_current_network_mode`
- `sensor.greenhouse_controller_last_failure_reason`
- `sensor.greenhouse_controller_last_configuration_source`
- `sensor.greenhouse_controller_last_automation_action`
- `sensor.greenhouse_controller_last_log_prune_result`
- `sensor.greenhouse_controller_current_profile_name`

## Recommended Home Assistant Helpers

Use helpers for user-friendly profile management and dashboards, while persisting final authoritative values on the device.

Recommended helpers:

- `input_select.greenhouse_profile`
- `input_number.greenhouse_day_vent_open`
- `input_number.greenhouse_day_vent_close`
- `input_number.greenhouse_night_vent_open`
- `input_number.greenhouse_night_vent_close`
- `input_number.greenhouse_soil_target`
- `input_number.greenhouse_window_target`
- `input_boolean.greenhouse_supervised_manual_mode`
- `input_boolean.greenhouse_notifications_enabled`

## Required Automation Patterns

### 1. Profile Sync

When a helper or profile changes, write values into the device entities.

Example:

```yaml
alias: Greenhouse Profile Sync
mode: single
trigger:
  - platform: state
    entity_id:
      - input_select.greenhouse_profile
      - input_number.greenhouse_day_vent_open
      - input_number.greenhouse_day_vent_close
      - input_number.greenhouse_soil_target
action:
  - service: number.set_value
    target:
      entity_id: number.greenhouse_controller_ventilation_open_threshold
    data:
      value: "{{ states('input_number.greenhouse_day_vent_open') | float }}"
  - service: number.set_value
    target:
      entity_id: number.greenhouse_controller_ventilation_close_threshold
    data:
      value: "{{ states('input_number.greenhouse_day_vent_close') | float }}"
  - service: number.set_value
    target:
      entity_id: number.greenhouse_controller_soil_moisture_trigger_threshold
    data:
      value: "{{ states('input_number.greenhouse_soil_target') | float }}"
```

### 2. Mode Control

```yaml
alias: Greenhouse Manual Mode Toggle
mode: single
trigger:
  - platform: state
    entity_id: input_boolean.greenhouse_supervised_manual_mode
action:
  - service: "switch.turn_{{ 'on' if is_state('input_boolean.greenhouse_supervised_manual_mode', 'on') else 'off' }}"
    target:
      entity_id: switch.greenhouse_controller_manual_mode
```

### 3. Rule Engine Enable Control

```yaml
alias: Greenhouse Rule Engine Enable
mode: single
trigger:
  - platform: state
    entity_id: input_boolean.greenhouse_notifications_enabled
condition: []
action:
  - service: switch.turn_on
    target:
      entity_id: switch.greenhouse_controller_rule_engine_enable
```

Replace the helper with a dedicated one if you want direct operator control.

### 4. Fault Notifications

```yaml
alias: Greenhouse Irrigation Fault Notify
mode: single
trigger:
  - platform: state
    entity_id: binary_sensor.greenhouse_controller_irrigation_fault_active
    to: "on"
action:
  - service: persistent_notification.create
    data:
      title: Greenhouse irrigation fault
      message: >
        Irrigation fault active. Last failure:
        {{ states('sensor.greenhouse_controller_last_failure_reason') }}
```

### 5. AP Recovery Alert

```yaml
alias: Greenhouse AP Recovery Alert
mode: single
trigger:
  - platform: state
    entity_id: binary_sensor.greenhouse_controller_ap_mode_active
    to: "on"
action:
  - service: persistent_notification.create
    data:
      title: Greenhouse recovery mode
      message: The controller has entered AP recovery mode.
```

### 6. Prolonged Manual Mode Reminder

```yaml
alias: Greenhouse Manual Mode Reminder
mode: single
trigger:
  - platform: state
    entity_id: binary_sensor.greenhouse_controller_manual_mode_active
    to: "on"
    for: "02:00:00"
action:
  - service: persistent_notification.create
    data:
      title: Greenhouse manual mode still active
      message: Manual mode has remained enabled for more than 2 hours.
```

## Dashboard Guidance

Recommended cards:

- status / connectivity card
- environmental readings card
- irrigation status and fault card
- window position and command card
- rule engine / automation source diagnostics card
- maintenance actions card
- recent-fault summary card

## Precedence Guidance

Expose and document a clear precedence mode:

- `local_web_wins`
- `home_assistant_wins`
- `last_writer_wins` if later justified

Recommended v1 default:

- `local_web_wins` for safety-critical commissioning adjustments

Every accepted configuration change should be logged with the source where detectable.

## Clear Instructions For Home Assistant Integration

1. Add the device to Home Assistant using the ESPHome integration.
2. Confirm that the required writable entities appear.
3. Create optional helper entities for operator-friendly profiles and seasonal presets.
4. Add automations that copy helper values into the device’s ESPHome number/select/switch entities.
5. Use dashboards for supervision, but keep the device responsible for real-time actuation.
6. Add notifications for irrigation faults, sensor faults, AP recovery mode, and prolonged manual mode.
7. Test with Home Assistant offline to confirm the device continues using the last valid stored settings and rule table.
