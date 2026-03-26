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
          <StatusBadge label={`last failure: ${state.faults.lastFailureReason}`} tone={state.faults.lastFailureReason === "none" ? "neutral" : "warn"} />
        </div>
        <div className="inline-actions">
          <button className="button" onClick={() => onInjectFault("sensor")}>Simulate sensor fault</button>
          <button className="button" onClick={() => onInjectFault("irrigation")}>Simulate irrigation fault</button>
          <button className="button" onClick={() => onInjectFault("clear")}>Clear simulated faults</button>
        </div>
      </SectionCard>

      <SectionCard title="Diagnostic Log">
        <div className="log-panel">
          {state.faults.logs.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Developer Notes">
        <ul className="compact-list">
          <li>These logs are mock status lines only, not a secure audit trail.</li>
          <li>The embedded version should keep diagnostics lightweight and practical for recovery.</li>
          <li>Home Assistant can expose richer history, but the device should still show enough local fault context to recover safely.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
