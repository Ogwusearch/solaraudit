#!/usr/bin/env bash

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/validation"

cd "/home/ogwu/workspace/solaraudit"

echo "========================================"
echo " SolarAudit Validation Engine Update"
echo "========================================"
echo

if [[ ! -d "$ROOT" ]]; then
  echo "ERROR: Validation Engine not found:"
  echo "$ROOT"
  exit 1
fi

# ---------------------------------------------------------
# Backup
# ---------------------------------------------------------

BACKUP="$ROOT/.backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"

cp "$ROOT/types.ts" "$BACKUP/types.ts"
cp "$ROOT/constants.ts" "$BACKUP/constants.ts"
cp "$ROOT/validation.ts" "$BACKUP/validation.ts"
cp "$ROOT/calculation.ts" "$BACKUP/calculation.ts"
cp "$ROOT/rulesCatalog.ts" "$BACKUP/rulesCatalog.ts"
cp "$ROOT/index.ts" "$BACKUP/index.ts"

echo "Backup created:"
echo "  $BACKUP"
echo

# ---------------------------------------------------------
# 1. Rename misleading PV rule
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

root = Path("/home/ogwu/workspace/solaraudit/src/engineering/validation")

files = [
    root / "types.ts",
    root / "rulesCatalog.ts",
    root / "calculation.ts",
    root / "__tests__" / "calculation.test.ts",
]

old = "PV_ARRAY_POWER_MATCHES_BATTERY_C_RATE"
new = "PV_ARRAY_POWER_MATCHES_BATTERY_CAPACITY"

for file in files:
    if not file.exists():
        continue

    text = file.read_text()

    if old in text:
        file.write_text(text.replace(old, new))
        print(f"Updated: {file}")
PY

# ---------------------------------------------------------
# 2. Remove unused C-rate constants
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

file = Path(
    "/home/ogwu/workspace/solaraudit/src/engineering/validation/constants.ts"
)

text = file.read_text()

text = text.replace(
    'export const C_RATE_WARN_THRESHOLD = 0.5;        // charge/discharge below this warns\n',
    ''
)

text = text.replace(
    'export const C_RATE_MIN_THRESHOLD = 0.2;         // below this is an error\n',
    ''
)

file.write_text(text)

print("Removed unused C-rate constants.")
PY

# ---------------------------------------------------------
# 3. Rename voltage-drop tolerance
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

root = Path("/home/ogwu/workspace/solaraudit/src/engineering/validation")

for file in [
    root / "constants.ts",
    root / "calculation.ts",
]:
    text = file.read_text()
    text = text.replace(
        "DROP_OVERSHOOT_WARN",
        "DROP_FAILURE_TOLERANCE"
    )
    file.write_text(text)

print("Renamed DROP_OVERSHOOT_WARN -> DROP_FAILURE_TOLERANCE.")
PY

# ---------------------------------------------------------
# 4. Replace structural validation
# ---------------------------------------------------------

cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Validation Engine: Structural Validation
 *
 * Validates the shape and numerical integrity of ValidationInput.
 *
 * This layer does NOT determine whether the engineering design is good.
 * That responsibility belongs to calculation.ts.
 *
 * Rules:
 *   - Never throw for normal invalid input.
 *   - Collect all structural errors.
 *   - Reject NaN and Infinity.
 *   - Reject invalid negative/zero values where appropriate.
 */

import type { ValidationInput } from "./types";

import {
  ERROR_MISSING_CONFIG,
  ERROR_NEGATIVE_DAILY_ENERGY,
  ERROR_NEGATIVE_ARRAY_KWP,
  ERROR_NEGATIVE_BATTERY_CAPACITY,
  ERROR_INVALID_RULE_CODE,
} from "./errors";

import { ALL_RULE_CODES } from "./rulesCatalog";

function validateFiniteNonNegative(
  value: number,
  message: string,
  errors: string[],
): void {
  if (!Number.isFinite(value) || value < 0) {
    errors.push(message);
  }
}

function validateFinitePositive(
  value: number,
  message: string,
  errors: string[],
): void {
  if (!Number.isFinite(value) || value <= 0) {
    errors.push(message);
  }
}

