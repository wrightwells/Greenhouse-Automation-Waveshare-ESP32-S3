#include "greenhouse_runtime.h"

#include <algorithm>
#include <ctime>
#include <utility>

#include "cJSON.h"
#include "esp_err.h"
#include "esp_http_server.h"
#include "esphome/core/application.h"
#include "esphome/core/log.h"
#include "nvs.h"

namespace esphome {
namespace greenhouse_runtime {

static const char *const TAG = "greenhouse_runtime";
static const char *const NVS_KEY_RULES = "rules_json";
static const char *const NVS_KEY_LOGS = "log_json";
static const char *const NVS_KEY_ROLLOVER = "rollover";
static const char *const INDEX_HTML = R"HTML(
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Greenhouse Runtime</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", sans-serif; }
    body { margin: 0; background: #edf4ef; color: #173228; }
    header { padding: 16px 20px; background: #214a39; color: #f4fbf6; }
    main { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; padding: 16px; }
    section { background: white; border-radius: 14px; padding: 16px; box-shadow: 0 10px 24px rgba(23, 50, 40, 0.08); }
    h1, h2, h3 { margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #dde7df; vertical-align: top; }
    input, select, button, textarea { font: inherit; padding: 8px 10px; border-radius: 8px; border: 1px solid #b8cbbf; }
    textarea { width: 100%; min-height: 72px; }
    button { cursor: pointer; background: #295c48; color: white; border: 0; }
    button.secondary { background: #d7e6db; color: #173228; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #d7efe0; }
    .muted { color: #5f7169; }
    .log-entry { border-bottom: 1px solid #dde7df; padding: 10px 0; }
    .log-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.9rem; color: #5f7169; margin-bottom: 4px; }
    .full-span { grid-column: 1 / -1; }
    .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    .test-card { border: 1px solid #dde7df; border-radius: 12px; padding: 12px; display: grid; gap: 10px; }
    .test-card h3 { margin: 0; font-size: 1rem; }
    .test-card label { display: block; margin-bottom: 6px; font-weight: 600; }
    .test-meta { display: grid; gap: 4px; color: #5f7169; font-size: 0.92rem; }
    .source-chip { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; background: #d7efe0; color: #173228; }
    .source-chip.manual { background: #f4e4c7; color: #8a5a08; }
    .test-header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .hidden { display: none; }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>Greenhouse Runtime</h1>
    <div class="muted">Flash-backed rule store, bounded event log, and optional compile-time test controls</div>
  </header>
  <main>
    <section>
      <h2>Rule Editor</h2>
      <div class="row">
        <button id="addRule">Add Rule</button>
        <button id="saveRules">Save Rules</button>
        <span id="ruleStatus" class="pill">Loading</span>
      </div>
      <table id="rulesTable">
        <thead>
          <tr>
            <th>On</th>
            <th>Class</th>
            <th>Field</th>
            <th>Operator</th>
            <th>Threshold</th>
            <th>Action</th>
            <th>Target</th>
            <th>Notes</th>
            <th>Move</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </section>
    <section>
      <h2>Event Log</h2>
      <div class="row">
        <select id="logFilter">
          <option value="">All Categories</option>
          <option value="config">Config</option>
          <option value="fault">Fault</option>
        </select>
        <button id="refreshLogs" class="secondary">Refresh</button>
        <button id="clearLogs" class="secondary">Clear Logs</button>
      </div>
      <div id="logStatus" class="muted">Loading status...</div>
      <div id="logEntries"></div>
    </section>
    <section id="testPageSection" class="full-span hidden">
      <h2>Automation Test Page</h2>
      <div class="row">
        <label><input id="testModeActive" type="checkbox" /> Enable test overrides</label>
        <button id="saveTestState">Apply Test Values</button>
        <button id="clearTestState" class="secondary">Clear Test Values</button>
        <span id="testStatus" class="pill">Disabled</span>
      </div>
      <p class="muted">When enabled at compile time, each sensor can be switched individually between live data and a manual bench value. Manual values feed the same effective sensor path used by local automation.</p>
      <div class="test-grid" id="testGrid"></div>
    </section>
  </main>
  <script>
    const ruleFields = ["high_air_temperature", "low_air_temperature", "high_air_humidity", "low_air_humidity", "intake_air_temperature", "soil_moisture", "flow_rate", "door_state", "window_position", "output_state", "manual_mode", "fault_state"];
    const ruleOperators = ["above", "below", "inside_range", "outside_range", "valid", "invalid", "boolean_match", "hysteresis_state", "cooldown_state"];
    const ruleActions = ["pump_on", "pump_off", "intake_fan_on", "intake_fan_off", "exhaust_fan_on", "exhaust_fan_off", "window_open", "window_close", "window_target", "inhibit_irrigation", "inhibit_ventilation", "log_only"];
    const ruleClasses = ["irrigation", "ventilation", "window", "diagnostic"];
    const testNumericFields = [
      { key: "high_air_temperature", label: "High air temperature", step: "0.1" },
      { key: "high_air_humidity", label: "High air humidity", step: "0.1" },
      { key: "low_air_temperature", label: "Low air temperature", step: "0.1" },
      { key: "low_air_humidity", label: "Low air humidity", step: "0.1" },
      { key: "intake_air_temperature", label: "Intake air temperature", step: "0.1" },
      { key: "soil_moisture_percent", label: "Soil moisture", step: "0.1" },
      { key: "flow_rate_lpm", label: "Flow rate", step: "0.1" }
    ];
    const testBoolFields = [
      { key: "door_state", label: "Door open" }
    ];
    let rules = [];
    let testState = { test_ui_enabled: false, test_mode_active: false, numeric_overrides: {}, bool_overrides: {} };

    function optionList(values, selected) {
      return values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`).join("");
    }

    function renderRules() {
      const tbody = document.querySelector("#rulesTable tbody");
      tbody.innerHTML = "";
      rules.forEach((rule, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="checkbox" ${rule.enabled ? "checked" : ""} data-index="${index}" data-key="enabled" /></td>
          <td><select data-index="${index}" data-key="rule_class">${optionList(ruleClasses, rule.rule_class)}</select></td>
          <td><select data-index="${index}" data-key="field">${optionList(ruleFields, rule.field)}</select></td>
          <td><select data-index="${index}" data-key="op">${optionList(ruleOperators, rule.op)}</select></td>
          <td><input type="number" step="0.1" value="${rule.threshold ?? 0}" data-index="${index}" data-key="threshold" /></td>
          <td><select data-index="${index}" data-key="action">${optionList(ruleActions, rule.action)}</select></td>
          <td><input type="number" step="1" value="${rule.action_target ?? 0}" data-index="${index}" data-key="action_target" /></td>
          <td><textarea data-index="${index}" data-key="notes">${rule.notes ?? ""}</textarea></td>
          <td>
            <button class="secondary" data-move="up" data-index="${index}">↑</button>
            <button class="secondary" data-move="down" data-index="${index}">↓</button>
          </td>
          <td><button class="secondary" data-delete="${index}">Delete</button></td>
        `;
        tbody.appendChild(row);
      });

      tbody.querySelectorAll("input, select, textarea").forEach((el) => {
        el.addEventListener("change", (event) => {
          const target = event.target;
          const index = Number(target.dataset.index);
          const key = target.dataset.key;
          rules[index][key] = target.type === "checkbox" ? target.checked :
            target.type === "number" ? Number(target.value) : target.value;
        });
      });

      tbody.querySelectorAll("[data-delete]").forEach((button) => {
        button.addEventListener("click", () => {
          rules.splice(Number(button.dataset.delete), 1);
          rules.forEach((rule, idx) => rule.order = idx + 1);
          renderRules();
        });
      });

      tbody.querySelectorAll("[data-move]").forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.index);
          const direction = button.dataset.move;
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= rules.length) return;
          [rules[index], rules[targetIndex]] = [rules[targetIndex], rules[index]];
          rules.forEach((rule, idx) => rule.order = idx + 1);
          renderRules();
        });
      });
    }

    function renderTestPage() {
      const section = document.getElementById("testPageSection");
      const grid = document.getElementById("testGrid");
      if (!testState.test_ui_enabled) {
        section.classList.add("hidden");
        return;
      }
      section.classList.remove("hidden");
      document.getElementById("testModeActive").checked = !!testState.test_mode_active;
      document.getElementById("testStatus").textContent = testState.test_mode_active ? "Overrides active" : "Overrides idle";
      grid.innerHTML = "";

      testNumericFields.forEach((field) => {
        const snapshot = (testState.numeric_sensors && testState.numeric_sensors[field.key]) || {};
        const override = testState.numeric_overrides[field.key] || { enabled: false, value: 0 };
        const mode = override.enabled ? "manual" : "live";
        const card = document.createElement("div");
        card.className = "test-card";
        card.innerHTML = `
          <div class="test-header">
            <div>
              <h3>${field.label}</h3>
              <div class="test-meta">
                <span>Effective: ${snapshot.effective_available ? snapshot.effective_value : "unavailable"}</span>
                <span>Live: ${snapshot.live_available ? snapshot.live_value : "unavailable"}</span>
                <span>Manual: ${override.value ?? 0}</span>
              </div>
            </div>
            <span class="source-chip ${mode}">${mode}</span>
          </div>
          <label>Source</label>
          <select data-test-kind="numeric-mode" data-key="${field.key}">
            <option value="live" ${mode === "live" ? "selected" : ""}>live</option>
            <option value="manual" ${mode === "manual" ? "selected" : ""}>manual</option>
          </select>
          <label>Manual test value</label>
          <input type="number" step="${field.step}" data-test-kind="numeric-value" data-key="${field.key}" value="${override.value ?? 0}" />
        `;
        grid.appendChild(card);
      });

      testBoolFields.forEach((field) => {
        const snapshot = (testState.bool_sensors && testState.bool_sensors[field.key]) || {};
        const override = testState.bool_overrides[field.key] || { enabled: false, value: false };
        const mode = override.enabled ? "manual" : "live";
        const card = document.createElement("div");
        card.className = "test-card";
        card.innerHTML = `
          <div class="test-header">
            <div>
              <h3>${field.label}</h3>
              <div class="test-meta">
                <span>Effective: ${snapshot.effective_available ? (snapshot.effective_value ? "true" : "false") : "unavailable"}</span>
                <span>Live: ${snapshot.live_available ? (snapshot.live_value ? "true" : "false") : "unavailable"}</span>
                <span>Manual: ${override.value ? "true" : "false"}</span>
              </div>
            </div>
            <span class="source-chip ${mode}">${mode}</span>
          </div>
          <label>Source</label>
          <select data-test-kind="bool-mode" data-key="${field.key}">
            <option value="live" ${mode === "live" ? "selected" : ""}>live</option>
            <option value="manual" ${mode === "manual" ? "selected" : ""}>manual</option>
          </select>
          <div class="row">
            <label><input type="checkbox" data-test-kind="bool-value" data-key="${field.key}" ${override.value ? "checked" : ""} /> Simulated true</label>
          </div>
        `;
        grid.appendChild(card);
      });

      grid.querySelectorAll("[data-test-kind]").forEach((el) => {
        el.addEventListener("change", (event) => {
          const target = event.target;
          const kind = target.dataset.testKind;
          const key = target.dataset.key;
          if (kind === "numeric-mode") {
            testState.numeric_overrides[key] = testState.numeric_overrides[key] || { enabled: false, value: 0 };
            testState.numeric_overrides[key].enabled = target.value === "manual";
          } else if (kind === "numeric-value") {
            testState.numeric_overrides[key] = testState.numeric_overrides[key] || { enabled: false, value: 0 };
            testState.numeric_overrides[key].value = Number(target.value);
          } else if (kind === "bool-mode") {
            testState.bool_overrides[key] = testState.bool_overrides[key] || { enabled: false, value: false };
            testState.bool_overrides[key].enabled = target.value === "manual";
          } else if (kind === "bool-value") {
            testState.bool_overrides[key] = testState.bool_overrides[key] || { enabled: false, value: false };
            testState.bool_overrides[key].value = target.checked;
          }
        });
      });
    }

    async function loadRules() {
      const response = await fetch("/api/rules");
      const data = await response.json();
      rules = data.rules || [];
      renderRules();
      document.getElementById("ruleStatus").textContent = data.storage_status || "ready";
    }

    async function saveRules() {
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules })
      });
      const data = await response.json();
      document.getElementById("ruleStatus").textContent = data.message || data.storage_status || "saved";
      await loadRules();
      await loadLogs();
    }

