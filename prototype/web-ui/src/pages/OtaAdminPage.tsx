import { ConfigField, DeviceConfig, DeviceState, ValidationErrors } from "../types";
import { FieldRenderer } from "../components/FieldRenderer";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface OtaAdminPageProps {
  state: DeviceState;
  config: DeviceConfig;
  errors: ValidationErrors;
  fields: ConfigField[];
  onChange: (key: keyof DeviceConfig, value: string | number | boolean) => void;
  onSave: () => void;
  onAdminAction: (action: "restart" | "factory-reset" | "ota-toggle") => void;
}

export function OtaAdminPage({
  state,
  config,
  errors,
  fields,
  onChange,
  onSave,
  onAdminAction
}: OtaAdminPageProps) {
  const otaFields = fields.filter((field) => field.section === "ota");

  return (
    <div className="page-grid">
      <SectionCard title="OTA Expectations" subtitle="Prototype representation of update safety and admin controls.">
        <div className="badge-row">
          <StatusBadge label={state.flags.otaInProgress ? "ota in progress" : "ota idle"} tone={state.flags.otaInProgress ? "warn" : "neutral"} />
          <StatusBadge label={config.otaEnabled ? "ota enabled" : "ota disabled"} tone={config.otaEnabled ? "ok" : "warn"} />
        </div>
        <ul className="compact-list">
          <li>Outputs should be forced safe OFF before OTA begins.</li>
          <li>User control should be suspended during the update flow.</li>
          <li>After reboot, connectivity and health checks must pass before automation resumes.</li>
        </ul>
      </SectionCard>

      <SectionCard
        title="OTA Configuration"
        actions={<button className="button primary" onClick={onSave}>Save OTA settings</button>}
      >
        <div className="config-section-grid two-col">
          {otaFields.map((field) => (
            <FieldRenderer key={String(field.key)} field={field} config={config} errors={errors} onChange={onChange} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Admin Actions" subtitle="Non-destructive UI prototype actions for maintenance flows.">
        <div className="inline-actions">
          <button className="button" onClick={() => onAdminAction("restart")}>Simulate restart</button>
          <button className="button danger" onClick={() => onAdminAction("factory-reset")}>Reset prototype data</button>
          <button className="button" onClick={() => onAdminAction("ota-toggle")}>
            {state.flags.otaInProgress ? "Finish OTA simulation" : "Start OTA simulation"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
