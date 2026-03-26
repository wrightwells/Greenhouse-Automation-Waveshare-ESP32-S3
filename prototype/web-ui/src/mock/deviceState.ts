import { DeviceState } from "../types";

export const defaultDeviceState: DeviceState = {
  sensors: {
    highAirTemperature: 31.2,
    highAirHumidity: 79,
    lowAirTemperature: 26.7,
    lowAirHumidity: 82,
    intakeAirTemperature: 24.8,
    soilMoisture: 34,
    soilMoistureRaw: 2.14,
    flowRateLpm: 0,
    estimatedWindowPosition: 42,
    uptimeHours: 123.4,
    wifiRssi: -61
  },
  outputs: {
    intakeFan: true,
    exhaustFan: true,
    irrigationPump: false,
    windowOpenRelay: false,
    windowCloseRelay: false
  },
  connectivity: {
    ethernetConnected: true,
    wifiConnected: false,
    apModeActive: true,
    networkMode: "ethernet",
    ethernetIp: "192.168.1.46",
    wifiIp: "",
    wifiSsid: "",
    mqttConnected: true,
    homeAssistantConnected: true
  },
  faults: {
    sensorFaultActive: false,
    irrigationFaultActive: false,
    lastFailureReason: "none",
    logs: [
      "[22:01:14] Boot complete, outputs safe OFF until checks passed",
      "[22:01:31] Ethernet DHCP acquired 192.168.1.46",
      "[22:01:48] Wi-Fi AP recovery access enabled",
      "[22:02:10] Ventilation threshold exceeded, fans enabled",
      "[22:04:01] Home Assistant API connected"
    ]
  },
  flags: {
    automationEnabled: true,
    manualModeActive: false,
    otaInProgress: false,
    displayEnabled: true
  },
  config: {
    deviceName: "Greenhouse Controller",
    entityPrefix: "greenhouse_controller",
    actuatorMode: "two_relay_tandem",
    requestedWindowPosition: 60,
    fullWindowOpenTimeSeconds: 60,
    fullWindowCloseTimeSeconds: 58,
    ventilationOpenThreshold: 28,
    ventilationCloseThreshold: 24,
    soilMoistureMinThreshold: 35,
    irrigationMinRunSeconds: 30,
    irrigationMaxRunSeconds: 180,
    irrigationCooldownSeconds: 900,
    soilMoistureSettleDelaySeconds: 300,
    flowValidationEnabled: true,
    flowPulsesPerLitre: 450,
    soilMoistureWetCalibration: 1.1,
    soilMoistureDryCalibration: 2.6,
    selectedDisplayPage: "environmental",
    displayPageIntervalSeconds: 8,
    wifiSsid: "GreenhouseWiFi",
    wifiPassword: "",
    fallbackApSsid: "Greenhouse-Recovery",
    fallbackApPassword: "",
    mqttEnabled: true,
    mqttHost: "mqtt.local",
    mqttPort: 1883,
    mqttUsername: "greenhouse",
    mqttPassword: "",
    mqttTopicPrefix: "greenhouse/controller",
    otaEnabled: true,
    otaPassword: ""
  },
  displayPreview: [
    "High 31.2C 79%",
    "Soil 34% Win 42%"
  ],
  lastSensorScan: "2026-03-26 22:04:30",
  lastMqttPublish: "2026-03-26 22:04:25",
  bootCount: 18,
  manualModeReason: "not active"
};

export const storageKey = "greenhouse-controller-ui-prototype";