    async function loadLogs() {
      const filter = document.getElementById("logFilter").value;
      const response = await fetch(`/api/logs${filter ? `?category=${encodeURIComponent(filter)}` : ""}`);
      const data = await response.json();
      document.getElementById("logStatus").textContent =
        `Entries ${data.entry_count} | Oldest ${data.oldest_retained_timestamp} | Newest ${data.newest_retained_timestamp} | Status ${data.storage_status}`;
      const container = document.getElementById("logEntries");
      container.innerHTML = "";
      (data.entries || []).forEach((entry) => {
        const item = document.createElement("div");
        item.className = "log-entry";
        item.innerHTML = `
          <div class="log-meta">
            <span>${entry.timestamp_text}</span>
            <span>${entry.category}</span>
            <span>${entry.level}</span>
            <span>${entry.source}</span>
          </div>
          <div>${entry.message}</div>
        `;
        container.appendChild(item);
      });
    }

    async function loadTestState() {
      const response = await fetch("/api/test-state");
      const data = await response.json();
      testState = data;
      renderTestPage();
    }

    async function saveTestState() {
      testState.test_mode_active = document.getElementById("testModeActive").checked;
      const response = await fetch("/api/test-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testState)
      });
      const data = await response.json();
      document.getElementById("testStatus").textContent = data.message || (testState.test_mode_active ? "Overrides active" : "Overrides idle");
      await loadTestState();
    }

