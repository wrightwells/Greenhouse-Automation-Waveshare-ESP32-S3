export type RouteId =
  | "overview"
  | "status"
  | "controls"
  | "configuration"
  | "network"
  | "recovery"
  | "ota"
  | "diagnostics";

export type NetworkMode = "ethernet" | "wifi_client" | "ap_recovery";
export type ActuatorMode = "two_relay_tandem" | "single_relay";
export type DisplayPage = "environmental" | "irrigation" | "diagnostics";

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
  lastFailureReason: string;
  logs: string[];
}

export interface DeviceFlags {
  automationEnabled: boolean;
  manualModeActive: boolean;
  otaInProgress: boolean;
  displayEnabled: boolean;
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
  soilMoistureWetCalibration: number;
  soilMoistureDryCalibration: number;
  selectedDisplayPage: DisplayPage;
  displayPageIntervalSeconds: number;
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

export interface DeviceState {
  sensors: SensorState;
  outputs: OutputState;
  connectivity: ConnectivityState;
  faults: FaultState;
  flags: DeviceFlags;
  config: DeviceConfig;
  displayPreview: string[];
  lastSensorScan: string;
  lastMqttPublish: string;
  bootCount: number;
  manualModeReason: string;
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
    | "window"
    | "ventilation"
    | "irrigation"
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
