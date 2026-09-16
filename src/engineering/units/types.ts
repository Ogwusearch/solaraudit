/**
 * SolarAudit — Units Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * The Units Engine converts values between engineering units. It is a
 * conversion service — it does not perform engineering sizing.
 *
 * Two modes in one call:
 *   1. Same-dimension  : V ↔ mV, kWh ↔ Wh, m ↔ ft, degC ↔ degF, ...
 *   2. Adjacent        : W ↔ VA (requires powerFactor)
 *                        Wh ↔ Ah (requires systemVoltage)
 */

export type Dimension =
  | "temperature"
  | "length"
  | "area"
  | "volume"
  | "mass"
  | "power"
  | "apparent-power"
  | "energy"
  | "charge"
  | "voltage"
  | "current"
  | "resistance"
  | "frequency";

export type TemperatureUnit = "degC" | "degF" | "K";
export type LengthUnit = "mm" | "cm" | "m" | "km" | "in" | "ft";
export type AreaUnit = "mm2" | "cm2" | "m2" | "in2" | "ft2";
export type VolumeUnit = "L" | "m3" | "gal";
export type MassUnit = "g" | "kg" | "lb";
export type PowerUnit = "W" | "kW" | "MW" | "hp";
export type ApparentPowerUnit = "VA" | "kVA" | "MVA";
export type EnergyUnit = "Wh" | "kWh" | "MWh" | "J" | "BTU";
export type ChargeUnit = "mAh" | "Ah" | "C";
export type VoltageUnit = "mV" | "V" | "kV";
export type CurrentUnit = "mA" | "A" | "kA";
export type ResistanceUnit = "mOhm" | "Ohm" | "kOhm";
export type FrequencyUnit = "Hz" | "kHz" | "MHz";

export type Unit =
  | TemperatureUnit
  | LengthUnit
  | AreaUnit
  | VolumeUnit
  | MassUnit
  | PowerUnit
  | ApparentPowerUnit
  | EnergyUnit
  | ChargeUnit
  | VoltageUnit
  | CurrentUnit
  | ResistanceUnit
  | FrequencyUnit;

export interface ConversionInput {
  readonly value: number;
  readonly from: Unit;
  readonly to: Unit;

  /** Required for W ↔ VA and kW ↔ kVA etc. — dimensionless, 0 < pf ≤ 1. */
  readonly powerFactor?: number;

  /** Required for Wh ↔ Ah and kWh ↔ Ah etc. — in volts, > 0. */
  readonly systemVoltage?: number;
}

export interface ConversionResult {
  readonly value: number;              // converted value
  readonly from: Unit;
  readonly to: Unit;
  readonly originalValue: number;
  readonly fromDimension: Dimension;
  readonly toDimension: Dimension;

  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