    document.getElementById("addRule").addEventListener("click", () => {
      rules.push({
        id: `rule_${Date.now()}`,
        enabled: true,
        order: rules.length + 1,
        rule_class: "ventilation",
        field: "high_air_temperature",
        op: "above",
        action: "window_target",
        threshold: 30,
        action_target: 100,
        notes: ""
      });
      renderRules();
    });
    document.getElementById("saveRules").addEventListener("click", saveRules);
    document.getElementById("refreshLogs").addEventListener("click", loadLogs);
    document.getElementById("logFilter").addEventListener("change", loadLogs);
    document.getElementById("saveTestState").addEventListener("click", saveTestState);
    document.getElementById("clearTestState").addEventListener("click", async () => {
      await fetch("/api/test-state/clear", { method: "POST" });
      await loadTestState();
    });
    document.getElementById("clearLogs").addEventListener("click", async () => {
      await fetch("/api/logs/clear", { method: "POST" });
      await loadLogs();
    });

    loadRules();
    loadLogs();
    loadTestState();
    setInterval(loadLogs, 15000);
    setInterval(loadTestState, 5000);
  </script>
</body>
</html>
)HTML";

void GreenhouseRuntime::setup() {
  this->last_flush_ms_ = millis();
  this->load_rules_();
  this->load_logs_();
  this->prune_logs_(true);
  this->start_http_server_();
  this->save_logs_();
  ESP_LOGI(TAG, "Greenhouse runtime ready with %u rules and %u retained log entries", static_cast<unsigned>(this->rules_.size()),
           static_cast<unsigned>(this->logs_.size()));
}

void GreenhouseRuntime::loop() {
  const uint32_t now = millis();
  if (this->logs_dirty_ && now - this->last_flush_ms_ >= this->flush_interval_ms_) {
    this->save_logs_();
  }
  if (this->rules_dirty_) {
    this->save_rules_();
  }
}

float GreenhouseRuntime::get_setup_priority() const { return setup_priority::AFTER_WIFI; }

void GreenhouseRuntime::set_web_port(uint16_t web_port) { this->web_port_ = web_port; }
void GreenhouseRuntime::set_max_rules(size_t max_rules) { this->max_rules_ = max_rules; }
void GreenhouseRuntime::set_max_log_entries(size_t max_log_entries) { this->max_log_entries_ = max_log_entries; }
void GreenhouseRuntime::set_retention_days(uint8_t retention_days) { this->retention_days_ = retention_days; }
void GreenhouseRuntime::set_max_log_json_bytes(size_t max_log_json_bytes) { this->max_log_json_bytes_ = max_log_json_bytes; }
void GreenhouseRuntime::set_flush_interval_seconds(uint32_t flush_interval_seconds) {
  this->flush_interval_ms_ = flush_interval_seconds * 1000UL;
}
void GreenhouseRuntime::set_namespace_name(const std::string &namespace_name) {
  this->namespace_name_ = namespace_name.substr(0, 15);
  if (this->namespace_name_.empty()) {
    this->namespace_name_ = "gh_runtime";
  }
}
void GreenhouseRuntime::set_test_ui_enabled(bool test_ui_enabled) { this->test_ui_enabled_ = test_ui_enabled; }
void GreenhouseRuntime::set_live_numeric_sensor(const std::string &key, sensor::Sensor *sensor) {
  this->live_numeric_sensors_[key] = sensor;
}
void GreenhouseRuntime::set_effective_numeric_sensor(const std::string &key, sensor::Sensor *sensor) {
  this->effective_numeric_sensors_[key] = sensor;
}
void GreenhouseRuntime::set_live_binary_sensor(const std::string &key, binary_sensor::BinarySensor *sensor) {
  this->live_binary_sensors_[key] = sensor;
}
void GreenhouseRuntime::set_effective_binary_sensor(const std::string &key, binary_sensor::BinarySensor *sensor) {
  this->effective_binary_sensors_[key] = sensor;
}

bool GreenhouseRuntime::is_test_ui_enabled() const { return this->test_ui_enabled_; }
bool GreenhouseRuntime::is_test_mode_active() const { return this->test_ui_enabled_ && this->test_mode_active_; }
void GreenhouseRuntime::set_test_mode_active(bool active) { this->test_mode_active_ = this->test_ui_enabled_ && active; }

bool GreenhouseRuntime::has_numeric_test_override(const std::string &key) const {
  if (!this->is_test_mode_active()) {
    return false;
  }
  const auto it = this->numeric_test_overrides_.find(key);
  return it != this->numeric_test_overrides_.end() && it->second.enabled;
}

float GreenhouseRuntime::get_numeric_test_override(const std::string &key, float fallback_value) const {
  const auto it = this->numeric_test_overrides_.find(key);
  if (!this->is_test_mode_active() || it == this->numeric_test_overrides_.end() || !it->second.enabled) {
    return fallback_value;
  }
  return it->second.value;
}

void GreenhouseRuntime::set_numeric_test_override(const std::string &key, bool enabled, float value) {
  this->numeric_test_overrides_[key] = {enabled, value};
}

bool GreenhouseRuntime::has_bool_test_override(const std::string &key) const {
  if (!this->is_test_mode_active()) {
    return false;
  }
  const auto it = this->bool_test_overrides_.find(key);
  return it != this->bool_test_overrides_.end() && it->second.enabled;
}

bool GreenhouseRuntime::get_bool_test_override(const std::string &key, bool fallback_value) const {
  const auto it = this->bool_test_overrides_.find(key);
  if (!this->is_test_mode_active() || it == this->bool_test_overrides_.end() || !it->second.enabled) {
    return fallback_value;
  }
  return it->second.value;
}

void GreenhouseRuntime::set_bool_test_override(const std::string &key, bool enabled, bool value) {
  this->bool_test_overrides_[key] = {enabled, value};
}

void GreenhouseRuntime::clear_test_overrides() {
  this->test_mode_active_ = false;
  this->numeric_test_overrides_.clear();
  this->bool_test_overrides_.clear();
}

bool GreenhouseRuntime::log_event(const std::string &category, const std::string &level, const std::string &message,
                                  const std::string &source) {
  if (message.empty()) {
    return false;
  }
  this->append_log_internal_({this->current_timestamp_(), category, level, source, message}, false);
  return true;
}

size_t GreenhouseRuntime::get_log_entry_count() const { return this->logs_.size(); }
size_t GreenhouseRuntime::get_log_rollover_count() const { return this->rollover_count_; }
bool GreenhouseRuntime::is_pruning_active() const { return this->pruning_active_; }
bool GreenhouseRuntime::is_logging_faulted() const { return this->logging_faulted_; }
std::string GreenhouseRuntime::get_log_storage_status() const {
  if (this->logging_faulted_) {
    return "logging_faulted";
  }
  if (this->pruning_active_) {
    return "pruning_active";
  }
  return "logging_enabled";
}
std::string GreenhouseRuntime::get_oldest_retained_timestamp_text() const {
  if (this->logs_.empty()) {
    return "n/a";
  }
  return this->format_timestamp_(this->logs_.front().timestamp);
}
std::string GreenhouseRuntime::get_newest_retained_timestamp_text() const {
  if (this->logs_.empty()) {
    return "n/a";
  }
  return this->format_timestamp_(this->logs_.back().timestamp);
}
std::string GreenhouseRuntime::get_last_prune_result() const { return this->last_prune_result_; }
std::string GreenhouseRuntime::get_rules_storage_status() const { return this->rules_storage_status_; }

