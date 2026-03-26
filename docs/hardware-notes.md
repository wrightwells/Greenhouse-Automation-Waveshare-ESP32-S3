# Hardware Notes

This document captures early implementation assumptions that must be validated before final deployment.

## Board Target

- Waveshare ESP32-S3-ETH-8DI-8RO family
- Ethernet-capable variant assumed for v1

## Validation Focus

- confirm relay numbering and default polarity
- confirm ADC-capable pin availability for soil moisture input
- confirm GPIO availability for:
  - 2 x DHT22
  - 1 x DS18B20
  - 1 x flow pulse input
  - 1 x reed switch
  - 1 x display interface
- confirm stable Ethernet plus Wi-Fi AP coexistence

## Safety Reminders

- relays must boot OFF
- mixed-voltage wiring must be segregated
- inductive loads require suppression/protection
- actuator interlocking must be enforced in software and respected in wiring

## Open Questions

- final pin map for the exact board revision
- display interface and model
- whether all planned sensors and the display fit simultaneously without trade-offs
