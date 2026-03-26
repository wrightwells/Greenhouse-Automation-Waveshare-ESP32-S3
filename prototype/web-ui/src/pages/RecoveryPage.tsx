import { DeviceState } from "../types";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface RecoveryPageProps {
  state: DeviceState;
  onSimulateMode: (mode: DeviceState["connectivity"]["networkMode"]) => void;
}

export function RecoveryPage({ state, onSimulateMode }: RecoveryPageProps) {
  return (
    <div className="page-grid">
      <SectionCard title="First-Boot / AP Recovery Flow" subtitle="Prototype for captive-portal style access when Ethernet and Wi-Fi client are unavailable.">
        <div className="badge-row">
          <StatusBadge label={`recovery ssid: ${state.config.fallbackApSsid}`} tone="warn" />
          <StatusBadge label={state.connectivity.apModeActive ? "recovery mode active" : "recovery mode simulated off"} tone={state.connectivity.apModeActive ? "warn" : "neutral"} />
        </div>
        <ol className="compact-list ordered">
          <li>Power on the controller with no working Ethernet or Wi-Fi client link.</li>
          <li>Join the fallback AP from a phone or laptop.</li>
          <li>Open the local setup/status page.</li>
          <li>Enter Wi-Fi credentials, MQTT settings, and control thresholds.</li>
          <li>Save and restart into normal operation.</li>
        </ol>
        <div className="inline-actions">
          <button className="button" onClick={() => onSimulateMode("ap_recovery")}>Preview AP recovery state</button>
          <button className="button" onClick={() => onSimulateMode("ethernet")}>Return to Ethernet preview</button>
        </div>
      </SectionCard>

      <SectionCard title="Recovery Content Priorities">
        <ul className="compact-list">
          <li>Show enough live state to understand whether sensors, outputs, and networking are healthy.</li>
          <li>Keep credential and threshold editing simple and field-serviceable.</li>
          <li>Make manual mode, faults, and restart/factory reset actions visible but clearly separated.</li>
          <li>Avoid depending on Home Assistant or MQTT to reach recovery actions.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
