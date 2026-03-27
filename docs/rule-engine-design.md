# Rule Engine Design

This document captures the structured implementation approach for the updated functional specification that adds a local rule-table automation engine.

## Objective

The device remains the final decision-maker for irrigation, fan, and window actions. Home Assistant may write supervisory values, but it must not be required to make per-cycle actuation decisions.

## Design Principles

- deterministic ordered evaluation
- validation before activation
- safe default fallback when rules are invalid
- explicit conflict arbitration
- separation between rule evaluation and output actuation
- maintainable enough for a homelab operator to understand

## Proposed Architecture

Recommended logical path:

1. read and validate sensor state
2. load active thresholds, enable flags, and rule rows from persisted storage
3. evaluate rules by ordered row index
4. collect requested actions by automation class:
   - irrigation
   - intake/exhaust fan
   - window position
5. resolve conflicts using configured precedence
6. apply safe arbitration before touching relays
7. log only significant decisions and arbitration results

## Rule Row Model

Each rule row should contain:

- `id`
- `enabled`
- `order`
- `class`
  - irrigation
  - ventilation
  - window
- `description`
- `conditions`
- `action`
- `cooldown / hysteresis / minimum interval fields`
- `last matched / last applied metadata`

## Supported Inputs

The updated specification requires rule evaluation support for:

- low air temperature
- high air temperature
- low air humidity
- high air humidity
- intake air temperature
- soil moisture
- flow rate
- door state
- current estimated window position
- current output states
- manual/automatic mode
- fault state

## Supported Condition Types

- above threshold
- below threshold
- inside range
- outside range
- valid/invalid
- boolean match
- hysteresis-qualified state
- cooldown/timer-qualified state

## Supported Actions

- intake fan ON/OFF
- exhaust fan ON/OFF
- irrigation pump ON/OFF
- request window fully open
- request window fully close
- request window target percentage
- inhibit irrigation
- inhibit ventilation/window actions
- create diagnostic/log event

## Conflict Policy

Default recommended policy:

1. manual mode overrides all rule actions
2. safety faults override normal automation
3. inhibit actions override permissive actions
4. explicit OFF wins over ON for pumps/fans when conflicts remain
5. window stop / no-motion wins over contradictory directional requests
6. highest-priority matching rule row wins within the same automation class

All arbitration decisions should be logged when they materially change the final applied action.

## Storage Strategy

Persist:

- active rule rows
- rule enable state
- rule-engine enable state
- per-class automation enable flags
- precedence mode
- configuration source metadata where available

Do not persist transient per-cycle evaluation state unless required for timers or anti-chatter logic.

## Validation Strategy

Reject rules that are:

- incomplete
- contradictory
- out of supported value range
- unsafe for the selected actuator mode
- impossible under the current pin / feature build

If the stored table fails validation at boot:

- mark rule-engine degraded
- load safe fallback defaults or disable affected classes
- keep outputs safe
- create diagnostic and log entries

## Implementation Recommendation

For v1:

- keep sensors and outputs in ESPHome where practical
- move rule-table evaluation and persistence into a targeted custom component if pure YAML becomes too brittle
- keep the rule editor row-based and explicit rather than highly abstract

## Phased Delivery

### Phase 1

- global rule-engine enable
- class enables for irrigation / ventilation / window
- fixed built-in rules expressed through writable thresholds
- diagnostics for rule-engine state and automation source

### Phase 2

- persisted row-based rule table
- local rule editor UI with add/edit/reorder/delete
- precedence mode and conflict logging

### Phase 3

- helper/profile sync from Home Assistant
- profile-aware rule variants
- export/import if still justified