bool GreenhouseRuntime::load_rules_() {
  std::string raw;
  if (!this->load_string_(NVS_KEY_RULES, raw) || raw.empty()) {
    this->rules_storage_status_ = "using_default_rules";
    this->rules_.clear();
    this->rules_.push_back({"rule_boot_vent_open", true, 1, "ventilation", "high_air_temperature", "above",
                            "window_target", 30.0f, 0.0f, false, 100, "Default warm-weather ventilation rule"});
    this->rules_.push_back({"rule_boot_irrigation", true, 2, "irrigation", "soil_moisture", "below",
                            "pump_on", 35.0f, 0.0f, false, 0, "Default soil moisture irrigation rule"});
    this->rules_dirty_ = true;
    return true;
  }
  if (!this->parse_rules_json_(raw)) {
    this->rules_storage_status_ = "invalid_rule_table_fallback";
    this->rules_.clear();
    this->rules_dirty_ = true;
    return false;
  }
  this->rules_storage_status_ = "rules_loaded";
  return true;
}

bool GreenhouseRuntime::load_logs_() {
  std::string raw;
  if (!this->load_string_(NVS_KEY_LOGS, raw) || raw.empty()) {
    this->logs_.clear();
    this->last_prune_result_ = "no_persisted_log";
    return true;
  }
  if (!this->parse_logs_json_(raw)) {
    this->logging_faulted_ = true;
    this->last_prune_result_ = "log_load_failed";
    this->logs_.clear();
    return false;
  }

  nvs_handle_t handle;
  if (nvs_open(this->namespace_name_.c_str(), NVS_READONLY, &handle) == ESP_OK) {
    uint32_t rollover = 0;
    nvs_get_u32(handle, NVS_KEY_ROLLOVER, &rollover);
    this->rollover_count_ = rollover;
    nvs_close(handle);
  }
  return true;
}

bool GreenhouseRuntime::save_rules_() {
  const bool ok = this->save_string_(NVS_KEY_RULES, this->serialize_rules_json_());
  this->rules_dirty_ = !ok;
  this->rules_storage_status_ = ok ? "rules_saved" : "rules_save_failed";
  return ok;
}

bool GreenhouseRuntime::save_logs_() {
  this->prune_logs_(true);
  const bool ok = this->save_string_(NVS_KEY_LOGS, this->serialize_logs_json_());
  nvs_handle_t handle;
  if (nvs_open(this->namespace_name_.c_str(), NVS_READWRITE, &handle) == ESP_OK) {
    nvs_set_u32(handle, NVS_KEY_ROLLOVER, this->rollover_count_);
    nvs_commit(handle);
    nvs_close(handle);
  }
  this->logs_dirty_ = !ok;
  this->last_flush_ms_ = millis();
  this->logging_faulted_ = !ok;
  return ok;
}

bool GreenhouseRuntime::save_string_(const char *key, const std::string &value) {
  nvs_handle_t handle;
  esp_err_t err = nvs_open(this->namespace_name_.c_str(), NVS_READWRITE, &handle);
  if (err != ESP_OK) {
    ESP_LOGE(TAG, "NVS open failed for %s: %s", key, esp_err_to_name(err));
    return false;
  }
  err = nvs_set_str(handle, key, value.c_str());
  if (err == ESP_OK) {
    err = nvs_commit(handle);
  }
  nvs_close(handle);
  if (err != ESP_OK) {
    ESP_LOGE(TAG, "NVS save failed for %s: %s", key, esp_err_to_name(err));
    return false;
  }
  return true;
}

bool GreenhouseRuntime::load_string_(const char *key, std::string &value) {
  nvs_handle_t handle;
  esp_err_t err = nvs_open(this->namespace_name_.c_str(), NVS_READONLY, &handle);
  if (err != ESP_OK) {
    return false;
  }
  size_t required_size = 0;
  err = nvs_get_str(handle, key, nullptr, &required_size);
  if (err != ESP_OK || required_size == 0) {
    nvs_close(handle);
    return false;
  }
  std::string buffer(required_size, '\0');
  err = nvs_get_str(handle, key, &buffer[0], &required_size);
  nvs_close(handle);
  if (err != ESP_OK) {
    return false;
  }
  value.assign(buffer.c_str());
  return true;
}

bool GreenhouseRuntime::parse_rules_json_(const std::string &json) {
  cJSON *root = cJSON_Parse(json.c_str());
  if (root == nullptr || !cJSON_IsArray(root)) {
    if (root != nullptr) {
      cJSON_Delete(root);
    }
    return false;
  }
  std::vector<RuntimeRuleRow> parsed;
  cJSON *item = nullptr;
  cJSON_ArrayForEach(item, root) {
    if (!cJSON_IsObject(item)) {
      continue;
    }
    RuntimeRuleRow row;
    cJSON *value = nullptr;
    if ((value = cJSON_GetObjectItem(item, "id")) != nullptr && cJSON_IsString(value)) row.id = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "enabled")) != nullptr && cJSON_IsBool(value)) row.enabled = cJSON_IsTrue(value);
    if ((value = cJSON_GetObjectItem(item, "order")) != nullptr && cJSON_IsNumber(value)) row.order = value->valueint;
    if ((value = cJSON_GetObjectItem(item, "rule_class")) != nullptr && cJSON_IsString(value)) row.rule_class = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "field")) != nullptr && cJSON_IsString(value)) row.field = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "op")) != nullptr && cJSON_IsString(value)) row.op = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "action")) != nullptr && cJSON_IsString(value)) row.action = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "threshold")) != nullptr && cJSON_IsNumber(value)) row.threshold = value->valuedouble;
    if ((value = cJSON_GetObjectItem(item, "threshold_high")) != nullptr && cJSON_IsNumber(value))
      row.threshold_high = value->valuedouble;
    if ((value = cJSON_GetObjectItem(item, "bool_state")) != nullptr && cJSON_IsBool(value))
      row.bool_state = cJSON_IsTrue(value);
    if ((value = cJSON_GetObjectItem(item, "action_target")) != nullptr && cJSON_IsNumber(value))
      row.action_target = value->valueint;
    if ((value = cJSON_GetObjectItem(item, "notes")) != nullptr && cJSON_IsString(value)) row.notes = value->valuestring;
    parsed.push_back(row);
  }
  cJSON_Delete(root);
  if (parsed.size() > this->max_rules_) {
    return false;
  }
  this->rules_ = std::move(parsed);
  return true;
}

