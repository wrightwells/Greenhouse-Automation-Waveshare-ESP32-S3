# Test Layout

This directory groups practical validation work by context.

## Structure

- `bench/`: hardware and wiring validation before live deployment
- `integration/`: Home Assistant, MQTT, DHCP, and local web interaction checks
- `ota/`: update, recovery, and persistence checks

## Usage

Start by translating the high-priority scenarios from [docs/test-plan.md](/home/ww/src/Greenhouse-Automation-Waveshare-ESP32-S3/docs/test-plan.md) into step-by-step notes under the relevant subfolder as implementation progresses.

Do not treat deployment as ready until safe boot, actuator interlock, irrigation fault handling, and OTA recovery paths have all been exercised on the bench.
