import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { EventCategory, EventLogEntry, EventLogState } from "../types";

interface LogViewerPageProps {
  eventLog: EventLogState;
  filter: EventCategory | "all";
  onFilterChange: (filter: EventCategory | "all") => void;
  onGenerateEvent: (category?: EventCategory) => void;
  onStressLog: () => void;
}

const categories: Array<EventCategory | "all"> = [
  "all",
  "boot",
  "network",
  "sensor",
  "rule_engine",
  "output",
  "irrigation",
  "window",
  "configuration",
  "ota",
  "maintenance",
  "logging"
];

function renderEntry(entry: EventLogEntry) {
  return (
    <div className="log-entry" key={entry.id}>
      <div className="log-entry-meta">
        <StatusBadge label={entry.category} tone="neutral" />
        <StatusBadge label={entry.source} tone="ok" />
        <span>{new Date(entry.timestamp).toLocaleString()}</span>
      </div>
      <div className="log-entry-message">{entry.message}</div>
    </div>
  );
}

export function LogViewerPage({
  eventLog,
  filter,
  onFilterChange,
  onGenerateEvent,
  onStressLog
}: LogViewerPageProps) {
  const visibleEntries =
    filter === "all"
      ? eventLog.entries
      : eventLog.entries.filter((entry) => entry.category === filter);

  return (
    <div className="page-grid">
      <SectionCard
        title="Rolling Event Log"
        subtitle="Bounded newest-first log with explicit rollover protection so logging cannot grow without limit."
        actions={
          <div className="inline-actions">
            <button className="button" onClick={() => onGenerateEvent()}>Add sample event</button>
            <button className="button" onClick={() => onGenerateEvent("rule_engine")}>Add rule event</button>
            <button className="button danger" onClick={onStressLog}>Stress rollover</button>
          </div>
        }
      >
        <div className="badge-row">
          <StatusBadge label={`status: ${eventLog.status}`} tone={eventLog.status === "healthy" ? "ok" : "warn"} />
          <StatusBadge label={`entries: ${eventLog.entries.length}/${eventLog.maxEntries}`} tone="neutral" />
          <StatusBadge label={`rollovers: ${eventLog.rolloverCount}`} tone="warn" />
          <StatusBadge label={`retention: ${eventLog.retentionDays}d`} tone="neutral" />
        </div>
        <div className="definition-list">
          <div>
            <dt>Oldest retained</dt>
            <dd>{eventLog.oldestRetainedTimestamp || "n/a"}</dd>
          </div>
          <div>
            <dt>Newest retained</dt>
            <dd>{eventLog.newestRetainedTimestamp || "n/a"}</dd>
          </div>
          <div>
            <dt>Last prune result</dt>
            <dd>{eventLog.lastLogPruneResult}</dd>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Filters">
        <div className="inline-actions">
          {categories.map((category) => (
            <button
              key={category}
              className={category === filter ? "button primary" : "button"}
              onClick={() => onFilterChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Newest First">
        <div className="log-panel">
          {visibleEntries.map(renderEntry)}
        </div>
      </SectionCard>
    </div>
  );
}