bool GreenhouseRuntime::parse_logs_json_(const std::string &json) {
  cJSON *root = cJSON_Parse(json.c_str());
  if (root == nullptr || !cJSON_IsArray(root)) {
    if (root != nullptr) {
      cJSON_Delete(root);
    }
    return false;
  }
  std::deque<RuntimeLogEntry> parsed;
  cJSON *item = nullptr;
  cJSON_ArrayForEach(item, root) {
    if (!cJSON_IsObject(item)) {
      continue;
    }
    RuntimeLogEntry entry;
    cJSON *value = nullptr;
    if ((value = cJSON_GetObjectItem(item, "timestamp")) != nullptr && cJSON_IsNumber(value)) entry.timestamp = value->valueint;
    if ((value = cJSON_GetObjectItem(item, "category")) != nullptr && cJSON_IsString(value)) entry.category = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "level")) != nullptr && cJSON_IsString(value)) entry.level = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "source")) != nullptr && cJSON_IsString(value)) entry.source = value->valuestring;
    if ((value = cJSON_GetObjectItem(item, "message")) != nullptr && cJSON_IsString(value)) entry.message = value->valuestring;
    parsed.push_back(entry);
  }
  cJSON_Delete(root);
  this->logs_ = std::move(parsed);
  return true;
}

std::string GreenhouseRuntime::serialize_rules_json_() const {
  cJSON *root = cJSON_CreateArray();
  for (const auto &rule : this->rules_) {
    cJSON *item = cJSON_CreateObject();
    cJSON_AddStringToObject(item, "id", rule.id.c_str());
    cJSON_AddBoolToObject(item, "enabled", rule.enabled);
    cJSON_AddNumberToObject(item, "order", rule.order);
    cJSON_AddStringToObject(item, "rule_class", rule.rule_class.c_str());
    cJSON_AddStringToObject(item, "field", rule.field.c_str());
    cJSON_AddStringToObject(item, "op", rule.op.c_str());
    cJSON_AddStringToObject(item, "action", rule.action.c_str());
    cJSON_AddNumberToObject(item, "threshold", rule.threshold);
    cJSON_AddNumberToObject(item, "threshold_high", rule.threshold_high);
    cJSON_AddBoolToObject(item, "bool_state", rule.bool_state);
    cJSON_AddNumberToObject(item, "action_target", rule.action_target);
    cJSON_AddStringToObject(item, "notes", rule.notes.c_str());
    cJSON_AddItemToArray(root, item);
  }
  char *rendered = cJSON_PrintUnformatted(root);
  std::string output = rendered != nullptr ? rendered : "[]";
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
  return output;
}

std::string GreenhouseRuntime::serialize_logs_json_() const {
  cJSON *root = cJSON_CreateArray();
  for (const auto &entry : this->logs_) {
    cJSON *item = cJSON_CreateObject();
    cJSON_AddNumberToObject(item, "timestamp", entry.timestamp);
    cJSON_AddStringToObject(item, "category", entry.category.c_str());
    cJSON_AddStringToObject(item, "level", entry.level.c_str());
    cJSON_AddStringToObject(item, "source", entry.source.c_str());
    cJSON_AddStringToObject(item, "message", entry.message.c_str());
    cJSON_AddItemToArray(root, item);
  }
  char *rendered = cJSON_PrintUnformatted(root);
  std::string output = rendered != nullptr ? rendered : "[]";
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
  return output;
}

bool GreenhouseRuntime::validate_rules_json_(const std::string &json, std::string &error_message) {
  cJSON *root = cJSON_Parse(json.c_str());
  if (root == nullptr || !cJSON_IsObject(root)) {
    error_message = "request body must be a JSON object";
    if (root != nullptr) {
      cJSON_Delete(root);
    }
    return false;
  }
  cJSON *rules = cJSON_GetObjectItem(root, "rules");
  if (rules == nullptr || !cJSON_IsArray(rules)) {
    error_message = "rules array is required";
    cJSON_Delete(root);
    return false;
  }
  if (cJSON_GetArraySize(rules) > static_cast<int>(this->max_rules_)) {
    error_message = "rule count exceeds configured maximum";
    cJSON_Delete(root);
    return false;
  }
  cJSON *item = nullptr;
  int index = 0;
  cJSON_ArrayForEach(item, rules) {
    if (!cJSON_IsObject(item)) {
      error_message = "each rule must be an object";
      cJSON_Delete(root);
      return false;
    }
    const cJSON *rule_class = cJSON_GetObjectItem(item, "rule_class");
    const cJSON *field = cJSON_GetObjectItem(item, "field");
    const cJSON *op = cJSON_GetObjectItem(item, "op");
    const cJSON *action = cJSON_GetObjectItem(item, "action");
    if (!cJSON_IsString(rule_class) || !cJSON_IsString(field) || !cJSON_IsString(op) || !cJSON_IsString(action)) {
      error_message = "rule " + std::to_string(index + 1) + " is missing required fields";
      cJSON_Delete(root);
      return false;
    }
    ++index;
  }
  cJSON_Delete(root);
  return true;
}

bool GreenhouseRuntime::apply_rules_json_(const std::string &json, const std::string &source) {
  std::string error;
  if (!this->validate_rules_json_(json, error)) {
    return false;
  }

  cJSON *root = cJSON_Parse(json.c_str());
  cJSON *rules = cJSON_GetObjectItem(root, "rules");
  cJSON *array_only = cJSON_Duplicate(rules, true);
  char *rules_json = cJSON_PrintUnformatted(array_only);
  const std::string rendered = rules_json != nullptr ? rules_json : "[]";
  if (rules_json != nullptr) {
    cJSON_free(rules_json);
  }
  cJSON_Delete(array_only);
  cJSON_Delete(root);

  if (!this->parse_rules_json_(rendered)) {
    return false;
  }

  std::sort(this->rules_.begin(), this->rules_.end(),
            [](const RuntimeRuleRow &lhs, const RuntimeRuleRow &rhs) { return lhs.order < rhs.order; });
  this->rules_dirty_ = true;
  this->save_rules_();
  this->append_log_internal_({this->current_timestamp_(), "config", "info", source, "rule table updated and persisted"}, true);
  return true;
}

void GreenhouseRuntime::append_log_internal_(const RuntimeLogEntry &entry, bool persist_now) {
  this->logs_.push_back(entry);
  this->prune_logs_(true);
  this->logs_dirty_ = true;
  if (persist_now) {
    this->save_logs_();
  }
}

void GreenhouseRuntime::prune_logs_(bool force_bytes_check) {
  this->pruning_active_ = false;
  const uint32_t now = this->current_timestamp_();
  const uint32_t retention_seconds = static_cast<uint32_t>(this->retention_days_) * 86400UL;

  while (!this->logs_.empty() && now > 0 && this->logs_.front().timestamp > 0 &&
         now - this->logs_.front().timestamp > retention_seconds) {
    this->logs_.pop_front();
    this->rollover_count_++;
    this->pruning_active_ = true;
    this->last_prune_result_ = "retention_pruned_oldest_entries";
  }

  while (this->logs_.size() > this->max_log_entries_) {
    this->logs_.pop_front();
    this->rollover_count_++;
    this->pruning_active_ = true;
    this->last_prune_result_ = "entry_cap_pruned_oldest_entries";
  }

  if (force_bytes_check) {
    std::string rendered = this->serialize_logs_json_();
    while (!this->logs_.empty() && rendered.size() > this->max_log_json_bytes_) {
      this->logs_.pop_front();
      this->rollover_count_++;
      this->pruning_active_ = true;
      this->last_prune_result_ = "byte_cap_pruned_oldest_entries";
      rendered = this->serialize_logs_json_();
    }
  }

  if (!this->pruning_active_ && this->last_prune_result_ == "never_pruned" && !this->logs_.empty()) {
    this->last_prune_result_ = "within_storage_budget";
  }
}

