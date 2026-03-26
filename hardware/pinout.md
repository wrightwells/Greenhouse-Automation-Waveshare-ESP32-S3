# Pinout Planning

This file captures the initial pin planning assumptions for the Waveshare ESP32-S3 greenhouse controller. Final assignments must be validated against the exact board revision before wiring field hardware.

## Reserved Relay Functions

| Relay | Planned Use | Notes |
| --- | --- | --- |
| Relay 1 | Window actuator open | Must never energize with close relay |
| Relay 2 | Window actuator close | Must never energize with open relay |
| Relay 3 | Intake fan | Safe OFF on boot and fault |
| Relay 4 | Exhaust fan | Safe OFF on boot and fault |
| Relay 5 | Irrigation pump | Safe OFF on boot, OTA, and irrigation fault |

## Planned Signal Areas

| Function | Current Placeholder | Notes |
| --- | --- | --- |
| DHT22 high | GPIO6 | Validate board routing and pull-up |
| DHT22 low | GPIO7 | Validate board routing and pull-up |
| Soil moisture ADC | GPIO8 | Confirm ADC suitability and noise behaviour |
| Ethernet reset | GPIO9 | Placeholder from scaffold, validate against board docs |
| Ethernet CS | GPIO10 | Placeholder from scaffold, validate |
| Ethernet MOSI | GPIO11 | Placeholder from scaffold, validate |
| Ethernet CLK | GPIO12 | Placeholder from scaffold, validate |
| Ethernet MISO | GPIO13 | Placeholder from scaffold, validate |
| Ethernet INT | GPIO14 | Placeholder from scaffold, validate |
| Flow pulse | GPIO15 | Validate interrupt suitability |
| DS18B20 bus | GPIO16 | Confirm pull-up and cable length tolerance |
| Reed switch | GPIO17 | Normally closed input with safe default handling |

## Validation Checklist

- confirm the actual Waveshare relay numbering and GPIO mapping
- confirm whether Ethernet pins above match the board variant used
- verify enough pins remain for display support
- verify whether all planned sensors and display can coexist without compromise

## Safety Notes

- mixed-voltage wiring must be segregated
- actuator control wiring must be interlocked logically and electrically as appropriate
- all output lines should be validated with safe bench loads first
