import { DeviceState } from "../types";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface DiagnosticsPageProps {
  state: DeviceState;
  onInjectFault: (fault: "sensor" | "irrigation" | "clear") => void;
}

export function DiagnosticsPage({ state, onInjectFault }: DiagnosticsPageProps) {
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
          <li>The embedded implementation should keep logging lightweight enough that storage problems cannot block safe control.</li>
          <li>Rule-engine and logging faults should stay diagnostically visible while core automation remains recoverable.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
