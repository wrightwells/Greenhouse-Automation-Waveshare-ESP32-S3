import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID


CONF_WEB_PORT = "web_port"
CONF_MAX_RULES = "max_rules"
CONF_MAX_LOG_ENTRIES = "max_log_entries"
CONF_RETENTION_DAYS = "retention_days"
CONF_MAX_LOG_JSON_BYTES = "max_log_json_bytes"
CONF_FLUSH_INTERVAL_SECONDS = "flush_interval_seconds"
CONF_NAMESPACE_NAME = "namespace_name"
CONF_TEST_UI_ENABLED = "test_ui_enabled"

greenhouse_runtime_ns = cg.esphome_ns.namespace("greenhouse_runtime")
GreenhouseRuntime = greenhouse_runtime_ns.class_("GreenhouseRuntime", cg.Component)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(GreenhouseRuntime),
        cv.Optional(CONF_WEB_PORT, default=8081): cv.port,
        cv.Optional(CONF_MAX_RULES, default=32): cv.int_range(min=1, max=128),
        cv.Optional(CONF_MAX_LOG_ENTRIES, default=256): cv.int_range(min=32, max=1024),
        cv.Optional(CONF_RETENTION_DAYS, default=7): cv.int_range(min=1, max=7),
        cv.Optional(CONF_MAX_LOG_JSON_BYTES, default=32768): cv.int_range(min=4096, max=262144),
        cv.Optional(CONF_FLUSH_INTERVAL_SECONDS, default=60): cv.int_range(min=5, max=3600),
        cv.Optional(CONF_NAMESPACE_NAME, default="gh_runtime"): cv.string,
        cv.Optional(CONF_TEST_UI_ENABLED, default=False): cv.boolean,
    }
).extend(cv.COMPONENT_SCHEMA)


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    cg.add(var.set_web_port(config[CONF_WEB_PORT]))
    cg.add(var.set_max_rules(config[CONF_MAX_RULES]))
    cg.add(var.set_max_log_entries(config[CONF_MAX_LOG_ENTRIES]))
    cg.add(var.set_retention_days(config[CONF_RETENTION_DAYS]))
    cg.add(var.set_max_log_json_bytes(config[CONF_MAX_LOG_JSON_BYTES]))
    cg.add(var.set_flush_interval_seconds(config[CONF_FLUSH_INTERVAL_SECONDS]))
    cg.add(var.set_namespace_name(config[CONF_NAMESPACE_NAME]))
    cg.add(var.set_test_ui_enabled(config[CONF_TEST_UI_ENABLED]))
