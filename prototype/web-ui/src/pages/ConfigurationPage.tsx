import { ConfigField, DeviceConfig, ValidationErrors } from "../types";
import { FieldRenderer } from "../components/FieldRenderer";
import { SectionCard } from "../components/SectionCard";

interface ConfigurationPageProps {
  config: DeviceConfig;
  errors: ValidationErrors;
  fields: ConfigField[];
  onChange: (key: keyof DeviceConfig, value: string | number | boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

const sectionOrder: Array<ConfigField["section"]> = [
  "general",
  "ruleEngine",
  "window",
  "ventilation",
  "irrigation",
  "logging",
  "display"
];

const sectionTitles: Record<ConfigField["section"], string> = {
  general: "General",
  ruleEngine: "Rule engine",
  window: "Window actuator",
  ventilation: "Ventilation",
  irrigation: "Irrigation",
  logging: "Logging",
  network: "Network",
  mqtt: "MQTT",
  display: "Display",
  ota: "OTA"
};

export function ConfigurationPage({
  config,
  errors,
  fields,
  onChange,
  onSave,
  onReset
}: ConfigurationPageProps) {
  return (
    <div className="page-grid">
      <SectionCard
        title="Operational Configuration"
        subtitle="Configuration prototype for thresholds, timings, actuator behavior, and display settings."
        actions={
          <div className="inline-actions">
            <button className="button" onClick={onReset}>Reset changes</button>
            <button className="button primary" onClick={onSave}>Save configuration</button>
          </div>
        }
      >
        <div className="config-section-grid">
          {sectionOrder.map((section) => (
            <div className="config-group" key={section}>
              <h3>{sectionTitles[section]}</h3>
              {fields
                .filter((field) => field.section === section)
                .map((field) => (
                  <FieldRenderer
                    key={String(field.key)}
                    field={field}
                    config={config}
                    errors={errors}
                    onChange={onChange}
                  />
                ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
