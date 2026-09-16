import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_NO_PV_ARRAYS,
  ERROR_INVALID_CONSUMPTION,
  ERROR_INVALID_DAYS,
  ERROR_INVALID_BATTERY_CAPACITY,
} from "../errors";

const pv = {
  name: "Roof",
  capacityKwp: 5,
  peakSunHours: 4.5,
  performanceRatio: 0.8,
};

const base = {
  pvArrays: [pv],
  dailyConsumptionKwh: 10,
  days: 1,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects empty pvArrays", () => {
    const errs = validateInput({ ...base, pvArrays: [] });
    expect(errs).toContain(ERROR_NO_PV_ARRAYS);
  });

  it("rejects negative consumption", () => {
    const errs = validateInput({ ...base, dailyConsumptionKwh: -1 });
    expect(errs).toContain(ERROR_INVALID_CONSUMPTION);
  });

  it("rejects non-integer days", () => {
    const errs = validateInput({ ...base, days: 1.5 });
    expect(errs).toContain(ERROR_INVALID_DAYS);
  });

  it("rejects bad battery capacity", () => {
    const errs = validateInput({
      ...base,
      battery: {
        name: "B",
        capacityKwh: 0,
        depthOfDischarge: 0.9,
        roundTripEfficiency: 0.9,
        initialSoc: 0.5,
      },
    });
    expect(errs).toContain(ERROR_INVALID_BATTERY_CAPACITY);
  });
});