export function validateInput(
  input: ValidationInput,
): string[] {
  const errors: string[] = [];

  if (!input || !input.config) {
    errors.push(ERROR_MISSING_CONFIG);
    return errors;
  }

  const c = input.config;

  // -------------------------------------------------------
  // System
  // -------------------------------------------------------

  validateFiniteNonNegative(
    c.dailyEnergyRequirementKwh,
    ERROR_NEGATIVE_DAILY_ENERGY,
    errors,
  );

  // -------------------------------------------------------
  // PV
  // -------------------------------------------------------

  if (c.pv) {
    validateFiniteNonNegative(
      c.pv.arrayKwp,
      ERROR_NEGATIVE_ARRAY_KWP,
      errors,
    );

    validateFiniteNonNegative(
      c.pv.arrayVoc,
      "pv.arrayVoc must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.pv.arrayIsc,
      "pv.arrayIsc must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.pv.arrayImp,
      "pv.arrayImp must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.pv.dailyGenerationKwh,
      "pv.dailyGenerationKwh must be finite and >= 0.",
      errors,
    );
  }

  // -------------------------------------------------------
  // Battery
  // -------------------------------------------------------

  if (c.battery) {
    validateFinitePositive(
      c.battery.bankVoltage,
      "battery.bankVoltage must be finite and > 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.battery.bankCapacityAh,
      ERROR_NEGATIVE_BATTERY_CAPACITY,
      errors,
    );

    validateFiniteNonNegative(
      c.battery.installedKwh,
      "battery.installedKwh must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.battery.maxChargeCurrentA,
      "battery.maxChargeCurrentA must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.battery.maxDischargeCurrentA,
      "battery.maxDischargeCurrentA must be finite and >= 0.",
      errors,
    );
  }

  // -------------------------------------------------------
  // Inverter
  // -------------------------------------------------------

  if (c.inverter) {
    validateFinitePositive(
      c.inverter.systemVoltage,
      "inverter.systemVoltage must be finite and > 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.inverter.recommendedVa,
      "inverter.recommendedVa must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.inverter.continuousLoadW,
      "inverter.continuousLoadW must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.inverter.peakLoadW,
      "inverter.peakLoadW must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.inverter.surgeLoadW,
      "inverter.surgeLoadW must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.inverter.dcInputCurrentA,
      "inverter.dcInputCurrentA must be finite and >= 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.inverter.dcSurgeCurrentA,
      "inverter.dcSurgeCurrentA must be finite and >= 0.",
      errors,
    );
  }

  // -------------------------------------------------------
  // Charge Controller
  // -------------------------------------------------------

  if (c.chargeController) {
    validateFinitePositive(
      c.chargeController.batteryVoltage,
      "chargeController.batteryVoltage must be finite and > 0.",
      errors,
    );

    validateFiniteNonNegative(
      c.chargeController.recommendedCurrentA,
      "chargeController.recommendedCurrentA must be finite and >= 0.",
      errors,
    );

    if (c.chargeController.maxPvInputVoltage !== undefined) {
      validateFinitePositive(
        c.chargeController.maxPvInputVoltage,
        "chargeController.maxPvInputVoltage must be finite and > 0.",
        errors,
      );
    }

    if (c.chargeController.maxPvInputCurrentA !== undefined) {
      validateFiniteNonNegative(
        c.chargeController.maxPvInputCurrentA,
        "chargeController.maxPvInputCurrentA must be finite and >= 0.",
        errors,
      );
    }

    if (c.chargeController.maxOutputCurrentA !== undefined) {
      validateFiniteNonNegative(
        c.chargeController.maxOutputCurrentA,
        "chargeController.maxOutputCurrentA must be finite and >= 0.",
        errors,
      );
    }
  }

  // -------------------------------------------------------
  // Cables
  // -------------------------------------------------------

  if (c.cables) {
    for (const cable of c.cables) {
      validateFiniteNonNegative(
        cable.currentA,
        "cable.currentA must be finite and >= 0.",
        errors,
      );

      validateFiniteNonNegative(
        cable.deratedAmpacityA,
        "cable.deratedAmpacityA must be finite and >= 0.",
        errors,
      );

      validateFiniteNonNegative(
        cable.actualDropPercent,
        "cable.actualDropPercent must be finite and >= 0.",
        errors,
      );

      if (cable.targetDropPercent !== undefined) {
        validateFiniteNonNegative(
          cable.targetDropPercent,
          "cable.targetDropPercent must be finite and >= 0.",
          errors,
        );
      }
    }
  }

  // -------------------------------------------------------
  // Protection
  // -------------------------------------------------------

  if (c.protections) {
    for (const protection of c.protections) {
      validateFiniteNonNegative(
        protection.selectedRatingA,
        "protection.selectedRatingA must be finite and >= 0.",
        errors,
      );

      validateFiniteNonNegative(
        protection.designCurrentA,
        "protection.designCurrentA must be finite and >= 0.",
        errors,
      );

      validateFinitePositive(
        protection.minimumVoltageRatingV,
        "protection.minimumVoltageRatingV must be finite and > 0.",
        errors,
      );

      if (protection.selectedVoltageRatingV !== undefined) {
        validateFinitePositive(
          protection.selectedVoltageRatingV,
          "protection.selectedVoltageRatingV must be finite and > 0.",
          errors,
        );
      }

      if (protection.selectedInterruptRatingKa !== undefined) {
        validateFinitePositive(
          protection.selectedInterruptRatingKa,
          "protection.selectedInterruptRatingKa must be finite and > 0.",
          errors,
        );
      }

      if (protection.availableFaultCurrentKa !== undefined) {
        validateFiniteNonNegative(
          protection.availableFaultCurrentKa,
          "protection.availableFaultCurrentKa must be finite and >= 0.",
          errors,
        );
      }
    }
  }

  // -------------------------------------------------------
  // Rule suppression
  // -------------------------------------------------------

  for (const code of input.skipRules ?? []) {
    if (!ALL_RULE_CODES.has(code)) {
      errors.push(ERROR_INVALID_RULE_CODE(String(code)));
    }
  }

  return errors;
}
EOF