uint32_t GreenhouseRuntime::current_timestamp_() const {
  const time_t now = ::time(nullptr);
  if (now < 1700000000) {
    return 0;
  }
  return static_cast<uint32_t>(now);
}

std::string GreenhouseRuntime::format_timestamp_(uint32_t timestamp) const {
  if (timestamp == 0) {
    return "pending_time_sync";
  }
  char buffer[32];
  const time_t as_time = static_cast<time_t>(timestamp);
  struct tm timeinfo {};
  gmtime_r(&as_time, &timeinfo);
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S UTC", &timeinfo);
  return buffer;
}

bool GreenhouseRuntime::start_http_server_() {
  if (this->http_server_ != nullptr) {
    return true;
  }
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = this->web_port_;
  config.ctrl_port = static_cast<uint16_t>(this->web_port_ + 1);
  config.max_uri_handlers = 12;
  esp_err_t err = httpd_start(&this->http_server_, &config);
  if (err != ESP_OK) {
    ESP_LOGE(TAG, "HTTP server start failed: %s", esp_err_to_name(err));
    return false;
  }

  httpd_uri_t index_uri = {};
  index_uri.uri = "/";
  index_uri.method = HTTP_GET;
  index_uri.handler = &GreenhouseRuntime::handle_index_;
  index_uri.user_ctx = this;

  httpd_uri_t status_uri = {};
  status_uri.uri = "/api/status";
  status_uri.method = HTTP_GET;
  status_uri.handler = &GreenhouseRuntime::handle_status_;
  status_uri.user_ctx = this;

  httpd_uri_t rules_get_uri = {};
  rules_get_uri.uri = "/api/rules";
  rules_get_uri.method = HTTP_GET;
  rules_get_uri.handler = &GreenhouseRuntime::handle_get_rules_;
  rules_get_uri.user_ctx = this;

  httpd_uri_t rules_post_uri = {};
  rules_post_uri.uri = "/api/rules";
  rules_post_uri.method = HTTP_POST;
  rules_post_uri.handler = &GreenhouseRuntime::handle_post_rules_;
  rules_post_uri.user_ctx = this;

  httpd_uri_t logs_get_uri = {};
  logs_get_uri.uri = "/api/logs";
  logs_get_uri.method = HTTP_GET;
  logs_get_uri.handler = &GreenhouseRuntime::handle_get_logs_;
  logs_get_uri.user_ctx = this;

  httpd_uri_t log_post_uri = {};
  log_post_uri.uri = "/api/logs";
  log_post_uri.method = HTTP_POST;
  log_post_uri.handler = &GreenhouseRuntime::handle_post_log_event_;
  log_post_uri.user_ctx = this;

  httpd_uri_t logs_clear_uri = {};
  logs_clear_uri.uri = "/api/logs/clear";
  logs_clear_uri.method = HTTP_POST;
  logs_clear_uri.handler = &GreenhouseRuntime::handle_clear_logs_;
  logs_clear_uri.user_ctx = this;

  httpd_uri_t test_state_get_uri = {};
  test_state_get_uri.uri = "/api/test-state";
  test_state_get_uri.method = HTTP_GET;
  test_state_get_uri.handler = &GreenhouseRuntime::handle_get_test_state_;
  test_state_get_uri.user_ctx = this;

  httpd_uri_t test_state_post_uri = {};
  test_state_post_uri.uri = "/api/test-state";
  test_state_post_uri.method = HTTP_POST;
  test_state_post_uri.handler = &GreenhouseRuntime::handle_post_test_state_;
  test_state_post_uri.user_ctx = this;

  httpd_uri_t test_state_clear_uri = {};
  test_state_clear_uri.uri = "/api/test-state/clear";
  test_state_clear_uri.method = HTTP_POST;
  test_state_clear_uri.handler = &GreenhouseRuntime::handle_clear_test_state_;
  test_state_clear_uri.user_ctx = this;

  httpd_register_uri_handler(this->http_server_, &index_uri);
  httpd_register_uri_handler(this->http_server_, &status_uri);
  httpd_register_uri_handler(this->http_server_, &rules_get_uri);
  httpd_register_uri_handler(this->http_server_, &rules_post_uri);
  httpd_register_uri_handler(this->http_server_, &logs_get_uri);
  httpd_register_uri_handler(this->http_server_, &log_post_uri);
  httpd_register_uri_handler(this->http_server_, &logs_clear_uri);
  httpd_register_uri_handler(this->http_server_, &test_state_get_uri);
  httpd_register_uri_handler(this->http_server_, &test_state_post_uri);
  httpd_register_uri_handler(this->http_server_, &test_state_clear_uri);
  return true;
}

void GreenhouseRuntime::stop_http_server_() {
  if (this->http_server_ != nullptr) {
    httpd_stop(this->http_server_);
    this->http_server_ = nullptr;
  }
}

std::string GreenhouseRuntime::build_index_html_() const { return INDEX_HTML; }

std::string GreenhouseRuntime::build_status_json_() const {
  cJSON *root = cJSON_CreateObject();
  cJSON_AddStringToObject(root, "rules_storage_status", this->rules_storage_status_.c_str());
  cJSON_AddStringToObject(root, "log_storage_status", this->get_log_storage_status().c_str());
  cJSON_AddNumberToObject(root, "rule_count", this->rules_.size());
  cJSON_AddNumberToObject(root, "log_entry_count", this->logs_.size());
  cJSON_AddNumberToObject(root, "rollover_count", this->rollover_count_);
  cJSON_AddStringToObject(root, "oldest_retained_timestamp", this->get_oldest_retained_timestamp_text().c_str());
  cJSON_AddStringToObject(root, "newest_retained_timestamp", this->get_newest_retained_timestamp_text().c_str());
  cJSON_AddStringToObject(root, "last_prune_result", this->last_prune_result_.c_str());
  cJSON_AddBoolToObject(root, "test_ui_enabled", this->test_ui_enabled_);
  cJSON_AddBoolToObject(root, "test_mode_active", this->is_test_mode_active());
  char *rendered = cJSON_PrintUnformatted(root);
  std::string output = rendered != nullptr ? rendered : "{}";
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
  return output;
}

