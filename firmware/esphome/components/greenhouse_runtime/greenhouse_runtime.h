#pragma once

#include <cstddef>
#include <cstdint>
#include <deque>
#include <string>
#include <vector>

#include "esp_http_server.h"
#include "esphome/core/component.h"

namespace esphome {
namespace greenhouse_runtime {

struct RuntimeRuleRow {
  std::string id;
  bool enabled{true};
  int order{0};
  std::string rule_class;
  std::string field;
  std::string op;
  std::string action;
  float threshold{0.0f};
  float threshold_high{0.0f};
  bool bool_state{false};
  int action_target{0};
  std::string notes;
};

struct RuntimeLogEntry {
  uint32_t timestamp{0};
  std::string category;
  std::string level;
  std::string source;
  std::string message;
};

class GreenhouseRuntime : public Component {
 public:
  void setup() override;
  void loop() override;
  float get_setup_priority() const override;

  void set_web_port(uint16_t web_port);
  void set_max_rules(size_t max_rules);
  void set_max_log_entries(size_t max_log_entries);
  void set_retention_days(uint8_t retention_days);
  void set_max_log_json_bytes(size_t max_log_json_bytes);
  void set_flush_interval_seconds(uint32_t flush_interval_seconds);
  void set_namespace_name(const std::string &namespace_name);

  bool log_event(const std::string &category, const std::string &level, const std::string &message,
                 const std::string &source);

  size_t get_log_entry_count() const;
  size_t get_log_rollover_count() const;
  bool is_pruning_active() const;
  bool is_logging_faulted() const;
  std::string get_log_storage_status() const;
  std::string get_oldest_retained_timestamp_text() const;
  std::string get_newest_retained_timestamp_text() const;
  std::string get_last_prune_result() const;
  std::string get_rules_storage_status() const;

 protected:
  bool load_rules_();
  bool load_logs_();
  bool save_rules_();
  bool save_logs_();
  bool save_string_(const char *key, const std::string &value);
  bool load_string_(const char *key, std::string &value);

  bool parse_rules_json_(const std::string &json);
  bool parse_logs_json_(const std::string &json);
  std::string serialize_rules_json_() const;
  std::string serialize_logs_json_() const;

  bool validate_rules_json_(const std::string &json, std::string &error_message);
  bool apply_rules_json_(const std::string &json, const std::string &source);
  void append_log_internal_(const RuntimeLogEntry &entry, bool persist_now);
  void prune_logs_(bool force_bytes_check);
  uint32_t current_timestamp_() const;
  std::string format_timestamp_(uint32_t timestamp) const;

  bool start_http_server_();
  void stop_http_server_();
  std::string build_index_html_() const;
  std::string build_status_json_() const;

  static esp_err_t handle_index_(httpd_req_t *req);
  static esp_err_t handle_status_(httpd_req_t *req);
  static esp_err_t handle_get_rules_(httpd_req_t *req);
  static esp_err_t handle_post_rules_(httpd_req_t *req);
  static esp_err_t handle_get_logs_(httpd_req_t *req);
  static esp_err_t handle_post_log_event_(httpd_req_t *req);
  static esp_err_t handle_clear_logs_(httpd_req_t *req);

  std::string read_request_body_(httpd_req_t *req);
  void write_json_response_(httpd_req_t *req, const std::string &body, int status_code = 200) const;
  void write_error_response_(httpd_req_t *req, int status_code, const std::string &message) const;

  uint16_t web_port_{8081};
  size_t max_rules_{32};
  size_t max_log_entries_{256};
  uint8_t retention_days_{7};
  size_t max_log_json_bytes_{32768};
  uint32_t flush_interval_ms_{60000};
  std::string namespace_name_{"gh_runtime"};
  bool logging_faulted_{false};
  bool pruning_active_{false};
  size_t rollover_count_{0};
  std::string last_prune_result_{"never_pruned"};
  std::string rules_storage_status_{"not_loaded"};
  std::deque<RuntimeLogEntry> logs_;
  std::vector<RuntimeRuleRow> rules_;
  bool logs_dirty_{false};
  bool rules_dirty_{false};
  uint32_t last_flush_ms_{0};
  httpd_handle_t http_server_{nullptr};
};

}  // namespace greenhouse_runtime
}  // namespace esphome