echo "Structural validation updated."
echo

# ---------------------------------------------------------
# 5. Update calculation status handling
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

file = Path(
    "/home/ogwu/workspace/solaraudit/src/engineering/validation/calculation.ts"
)

text = file.read_text()

old = '''  const errorCount = failedRules.length;
  const warningCount = warningRules.length;
  const infoCount = infoRules.length;

  const overallStatus: ValidationResult["overallStatus"] =
    errorCount > 0 ? "invalid" : warningCount > 0 ? "warning" : "valid";
'''

new = '''  const errorCount = failedRules.length;
  const warningCount =
    warningRules.length + engineWarnings.length;
  const infoCount = infoRules.length;

  const overallStatus: ValidationResult["overallStatus"] =
    errorCount > 0
      ? "invalid"
      : warningCount > 0
        ? "warning"
        : "valid";
'''

if old not in text:
    raise SystemExit(
        "Could not locate calculation status block."
    )

text = text.replace(old, new)

file.write_text(text)

print("Updated overallStatus/warningCount handling.")
PY

# ---------------------------------------------------------
# 6. Update tests for renamed rule
# ---------------------------------------------------------

python3 <<'PY'
from pathlib import Path

root = Path(
    "/home/ogwu/workspace/solaraudit/src/engineering/validation"
)

for file in [
    root / "__tests__" / "calculation.test.ts",
    root / "__tests__" / "integration.test.ts",
]:
    if not file.exists():
        continue

    text = file.read_text()

    text = text.replace(
        "PV_ARRAY_POWER_MATCHES_BATTERY_C_RATE",
        "PV_ARRAY_POWER_MATCHES_BATTERY_CAPACITY",
    )

    file.write_text(text)

print("Updated test rule names.")
PY

# ---------------------------------------------------------
# 7. Add NaN/Infinity tests
# ---------------------------------------------------------

cat >> "$ROOT/__tests__/validation.test.ts" <<'EOF'

describe("validateInput — numeric integrity", () => {
  it("rejects NaN daily energy", () => {
    const errors = validateInput({
      config: {
        dailyEnergyRequirementKwh: Number.NaN,
      },
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects Infinity daily energy", () => {
    const errors = validateInput({
      config: {
        dailyEnergyRequirementKwh: Number.POSITIVE_INFINITY,
      },
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects NaN PV voltage", () => {
    const errors = validateInput({
      config: {
        dailyEnergyRequirementKwh: 10,
        pv: {
          arrayKwp: 4,
          arrayVoc: Number.NaN,
          arrayIsc: 10,
          arrayImp: 9,
          dailyGenerationKwh: 10,
        },
      },
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects Infinity battery voltage", () => {
    const errors = validateInput({
      config: {
        dailyEnergyRequirementKwh: 10,
        battery: {
          bankVoltage: Number.POSITIVE_INFINITY,
          bankCapacityAh: 100,
          installedKwh: 4.8,
          maxChargeCurrentA: 100,
          maxDischargeCurrentA: 100,
        },
      },
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
EOF

# ---------------------------------------------------------
# 8. Add missing-component warning test
# ---------------------------------------------------------

cat >> "$ROOT/__tests__/calculation.test.ts" <<'EOF'

describe("calculateInternal — engine warnings", () => {
  it("changes overallStatus to warning when components are missing", () => {
    const r = calculateInternal({
      config: {
        dailyEnergyRequirementKwh: 10,
      },
    });

    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warningCount).toBeGreaterThan(0);
    expect(r.overallStatus).toBe("warning");
  });
});
EOF

# ---------------------------------------------------------
# 9. TypeScript
# ---------------------------------------------------------

echo "========================================"
echo " TypeScript"
echo "========================================"

npx tsc --noEmit

echo
echo "TypeScript passed."
echo

# ---------------------------------------------------------
# 10. Tests
# ---------------------------------------------------------

echo "========================================"
echo " Validation Engine Tests"
echo "========================================"

npx vitest run src/engineering/validation

echo
echo "========================================"
echo " UPDATE COMPLETE"
echo "========================================"
echo
echo "Validation Engine:"
echo "  $ROOT"
echo
echo "Backup:"
echo "  $BACKUP"
echo