std::string GreenhouseRuntime::build_test_state_json_() const {
  cJSON *root = cJSON_CreateObject();
  cJSON_AddBoolToObject(root, "test_ui_enabled", this->test_ui_enabled_);
  cJSON_AddBoolToObject(root, "test_mode_active", this->is_test_mode_active());

  cJSON *numeric = cJSON_CreateObject();
  for (const auto &pair : this->numeric_test_overrides_) {
    cJSON *entry = cJSON_CreateObject();
    cJSON_AddBoolToObject(entry, "enabled", pair.second.enabled);
    cJSON_AddNumberToObject(entry, "value", pair.second.value);
    cJSON_AddItemToObject(numeric, pair.first.c_str(), entry);
  }
  cJSON_AddItemToObject(root, "numeric_overrides", numeric);

  cJSON *bools = cJSON_CreateObject();
  for (const auto &pair : this->bool_test_overrides_) {
    cJSON *entry = cJSON_CreateObject();
    cJSON_AddBoolToObject(entry, "enabled", pair.second.enabled);
    cJSON_AddBoolToObject(entry, "value", pair.second.value);
    cJSON_AddItemToObject(bools, pair.first.c_str(), entry);
  }
  cJSON_AddItemToObject(root, "bool_overrides", bools);

  cJSON *numeric_sensors = cJSON_CreateObject();
  for (const auto &pair : this->effective_numeric_sensors_) {
    const std::string &key = pair.first;
    sensor::Sensor *effective_sensor = pair.second;
    sensor::Sensor *live_sensor = nullptr;
    auto live_it = this->live_numeric_sensors_.find(key);
    if (live_it != this->live_numeric_sensors_.end()) {
      live_sensor = live_it->second;
    }
    auto override_it = this->numeric_test_overrides_.find(key);
    const bool override_enabled = this->is_test_mode_active() &&
      override_it != this->numeric_test_overrides_.end() &&
      override_it->second.enabled;
    const bool live_available = live_sensor != nullptr && live_sensor->has_state();
    const bool effective_available = override_enabled || (effective_sensor != nullptr && effective_sensor->has_state()) || live_available;
    const float manual_value = override_it != this->numeric_test_overrides_.end()
      ? override_it->second.value
      : (live_available ? live_sensor->state : 0.0f);
    const float live_value = live_available ? live_sensor->state : 0.0f;
    float effective_value = manual_value;
    if (!override_enabled) {
      if (effective_sensor != nullptr && effective_sensor->has_state()) {
        effective_value = effective_sensor->state;
      } else if (live_available) {
        effective_value = live_value;
      }
    }

    cJSON *entry = cJSON_CreateObject();
    cJSON_AddBoolToObject(entry, "override_enabled", override_enabled);
    cJSON_AddStringToObject(entry, "source", override_enabled ? "manual" : "live");
    cJSON_AddBoolToObject(entry, "live_available", live_available);
    cJSON_AddBoolToObject(entry, "effective_available", effective_available);
    cJSON_AddNumberToObject(entry, "live_value", live_value);
    cJSON_AddNumberToObject(entry, "manual_value", manual_value);
    cJSON_AddNumberToObject(entry, "effective_value", effective_value);
    cJSON_AddItemToObject(numeric_sensors, key.c_str(), entry);
  }
  cJSON_AddItemToObject(root, "numeric_sensors", numeric_sensors);

  cJSON *bool_sensors = cJSON_CreateObject();
  for (const auto &pair : this->effective_binary_sensors_) {
    const std::string &key = pair.first;
    binary_sensor::BinarySensor *effective_sensor = pair.second;
    binary_sensor::BinarySensor *live_sensor = nullptr;
    auto live_it = this->live_binary_sensors_.find(key);
    if (live_it != this->live_binary_sensors_.end()) {
      live_sensor = live_it->second;
    }
    auto override_it = this->bool_test_overrides_.find(key);
    const bool override_enabled = this->is_test_mode_active() &&
      override_it != this->bool_test_overrides_.end() &&
      override_it->second.enabled;
    const bool live_available = live_sensor != nullptr && live_sensor->has_state();
    const bool effective_available = override_enabled || (effective_sensor != nullptr && effective_sensor->has_state()) || live_available;
    const bool manual_value = override_it != this->bool_test_overrides_.end()
      ? override_it->second.value
      : (live_available ? live_sensor->state : false);
    const bool live_value = live_available ? live_sensor->state : false;
    bool effective_value = manual_value;
    if (!override_enabled) {
      if (effective_sensor != nullptr && effective_sensor->has_state()) {
        effective_value = effective_sensor->state;
      } else if (live_available) {
        effective_value = live_value;
      }
    }

    cJSON *entry = cJSON_CreateObject();
    cJSON_AddBoolToObject(entry, "override_enabled", override_enabled);
    cJSON_AddStringToObject(entry, "source", override_enabled ? "manual" : "live");
    cJSON_AddBoolToObject(entry, "live_available", live_available);
    cJSON_AddBoolToObject(entry, "effective_available", effective_available);
    cJSON_AddBoolToObject(entry, "live_value", live_value);
    cJSON_AddBoolToObject(entry, "manual_value", manual_value);
    cJSON_AddBoolToObject(entry, "effective_value", effective_value);
    cJSON_AddItemToObject(bool_sensors, key.c_str(), entry);
  }
  cJSON_AddItemToObject(root, "bool_sensors", bool_sensors);

  char *rendered = cJSON_PrintUnformatted(root);
  std::string output = rendered != nullptr ? rendered : "{}";
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
  return output;
}

bool GreenhouseRuntime::apply_test_state_json_(const std::string &json, std::string &error_message) {
  if (!this->test_ui_enabled_) {
    error_message = "test page not enabled in this build";
    return false;
  }

  cJSON *root = cJSON_Parse(json.c_str());
  if (root == nullptr || !cJSON_IsObject(root)) {
    if (root != nullptr) {
      cJSON_Delete(root);
    }
    error_message = "request body must be a JSON object";
    return false;
  }

  const cJSON *mode = cJSON_GetObjectItem(root, "test_mode_active");
  if (mode != nullptr && !cJSON_IsBool(mode)) {
    error_message = "test_mode_active must be a boolean";
    cJSON_Delete(root);
    return false;
  }

  std::map<std::string, NumericTestOverride> numeric;
  std::map<std::string, BoolTestOverride> bools;

  const cJSON *numeric_root = cJSON_GetObjectItem(root, "numeric_overrides");
  if (numeric_root != nullptr && cJSON_IsObject(numeric_root)) {
    cJSON *entry = nullptr;
    cJSON_ArrayForEach(entry, numeric_root) {
      if (!cJSON_IsObject(entry)) {
        continue;
      }
      NumericTestOverride override_value;
      const cJSON *enabled = cJSON_GetObjectItem(entry, "enabled");
      const cJSON *value = cJSON_GetObjectItem(entry, "value");
      if (enabled != nullptr && cJSON_IsBool(enabled)) {
        override_value.enabled = cJSON_IsTrue(enabled);
      }
      if (value != nullptr && cJSON_IsNumber(value)) {
        override_value.value = value->valuedouble;
      }
      numeric[entry->string] = override_value;
    }
  }

  const cJSON *bool_root = cJSON_GetObjectItem(root, "bool_overrides");
  if (bool_root != nullptr && cJSON_IsObject(bool_root)) {
    cJSON *entry = nullptr;
    cJSON_ArrayForEach(entry, bool_root) {
      if (!cJSON_IsObject(entry)) {
        continue;
      }
      BoolTestOverride override_value;
      const cJSON *enabled = cJSON_GetObjectItem(entry, "enabled");
      const cJSON *value = cJSON_GetObjectItem(entry, "value");
      if (enabled != nullptr && cJSON_IsBool(enabled)) {
        override_value.enabled = cJSON_IsTrue(enabled);
      }
      if (value != nullptr && cJSON_IsBool(value)) {
        override_value.value = cJSON_IsTrue(value);
      }
      bools[entry->string] = override_value;
    }
  }

  this->numeric_test_overrides_ = std::move(numeric);
  this->bool_test_overrides_ = std::move(bools);
  this->set_test_mode_active(mode != nullptr && cJSON_IsTrue(mode));
  cJSON_Delete(root);
  return true;
}

