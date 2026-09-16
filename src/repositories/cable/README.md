# SolarAudit — Cable Repository

## Overview

This repository module provides the data-access boundary for Cable
records.

## Responsibilities

- Persist Cable records
- Retrieve Cable records
- Update existing Cable records
- Delete Cable records when required
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

## What a Cable record is

A Cable record is a saved cable sizing outcome for ONE circuit run.
The Cable Engine is called once per circuit (battery, PV string,
inverter DC, inverter AC, AC load, ...), so a single project typically
has several Cable records — one per protected run.

A record captures:

- Circuit identity: role, voltage type, circuit type, material
- The input snapshot (current, length, system voltage, target drop, ...)
- The result snapshot (selected area, actual drop, derating factors, ...)
- A status: candidate | selected | installed | archived
- A link back to the project and (optionally) to the audit that produced it

The "selected" status applies per (project, circuitRole) pair — at most
one selected record per role per project.

## Status

Implemented with an in-memory repository. A D1/SQLite implementation
is planned; only this folder changes when it lands.
