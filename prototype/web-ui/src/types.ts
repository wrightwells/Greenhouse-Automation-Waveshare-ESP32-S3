export type RouteId =
  | "overview"
  | "status"
  | "controls"
  | "rules"
  | "logs"
  | "configuration"
  | "network"
  | "recovery"
  | "ota"
  | "diagnostics";

export type NetworkMode = "ethernet" | "wifi_client" | "ap_recovery";
export type ActuatorMode = "two_relay_tandem" | "single_relay";
export type DisplayPage = "environmental" | "irrigation" | "diagnostics";
export type ConfigPrecedenceMode = "local_web_wins" | "home_assistant_wins" | "last_writer_wins";
export type RuleConflictPolicy = "safe_off_wins" | "highest_priority_wins" | "inhibit_wins";
export type IrrigationFaultPolicy = "stop_and_inhibit" | "stop_and_retry_later" | "stop_and_flag_only";
export type AutomationSource = "local_rules" | "home_assistant_synced" | "fallback_defaults" | "manual_mode";
export type RuleEngineState = "rule_engine_active" | "rule_engine_inhibited" | "rule_engine_degraded";
export type LogStorageStatus = "healthy" | "pruning_active" | "degraded" | "faulted" | "disabled";
export type RuleClass = "ventilation" | "irrigation" | "window";
export type RuleField =
  | "highAirTemperature"
  | "lowAirTemperature"
  | "highAirHumidity"
  | "lowAirHumidity"
  | "intakeAirTemperature"
  | "soilMoisture"
  | "flowRateLpm"
  | "doorState"
  | "estimatedWindowPosition"
  | "manualModeActive"
  | "sensorFaultActive"
  | "irrigationPump"
  | "intakeFan"
  | "exhaustFan";
export type RuleOperator =
  | "above"
  | "below"
  | "inside_range"
  | "outside_range"
  | "boolean_is"
  | "valid"
  | "invalid";
export type RuleAction =
  | "turn_irrigation_on"
  | "turn_irrigation_off"
  | "turn_intake_fan_on"
  | "turn_intake_fan_off"
  | "turn_exhaust_fan_on"
  | "turn_exhaust_fan_off"
  | "request_window_open"
  | "request_window_close"
  | "request_window_target"
  | "inhibit_irrigation"
  | "inhibit_ventilation_window"
  | "raise_log_event";
export type EventCategory =
  | "boot"
  | "network"
  | "sensor"
  | "rule_engine"
  | "output"
  | "irrigation"
  | "window"
  | "configuration"
  | "ota"
  | "maintenance"
  | "logging";
export type EventSource =
  | "system"
  | "local_web"
  | "home_assistant"
  | "restore"
  | "default_fallback";

export interface SensorState {
  highAirTemperature: number;
  highAirHumidity: number;
  lowAirTemperature: number;
  lowAirHumidity: number;
  intakeAirTemperature: number;
  soilMoisture: number;
  soilMoistureRaw: number;
  flowRateLpm: number;
  estimatedWindowPosition: number;
  uptimeHours: number;
  wifiRssi: number;
}

export interface OutputState {
  intakeFan: boolean;
  exhaustFan: boolean;
  irrigationPump: boolean;
  windowOpenRelay: boolean;
  windowCloseRelay: boolean;
}

export interface ConnectivityState {
  ethernetConnected: boolean;
  wifiConnected: boolean;
  apModeActive: boolean;
  networkMode: NetworkMode;
  ethernetIp: string;
  wifiIp: string;
  wifiSsid: string;
  mqttConnected: boolean;
  homeAssistantConnected: boolean;
}

export interface FaultState {
  sensorFaultActive: boolean;
  irrigationFaultActive: boolean;
  loggingFaultActive: boolean;
  ruleEngineFaultActive: boolean;
  lastFailureReason: string;
}

