# Preliminary BOM

This is the implementation-start BOM for v1. Quantities and exact part numbers can be refined during bench validation.

| Item | Qty | Notes |
| --- | --- | --- |
| [Waveshare ESP32-S3-ETH-8DI-8RO board](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/hardware/bom.md)| 1 | Ethernet-capable target board |
| [DHT22 / AM2302 sensor](https://thepihut.com/products/am2302-wired-dht22-temperature-humidity-sensor?variant=27740418641) | 2 | High and low greenhouse positions |
| [DS18B20 sensor[(https://thepihut.com/products/waterproof-ds18b20-digital-temperature-sensor-extras?variant=27740417873)] | 1 | Intake air temperature |
| [Capacitive soil moisture sensor](https://thepihut.com/products/gravity-analog-waterproof-capacitive-soil-moisture-sensor?variant=39824758276291) | 1 | Prefer stable analog-compatible model |
| [Hall-effect flow sensor](https://thepihut.com/products/gravity-water-flow-sensor-1-2-for-arduino) | 1 | Sized for irrigation flow range |
| [Normally closed reed switch](https://www.amazon.co.uk/Magnetic-Window-Normally-Contacts-AC110-220V/dp/B07C9S23RY)| 1 | Door state |
| [2-line display](https://thepihut.com/products/i2c-16x2-arduino-lcd-display-module) | 1 | ESPHome-compatible, low pin count |
| [12V window actuator system](https://uk.banggood.com/DC-12V-900N-2-or-4-or-8-or-12-or-16-or-20-Inch-Stroke-Tubular-Motor-50-500mm-Linear-Actuator-Motor-p-1526727.html?cur_warehouse=CN&ID=515973&rmmds=search) | 1 | External supply and protection required |
| Intake fan load | 1 | Voltage depends on install |
| Exhaust fan load | 1 | Voltage depends on install |
| [Irrigation pump](https://www.amazon.co.uk/Submersible-Water-Ultra-Caravan-Motorhome/dp/B0D6348LJV) | 1 | Voltage depends on install |
| External fusing and isolation components, and [12v power supply](https://www.amazon.co.uk/Switching-IRM-30-12ST-Terminal-Converter-Transformer/dp/B0CQMB9L6G) | As needed | Required for safe installation |
| Flyback or suppression protection | As needed | Required for inductive loads |
| [Suitable enclosure](https://www.ebay.co.uk/itm/276687064147) and cable glands | As needed | Greenhouse environment appropriate |

## Procurement Notes

- confirm relay contact ratings for each connected load
- avoid relying on sensor modules with poor long-term greenhouse durability
- prefer field-replaceable connectors and clearly labelled wiring
