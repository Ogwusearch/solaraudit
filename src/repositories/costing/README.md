# SolarAudit — Costing Repository

## Overview

This repository module provides the data-access boundary for Costing
records.

## Responsibilities

- Persist Costing records
- Retrieve Costing records
- Update existing Costing records
- Delete Costing records when required
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

## What a Costing record is

A Costing record is a saved financial plan for a project. It captures:

- The currency (ISO 4217) — denormalised for filtering
- The input snapshot (line items, waste factor, overheads, discount, tax)
- The result snapshot (subtotal, overheads, contingency, grand total, category breakdown)
- A status: draft | selected | final | archived
- A link back to the project and (optionally) to the audit that produced it

A project normally has one active financial plan, so at most one
record per project may be "selected". Drafts and alternates may
accumulate during estimating; finalising is a distinct transition.

## Note on status names

Costing uses its own status vocabulary (draft / selected / final /
archived) rather than the candidate / selected / installed / archived
used by hardware records. Installed has no meaning for a financial
plan; "final" does.

## Status

Implemented with an in-memory repository. A D1/SQLite implementation
is planned; only this folder changes when it lands.
