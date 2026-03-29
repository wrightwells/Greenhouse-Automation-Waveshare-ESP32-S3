import {
  BooleanSensorKey,
  DeviceState,
  NumericSensorKey,
  SensorInputMode
} from "../types";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface DiagnosticsPageProps {
  state: DeviceState;
  onInjectFault: (fault: "sensor" | "irrigation" | "clear") => void;
  onSensorModeChange: (key: NumericSensorKey | BooleanSensorKey, mode: SensorInputMode) => void;
  onNumericSensorManualValueChange: (key: NumericSensorKey, value: number) => void;
  onBooleanSensorManualValueChange: (key: BooleanSensorKey, value: boolean) => void;
}

const numericSensors: Array<{ key: NumericSensorKey; label: string; unit: string }> = [
  { key: "highAirTemperature", label: "High air temperature", unit: "C" },
  { key: "highAirHumidity", label: "High air humidity", unit: "%" },
  { key: "lowAirTemperature", label: "Low air temperature", unit: "C" },
  { key: "lowAirHumidity", label: "Low air humidity", unit: "%" },
  { key: "intakeAirTemperature", label: "Intake air temperature", unit: "C" },
  { key: "soilMoisture", label: "Soil moisture", unit: "%" },
  { key: "soilMoistureRaw", label: "Soil moisture raw", unit: "V" },
  { key: "flowRateLpm", label: "Flow rate", unit: "L/min" },
  { key: "estimatedWindowPosition", label: "Estimated window position", unit: "%" },
  { key: "uptimeHours", label: "Uptime", unit: "h" },
  { key: "wifiRssi", label: "Wi-Fi RSSI", unit: "dBm" }
];

export function DiagnosticsPage({
  state,
  onInjectFault,
  onSensorModeChange,
  onNumericSensorManualValueChange,
  onBooleanSensorManualValueChange
}: DiagnosticsPageProps) {
  return (
    <div className="page-grid">
      <SectionCard title="Diagnostics Summary" subtitle="Lightweight embedded-oriented diagnostics and fault indicators.">
        <div className="badge-row">
          <StatusBadge label={state.faults.sensorFaultActive ? "sensor fault active" : "sensor state healthy"} tone={state.faults.sensorFaultActive ? "danger" : "ok"} />
          <StatusBadge label={state.faults.irrigationFaultActive ? "irrigation fault active" : "irrigation path healthy"} tone={state.faults.irrigationFaultActive ? "danger" : "ok"} />
          <StatusBadge label={state.faults.loggingFaultActive ? "logging fault active" : `log ${state.eventLog.status}`} tone={state.faults.loggingFaultActive ? "danger" : "ok"} />
          <StatusBadge label={state.faults.ruleEngineFaultActive ? "rule-engine fault active" : state.ruleEngine.state} tone={state.faults.ruleEngineFaultActive ? "danger" : "ok"} />
          <StatusBadge label={`last failure: ${state.faults.lastFailureReason}`} tone={state.faults.lastFailureReason === "none" ? "neutral" : "warn"} />
        </div>
        <div className="inline-actions">
          <button className="button" onClick={() => onInjectFault("sensor")}>Simulate sensor fault</button>
          <button className="button" onClick={() => onInjectFault("irrigation")}>Simulate irrigation fault</button>
          <button className="button" onClick={() => onInjectFault("clear")}>Clear simulated faults</button>
        </div>
      </SectionCard>

      <SectionCard
        title="Sensor Override Bench"
        subtitle="Switch each sensor between live data and a manual test value. Manual values feed the same effective sensor state used by the prototype rule engine."
      >
        <div className="sensor-test-grid">
          {numericSensors.map((sensor) => {
            const control = state.sensorControls[sensor.key];
            return (
              <div className="sensor-test-card" key={sensor.key}>
                <div className="sensor-test-header">
                  <div>
                    <h3>{sensor.label}</h3>
                    <p>Effective value: {state.sensors[sensor.key]} {sensor.unit}</p>
                  </div>
                  <span className={`sensor-source-chip ${control.mode}`}>{control.mode}</span>
                </div>

                <div className="sensor-test-meta">
                  <span>Live: {state.liveSensors[sensor.key]} {sensor.unit}</span>
                  <span>Manual: {control.manualValue} {sensor.unit}</span>
                </div>

                <div className="sensor-mode-row">
                  <label>
                    <span>Source</span>
                    <select
                      value={control.mode}
                      onChange={(event) => onSensorModeChange(sensor.key, event.target.value as SensorInputMode)}
                    >
                      <option value="live">live</option>
                      <option value="manual">manual</option>
                    </select>
                  </label>
                </div>

                <div className="sensor-value-row">
                  <label>
                    <span>Manual test value</span>
                    <input
                      type="number"
                      value={control.manualValue}
                      step="0.1"
                      onChange={(event) => onNumericSensorManualValueChange(sensor.key, Number(event.target.value))}
                    />
                  </label>
                </div>
              </div>
            );
          })}

          <div className="sensor-test-card">
            <div className="sensor-test-header">
              <div>
                <h3>Door state</h3>
                <p>Effective value: {state.sensors.doorState ? "Open / faulted NC loop" : "Closed / healthy NC loop"}</p>
              </div>
              <span className={`sensor-source-chip ${state.sensorControls.doorState.mode}`}>
                {state.sensorControls.doorState.mode}
              </span>
            </div>

            <div className="sensor-test-meta">
              <span>Live: {state.liveSensors.doorState ? "Open" : "Closed"}</span>
              <span>Manual: {state.sensorControls.doorState.manualValue ? "Open" : "Closed"}</span>
            </div>

            <div className="sensor-mode-row">
              <label>
                <span>Source</span>
                <select
                  value={state.sensorControls.doorState.mode}
                  onChange={(event) => onSensorModeChange("doorState", event.target.value as SensorInputMode)}
                >
                  <option value="live">live</option>
                  <option value="manual">manual</option>
                </select>
              </label>
            </div>

            <div className="sensor-value-row">
              <label className="toggle-field">
                <span>Manual test state</span>
                <input
                  type="checkbox"
                  checked={state.sensorControls.doorState.manualValue}
                  onChange={(event) => onBooleanSensorManualValueChange("doorState", event.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Rule Engine Diagnostics">
        <dl className="definition-list">
          <div>
            <dt>State</dt>
            <dd>{state.ruleEngine.state}</dd>
          </div>
          <div>
            <dt>Automation source</dt>
            <dd>{state.ruleEngine.automationSource}</dd>
          </div>
          <div>
            <dt>Last decision</dt>
            <dd>{state.ruleEngine.lastAutomationDecisionText}</dd>
          </div>
          <div>
            <dt>Last config source</dt>
            <dd>{state.ruleEngine.lastConfigurationSource}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Recent Event Log Snapshot">
        <div className="log-panel">
          {state.eventLog.entries.slice(0, 8).map((entry) => (
            <div key={entry.id}>
              [{entry.category}] {new Date(entry.timestamp).toLocaleString()} {entry.message}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Developer Notes">
        <ul className="compact-list">
          <li>The prototype log is intentionally bounded and rolls over by dropping the oldest entries first.</li>
          <li>Manual sensor overrides drive the effective sensor set the rule engine reads, without changing the seeded live sensor values.</li>
          <li>Rule-engine and logging faults should stay diagnostically visible while core automation remains recoverable.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
