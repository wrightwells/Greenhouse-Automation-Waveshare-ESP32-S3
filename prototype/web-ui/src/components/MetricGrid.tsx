interface Metric {
  label: string;
  value: string;
  hint?: string;
}

interface MetricGridProps {
  items: Metric[];
}

export function MetricGrid({ items }: MetricGridProps) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <div className="metric-card" key={item.label}>
          <span className="metric-label">{item.label}</span>
          <strong className="metric-value">{item.value}</strong>
          {item.hint ? <span className="metric-hint">{item.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
