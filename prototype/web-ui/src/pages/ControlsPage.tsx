import { DeviceState } from "../types";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface ControlsPageProps {
  state: DeviceState;
  onToggleOutput: (key: keyof DeviceState["outputs"]) => void;
  onSetFlag: (key: "automationEnabled" | "manualModeActive", value: boolean) => void;
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
      <SectionCard title="Control Mode" subtitle="Manual maintenance mode is explicit and latched until cancelled.">
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
        </div>
        <div className="badge-row">
          <StatusBadge
            label={state.flags.automationEnabled ? "automation enabled" : "automation disabled"}
            tone={state.flags.automationEnabled ? "ok" : "warn"}
          />
          <StatusBadge
            label={state.flags.manualModeActive ? "manual mode active" : "manual mode inactive"}
            tone={state.flags.manualModeActive ? "warn" : "neutral"}
          />
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
