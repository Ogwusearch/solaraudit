# SolarAudit — Project Repository

## Overview

This repository module provides the data-access boundary for
Project records.

## Responsibilities

- Persist Project data
- Retrieve Project data
- Update existing Project records
- Delete Project records when required
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
project/
└── README.md
```

## Status

Repository scaffold created. Implementation pending.
