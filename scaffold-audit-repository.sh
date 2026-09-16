#!/usr/bin/env bash

set -e

PROJECT_ROOT="/home/ogwu/workspace/solaraudit"
REPOSITORY_DIR="$PROJECT_ROOT/src/repositories"

echo "========================================"
echo "  SolarAudit Repository Scaffold"
echo "========================================"
echo

cd "$PROJECT_ROOT" || exit 1

REPOSITORIES=(
  "project"
  "audit"
  "load"
  "solar"
  "battery"
  "inverter"
  "charge-controller"
  "cable"
  "protection"
  "energy"
  "costing"
  "report"
)

mkdir -p "$REPOSITORY_DIR"

for repository in "${REPOSITORIES[@]}"; do

  REPOSITORY_PATH="$REPOSITORY_DIR/$repository"
  README="$REPOSITORY_PATH/README.md"

  if [ -d "$REPOSITORY_PATH" ]; then
    echo "SKIP folder:  $repository"
  else
    mkdir -p "$REPOSITORY_PATH"
    echo "CREATE folder: $repository"
  fi

  if [ -f "$README" ]; then
    echo "SKIP README:  $repository/README.md"
  else

    TITLE=$(echo "$repository" | tr '-' ' ' | awk '
      {
        for (i = 1; i <= NF; i++)
          $i = toupper(substr($i,1,1)) substr($i,2)
        print
      }
    ')

    cat > "$README" <<EOF
# SolarAudit — $TITLE Repository

## Overview

This repository module provides the data-access boundary for
$TITLE records.

## Responsibilities

- Persist $TITLE data
- Retrieve $TITLE data
- Update existing $TITLE records
- Delete $TITLE records when required
- Keep database access separate from UI components
- Keep database access separate from engineering calculations

## Architecture

\`\`\`text
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
\`\`\`

## Engineering Boundary

Engineering calculations must remain under:

\`\`\`text
src/engineering/
\`\`\`

The repository is responsible for persistence, not engineering
calculation logic.

## Structure

\`\`\`text
$repository/
└── README.md
\`\`\`

## Status

Repository scaffold created. Implementation pending.
EOF

    echo "CREATE README: $repository/README.md"
  fi

  echo
done

echo "========================================"
echo "  Repository Structure"
echo "========================================"
echo

if command -v tree >/dev/null 2>&1; then
  tree "$REPOSITORY_DIR" -L 2
else
  find "$REPOSITORY_DIR" -maxdepth 2 -print | sort
fi

echo
echo "========================================"
echo "  Scaffold Complete"
echo "========================================"