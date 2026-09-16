# SolarAudit — Energy Analysis

## Overview

This feature contains the user interface and application logic for the
Energy Analysis module.

## Responsibilities

- Provide the feature user interface
- Collect required user inputs
- Display engineering calculations and results
- Display warnings and validation errors
- Connect the UI to application services
- Keep engineering calculations separate from UI logic

## Engineering Engine

Engineering calculations are implemented under:

```text
src/engineering/
```

This feature should consume the appropriate engineering engine rather than
duplicating calculation logic.

## Structure

The feature starts with a single README and can be expanded as implementation
requirements become clear.

```text
energy-analysis/
└── README.md
```

## Status

Scaffold created. Implementation pending.