esp_err_t GreenhouseRuntime::handle_index_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  httpd_resp_set_type(req, "text/html");
  const std::string body = runtime->build_index_html_();
  return httpd_resp_send(req, body.c_str(), body.size());
}

esp_err_t GreenhouseRuntime::handle_status_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  runtime->write_json_response_(req, runtime->build_status_json_());
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_get_rules_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  cJSON *root = cJSON_CreateObject();
  cJSON_AddStringToObject(root, "storage_status", runtime->get_rules_storage_status().c_str());
  cJSON *rules = cJSON_Parse(runtime->serialize_rules_json_().c_str());
  cJSON_AddItemToObject(root, "rules", rules != nullptr ? rules : cJSON_CreateArray());
  char *rendered = cJSON_PrintUnformatted(root);
  runtime->write_json_response_(req, rendered != nullptr ? rendered : "{}");
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_post_rules_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  const std::string body = runtime->read_request_body_(req);
  if (body.empty()) {
    runtime->write_error_response_(req, 400, "request body required");
    return ESP_OK;
  }
  if (!runtime->apply_rules_json_(body, "local_web")) {
    runtime->write_error_response_(req, 400, "rule table validation failed");
    return ESP_OK;
  }
  runtime->write_json_response_(req, "{\"message\":\"rules_saved\",\"storage_status\":\"rules_saved\"}");
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_get_logs_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  char query[64] = {0};
  char category[24] = {0};
  if (httpd_req_get_url_query_len(req) > 0) {
    httpd_req_get_url_query_str(req, query, sizeof(query));
    httpd_query_key_value(query, "category", category, sizeof(category));
  }

  cJSON *root = cJSON_CreateObject();
  cJSON *entries = cJSON_CreateArray();
  for (auto it = runtime->logs_.rbegin(); it != runtime->logs_.rend(); ++it) {
    if (category[0] != '\0' && it->category != category) {
      continue;
    }
    cJSON *item = cJSON_CreateObject();
    cJSON_AddNumberToObject(item, "timestamp", it->timestamp);
    cJSON_AddStringToObject(item, "timestamp_text", runtime->format_timestamp_(it->timestamp).c_str());
    cJSON_AddStringToObject(item, "category", it->category.c_str());
    cJSON_AddStringToObject(item, "level", it->level.c_str());
    cJSON_AddStringToObject(item, "source", it->source.c_str());
    cJSON_AddStringToObject(item, "message", it->message.c_str());
    cJSON_AddItemToArray(entries, item);
  }
  cJSON_AddItemToObject(root, "entries", entries);
  cJSON_AddNumberToObject(root, "entry_count", runtime->logs_.size());
  cJSON_AddNumberToObject(root, "rollover_count", runtime->rollover_count_);
  cJSON_AddStringToObject(root, "storage_status", runtime->get_log_storage_status().c_str());
  cJSON_AddStringToObject(root, "oldest_retained_timestamp", runtime->get_oldest_retained_timestamp_text().c_str());
  cJSON_AddStringToObject(root, "newest_retained_timestamp", runtime->get_newest_retained_timestamp_text().c_str());
  cJSON_AddStringToObject(root, "last_prune_result", runtime->last_prune_result_.c_str());
  char *rendered = cJSON_PrintUnformatted(root);
  runtime->write_json_response_(req, rendered != nullptr ? rendered : "{}");
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_post_log_event_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  runtime->write_error_response_(req, 400, "manual log writes are disabled; logs are reserved for rule changes and sensor fault transitions");
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_clear_logs_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  runtime->logs_.clear();
  runtime->last_prune_result_ = "logs_cleared_by_local_web";
  runtime->save_logs_();
  runtime->write_json_response_(req, "{\"message\":\"logs_cleared\"}");
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_get_test_state_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  runtime->write_json_response_(req, runtime->build_test_state_json_());
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_post_test_state_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  const std::string body = runtime->read_request_body_(req);
  if (body.empty()) {
    runtime->write_error_response_(req, 400, "request body required");
    return ESP_OK;
  }
  std::string error_message;
  if (!runtime->apply_test_state_json_(body, error_message)) {
    runtime->write_error_response_(req, 400, error_message);
    return ESP_OK;
  }
  runtime->write_json_response_(req, "{\"message\":\"test_state_applied\"}");
  return ESP_OK;
}

esp_err_t GreenhouseRuntime::handle_clear_test_state_(httpd_req_t *req) {
  auto *runtime = static_cast<GreenhouseRuntime *>(req->user_ctx);
  runtime->clear_test_overrides();
  runtime->write_json_response_(req, "{\"message\":\"test_state_cleared\"}");
  return ESP_OK;
}

std::string GreenhouseRuntime::read_request_body_(httpd_req_t *req) {
  std::string body;
  body.resize(req->content_len);
  int received = 0;
  while (received < req->content_len) {
    const int result = httpd_req_recv(req, &body[received], req->content_len - received);
    if (result <= 0) {
      return "";
    }
    received += result;
  }
  return body;
}

void GreenhouseRuntime::write_json_response_(httpd_req_t *req, const std::string &body, int status_code) const {
  httpd_resp_set_type(req, "application/json");
  if (status_code != 200) {
    switch (status_code) {
      case 400:
        httpd_resp_set_status(req, "400 Bad Request");
        break;
      case 500:
        httpd_resp_set_status(req, "500 Internal Server Error");
        break;
      default:
        httpd_resp_set_status(req, "500 Internal Server Error");
        break;
    }
  }
  httpd_resp_send(req, body.c_str(), body.size());
}

void GreenhouseRuntime::write_error_response_(httpd_req_t *req, int status_code, const std::string &message) const {
  cJSON *root = cJSON_CreateObject();
  cJSON_AddStringToObject(root, "error", message.c_str());
  char *rendered = cJSON_PrintUnformatted(root);
  this->write_json_response_(req, rendered != nullptr ? rendered : "{\"error\":\"unknown\"}", status_code);
  if (rendered != nullptr) {
    cJSON_free(rendered);
  }
  cJSON_Delete(root);
}

}  // namespace greenhouse_runtime
}  // namespace esphome
