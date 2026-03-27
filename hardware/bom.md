# Preliminary BOM

This is the implementation-start BOM for v1. Quantities and exact part numbers can be refined during bench validation.

| Item | Qty | Notes |
| --- | --- | --- |
| [Waveshare ESP32-S3-ETH-8DI-8RO board](https://www.waveshare.com/esp32-s3-eth-8di-8ro.htm)[link](/https://thepihut.com/products/8-channel-esp32-s3-wi-fi-relay-module-with-can-interface?variant=55382970401153) | 1 | Ethernet-capable target board |
| [DHT22 / AM2302 sensor](https://www.adafruit.com/product/393)[link](https://thepihut.com/products/am2302-wired-dht22-temperature-humidity-sensor?variant=27740418641) | 2 | High and low greenhouse positions |
| [DS18B20 sensor](https://www.adafruit.com/product/381)[link](https://thepihut.com/products/waterproof-ds18b20-digital-temperature-sensor-extras?variant=27740417873) | 1 | Intake air temperature |
| [Capacitive soil moisture sensor](https://www.dfrobot.com/product-2054.html/) [link](https://thepihut.com/products/gravity-analog-waterproof-capacitive-soil-moisture-sensor?variant=39824758276291) | 1 | Waterproof capacitive option preferred for greenhouse use |
| [Hall-effect flow sensor](https://www.dfrobot.com/product-1517.html) [link](https://thepihut.com/products/gravity-water-flow-sensor-1-2-for-arduino) | 1 | Sized for irrigation flow range |
| [Normally closed reed switch](https://www.sparkfun.com/products/8642)[link](https://www.amazon.co.uk/Magnetic-Window-Normally-Contacts-AC110-220V/dp/B07C9S23RY) | 1 | Door state; choose NC wiring arrangement in installation |
| [2-line display](https://www.dfrobot.com/product-135.html) [link](https://thepihut.com/products/i2c-16x2-arduino-lcd-display-module)| 1 | I2C 16x2 class display, ESPHome-compatible |
| [12V window actuator system](https://www.firgelliauto.com/collections/linear-actuators)[link](https://uk.banggood.com/DC-12V-900N-2-or-4-or-8-or-12-or-16-or-20-Inch-Stroke-Tubular-Motor-50-500mm-Linear-Actuator-Motor-p-1526727.html?cur_warehouse=CN&ID=515973&rmmds=search)  | 1 | External supply and protection required |
| [Intake fan load](https://acinfinity.com/axial-ac-fan-kits/axial-1238-120v-ac-muffin-cooling-fan-120mm-x-120mm-x-38mm/) [link](https://www.aliexpress.com/item/1005011758748531.html)| 1 | Example mains-rated ventilation fan; final airflow depends on install |
| [Exhaust fan load](https://acinfinity.com/axial-ac-fan-kits/axial-1238-120v-ac-muffin-cooling-fan-120mm-x-120mm-x-38mm/) | 1 | Match intake/exhaust fan selection to greenhouse airflow plan |
| [Irrigation pump](https://www.dfrobot.com/product-1710.html) [link](https://www.amazon.co.uk/Submersible-Water-Ultra-Caravan-Motorhome/dp/B0D6348LJV)| 1 | Example low-voltage irrigation pump; confirm head/flow requirements |
| External fusing and isolation components, and [12V power supply](https://www.digikey.com/en/products/detail/mean-well-usa-inc/IRM-30-12ST/7704673) [link](https://www.amazon.co.uk/Switching-IRM-30-12ST-Terminal-Converter-Transformer/dp/B0CQMB9L6G)| As needed | Required for safe installation |
| Flyback or suppression protection | As needed | Required for inductive loads |
| Suitable enclosure [link](https://www.ebay.co.uk/itm/276687064147)and cable glands | As needed | Choose an IP-rated enclosure sized for mains segregation and DIN-rail/device clearance |

## Procurement Notes

- confirm relay contact ratings for each connected load
- avoid relying on sensor modules with poor long-term greenhouse durability
- prefer field-replaceable connectors and clearly labelled wiring
