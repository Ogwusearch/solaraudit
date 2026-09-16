# SolarAudit — Audit Repository

## Overview

Data-access boundary for Audit records.

## Responsibilities

- Persist, retrieve, update, and delete Audit records
- Keep database access separate from UI components
- Keep database access separate from engineering calculations

## Architecture

    Feature -> Service -> Repository -> Database

## Engineering Boundary

Engineering calculations remain under `src/engineering/`.

This repository stores the results of those calculations, not the
calculations themselves.

## Status

Implemented with an in-memory repository.
