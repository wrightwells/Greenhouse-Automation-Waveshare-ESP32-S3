import { DeviceState } from "../types";
import { MetricGrid } from "../components/MetricGrid";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";

interface StatusPageProps {
  state: DeviceState;
}

export function StatusPage({ state }: StatusPageProps) {
  return (
    <div className="page-grid">
      <SectionCard title="Environmental Sensors" subtitle="Live sensor view with mock greenhouse telemetry.">
        <MetricGrid
          items={[
            { label: "High air temperature", value: `${state.sensors.highAirTemperature.toFixed(1)} °C` },
            { label: "High air humidity", value: `${state.sensors.highAirHumidity}%` },
            { label: "Low air temperature", value: `${state.sensors.lowAirTemperature.toFixed(1)} °C` },
            { label: "Low air humidity", value: `${state.sensors.lowAirHumidity}%` },
            { label: "Intake temperature", value: `${state.sensors.intakeAirTemperature.toFixed(1)} °C` },
            { label: "Soil moisture", value: `${state.sensors.soilMoisture}%`, hint: `raw ${state.sensors.soilMoistureRaw.toFixed(2)} V` },
            { label: "Flow rate", value: `${state.sensors.flowRateLpm.toFixed(2)} L/min` },
            { label: "Window estimate", value: `${state.sensors.estimatedWindowPosition}%` }
          ]}
        />
      </SectionCard>

      <SectionCard title="Connectivity and State">
        <div className="badge-row">
          <StatusBadge label={state.connectivity.ethernetConnected ? "ethernet online" : "ethernet offline"} tone={state.connectivity.ethernetConnected ? "ok" : "neutral"} />
          <StatusBadge label={state.connectivity.wifiConnected ? "wifi connected" : "wifi idle"} tone={state.connectivity.wifiConnected ? "ok" : "neutral"} />
          <StatusBadge label={state.connectivity.apModeActive ? "ap recovery active" : "ap standby"} tone={state.connectivity.apModeActive ? "warn" : "neutral"} />
          <StatusBadge label={state.flags.manualModeActive ? "manual mode" : "automatic mode"} tone={state.flags.manualModeActive ? "warn" : "ok"} />
        </div>
        <dl className="definition-list">
          <div>
            <dt>Ethernet IP</dt>
            <dd>{state.connectivity.ethernetIp || "not assigned"}</dd>
          </div>
          <div>
            <dt>Wi-Fi IP</dt>
            <dd>{state.connectivity.wifiIp || "not assigned"}</dd>
          </div>
          <div>
            <dt>Wi-Fi RSSI</dt>
            <dd>{state.sensors.wifiRssi} dBm</dd>
          </div>
          <div>
            <dt>Last sensor scan</dt>
            <dd>{state.lastSensorScan}</dd>
          </div>
          <div>
            <dt>Last MQTT publish</dt>
            <dd>{state.lastMqttPublish}</dd>
          </div>
          <div>
            <dt>Boot count</dt>
            <dd>{state.bootCount}</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
