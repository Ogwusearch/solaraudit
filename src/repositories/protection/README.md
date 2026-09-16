# SolarAudit — Protection Repository

## Overview

This repository module provides the data-access boundary for
Protection records.

## Responsibilities

- Persist Protection data
- Retrieve Protection data
- Update existing Protection records
- Delete Protection records when required
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
protection/
└── README.md
```

## Status

Repository scaffold created. Implementation pending.
