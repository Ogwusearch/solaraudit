# SolarAudit — cable Engine

This module contains the cable engineering logic.

## Responsibilities

- Define typed inputs
- Validate engineering inputs
- Perform calculations
- Return structured results
- Report warnings and errors
- Avoid UI-specific logic
- Avoid direct database access

## Boundary

```text
Input
  │
  ▼
Validation
  │
  ▼
Calculation
  │
  ▼
Engineering Result
```
