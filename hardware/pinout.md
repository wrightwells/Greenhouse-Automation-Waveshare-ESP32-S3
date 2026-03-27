# Pinout Planning

This file captures the current board-aware pin planning for the Waveshare ESP32-S3-ETH-8DI-8RO greenhouse controller. It now reflects the official Waveshare relay and Ethernet mappings, while keeping the external sensor pins explicit as install-time assignments that still need bench validation on the expansion header.

## Reserved Relay Functions

| Relay | Planned Use | Notes |
| --- | --- | --- |
| EXIO1 / Relay 1 | Window actuator open | Via onboard TCA9554 expander |
| EXIO2 / Relay 2 | Window actuator close | Via onboard TCA9554 expander |
| EXIO3 / Relay 3 | Intake fan | Via onboard TCA9554 expander |
| EXIO4 / Relay 4 | Exhaust fan | Via onboard TCA9554 expander |
| EXIO5 / Relay 5 | Irrigation pump | Via onboard TCA9554 expander |

## Board-Reserved Signal Areas

| Function | Board Pin | Notes |
| --- | --- | --- |
| Ethernet INT | GPIO12 | Official Waveshare W5500 mapping |
| Ethernet MOSI | GPIO13 | Official Waveshare W5500 mapping |
| Ethernet MISO | GPIO14 | Official Waveshare W5500 mapping |
| Ethernet SCLK | GPIO15 | Official Waveshare W5500 mapping |
| Ethernet CS | GPIO16 | Official Waveshare W5500 mapping |
| RS485 TX | GPIO17 | Onboard RS485 |
| RS485 RX | GPIO18 | Onboard RS485 |
| RTC / I2C SCL | GPIO41 | Shared with TCA9554 relay expander bus |
| RTC / I2C SDA | GPIO42 | Shared with TCA9554 relay expander bus |
| RGB LED | GPIO38 | Onboard WS2812 |
| Buzzer | GPIO46 | Onboard buzzer |
| DI1 | GPIO4 | Available as isolated digital input |
| DI2 | GPIO5 | Available as isolated digital input |
| DI3 | GPIO6 | Available as isolated digital input |
| DI4 | GPIO7 | Available as isolated digital input |
| DI5 | GPIO8 | Available as isolated digital input |
| DI6 | GPIO9 | Available as isolated digital input |
| DI7 | GPIO10 | Available as isolated digital input |
| DI8 | GPIO11 | Available as isolated digital input |

## Current External Sensor Assignments

| Function | Current Install-Time Assignment | Rationale |
| --- | --- | --- |
| Soil moisture ADC | GPIO1 | Keeps ADC off the isolated DI bank and away from Ethernet |
| Flow pulse | GPIO2 | Free local MCU pin, no longer tied to Ethernet clock |
| Reed switch | GPIO4 | Uses isolated DI1 input path |
| DHT22 high | GPIO21 | Expansion-header candidate, not board-reserved |
| DHT22 low | GPIO47 | Expansion-header candidate, not used by Ethernet/RS485 |
| DS18B20 bus | GPIO48 | Expansion-header candidate, not used by Ethernet/RS485 |

## Validation Checklist

- confirm the expansion header exposes GPIO1, GPIO2, GPIO21, GPIO47, and GPIO48 as expected on the exact board revision
- confirm GPIO1 is usable and stable for the selected analog soil sensor
- confirm GPIO47 and GPIO48 are suitable for the selected DHT22 and DS18B20 wiring lengths
- verify enough pins remain for display support
- verify whether all planned sensors and display can coexist without compromise
- confirm relay polarity on the TCA9554-driven outputs against real hardware
- confirm DI1 wiring is appropriate for the normally closed reed switch install

## Safety Notes

- mixed-voltage wiring must be segregated
- actuator control wiring must be interlocked logically and electrically as appropriate
- all output lines should be validated with safe bench loads first
- do not repurpose GPIO12-GPIO16, GPIO17-GPIO18, GPIO41-GPIO42, GPIO38, or GPIO46 for external sensors on this board
