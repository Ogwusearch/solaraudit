# SolarAudit — Energy Repository

## Overview

This repository module provides the data-access boundary for Energy
records.

## Responsibilities

- Persist Energy records
- Retrieve Energy records
- Update existing Energy records
- Delete Energy records when required
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

## What an Energy record is

An Energy record is a saved energy-analysis scenario for a project. It
captures:

- The simulation horizon in days (denormalised for filtering)
- Whether a battery was included (denormalised boolean)
- The input snapshot (PV arrays, daily consumption, battery if any)
- The result snapshot (generation, self-consumption, grid flows, battery
  throughput, rates)
- A status: draft | selected | archived
- A link back to the project and (optionally) to the audit that produced it

A project may accumulate multiple energy scenarios — summer vs winter,
with vs without a battery, before vs after a load change. At most one
per project may be "selected" as the current reference.

## Note on status vocabulary

Energy analyses are not hardware selections (no "installed" state) and
are not frozen financial plans (no "final" state). The vocabulary is
deliberately minimal: a working draft, one selected reference per
project, and archived scenarios that remain retrievable.

## Status

Implemented with an in-memory repository. A D1/SQLite implementation
is planned; only this folder changes when it lands.
