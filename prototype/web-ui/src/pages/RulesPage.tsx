import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { RuleAction, RuleField, RuleOperator, RuleRow, ValidationErrors } from "../types";

interface RulesPageProps {
  rules: RuleRow[];
  errors: ValidationErrors;
  onAddRule: () => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onMoveRule: (id: string, direction: "up" | "down") => void;
  onRuleChange: (id: string, patch: Partial<RuleRow>) => void;
}

const fields: RuleField[] = [
  "highAirTemperature",
  "lowAirTemperature",
  "highAirHumidity",
  "lowAirHumidity",
  "intakeAirTemperature",
  "soilMoisture",
  "flowRateLpm",
  "doorState",
  "estimatedWindowPosition",
  "manualModeActive",
  "sensorFaultActive",
  "irrigationPump",
  "intakeFan",
  "exhaustFan"
];

const operators: RuleOperator[] = [
  "above",
  "below",
  "inside_range",
  "outside_range",
  "boolean_is",
  "valid",
  "invalid"
];

const actions: RuleAction[] = [
  "turn_irrigation_on",
  "turn_irrigation_off",
  "turn_intake_fan_on",
  "turn_intake_fan_off",
  "turn_exhaust_fan_on",
  "turn_exhaust_fan_off",
  "request_window_open",
  "request_window_close",
  "request_window_target",
  "inhibit_irrigation",
  "inhibit_ventilation_window",
  "raise_log_event"
];

export function RulesPage({
  rules,
  errors,
  onAddRule,
  onDeleteRule,
  onToggleRule,
  onMoveRule,
  onRuleChange
}: RulesPageProps) {
  return (
    <div className="page-grid">
      <SectionCard
        title="Rule Engine Editor"
        subtitle="Row-based local automation rules with explicit ordering, enable states, and bounded editing complexity."
        actions={<button className="button primary" onClick={onAddRule}>Add rule row</button>}
      >
        <div className="badge-row">
          <StatusBadge label={`${rules.length} rows`} tone="ok" />
          <StatusBadge label="ordered evaluation" tone="neutral" />
          <StatusBadge label="safe arbitration required" tone="warn" />
        </div>
      </SectionCard>

      {rules.map((rule, index) => (
        <SectionCard
          key={rule.id}
          title={`Rule ${rule.order}: ${rule.description || "Unnamed rule"}`}
          subtitle={`${rule.ruleClass} rule`}
          actions={
            <div className="inline-actions">
              <button className="button" onClick={() => onMoveRule(rule.id, "up")} disabled={index === 0}>Move up</button>
              <button className="button" onClick={() => onMoveRule(rule.id, "down")} disabled={index === rules.length - 1}>Move down</button>
              <button className="button" onClick={() => onToggleRule(rule.id)}>{rule.enabled ? "Disable" : "Enable"}</button>
              <button className="button danger" onClick={() => onDeleteRule(rule.id)}>Delete</button>
            </div>
          }
        >
          <div className="config-section-grid two-col">
            <label className="form-field">
              <span className="field-label">Description</span>
              <input
                value={rule.description}
                onChange={(event) => onRuleChange(rule.id, { description: event.target.value })}
              />
            </label>

            <label className="form-field">
              <span className="field-label">Rule class</span>
              <select
                value={rule.ruleClass}
                onChange={(event) => onRuleChange(rule.id, { ruleClass: event.target.value as RuleRow["ruleClass"] })}
              >
                <option value="ventilation">ventilation</option>
                <option value="irrigation">irrigation</option>
                <option value="window">window</option>
              </select>
            </label>

            <label className="form-field">
              <span className="field-label">Field</span>
              <select
                value={rule.field}
                onChange={(event) => onRuleChange(rule.id, { field: event.target.value as RuleField })}
              >
                {fields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="field-label">Operator</span>
              <select
                value={rule.operator}
                onChange={(event) => onRuleChange(rule.id, { operator: event.target.value as RuleOperator })}
              >
                {operators.map((operator) => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="field-label">Threshold</span>
              <input
                type="number"
                value={rule.threshold}
                onChange={(event) => onRuleChange(rule.id, { threshold: Number(event.target.value) })}
              />
            </label>

            <label className="form-field">
              <span className="field-label">Action</span>
              <select
                value={rule.action}
                onChange={(event) => onRuleChange(rule.id, { action: event.target.value as RuleAction })}
              >
                {actions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="field-label">Action target %</span>
              <input
                type="number"
                value={rule.actionTarget ?? 0}
                onChange={(event) => onRuleChange(rule.id, { actionTarget: Number(event.target.value) })}
              />
            </label>

            <label className="form-field">
              <span className="field-label">Cooldown seconds</span>
              <input
                type="number"
                value={rule.cooldownSeconds ?? 0}
                onChange={(event) => onRuleChange(rule.id, { cooldownSeconds: Number(event.target.value) })}
              />
            </label>
          </div>
          {errors[`rule:${rule.id}`] ? <div className="field-error">{errors[`rule:${rule.id}`]}</div> : null}
        </SectionCard>
      ))}
    </div>
  );
}
