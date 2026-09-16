# SolarAudit — Voltage Drop Engine

This module contains the voltage-drop engineering logic for DC and AC circuit runs.

## Responsibilities

* Define typed engineering inputs
* Validate electrical inputs
* Calculate conductor resistance
* Calculate voltage drop
* Calculate voltage-drop percentage
* Calculate receiving-end voltage
* Support DC and AC circuit models
* Return structured engineering results
* Report validation errors and engineering warnings
* Keep calculations independent from the UI
* Keep calculations independent from database access

## Boundary

```text
Input
  │
  ▼
Validation
  │
  ├── Invalid ──► Errors
  │
  ▼
Calculation
  │
  ├── Voltage Drop
  ├── Drop Percentage
  └── Receiving Voltage
  │
  ▼
Engineering Result
```

## Engineering Scope

The engine is responsible for determining the voltage loss along a cable run based on:

* Circuit voltage
* Circuit current
* Cable length
* Conductor cross-sectional area
* Conductor resistivity
* Number of conductors
* Circuit type
* Power factor where applicable
* Cable reactance where applicable

### DC Model

For a two-conductor DC circuit:

```text
Vdrop = I × Rtotal
```

where:

```text
Rtotal = ρ × Ltotal / A
```

For a positive and negative conductor:

```text
Ltotal = 2 × L
```

Therefore:

```text
Vdrop = I × ρ × (2L) / A
```

### AC Resistive Model

For a simplified single-phase AC circuit:

```text
Vdrop ≈ I × Rtotal
```

For AC circuits requiring impedance modeling:

```text
Vdrop ≈ I × Ztotal
```

where:

```text
Z = √(R² + X²)
```

A future version may provide dedicated single-phase and three-phase models with power-factor handling.

## Result

A successful calculation should expose values such as:

```text
design current
conductor resistance
total circuit resistance
voltage drop
voltage drop percentage
receiving-end voltage
warnings
errors
validation status
```

## Validation

Validation must:

* Reject zero or negative voltage
* Reject zero or negative current
* Reject zero or negative cable length
* Reject zero or negative conductor area
* Reject invalid resistivity
* Reject invalid conductor count
* Reject invalid circuit type
* Reject non-finite numeric values
* Collect all validation errors
* Never throw for normal invalid user input

The validation contract is:

```text
valid input
    │
    ▼
[]

invalid input
    │
    ▼
[
  "error 1",
  "error 2",
  "error 3"
]
```

## Warnings

Warnings should identify engineering conditions that are not necessarily calculation errors.

Examples:

```text
Voltage drop exceeds recommended limit.

Cable resistance is high.

Receiving-end voltage is below the design target.

Cable length is unusually long.

High current may require a larger conductor.

AC calculation requires impedance/power-factor data.
```

## Architecture

```text
src/engineering/voltage-drop/
│
├── types.ts
├── constants.ts
├── errors.ts
├── validation.ts
├── calculation.ts
├── index.ts
└── __tests__/
    ├── validation.test.ts
    ├── calculation.test.ts
    └── integration.test.ts
```

## Calculation Boundary

The calculation layer must remain pure.

```text
UI
 │
 ▼
Public API
 │
 ▼
Validation
 │
 ▼
Calculation
 │
 ▼
Result
```

The engine must not:

* Access React components
* Access browser storage
* Access SQLite
* Access Supabase
* Perform HTTP requests
* Read environment variables
* Format UI components
* Persist project data

## Design Principle

The Voltage Drop Engine should answer one engineering question:

> Given a defined circuit and conductor, what voltage is lost along the cable and what voltage remains at the load?

Sizing a cable to satisfy a target voltage-drop limit should remain a separate responsibility or a higher-level cable-sizing engine.

## Future Extensions

Potential future capabilities include:

* DC two-wire calculations
* Single-phase AC calculations
* Three-phase AC calculations
* Conductor temperature correction
* Copper and aluminium conductor libraries
* Cable installation correction factors
* AC impedance tables
* Power-factor correction
* Maximum permissible voltage-drop validation
* Cable-size recommendation
* Parallel conductor calculations
* PV string voltage-drop analysis
* Battery cable voltage-drop analysis
* Inverter DC cable analysis
* AC distribution voltage-drop analysis

```text
I recommend keeping **voltage-drop calculation** separate from **cable sizing**: the voltage-drop engine calculates the electrical result, while the cable-sizing engine can iterate conductor sizes until the specified voltage-drop limit is satisfied.
```
