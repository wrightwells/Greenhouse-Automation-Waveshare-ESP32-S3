import { useEffect, useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { configFields } from "./mock/configSchema";
import { defaultDeviceState, storageKey } from "./mock/deviceState";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { ControlsPage } from "./pages/ControlsPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import { LogViewerPage } from "./pages/LogViewerPage";
import { NetworkPage } from "./pages/NetworkPage";
import { OtaAdminPage } from "./pages/OtaAdminPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RecoveryPage } from "./pages/RecoveryPage";
import { RulesPage } from "./pages/RulesPage";
import { StatusPage } from "./pages/StatusPage";
import {
  BooleanSensorKey,
  DeviceConfig,
  DeviceState,
  EventCategory,
  EventLogEntry,
  EventLogState,
  NumericSensorKey,
  RouteId,
  RuleRow,
  SensorInputMode,
  ValidationErrors
} from "./types";

const numericSensorKeys: NumericSensorKey[] = [
  "highAirTemperature",
  "highAirHumidity",
  "lowAirTemperature",
  "lowAirHumidity",
  "intakeAirTemperature",
  "soilMoisture",
  "soilMoistureRaw",
  "flowRateLpm",
  "estimatedWindowPosition",
  "uptimeHours",
  "wifiRssi"
];

const booleanSensorKeys: BooleanSensorKey[] = ["doorState"];

function getInitialRoute(): RouteId {
  const hash = window.location.hash.replace("#", "") as RouteId;
  const allowed: RouteId[] = [
    "overview",
    "status",
    "controls",
    "rules",
    "logs",
    "configuration",
    "network",
    "recovery",
    "ota",
    "diagnostics"
  ];
  return allowed.includes(hash) ? hash : "overview";
}

function loadState(): DeviceState {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultDeviceState;
    }
    const parsed = JSON.parse(raw) as Partial<DeviceState>;
    return {
      ...defaultDeviceState,
      ...parsed,
      liveSensors: { ...defaultDeviceState.liveSensors, ...(parsed.liveSensors ?? parsed.sensors ?? {}) },
      sensors: { ...defaultDeviceState.sensors, ...(parsed.sensors ?? {}) },
      sensorControls: { ...defaultDeviceState.sensorControls, ...(parsed.sensorControls ?? {}) }
    };
  } catch {
    return defaultDeviceState;
  }
}

function validateRule(rule: RuleRow): string | undefined {
  if (!rule.description.trim()) {
    return "Rule description is required.";
  }
  if ((rule.operator === "inside_range" || rule.operator === "outside_range") &&
    ((rule.rangeMin ?? 0) >= (rule.rangeMax ?? 0))) {
    return "Range operators require rangeMin to be lower than rangeMax.";
  }
  if (rule.action === "request_window_target" && ((rule.actionTarget ?? -1) < 0 || (rule.actionTarget ?? 101) > 100)) {
    return "Window target actions require an action target between 0 and 100.";
  }
  if (rule.cooldownSeconds !== undefined && rule.cooldownSeconds < 0) {
    return "Cooldown cannot be negative.";
  }
  return undefined;
}

