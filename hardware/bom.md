# Preliminary BOM

This is the implementation-start BOM for v1. Quantities and exact part numbers can be refined during bench validation.

| Item | Qty | Notes |
| --- | --- | --- |
| Waveshare ESP32-S3-ETH-8DI-8RO board | 1 | Ethernet-capable target board |
| DHT22 / AM2302 sensor | 2 | High and low greenhouse positions |
| DS18B20 sensor | 1 | Intake air temperature |
| Capacitive soil moisture sensor | 1 | Prefer stable analog-compatible model |
| Hall-effect flow sensor | 1 | Sized for irrigation flow range |
| Normally closed reed switch | 1 | Door state |
| 2-line display | 1 | ESPHome-compatible, low pin count |
| 12V window actuator system | 1 | External supply and protection required |
| Intake fan load | 1 | Voltage depends on install |
| Exhaust fan load | 1 | Voltage depends on install |
| Irrigation pump | 1 | Voltage depends on install |
| External fusing and isolation components | As needed | Required for safe installation |
| Flyback or suppression protection | As needed | Required for inductive loads |
| Suitable enclosure and cable glands | As needed | Greenhouse environment appropriate |

## Procurement Notes

- confirm relay contact ratings for each connected load
- avoid relying on sensor modules with poor long-term greenhouse durability
- prefer field-replaceable connectors and clearly labelled wiring
