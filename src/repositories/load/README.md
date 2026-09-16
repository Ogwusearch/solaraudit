# SolarAudit — Load Repository

## Overview

This repository module provides the data-access boundary for
Load records.

## Responsibilities

- Persist Load data
- Retrieve Load data
- Update existing Load records
- Delete Load records when required
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
load/
└── README.md
```

## Status

Repository scaffold created. Implementation pending.
