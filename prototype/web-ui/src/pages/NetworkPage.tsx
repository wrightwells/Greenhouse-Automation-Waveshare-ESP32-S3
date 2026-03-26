import { ConfigField, DeviceConfig, DeviceState, ValidationErrors } from "../types";
import { FieldRenderer } from "../components/FieldRenderer";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface NetworkPageProps {
  state: DeviceState;
  config: DeviceConfig;
  errors: ValidationErrors;
  fields: ConfigField[];
  onChange: (key: keyof DeviceConfig, value: string | number | boolean) => void;
  onSave: () => void;
  onSimulateMode: (mode: DeviceState["connectivity"]["networkMode"]) => void;
}

export function NetworkPage({
  state,
  config,
  errors,
  fields,
  onChange,
  onSave,
  onSimulateMode
}: NetworkPageProps) {
  const networkFields = fields.filter((field) => field.section === "network");
  const mqttFields = fields.filter((field) => field.section === "mqtt");

  return (
    <div className="page-grid">
      <SectionCard title="Network State" subtitle="Simulated transport priority and recovery visibility.">
        <div className="badge-row">
          <StatusBadge label={`mode: ${state.connectivity.networkMode}`} tone="ok" />
          <StatusBadge label={state.connectivity.ethernetConnected ? "ethernet online" : "ethernet offline"} tone={state.connectivity.ethernetConnected ? "ok" : "neutral"} />
          <StatusBadge label={state.connectivity.wifiConnected ? "wifi client online" : "wifi client offline"} tone={state.connectivity.wifiConnected ? "ok" : "neutral"} />
          <StatusBadge label={state.connectivity.apModeActive ? "ap recovery active" : "ap recovery idle"} tone={state.connectivity.apModeActive ? "warn" : "neutral"} />
        </div>
        <div className="inline-actions">
          <button className="button" onClick={() => onSimulateMode("ethernet")}>Simulate ethernet priority</button>
          <button className="button" onClick={() => onSimulateMode("wifi_client")}>Simulate Wi-Fi fallback</button>
          <button className="button" onClick={() => onSimulateMode("ap_recovery")}>Simulate AP recovery</button>
        </div>
      </SectionCard>

      <SectionCard
        title="Wi-Fi and Recovery Access"
        subtitle="First-pass local setup and recovery settings."
        actions={<button className="button primary" onClick={onSave}>Save network settings</button>}
      >
        <div className="config-section-grid two-col">
          <div className="config-group">
            <h3>Wi-Fi client</h3>
            {networkFields.slice(0, 2).map((field) => (
              <FieldRenderer key={String(field.key)} field={field} config={config} errors={errors} onChange={onChange} />
            ))}
          </div>
          <div className="config-group">
            <h3>Fallback AP</h3>
            {networkFields.slice(2).map((field) => (
              <FieldRenderer key={String(field.key)} field={field} config={config} errors={errors} onChange={onChange} />
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="MQTT Supplementary Reporting" subtitle="MQTT remains optional and must not be required for core control.">
        <div className="config-section-grid two-col">
          {mqttFields.map((field) => (
            <FieldRenderer key={String(field.key)} field={field} config={config} errors={errors} onChange={onChange} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
