/**
 * SolarAudit — Projects feature: Draft factories
 */

import type { ProjectDraft } from "../types";

export function createEmptyDraft(): ProjectDraft {
  return {
    name: "",
    clientName: "",
    siteAddress: "",
    auditorName: "",
    notes: "",
  };
}

export function createSampleDraft(): ProjectDraft {
  return {
    name: "Off-grid home — Lagos",
    clientName: "Mr. A. Adeyemi",
    siteAddress: "12 Bourdillon Rd, Ikoyi, Lagos",
    auditorName: "SolarAudit Team",
    notes: "Hybrid system, 5 kWp array, 48 V LFP bank.",
  };
}