export interface DeviceFlags {
  automationEnabled: boolean;
  manualModeActive: boolean;
  otaInProgress: boolean;
  displayEnabled: boolean;
  ruleEngineEnabled: boolean;
  irrigationAutomationEnabled: boolean;
  ventilationAutomationEnabled: boolean;
  windowAutomationEnabled: boolean;
  eventLoggingEnabled: boolean;
}

export interface DeviceConfig {
  deviceName: string;
  entityPrefix: string;
  actuatorMode: ActuatorMode;
  requestedWindowPosition: number;
  fullWindowOpenTimeSeconds: number;
  fullWindowCloseTimeSeconds: number;
  ventilationOpenThreshold: number;
  ventilationCloseThreshold: number;
  soilMoistureMinThreshold: number;
  irrigationMinRunSeconds: number;
  irrigationMaxRunSeconds: number;
  irrigationCooldownSeconds: number;
  soilMoistureSettleDelaySeconds: number;
  flowValidationEnabled: boolean;
  flowPulsesPerLitre: number;
  flowValidationMinimumThreshold: number;
  noFlowTimeoutSeconds: number;
  soilMoistureWetCalibration: number;
  soilMoistureDryCalibration: number;
  minFanRunTimeSeconds: number;
  minFanOffTimeSeconds: number;
  minPumpRunTimeSeconds: number;
  maxPumpRunTimeSeconds: number;
  windowMinimumMovementIntervalSeconds: number;
  selectedDisplayPage: DisplayPage;
  displayPageIntervalSeconds: number;
  activeControlProfile: string;
  configurationPrecedenceMode: ConfigPrecedenceMode;
  ruleConflictPolicy: RuleConflictPolicy;
  irrigationFaultPolicy: IrrigationFaultPolicy;
  eventLogRetentionDays: number;
  eventLogCapacityEntries: number;
  minimumStateChangeLoggingIntervalSeconds: number;
  wifiSsid: string;
  wifiPassword: string;
  fallbackApSsid: string;
  fallbackApPassword: string;
  mqttEnabled: boolean;
  mqttHost: string;
  mqttPort: number;
  mqttUsername: string;
  mqttPassword: string;
  mqttTopicPrefix: string;
  otaEnabled: boolean;
  otaPassword: string;
}

export interface RuleRow {
  id: string;
  enabled: boolean;
  order: number;
  ruleClass: RuleClass;
  description: string;
  field: RuleField;
  operator: RuleOperator;
  threshold: number;
  rangeMin?: number;
  rangeMax?: number;
  boolValue?: boolean;
  action: RuleAction;
  actionTarget?: number;
  hysteresis?: number;
  cooldownSeconds?: number;
}

export interface RuleEngineModel {
  state: RuleEngineState;
  automationSource: AutomationSource;
  lastAutomationDecisionText: string;
  lastConfigurationSource: EventSource;
  rules: RuleRow[];
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  category: EventCategory;
  source: EventSource;
  message: string;
}

export interface EventLogState {
  entries: EventLogEntry[];
  maxEntries: number;
  retentionDays: number;
  rolloverCount: number;
  status: LogStorageStatus;
  oldestRetainedTimestamp: string;
  newestRetainedTimestamp: string;
  lastLogPruneResult: string;
}

export interface DeviceState {
  sensors: SensorState;
  outputs: OutputState;
  connectivity: ConnectivityState;
  faults: FaultState;
  flags: DeviceFlags;
  config: DeviceConfig;
  ruleEngine: RuleEngineModel;
  eventLog: EventLogState;
  displayPreview: string[];
  lastSensorScan: string;
  lastMqttPublish: string;
  bootCount: number;
  manualModeReason: string;
  lastIrrigationEventTime: string;
  lastVentilationEventTime: string;
  lastWindowActionTime: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface ConfigField {
  key: keyof DeviceConfig;
  label: string;
  type: "text" | "password" | "number" | "boolean" | "select";
  section:
    | "general"
    | "ruleEngine"
    | "window"
    | "ventilation"
    | "irrigation"
    | "logging"
    | "network"
    | "mqtt"
    | "display"
    | "ota";
  description: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  required?: boolean;
}
