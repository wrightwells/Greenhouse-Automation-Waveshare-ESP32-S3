# Hardware Notes

This document captures early implementation assumptions that must be validated before final deployment.

## Board Target

- Waveshare ESP32-S3-ETH-8DI-8RO family
- Ethernet-capable variant assumed for v1

## Validation Focus

- confirm relay numbering and default polarity on the onboard TCA9554-controlled relay bank
- confirm the official Ethernet mapping remains:
  - GPIO12 interrupt
  - GPIO13 MOSI
  - GPIO14 MISO
  - GPIO15 clock
  - GPIO16 chip select
- confirm expansion-header availability for:
  - GPIO1 soil moisture ADC
  - GPIO2 flow pulse
  - GPIO21 DHT22 high
  - GPIO47 DHT22 low
  - GPIO48 DS18B20
- confirm DI1 / GPIO4 is appropriate for the normally closed reed switch path
- confirm GPIO41/GPIO42 shared I2C stability for the RTC, relay expander, and future display use
- confirm stable Ethernet plus Wi-Fi AP coexistence

## Safety Reminders

- relays must boot OFF
- relay outputs are not direct ESP32 GPIOs on this board; they are driven through the onboard TCA9554 expander
- mixed-voltage wiring must be segregated
- inductive loads require suppression/protection
- actuator interlocking must be enforced in software and respected in wiring

## Open Questions

- final pin map for the exact board revision
- display interface and model
- whether all planned sensors and the display fit simultaneously without trade-offs