function validateConfig(config: DeviceConfig, rules: RuleRow[]): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const field of configFields) {
    const value = config[field.key];
    const key = String(field.key);

    if (field.required && String(value).trim() === "") {
      errors[key] = "This field is required.";
    }

    if (field.type === "number" && typeof value === "number") {
      if (field.min !== undefined && value < field.min) {
        errors[key] = `Must be at least ${field.min}.`;
      }
      if (field.max !== undefined && value > field.max) {
        errors[key] = `Must be at most ${field.max}.`;
      }
    }
  }

  if (config.ventilationCloseThreshold >= config.ventilationOpenThreshold) {
    errors.ventilationCloseThreshold = "Close threshold should be lower than open threshold.";
  }

  if (config.irrigationMinRunSeconds > config.irrigationMaxRunSeconds) {
    errors.irrigationMinRunSeconds = "Minimum run time cannot exceed maximum run time.";
  }

  if (config.soilMoistureWetCalibration >= config.soilMoistureDryCalibration) {
    errors.soilMoistureWetCalibration = "Wet calibration should be lower than dry calibration.";
  }

  if (config.mqttEnabled && config.mqttHost.trim() === "") {
    errors.mqttHost = "MQTT host is required when MQTT is enabled.";
  }

  if (config.otaEnabled && config.otaPassword.trim() === "") {
    errors.otaPassword = "Set an OTA password for the prototype flow.";
  }

  if (config.wifiPassword && config.wifiPassword.length < 8) {
    errors.wifiPassword = "Use at least 8 characters for a realistic Wi-Fi password.";
  }

  if (config.fallbackApPassword && config.fallbackApPassword.length < 8) {
    errors.fallbackApPassword = "Use at least 8 characters for a realistic AP password.";
  }

  rules.forEach((rule) => {
    const error = validateRule(rule);
    if (error) {
      errors[`rule:${rule.id}`] = error;
    }
  });

  return errors;
}

function createEvent(category: EventCategory, message: string, source: EventLogEntry["source"]): EventLogEntry {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    source,
    message
  };
}

function applyBoundedEventLog(log: EventLogState, entry: EventLogEntry): EventLogState {
  const retentionMs = log.retentionDays * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  const filtered = [entry, ...log.entries].filter((current) => new Date(current.timestamp).getTime() >= cutoff);
  const bounded = filtered.slice(0, log.maxEntries);
  const droppedCount = filtered.length - bounded.length;

  return {
    ...log,
    entries: bounded,
    rolloverCount: log.rolloverCount + Math.max(0, droppedCount),
    status: droppedCount > 0 ? "pruning_active" : log.status === "disabled" ? "disabled" : "healthy",
    oldestRetainedTimestamp: bounded.length > 0 ? bounded[bounded.length - 1].timestamp : "",
    newestRetainedTimestamp: bounded.length > 0 ? bounded[0].timestamp : "",
    lastLogPruneResult:
      droppedCount > 0
        ? `dropped_${droppedCount}_oldest_entries_to_respect_capacity`
        : "no_prune_needed"
  };
}

function deriveEffectiveSensors(current: DeviceState): DeviceState["sensors"] {
  const nextSensors = { ...current.liveSensors };

  for (const key of numericSensorKeys) {
    const control = current.sensorControls[key];
    nextSensors[key] = control.mode === "manual" ? control.manualValue : current.liveSensors[key];
  }

  for (const key of booleanSensorKeys) {
    const control = current.sensorControls[key];
    nextSensors[key] = control.mode === "manual" ? control.manualValue : current.liveSensors[key];
  }

  return nextSensors;
}

function getRuleFieldValue(rule: RuleRow, current: DeviceState, sensors: DeviceState["sensors"]): number | boolean | null {
  switch (rule.field) {
    case "highAirTemperature":
    case "lowAirTemperature":
    case "highAirHumidity":
    case "lowAirHumidity":
    case "intakeAirTemperature":
    case "soilMoisture":
    case "flowRateLpm":
    case "doorState":
    case "estimatedWindowPosition":
      return sensors[rule.field];
    case "manualModeActive":
      return current.flags.manualModeActive;
    case "sensorFaultActive":
      return current.faults.sensorFaultActive;
    case "irrigationPump":
      return current.outputs.irrigationPump;
    case "intakeFan":
      return current.outputs.intakeFan;
    case "exhaustFan":
      return current.outputs.exhaustFan;
    default:
      return null;
  }
}

