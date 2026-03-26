import { DeviceState } from "../types";
import { MetricGrid } from "../components/MetricGrid";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface OverviewPageProps {
  state: DeviceState;
}

export function OverviewPage({ state }: OverviewPageProps) {
  const systemTone = state.faults.sensorFaultActive || state.faults.irrigationFaultActive
    ? "danger"
    : state.flags.manualModeActive
      ? "warn"
      : "ok";

  return (
    <div className="page-grid">
      <SectionCard
        title="Controller Overview"
        subtitle="Local-first greenhouse status summary intended for the embedded status page and recovery web surface."
        actions={<StatusBadge label={state.connectivity.networkMode} tone="ok" />}
      >
        <div className="badge-row">
          <StatusBadge
            label={state.flags.automationEnabled ? "automation enabled" : "automation paused"}
            tone={state.flags.automationEnabled ? "ok" : "warn"}
          />
          <StatusBadge
            label={state.flags.manualModeActive ? "manual maintenance active" : "automatic mode"}
            tone={state.flags.manualModeActive ? "warn" : "ok"}
          />
          <StatusBadge
            label={state.faults.lastFailureReason}
            tone={systemTone}
          />
        </div>

        <MetricGrid
          items={[
            {
              label: "High temp",
              value: `${state.sensors.highAirTemperature.toFixed(1)} °C`,
              hint: `${state.sensors.highAirHumidity}% RH`
            },
            {
              label: "Low temp",
              value: `${state.sensors.lowAirTemperature.toFixed(1)} °C`,
              hint: `${state.sensors.lowAirHumidity}% RH`
            },
            {
              label: "Soil moisture",
              value: `${state.sensors.soilMoisture}%`,
              hint: `threshold ${state.config.soilMoistureMinThreshold}%`
            },
            {
              label: "Window position",
              value: `${state.sensors.estimatedWindowPosition}%`,
              hint: `target ${state.config.requestedWindowPosition}%`
            },
            {
              label: "Flow rate",
              value: `${state.sensors.flowRateLpm.toFixed(2)} L/min`,
              hint: state.config.flowValidationEnabled ? "flow validation on" : "flow validation off"
            },
            {
              label: "Network",
              value: state.connectivity.networkMode,
              hint: state.connectivity.ethernetConnected
                ? state.connectivity.ethernetIp
                : state.connectivity.wifiIp || "AP fallback"
            }
          ]}
        />
      </SectionCard>

      <SectionCard title="Display Preview" subtitle="Simulated 2-line local display content">
        <div className="display-preview">
          {state.displayPreview.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Safety Summary">
        <ul className="compact-list">
          <li>All controlled outputs are expected to boot OFF.</li>
          <li>Manual maintenance mode should suspend automatic logic until cancelled.</li>
          <li>OTA must force safe output state before update proceeds.</li>
          <li>Sensor failures should move only affected functions to safe behavior where possible.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
