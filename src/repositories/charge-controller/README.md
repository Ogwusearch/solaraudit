# SolarAudit — Charge Controller Repository

## Overview

This repository module provides the data-access boundary for Charge
Controller records.

## Responsibilities

- Persist Charge Controller records
- Retrieve Charge Controller records
- Update existing Charge Controller records
- Delete Charge Controller records when required
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

## What a Charge Controller record is

A Charge Controller record is a saved controller selection for a
specific PV array + battery bank combination. It captures:

- The controller technology (MPPT / PWM) — denormalised for filtering
- The input snapshot (array kWp, Vmp, Voc, Imp, Isc, battery V/Ah, ...)
- The result snapshot (charge current, recommended size, compatibility flags, ...)
- A status: candidate | selected | installed | archived
- A link back to the project and (optionally) to the audit that produced it

A project normally has one charge controller — so at most one record
per project may be "selected". Candidates may accumulate as different
arrays or controllers are considered.

## Status

Implemented with an in-memory repository. A D1/SQLite implementation
is planned; only this folder changes when it lands.
