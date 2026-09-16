# SolarAudit — Inverter Repository

## Overview

This repository module provides the data-access boundary for
Inverter records.

## Responsibilities

- Persist Inverter data
- Retrieve Inverter data
- Update existing Inverter records
- Delete Inverter records when required
- Keep database access separate from UI components
- Keep database access separate from engineering calculations

## Architecture

```text
Feature
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
Database
```

## Engineering Boundary

Engineering calculations must remain under:

```text
src/engineering/
```

The repository is responsible for persistence, not engineering
calculation logic.

## Structure

```text
inverter/
└── README.md
```

## Status

Repository scaffold created. Implementation pending.
