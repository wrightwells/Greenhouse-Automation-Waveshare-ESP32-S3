import { DeviceState } from "../types";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface ControlsPageProps {
  state: DeviceState;
  onToggleOutput: (key: keyof DeviceState["outputs"]) => void;
  onSetFlag: (
    key:
      | "automationEnabled"
      | "manualModeActive"
      | "ruleEngineEnabled"
      | "irrigationAutomationEnabled"
      | "ventilationAutomationEnabled"
      | "windowAutomationEnabled"
      | "eventLoggingEnabled",
    value: boolean
  ) => void;
  onWindowAction: (action: "open" | "close" | "stop") => void;
  onIrrigationAction: (action: "start" | "stop" | "fault") => void;
}

export function ControlsPage({
  state,
  onToggleOutput,
  onSetFlag,
  onWindowAction,
  onIrrigationAction
}: ControlsPageProps) {
  return (
    <div className="page-grid">
      <SectionCard title="Control Mode" subtitle="Manual mode, rule-engine enable, and per-class automation enables are distinct.">
        <div className="toggle-row">
          <button
            className={state.flags.automationEnabled ? "button primary" : "button"}
            onClick={() => onSetFlag("automationEnabled", !state.flags.automationEnabled)}
          >
            {state.flags.automationEnabled ? "Disable automation" : "Enable automation"}
          </button>
          <button
            className={state.flags.manualModeActive ? "button danger" : "button"}
            onClick={() => onSetFlag("manualModeActive", !state.flags.manualModeActive)}
          >
            {state.flags.manualModeActive ? "Cancel manual mode" : "Enter manual mode"}
          </button>
          <button
            className={state.flags.ruleEngineEnabled ? "button primary" : "button"}
            onClick={() => onSetFlag("ruleEngineEnabled", !state.flags.ruleEngineEnabled)}
          >
            {state.flags.ruleEngineEnabled ? "Disable rule engine" : "Enable rule engine"}
          </button>
        </div>
        <div className="badge-row">
          <StatusBadge label={state.flags.manualModeActive ? "manual mode active" : "automatic mode"} tone={state.flags.manualModeActive ? "warn" : "ok"} />
          <StatusBadge label={state.flags.ruleEngineEnabled ? "rule engine enabled" : "rule engine inhibited"} tone={state.flags.ruleEngineEnabled ? "ok" : "warn"} />
          <StatusBadge label={state.ruleEngine.state} tone={state.ruleEngine.state === "rule_engine_active" ? "ok" : "warn"} />
        </div>
      </SectionCard>

      <SectionCard title="Automation Class Enables" subtitle="Supervisory class controls without entering full manual mode.">
        <div className="control-grid">
          {(
            [
              ["irrigationAutomationEnabled", "Irrigation automation"],
              ["ventilationAutomationEnabled", "Ventilation automation"],
              ["windowAutomationEnabled", "Window automation"],
              ["eventLoggingEnabled", "Event logging"]
            ] as const
          ).map(([key, label]) => (
            <div className="control-card" key={key}>
              <strong>{label}</strong>
              <StatusBadge label={state.flags[key] ? "enabled" : "disabled"} tone={state.flags[key] ? "ok" : "warn"} />
              <button className="button" onClick={() => onSetFlag(key, !state.flags[key])}>
                Toggle
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Relay Outputs" subtitle="Developer-machine simulation of direct maintenance controls.">
        <div className="control-grid">
          {(
            [
              ["intakeFan", "Intake fan relay"],
              ["exhaustFan", "Exhaust fan relay"],
              ["irrigationPump", "Irrigation pump relay"],
              ["windowOpenRelay", "Window open relay"],
              ["windowCloseRelay", "Window close relay"]
            ] as const
          ).map(([key, label]) => (
            <div className="control-card" key={key}>
              <strong>{label}</strong>
              <StatusBadge label={state.outputs[key] ? "on" : "off"} tone={state.outputs[key] ? "ok" : "neutral"} />
              <button className="button" onClick={() => onToggleOutput(key)}>
                Toggle
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Window Control" subtitle="Timed position-by-travel model from the specification.">
        <div className="control-grid">
          <div className="control-card">
            <strong>Requested position</strong>
            <div>{state.config.requestedWindowPosition}%</div>
          </div>
          <div className="control-card">
            <strong>Estimated position</strong>
            <div>{state.sensors.estimatedWindowPosition}%</div>
          </div>
          <div className="control-card control-actions">
            <button className="button" onClick={() => onWindowAction("open")}>Fully open</button>
            <button className="button" onClick={() => onWindowAction("close")}>Fully close</button>
            <button className="button" onClick={() => onWindowAction("stop")}>Stop</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Irrigation Controls" subtitle="Simulated irrigation run and fault actions for UX validation.">
        <div className="control-grid">
          <div className="control-card">
            <strong>Soil moisture</strong>
            <div>{state.sensors.soilMoisture}%</div>
          </div>
          <div className="control-card">
            <strong>Flow rate</strong>
            <div>{state.sensors.flowRateLpm.toFixed(2)} L/min</div>
          </div>
          <div className="control-card control-actions">
            <button className="button" onClick={() => onIrrigationAction("start")}>Start irrigation</button>
            <button className="button" onClick={() => onIrrigationAction("stop")}>Stop irrigation</button>
            <button className="button danger" onClick={() => onIrrigationAction("fault")}>Simulate no-flow fault</button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
