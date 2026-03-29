import { DeviceState, EventLogEntry } from "../types";

const initialEntries: EventLogEntry[] = [
  {
    id: "evt-1006",
    timestamp: "2026-03-27T09:18:00Z",
    category: "configuration",
    source: "local_web",
    message: "Configuration precedence set to local_web_wins"
  },
  {
    id: "evt-1005",
    timestamp: "2026-03-27T09:10:00Z",
    category: "rule_engine",
    source: "system",
    message: "Ventilation rule row 2 requested window target 60%"
  },
  {
    id: "evt-1004",
    timestamp: "2026-03-27T09:05:00Z",
    category: "output",
    source: "system",
    message: "Exhaust fan relay transitioned ON"
  },
  {
    id: "evt-1003",
    timestamp: "2026-03-27T08:52:00Z",
    category: "network",
    source: "system",
    message: "Ethernet DHCP acquired 192.168.1.46 and AP recovery access enabled"
  },
  {
    id: "evt-1002",
    timestamp: "2026-03-27T08:51:00Z",
    category: "boot",
    source: "system",
    message: "Boot complete, outputs held safe OFF until startup checks passed"
  }
];

export const defaultDeviceState: DeviceState = {
  liveSensors: {
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
    wifiRssi: -61,
    doorState: false
  },
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
    wifiRssi: -61,
    doorState: false
  },
  sensorControls: {
    highAirTemperature: { mode: "live", manualValue: 31.2 },
    highAirHumidity: { mode: "live", manualValue: 79 },
    lowAirTemperature: { mode: "live", manualValue: 26.7 },
    lowAirHumidity: { mode: "live", manualValue: 82 },
    intakeAirTemperature: { mode: "live", manualValue: 24.8 },
    soilMoisture: { mode: "live", manualValue: 34 },
    soilMoistureRaw: { mode: "live", manualValue: 2.14 },
    flowRateLpm: { mode: "live", manualValue: 0 },
    estimatedWindowPosition: { mode: "live", manualValue: 42 },
    uptimeHours: { mode: "live", manualValue: 123.4 },
    wifiRssi: { mode: "live", manualValue: -61 },
    doorState: { mode: "live", manualValue: false }
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
    loggingFaultActive: false,
    ruleEngineFaultActive: false,
    lastFailureReason: "none"
  },
  flags: {
    automationEnabled: true,
    manualModeActive: false,
    otaInProgress: false,
    displayEnabled: true,
    ruleEngineEnabled: true,
    irrigationAutomationEnabled: true,
    ventilationAutomationEnabled: true,
    windowAutomationEnabled: true,
    eventLoggingEnabled: true
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
    flowValidationMinimumThreshold: 0.2,
    noFlowTimeoutSeconds: 30,
    soilMoistureWetCalibration: 1.1,
    soilMoistureDryCalibration: 2.6,
    minFanRunTimeSeconds: 120,
    minFanOffTimeSeconds: 120,
    minPumpRunTimeSeconds: 30,
    maxPumpRunTimeSeconds: 180,
    windowMinimumMovementIntervalSeconds: 60,
    selectedDisplayPage: "environmental",
    displayPageIntervalSeconds: 8,
    activeControlProfile: "default",
    configurationPrecedenceMode: "local_web_wins",
    ruleConflictPolicy: "safe_off_wins",
    irrigationFaultPolicy: "stop_and_inhibit",
    eventLogRetentionDays: 7,
    eventLogCapacityEntries: 120,
    minimumStateChangeLoggingIntervalSeconds: 5,
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
  ruleEngine: {
    state: "rule_engine_active",
    automationSource: "local_rules",
    lastAutomationDecisionText: "Ventilation rule row 2 opened fans and requested window 60%",
    lastConfigurationSource: "local_web",
    rules: [
      {
        id: "rule-1",
        enabled: true,
        order: 1,
        ruleClass: "ventilation",
        description: "Open fans when ceiling temperature is high",
        field: "highAirTemperature",
        operator: "above",
        threshold: 28,
        action: "turn_intake_fan_on",
        hysteresis: 2,
        cooldownSeconds: 120
      },
      {
        id: "rule-2",
        enabled: true,
        order: 2,
        ruleClass: "window",
        description: "Open window to 60% when ceiling temperature is high",
        field: "highAirTemperature",
        operator: "above",
        threshold: 30,
        action: "request_window_target",
        actionTarget: 60,
        hysteresis: 2,
        cooldownSeconds: 60
      },
      {
        id: "rule-3",
        enabled: true,
        order: 3,
        ruleClass: "irrigation",
        description: "Run irrigation when soil moisture is low",
        field: "soilMoisture",
        operator: "below",
        threshold: 35,
        action: "turn_irrigation_on",
        cooldownSeconds: 900
      }
    ]
  },
  eventLog: {
    entries: initialEntries,
    maxEntries: 120,
    retentionDays: 7,
    rolloverCount: 0,
    status: "healthy",
    oldestRetainedTimestamp: initialEntries[initialEntries.length - 1].timestamp,
    newestRetainedTimestamp: initialEntries[0].timestamp,
    lastLogPruneResult: "none"
  },
  displayPreview: [
    "High 31.2C 79%",
    "Soil 34% Win 42%"
  ],
  lastSensorScan: "2026-03-27 09:18:30",
  lastMqttPublish: "2026-03-27 09:18:25",
  bootCount: 19,
  manualModeReason: "not active",
  lastIrrigationEventTime: "2026-03-26 18:10:00",
  lastVentilationEventTime: "2026-03-27 09:10:00",
  lastWindowActionTime: "2026-03-27 09:10:00"
};

export const storageKey = "greenhouse-controller-ui-prototype";
