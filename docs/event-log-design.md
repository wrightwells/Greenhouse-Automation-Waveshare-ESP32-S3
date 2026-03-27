# Event Log Design

This document defines the structured approach for the required rolling 7-day local event log.

## Objective

Maintain a lightweight, bounded log of meaningful device events for local troubleshooting, recovery, and Home Assistant-facing diagnostics, without compromising core control stability or flash endurance.

## Logging Principles

- log significant transitions, not every poll
- newest first in local viewer
- bounded storage
- automatic pruning
- control must continue if logging is degraded
- logging faults must be diagnostically visible

## Minimum Event Fields

Each entry should contain:

- timestamp
- category
- event text
- optional source
  - local_web
  - home_assistant
  - restore
  - default_fallback
  - system

## Required Categories

- boot
- network
- sensor
- rule_engine
- output
- irrigation
- window
- configuration
- ota
- maintenance
- logging

## Required Minimum Logged Events

- boot and restart events
- network mode changes
- AP mode activation
- sensor fault and recovery events
- rule-engine decisions that change outputs
- manual mode enable/disable
- output ON/OFF transitions
- irrigation start/stop/fault
- window movement requests and stop events
- configuration save events
- OTA start/success/failure
- factory reset events

## Retention Strategy

Recommended v1 strategy:

- retain up to 7 days of significant events
- prune entries older than 7 days
- also prune by entry budget if storage is constrained
- oldest entries are removed first

## Health States

Expose diagnostic states for:

- logging enabled
- pruning active
- storage full
- logging degraded
- logging faulted

## Failure Handling

If logging storage is full or corrupted:

- continue core control
- expose logging diagnostic state
- prune where possible
- avoid reboot loops
- preserve the most recent safe control state independently of the log

## Suggested Local Viewer Features

- newest first
- category filter
- compact timestamped list
- log health summary at top of page

## Suggested Home Assistant Exposure

- event log entry count
- oldest retained timestamp
- newest retained timestamp
- log storage status
- last automation action
- last configuration source
- last log-prune result

## Implementation Recommendation

Prefer a bounded record store rather than free-form text append.

Possible storage options to review:

- NVS / preferences metadata plus compact serialized entries
- LittleFS / SPIFFS ring-buffer style file
- fixed-size binary or JSON-lines style record store if write rate remains controlled

The final choice should prioritize:

- bounded size
- simple corruption recovery
- low write amplification
- easy pruning
