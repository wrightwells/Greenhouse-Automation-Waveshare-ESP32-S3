import { useEffect, useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { configFields } from "./mock/configSchema";
import { defaultDeviceState, storageKey } from "./mock/deviceState";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { ControlsPage } from "./pages/ControlsPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import { NetworkPage } from "./pages/NetworkPage";
import { OtaAdminPage } from "./pages/OtaAdminPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RecoveryPage } from "./pages/RecoveryPage";
import { StatusPage } from "./pages/StatusPage";
import { DeviceConfig, DeviceState, RouteId, ValidationErrors } from "./types";

function getInitialRoute(): RouteId {
  const hash = window.location.hash.replace("#", "") as RouteId;
  const allowed: RouteId[] = [
    "overview",
    "status",
    "controls",
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
    return JSON.parse(raw) as DeviceState;
  } catch {
    return defaultDeviceState;
  }
}

function validateConfig(config: DeviceConfig): ValidationErrors {
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

  return errors;
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(getInitialRoute());
  const [state, setState] = useState<DeviceState>(loadState);
  const [draftConfig, setDraftConfig] = useState<DeviceConfig>(loadState().config);
  const [lastSavedAt, setLastSavedAt] = useState<string>("not saved this session");

  const errors = useMemo(() => validateConfig(draftConfig), [draftConfig]);

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

  function appendLog(message: string) {
    setState((current) => ({
      ...current,
      faults: {
        ...current.faults,
        logs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...current.faults.logs].slice(0, 12)
      }
    }));
  }

  function handleConfigChange(key: keyof DeviceConfig, value: string | number | boolean) {
    setDraftConfig((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSaveConfig() {
    const nextErrors = validateConfig(draftConfig);
    if (Object.keys(nextErrors).length > 0) {
      appendLog("Configuration save blocked by validation errors");
      return;
    }

    setState((current) => ({
      ...current,
      config: draftConfig,
      flags: {
        ...current.flags,
        displayEnabled: draftConfig.selectedDisplayPage !== undefined ? current.flags.displayEnabled : current.flags.displayEnabled
      },
      manualModeReason: current.flags.manualModeActive ? "manual mode active by user" : "not active"
    }));
    setLastSavedAt(new Date().toLocaleString());
    appendLog("Configuration saved to simulated local storage");
  }

  function handleResetConfig() {
    setDraftConfig(state.config);
    appendLog("Draft configuration reset to current device state");
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
    appendLog(`Manual output toggle: ${key}`);
  }

  function handleSetFlag(key: "automationEnabled" | "manualModeActive", value: boolean) {
    setState((current) => ({
      ...current,
      flags: { ...current.flags, [key]: value },
      manualModeReason:
        key === "manualModeActive" && value
          ? "manual maintenance mode latched by operator"
          : key === "manualModeActive"
            ? "not active"
            : current.manualModeReason
    }));
    appendLog(`${key} set to ${value ? "enabled" : "disabled"}`);
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
          }
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
        }
      };
    });
    appendLog(`Window action simulated: ${action}`);
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
          }
        };
      }
      if (action === "stop") {
        return {
          ...current,
          outputs: { ...current.outputs, irrigationPump: false },
          sensors: { ...current.sensors, flowRateLpm: 0 }
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
        }
      };
    });
    appendLog(`Irrigation action simulated: ${action}`);
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
    appendLog(`Network mode simulated: ${mode}`);
  }

  function handleAdminAction(action: "restart" | "factory-reset" | "ota-toggle") {
    if (action === "factory-reset") {
      setState(defaultDeviceState);
      setDraftConfig(defaultDeviceState.config);
      setLastSavedAt("reset to defaults");
      return;
    }

    if (action === "restart") {
      setState((current) => ({
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
      appendLog("Simulated safe restart completed");
      return;
    }

    setState((current) => ({
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
    appendLog("OTA simulation toggled");
  }

  function handleInjectFault(fault: "sensor" | "irrigation" | "clear") {
    if (fault === "clear") {
      setState((current) => ({
        ...current,
        faults: {
          ...current.faults,
          sensorFaultActive: false,
          irrigationFaultActive: false,
          lastFailureReason: "none"
        }
      }));
      appendLog("Simulated faults cleared");
      return;
    }

    if (fault === "sensor") {
      setState((current) => ({
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
      appendLog("Simulated high temperature sensor fault");
      return;
    }

    setState((current) => ({
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
    appendLog("Simulated irrigation no-flow fault");
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
    page = <DiagnosticsPage state={state} onInjectFault={handleInjectFault} />;
  }

  return (
    <Layout route={route} onNavigate={setRoute}>
      <header className="page-header">
        <div>
          <div className="eyebrow">ESPHome / Home Assistant Local Web Prototype</div>
          <h2>{state.config.deviceName}</h2>
          <p>
            Mock desktop-browser prototype for local status, recovery, configuration, and maintenance pages.
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
