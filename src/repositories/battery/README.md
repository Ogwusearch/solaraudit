# SolarAudit — Battery Repository

## Overview

This repository module provides the data-access boundary for Battery
records.

## Responsibilities

- Persist Battery records
- Retrieve Battery records
- Update existing Battery records
- Delete Battery records when required
- Keep database access separate from UI components
- Keep database access separate from engineering calculations

## Architecture

    Feature
       |
       v
    Service
       |
       v
    Repository
       |
       v
    Database

## Engineering Boundary

Engineering calculations remain under `src/engineering/`.

This repository stores the results of those calculations, not the
calculations themselves. It has no knowledge of formulas, units, or
defaults. It moves typed records in and out of storage.

## What a Battery record is

A Battery record is a saved battery sizing outcome. It captures:

- The input snapshot (daily energy, autonomy, cell spec, design factors)
- The result snapshot (installed kWh, series/parallel, bank V/Ah, warnings)
- A status: candidate | selected | installed | archived
- A link back to the project (and optionally to the audit that produced it)

This is what lets a project store multiple candidate battery
configurations, promote one to selected, and later reconstruct the
sizing from the record.

## Status

Implemented with an in-memory repository. A D1/SQLite implementation
is planned; only this folder changes when it lands.
