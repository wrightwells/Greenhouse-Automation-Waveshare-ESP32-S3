import { ChangeEvent } from "react";
import { ConfigField, DeviceConfig, ValidationErrors } from "../types";

interface FieldRendererProps {
  field: ConfigField;
  config: DeviceConfig;
  errors: ValidationErrors;
  onChange: (key: keyof DeviceConfig, value: string | number | boolean) => void;
}

export function FieldRenderer({
  field,
  config,
  errors,
  onChange
}: FieldRendererProps) {
  const value = config[field.key];
  const error = errors[String(field.key)];

  const commonHelp = (
    <>
      <span className="field-help">{field.description}</span>
      {error ? <span className="field-error">{error}</span> : null}
    </>
  );

  if (field.type === "boolean") {
    return (
      <label className="toggle-field" key={String(field.key)}>
        <div>
          <span className="field-label">{field.label}</span>
          {commonHelp}
        </div>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(field.key, event.target.checked)}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="form-field" key={String(field.key)}>
        <span className="field-label">{field.label}</span>
        <select
          value={String(value)}
          onChange={(event) => onChange(field.key, event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {commonHelp}
      </label>
    );
  }

  const inputType = field.type === "password" ? "password" : field.type;

  return (
    <label className="form-field" key={String(field.key)}>
      <span className="field-label">{field.label}</span>
      <input
        type={inputType}
        value={String(value)}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const nextValue =
            field.type === "number" ? Number(event.target.value) : event.target.value;
          onChange(field.key, nextValue);
        }}
      />
      {commonHelp}
    </label>
  );
}
