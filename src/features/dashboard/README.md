# SolarAudit — Dashboard

## Overview

This feature contains the user interface and application logic for the
Dashboard module.

## Responsibilities

- Provide the feature user interface
- Aggregate read-only data from other features
- Display summary metrics, project list, and quick actions
- Display loading and error states
- Keep domain logic separate from UI logic

## Engineering Engine

**This feature does NOT consume an engineering engine.**

Dashboard is a read-only view. It composes data from other features
(the Projects feature provides the list of projects; a future project
state store provides per-project summary metrics) and displays it. It
does not size anything itself.

Engineering calculations are implemented under `src/engineering/` and
consumed by the sizing features in `src/features/`.

## Composition

The Dashboard service takes the Projects service as a dependency. The
composition happens in `services/defaultDashboardService.ts` — the one
file that names a concrete Projects service. Components never reach
into another feature's internals; they call Dashboard's own service.

## Status

Implemented. Reads real project data; metric tiles show "—" until
project state integration lands.