function doesRuleMatch(rule: RuleRow, current: DeviceState, sensors: DeviceState["sensors"]): boolean {
  const value = getRuleFieldValue(rule, current, sensors);
  if (value === null) {
    return false;
  }

  switch (rule.operator) {
    case "above":
      return typeof value === "number" && value > rule.threshold;
    case "below":
      return typeof value === "number" && value < rule.threshold;
    case "inside_range":
      return typeof value === "number" && rule.rangeMin !== undefined && rule.rangeMax !== undefined
        && value >= rule.rangeMin && value <= rule.rangeMax;
    case "outside_range":
      return typeof value === "number" && rule.rangeMin !== undefined && rule.rangeMax !== undefined
        && (value < rule.rangeMin || value > rule.rangeMax);
    case "boolean_is":
      return typeof value === "boolean" && value === Boolean(rule.boolValue);
    case "valid":
      return typeof value === "boolean" ? true : Number.isFinite(value);
    case "invalid":
      return typeof value === "boolean" ? false : !Number.isFinite(value);
    default:
      return false;
  }
}

function recomputePrototypeState(current: DeviceState): DeviceState {
  const sensors = deriveEffectiveSensors(current);
  let nextState: DeviceState = {
    ...current,
    sensors
  };

  const manualOrInhibited = !current.flags.automationEnabled
    || current.flags.manualModeActive
    || !current.flags.ruleEngineEnabled;

  let nextOutputs = current.outputs;
  let requestedWindowPosition = current.config.requestedWindowPosition;
  let lastIrrigationEventTime = current.lastIrrigationEventTime;
  let lastVentilationEventTime = current.lastVentilationEventTime;
  let lastWindowActionTime = current.lastWindowActionTime;

  let ruleEngineState: DeviceState["ruleEngine"]["state"] = "rule_engine_active";
  if (!current.flags.ruleEngineEnabled) {
    ruleEngineState = "rule_engine_inhibited";
  } else if (current.faults.ruleEngineFaultActive) {
    ruleEngineState = "rule_engine_degraded";
  }

  let automationSource: DeviceState["ruleEngine"]["automationSource"] = "local_rules";
  if (current.flags.manualModeActive) {
    automationSource = "manual_mode";
  } else if (!current.flags.ruleEngineEnabled || !current.flags.automationEnabled) {
    automationSource = "fallback_defaults";
  }

  let lastAutomationDecisionText = "No active rules matched current sensor state";

  if (manualOrInhibited) {
    if (current.flags.manualModeActive) {
      lastAutomationDecisionText = "Manual mode active; automatic rules not applied";
    } else if (!current.flags.ruleEngineEnabled) {
      lastAutomationDecisionText = "Rule engine disabled; automatic rules not applied";
    } else {
      lastAutomationDecisionText = "Automation disabled; current outputs held";
    }
  } else {
    const sortedRules = [...current.ruleEngine.rules]
      .filter((rule) => rule.enabled)
      .sort((left, right) => left.order - right.order);

    const derivedOutputs = {
      intakeFan: false,
      exhaustFan: false,
      irrigationPump: false,
      windowOpenRelay: false,
      windowCloseRelay: false
    };
    const matchedDecisions: string[] = [];
    let irrigationInhibited = false;
    let ventilationWindowInhibited = false;

    for (const rule of sortedRules) {
      if (!doesRuleMatch(rule, current, sensors)) {
        continue;
      }

      switch (rule.action) {
        case "turn_irrigation_on":
          if (!irrigationInhibited && current.flags.irrigationAutomationEnabled) {
            derivedOutputs.irrigationPump = true;
            lastIrrigationEventTime = new Date().toLocaleString();
            matchedDecisions.push(`${rule.description}: irrigation ON`);
          }
          break;
        case "turn_irrigation_off":
          derivedOutputs.irrigationPump = false;
          matchedDecisions.push(`${rule.description}: irrigation OFF`);
          break;
        case "turn_intake_fan_on":
          if (!ventilationWindowInhibited && current.flags.ventilationAutomationEnabled) {
            derivedOutputs.intakeFan = true;
            lastVentilationEventTime = new Date().toLocaleString();
            matchedDecisions.push(`${rule.description}: intake fan ON`);
          }
          break;
        case "turn_intake_fan_off":
          derivedOutputs.intakeFan = false;
          matchedDecisions.push(`${rule.description}: intake fan OFF`);
          break;
        case "turn_exhaust_fan_on":
          if (!ventilationWindowInhibited && current.flags.ventilationAutomationEnabled) {
            derivedOutputs.exhaustFan = true;
            lastVentilationEventTime = new Date().toLocaleString();
            matchedDecisions.push(`${rule.description}: exhaust fan ON`);
          }
          break;
        case "turn_exhaust_fan_off":
          derivedOutputs.exhaustFan = false;
          matchedDecisions.push(`${rule.description}: exhaust fan OFF`);
          break;
        case "request_window_open":
          if (!ventilationWindowInhibited && current.flags.windowAutomationEnabled) {
            requestedWindowPosition = 100;
            derivedOutputs.windowOpenRelay = true;
            derivedOutputs.windowCloseRelay = false;
            lastWindowActionTime = new Date().toLocaleString();
            matchedDecisions.push(`${rule.description}: window OPEN`);
          }
          break;
        case "request_window_close":
          if (!ventilationWindowInhibited && current.flags.windowAutomationEnabled) {
            requestedWindowPosition = 0;
            derivedOutputs.windowOpenRelay = false;
            derivedOutputs.windowCloseRelay = true;
            lastWindowActionTime = new Date().toLocaleString();
            matchedDecisions.push(`${rule.description}: window CLOSE`);
          }
          break;
        case "request_window_target":
          if (!ventilationWindowInhibited && current.flags.windowAutomationEnabled) {
            requestedWindowPosition = rule.actionTarget ?? requestedWindowPosition;
            derivedOutputs.windowOpenRelay = requestedWindowPosition > sensors.estimatedWindowPosition;
            derivedOutputs.windowCloseRelay = requestedWindowPosition < sensors.estimatedWindowPosition;
            lastWindowActionTime = new Date().toLocaleString();
            matchedDecisions.push(`${rule.description}: window target ${requestedWindowPosition}%`);
          }
          break;
        case "inhibit_irrigation":
          irrigationInhibited = true;
          derivedOutputs.irrigationPump = false;
          matchedDecisions.push(`${rule.description}: irrigation inhibited`);
          break;
        case "inhibit_ventilation_window":
          ventilationWindowInhibited = true;
          derivedOutputs.intakeFan = false;
          derivedOutputs.exhaustFan = false;
          derivedOutputs.windowOpenRelay = false;
          derivedOutputs.windowCloseRelay = false;
          matchedDecisions.push(`${rule.description}: ventilation/window inhibited`);
          break;
        case "raise_log_event":
          matchedDecisions.push(`${rule.description}: diagnostic marker`);
          break;
        default:
          break;
      }
    }

    nextOutputs = derivedOutputs;
    if (matchedDecisions.length > 0) {
      lastAutomationDecisionText = matchedDecisions.join(" | ");
    }
  }

  nextState = {
    ...nextState,
    outputs: nextOutputs,
    config: {
      ...nextState.config,
      requestedWindowPosition
    },
    ruleEngine: {
      ...nextState.ruleEngine,
      state: ruleEngineState,
      automationSource,
      lastAutomationDecisionText
    },
    lastIrrigationEventTime,
    lastVentilationEventTime,
    lastWindowActionTime
  };

  return nextState;
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(getInitialRoute());
  const [logFilter, setLogFilter] = useState<EventCategory | "all">("all");
  const [state, setState] = useState<DeviceState>(() => recomputePrototypeState(loadState()));
  const [draftConfig, setDraftConfig] = useState<DeviceConfig>(loadState().config);
  const [lastSavedAt, setLastSavedAt] = useState<string>("not saved this session");

  const errors = useMemo(
    () => validateConfig(draftConfig, state.ruleEngine.rules),
    [draftConfig, state.ruleEngine.rules]
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    window.location.hash = route;
  }, [route]);

  useEffect(() => {
    const onHashChange = () => setRoute(getInitialRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function appendEvent(category: EventCategory, message: string, source: EventLogEntry["source"] = "system") {
    setState((current) => {
      if (!current.flags.eventLoggingEnabled) {
        return {
          ...current,
          eventLog: {
            ...current.eventLog,
            status: "disabled"
          }
        };
      }

      return {
        ...current,
        eventLog: applyBoundedEventLog(current.eventLog, createEvent(category, message, source))
      };
    });
  }

  function handleConfigChange(key: keyof DeviceConfig, value: string | number | boolean) {
    setDraftConfig((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSaveConfig() {
    const nextErrors = validateConfig(draftConfig, state.ruleEngine.rules);
    if (Object.keys(nextErrors).length > 0) {
      appendEvent("configuration", "Configuration save blocked by validation errors", "local_web");
      return;
    }

    setState((current) => recomputePrototypeState({
      ...current,
      config: draftConfig,
      eventLog: {
        ...current.eventLog,
        maxEntries: draftConfig.eventLogCapacityEntries,
        retentionDays: draftConfig.eventLogRetentionDays
      },
      ruleEngine: {
        ...current.ruleEngine,
        lastConfigurationSource: "local_web"
      },
      manualModeReason: current.flags.manualModeActive ? "manual mode active by user" : "not active"
    }));
    setLastSavedAt(new Date().toLocaleString());
    appendEvent("configuration", "Configuration saved to simulated local storage", "local_web");
  }

  function handleResetConfig() {
    setDraftConfig(state.config);
    appendEvent("configuration", "Draft configuration reset to current device state", "local_web");
  }

  function handleToggleOutput(key: keyof DeviceState["outputs"]) {
    setState((current) => {
      const nextOutputs = { ...current.outputs, [key]: !current.outputs[key] };

      if (key === "windowOpenRelay" && nextOutputs.windowOpenRelay) {
        nextOutputs.windowCloseRelay = false;
      }
      if (key === "windowCloseRelay" && nextOutputs.windowCloseRelay) {
        nextOutputs.windowOpenRelay = false;
      }

      return {
        ...current,
        outputs: nextOutputs
      };
    });
    appendEvent("output", `Manual output toggle: ${key}`, "local_web");
  }

  function handleSetFlag(
    key:
      | "automationEnabled"
      | "manualModeActive"
      | "ruleEngineEnabled"
      | "irrigationAutomationEnabled"
      | "ventilationAutomationEnabled"
      | "windowAutomationEnabled"
      | "eventLoggingEnabled",
    value: boolean
  ) {
    setState((current) => recomputePrototypeState({
      ...current,
      flags: { ...current.flags, [key]: value },
      eventLog: key === "eventLoggingEnabled"
        ? {
            ...current.eventLog,
            status: value ? "healthy" : "disabled"
          }
        : current.eventLog,
      manualModeReason:
        key === "manualModeActive" && value
          ? "manual maintenance mode latched by operator"
          : key === "manualModeActive"
            ? "not active"
            : current.manualModeReason
    }));
    appendEvent("maintenance", `${key} set to ${value ? "enabled" : "disabled"}`, "local_web");
  }

  function handleWindowAction(action: "open" | "close" | "stop") {
    setState((current) => {
      if (action === "stop") {
        return {
          ...current,
          outputs: {
            ...current.outputs,
            windowOpenRelay: false,
            windowCloseRelay: false
          },
          ruleEngine: {
            ...current.ruleEngine,
            lastAutomationDecisionText: "Window motion stopped by local control"
          },
          lastWindowActionTime: new Date().toLocaleString()
        };
      }

      const target = action === "open" ? 100 : 0;
      return {
        ...current,
        sensors: {
          ...current.sensors,
          estimatedWindowPosition: target
        },
        config: {
          ...current.config,
          requestedWindowPosition: target
        },
        outputs: {
          ...current.outputs,
          windowOpenRelay: action === "open",
          windowCloseRelay: action === "close"
        },
        ruleEngine: {
          ...current.ruleEngine,
          lastAutomationDecisionText: `Window ${action} command issued`
        },
        lastWindowActionTime: new Date().toLocaleString()
      };
    });
    appendEvent("window", `Window action simulated: ${action}`, "local_web");
  }

  function handleIrrigationAction(action: "start" | "stop" | "fault") {
    setState((current) => {
      if (action === "start") {
        return {
          ...current,
          outputs: { ...current.outputs, irrigationPump: true },
          sensors: { ...current.sensors, flowRateLpm: 1.35 },
          faults: {
            ...current.faults,
            irrigationFaultActive: false,
            lastFailureReason: "none"
          },
          lastIrrigationEventTime: new Date().toLocaleString(),
          ruleEngine: {
            ...current.ruleEngine,
            lastAutomationDecisionText: "Irrigation start permitted"
          }
        };
      }
      if (action === "stop") {
        return {
          ...current,
          outputs: { ...current.outputs, irrigationPump: false },
          sensors: { ...current.sensors, flowRateLpm: 0 },
          lastIrrigationEventTime: new Date().toLocaleString()
        };
      }
      return {
        ...current,
        outputs: { ...current.outputs, irrigationPump: false },
        sensors: { ...current.sensors, flowRateLpm: 0 },
        faults: {
          ...current.faults,
          irrigationFaultActive: true,
          lastFailureReason: "irrigation_no_flow"
        },
        lastIrrigationEventTime: new Date().toLocaleString(),
        ruleEngine: {
          ...current.ruleEngine,
          lastAutomationDecisionText: "Irrigation stopped by no-flow policy"
        }
      };
    });
    appendEvent("irrigation", `Irrigation action simulated: ${action}`, "local_web");
  }

  function handleSimulateMode(mode: DeviceState["connectivity"]["networkMode"]) {
    setState((current) => {
      if (mode === "ethernet") {
        return {
          ...current,
          connectivity: {
            ...current.connectivity,
            networkMode: "ethernet",
            ethernetConnected: true,
            wifiConnected: false,
            apModeActive: true,
            ethernetIp: "192.168.1.46",
            wifiIp: ""
          }
        };
      }
      if (mode === "wifi_client") {
        return {
          ...current,
          connectivity: {
            ...current.connectivity,
            networkMode: "wifi_client",
            ethernetConnected: false,
            wifiConnected: true,
            apModeActive: false,
            ethernetIp: "",
            wifiIp: "192.168.1.82",
            wifiSsid: current.config.wifiSsid
          }
        };
      }
      return {
        ...current,
        connectivity: {
          ...current.connectivity,
          networkMode: "ap_recovery",
          ethernetConnected: false,
          wifiConnected: false,
          apModeActive: true,
          ethernetIp: "",
          wifiIp: "",
          wifiSsid: ""
        }
      };
    });
    appendEvent("network", `Network mode simulated: ${mode}`, "system");
  }

  function handleAdminAction(action: "restart" | "factory-reset" | "ota-toggle") {
    if (action === "factory-reset") {
      setState(recomputePrototypeState(defaultDeviceState));
      setDraftConfig(defaultDeviceState.config);
      setLastSavedAt("reset to defaults");
      return;
    }

    if (action === "restart") {
      setState((current) => recomputePrototypeState({
        ...current,
        outputs: {
          intakeFan: false,
          exhaustFan: false,
          irrigationPump: false,
          windowOpenRelay: false,
          windowCloseRelay: false
        },
        bootCount: current.bootCount + 1,
        faults: {
          ...current.faults,
          lastFailureReason: "none"
        }
      }));
      appendEvent("boot", "Simulated safe restart completed", "system");
      return;
    }

    setState((current) => recomputePrototypeState({
      ...current,
      flags: {
        ...current.flags,
        otaInProgress: !current.flags.otaInProgress
      },
      outputs: {
        intakeFan: false,
        exhaustFan: false,
        irrigationPump: false,
        windowOpenRelay: false,
        windowCloseRelay: false
      },
      faults: {
        ...current.faults,
        lastFailureReason: current.flags.otaInProgress ? "none" : "ota_in_progress"
      }
    }));
    appendEvent("ota", "OTA simulation toggled", "system");
  }

  function handleInjectFault(fault: "sensor" | "irrigation" | "clear") {
    if (fault === "clear") {
      setState((current) => recomputePrototypeState({
        ...current,
        faults: {
          ...current.faults,
          sensorFaultActive: false,
          irrigationFaultActive: false,
          loggingFaultActive: false,
          ruleEngineFaultActive: false,
          lastFailureReason: "none"
        }
      }));
      appendEvent("sensor", "Simulated faults cleared", "system");
      return;
    }

    if (fault === "sensor") {
      setState((current) => recomputePrototypeState({
        ...current,
        faults: {
          ...current.faults,
          sensorFaultActive: true,
          lastFailureReason: "high_temp_sensor_unavailable"
        },
        outputs: {
          ...current.outputs,
          intakeFan: false,
          exhaustFan: false
        }
      }));
      appendEvent("sensor", "Simulated high temperature sensor fault", "system");
      return;
    }

    setState((current) => recomputePrototypeState({
      ...current,
      faults: {
        ...current.faults,
        irrigationFaultActive: true,
        lastFailureReason: "irrigation_no_flow"
      },
      outputs: {
        ...current.outputs,
        irrigationPump: false
      }
    }));
    appendEvent("irrigation", "Simulated irrigation no-flow fault", "system");
  }

  function handleAddRule() {
    const nextRule: RuleRow = {
      id: `rule-${Date.now()}`,
      enabled: true,
      order: state.ruleEngine.rules.length + 1,
      ruleClass: "ventilation",
      description: "New rule",
      field: "highAirTemperature",
      operator: "above",
      threshold: 25,
      action: "turn_intake_fan_on",
      cooldownSeconds: 60
    };

    setState((current) => recomputePrototypeState({
      ...current,
      ruleEngine: {
        ...current.ruleEngine,
        rules: [...current.ruleEngine.rules, nextRule]
      }
    }));
    appendEvent("rule_engine", "Rule row added locally", "local_web");
  }

  function handleDeleteRule(id: string) {
    setState((current) => {
      const nextRules = current.ruleEngine.rules
        .filter((rule) => rule.id !== id)
        .map((rule, index) => ({ ...rule, order: index + 1 }));
      return recomputePrototypeState({
        ...current,
        ruleEngine: {
          ...current.ruleEngine,
          rules: nextRules
        }
      });
    });
    appendEvent("rule_engine", "Rule row deleted locally", "local_web");
  }

  function handleToggleRule(id: string) {
    setState((current) => recomputePrototypeState({
      ...current,
      ruleEngine: {
        ...current.ruleEngine,
        rules: current.ruleEngine.rules.map((rule) =>
          rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        )
      }
    }));
    appendEvent("rule_engine", "Rule row enable state changed", "local_web");
  }

  function handleMoveRule(id: string, direction: "up" | "down") {
    setState((current) => {
      const rules = [...current.ruleEngine.rules];
      const index = rules.findIndex((rule) => rule.id === id);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= rules.length) {
        return current;
      }
      const [item] = rules.splice(index, 1);
      rules.splice(target, 0, item);
      return recomputePrototypeState({
        ...current,
        ruleEngine: {
          ...current.ruleEngine,
          rules: rules.map((rule, order) => ({ ...rule, order: order + 1 }))
        }
      });
    });
    appendEvent("rule_engine", `Rule row moved ${direction}`, "local_web");
  }

  function handleRuleChange(id: string, patch: Partial<RuleRow>) {
    setState((current) => recomputePrototypeState({
      ...current,
      ruleEngine: {
        ...current.ruleEngine,
        rules: current.ruleEngine.rules.map((rule) =>
          rule.id === id ? { ...rule, ...patch } : rule
        )
      }
    }));
  }

  function handleSensorModeChange(key: NumericSensorKey | BooleanSensorKey, mode: SensorInputMode) {
    setState((current) => recomputePrototypeState({
      ...current,
      sensorControls: {
        ...current.sensorControls,
        [key]: {
          ...current.sensorControls[key],
          mode
        }
      }
    }));
    appendEvent("sensor", `${key} input source set to ${mode}`, "local_web");
  }

  function handleNumericSensorManualValueChange(key: NumericSensorKey, value: number) {
    setState((current) => recomputePrototypeState({
      ...current,
      sensorControls: {
        ...current.sensorControls,
        [key]: {
          ...current.sensorControls[key],
          manualValue: value
        }
      }
    }));
  }

  function handleBooleanSensorManualValueChange(key: BooleanSensorKey, value: boolean) {
    setState((current) => recomputePrototypeState({
      ...current,
      sensorControls: {
        ...current.sensorControls,
        [key]: {
          ...current.sensorControls[key],
          manualValue: value
        }
      }
    }));
  }

  function handleGenerateEvent(category: EventCategory = "maintenance") {
    appendEvent(category, `Sample ${category} event added from prototype`, "local_web");
  }

  function handleStressLog() {
    setState((current) => {
      let nextLog = current.eventLog;
      for (let i = 0; i < current.eventLog.maxEntries + 25; i += 1) {
        nextLog = applyBoundedEventLog(
          nextLog,
          createEvent("logging", `Stress event ${i + 1}`, "system")
        );
      }
      return {
        ...current,
        eventLog: nextLog
      };
    });
  }

  let page = <OverviewPage state={state} />;

  if (route === "status") {
    page = <StatusPage state={state} />;
  } else if (route === "controls") {
    page = (
      <ControlsPage
        state={state}
        onToggleOutput={handleToggleOutput}
        onSetFlag={handleSetFlag}
        onWindowAction={handleWindowAction}
        onIrrigationAction={handleIrrigationAction}
      />
    );
  } else if (route === "rules") {
    page = (
      <RulesPage
        rules={state.ruleEngine.rules}
        errors={errors}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
        onToggleRule={handleToggleRule}
        onMoveRule={handleMoveRule}
        onRuleChange={handleRuleChange}
      />
    );
  } else if (route === "logs") {
    page = (
      <LogViewerPage
        eventLog={state.eventLog}
        filter={logFilter}
        onFilterChange={setLogFilter}
        onGenerateEvent={handleGenerateEvent}
        onStressLog={handleStressLog}
      />
    );
  } else if (route === "configuration") {
    page = (
      <ConfigurationPage
        config={draftConfig}
        errors={errors}
        fields={configFields}
        onChange={handleConfigChange}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />
    );
  } else if (route === "network") {
    page = (
      <NetworkPage
        state={state}
        config={draftConfig}
        errors={errors}
        fields={configFields}
        onChange={handleConfigChange}
        onSave={handleSaveConfig}
        onSimulateMode={handleSimulateMode}
      />
    );
  } else if (route === "recovery") {
    page = <RecoveryPage state={state} onSimulateMode={handleSimulateMode} />;
  } else if (route === "ota") {
    page = (
      <OtaAdminPage
        state={state}
        config={draftConfig}
        errors={errors}
        fields={configFields}
        onChange={handleConfigChange}
        onSave={handleSaveConfig}
        onAdminAction={handleAdminAction}
      />
    );
  } else if (route === "diagnostics") {
    page = (
      <DiagnosticsPage
        state={state}
        onInjectFault={handleInjectFault}
        onSensorModeChange={handleSensorModeChange}
        onNumericSensorManualValueChange={handleNumericSensorManualValueChange}
        onBooleanSensorManualValueChange={handleBooleanSensorManualValueChange}
      />
    );
  }

  return (
    <Layout route={route} onNavigate={setRoute}>
      <header className="page-header">
        <div>
          <div className="eyebrow">ESPHome / Home Assistant Local Web Prototype</div>
          <h2>{state.config.deviceName}</h2>
          <p>
            Mock desktop-browser prototype for local status, recovery, configuration, rule editing, and bounded event logging.
          </p>
        </div>
        <div className="header-meta">
          <span>Entity prefix: {state.config.entityPrefix}</span>
          <span>Last saved: {lastSavedAt}</span>
        </div>
      </header>
      {page}
    </Layout>
  );
}
