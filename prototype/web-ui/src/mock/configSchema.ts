import { ConfigField } from "../types";

export const configFields: ConfigField[] = [
  {
    key: "deviceName",
    label: "Device name",
    type: "text",
    section: "general",
    description: "Friendly device label shown in the local UI.",
    required: true
  },
  {
    key: "entityPrefix",
    label: "Entity prefix",
    type: "text",
    section: "general",
    description: "Stable Home Assistant entity naming prefix.",
    required: true
  },
  {
    key: "actuatorMode",
    label: "Actuator mode",
    type: "select",
    section: "window",
    description: "Two-relay tandem is the default v1 assumption.",
    options: ["two_relay_tandem", "single_relay"]
  },
  {
    key: "requestedWindowPosition",
    label: "Requested window position",
    type: "number",
    section: "window",
    description: "Target window position for automation and manual requests.",
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: "fullWindowOpenTimeSeconds",
    label: "Full open travel time",
    type: "number",
    section: "window",
    description: "Time-based travel estimate used for full open.",
    min: 5,
    max: 600,
    step: 1
  },
  {
    key: "fullWindowCloseTimeSeconds",
    label: "Full close travel time",
    type: "number",
    section: "window",
    description: "Time-based travel estimate used for full close.",
    min: 5,
    max: 600,
    step: 1
  },
  {
    key: "ventilationOpenThreshold",
    label: "Ventilation open threshold",
    type: "number",
    section: "ventilation",
    description: "High temperature threshold that starts ventilation.",
    min: 10,
    max: 45,
    step: 0.5
  },
  {
    key: "ventilationCloseThreshold",
    label: "Ventilation close threshold",
    type: "number",
    section: "ventilation",
    description: "Lower threshold used for anti-chatter close logic.",
    min: 5,
    max: 40,
    step: 0.5
  },
  {
    key: "soilMoistureMinThreshold",
    label: "Soil moisture minimum threshold",
    type: "number",
    section: "irrigation",
    description: "Below this value irrigation can start if safeguards allow.",
    min: 0,
    max: 100,
    step: 1
  },
  {
    key: "irrigationMinRunSeconds",
    label: "Irrigation minimum run time",
    type: "number",
    section: "irrigation",
    description: "Minimum runtime before no-flow checks should matter.",
    min: 5,
    max: 600,
    step: 5
  },
  {
    key: "irrigationMaxRunSeconds",
    label: "Irrigation maximum run time",
    type: "number",
    section: "irrigation",
    description: "Hard safety stop for irrigation cycles.",
    min: 10,
    max: 1800,
    step: 10
  },
  {
    key: "irrigationCooldownSeconds",
    label: "Irrigation cooldown",
    type: "number",
    section: "irrigation",
    description: "Cooldown after an irrigation run completes.",
    min: 0,
    max: 7200,
    step: 30
  },
  {
    key: "soilMoistureSettleDelaySeconds",
    label: "Soil moisture settle delay",
    type: "number",
    section: "irrigation",
    description: "Delay before stale post-watering readings can trigger irrigation again.",
    min: 0,
    max: 3600,
    step: 30
  },
  {
    key: "flowValidationEnabled",
    label: "Flow validation enabled",
    type: "boolean",
    section: "irrigation",
    description: "Use flow feedback to detect no-flow conditions."
  },
  {
    key: "flowPulsesPerLitre",
    label: "Flow pulses per litre",
    type: "number",
    section: "irrigation",
    description: "Used to scale raw flow pulses into litres per minute.",
    min: 1,
    max: 2000,
    step: 1
  },
  {
    key: "soilMoistureWetCalibration",
    label: "Wet calibration",
    type: "number",
    section: "irrigation",
    description: "ADC reference for fully wet soil.",
    min: 0,
    max: 3.3,
    step: 0.01
  },
  {
    key: "soilMoistureDryCalibration",
    label: "Dry calibration",
    type: "number",
    section: "irrigation",
    description: "ADC reference for fully dry soil.",
    min: 0,
    max: 3.3,
    step: 0.01
  },
  {
    key: "wifiSsid",
    label: "Wi-Fi SSID",
    type: "text",
    section: "network",
    description: "Client Wi-Fi network used when Ethernet is unavailable.",
    required: true
  },
  {
    key: "wifiPassword",
    label: "Wi-Fi password",
    type: "password",
    section: "network",
    description: "Stored locally on-device, never committed to source control."
  },
  {
    key: "fallbackApSsid",
    label: "Fallback AP SSID",
    type: "text",
    section: "network",
    description: "Recovery AP name for setup and maintenance.",
    required: true
  },
  {
    key: "fallbackApPassword",
    label: "Fallback AP password",
    type: "password",
    section: "network",
    description: "Used only for recovery AP access."
  },
  {
    key: "mqttEnabled",
    label: "MQTT enabled",
    type: "boolean",
    section: "mqtt",
    description: "MQTT is supplementary and must not be required for core control."
  },
  {
    key: "mqttHost",
    label: "MQTT host",
    type: "text",
    section: "mqtt",
    description: "Broker hostname or IP."
  },
  {
    key: "mqttPort",
    label: "MQTT port",
    type: "number",
    section: "mqtt",
    description: "Broker port.",
    min: 1,
    max: 65535,
    step: 1
  },
  {
    key: "mqttUsername",
    label: "MQTT username",
    type: "text",
    section: "mqtt",
    description: "Optional broker username."
  },
  {
    key: "mqttPassword",
    label: "MQTT password",
    type: "password",
    section: "mqtt",
    description: "Optional broker password."
  },
  {
    key: "mqttTopicPrefix",
    label: "MQTT topic prefix",
    type: "text",
    section: "mqtt",
    description: "Supplementary telemetry topic root."
  },
  {
    key: "selectedDisplayPage",
    label: "Display page",
    type: "select",
    section: "display",
    description: "Which logical status page the small local display shows first.",
    options: ["environmental", "irrigation", "diagnostics"]
  },
  {
    key: "displayPageIntervalSeconds",
    label: "Display page interval",
    type: "number",
    section: "display",
    description: "Rotation interval for display pages.",
    min: 2,
    max: 60,
    step: 1
  },
  {
    key: "otaEnabled",
    label: "OTA enabled",
    type: "boolean",
    section: "ota",
    description: "ESPHome OTA should normally remain enabled."
  },
  {
    key: "otaPassword",
    label: "OTA password",
    type: "password",
    section: "ota",
    description: "Local secret used for OTA authentication."
  }
];
