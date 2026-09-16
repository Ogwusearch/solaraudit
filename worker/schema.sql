-- /home/ogwu/workspace/solaraudit/worker/schema.sql
--
-- SolarAudit — D1 / SQLite schema
--
-- Design principles:
--   1. Every table is scoped to a project or an audit.
--   2. IDs are TEXT — the app generates ULIDs/UUIDs, not the DB.
--   3. Timestamps are TEXT ISO 8601 (UTC) — sortable, portable.
--   4. Structured data gets real columns; complex results get JSON.
--   5. Calculation results are stored per-engine so new engines do not
--      require schema changes.
--   6. Every mutable row carries created_at / updated_at.
--   7. Soft-delete via deleted_at on user-visible rows (projects,
--      clients, reports). Hard-delete elsewhere.

PRAGMA foreign_keys = ON;

-- =====================================================================
-- Schema versioning
-- =====================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,
  applied_at  TEXT NOT NULL
);

-- =====================================================================
-- Users
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT,                    -- null if SSO-only
  role          TEXT NOT NULL DEFAULT 'auditor'
                CHECK (role IN ('admin', 'auditor', 'viewer')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- =====================================================================
-- Clients
-- =====================================================================

CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT REFERENCES users (id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address       TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients (owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_name  ON clients (name);

-- =====================================================================
-- Projects
-- =====================================================================

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,
  client_id    TEXT REFERENCES clients (id) ON DELETE SET NULL,
  owner_id     TEXT REFERENCES users (id)   ON DELETE SET NULL,
  name         TEXT NOT NULL,
  site_address TEXT,
  auditor_name TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner  ON projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects (updated_at DESC);

-- =====================================================================
-- Audits
--
-- One project → many audits. An audit is a snapshot of a design at a
-- point in time: a load profile, energy analysis, sizing selections,
-- and every calculation result that produced them.
-- =====================================================================

CREATE TABLE IF NOT EXISTS audits (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  version      INTEGER NOT NULL DEFAULT 1,
  label        TEXT,                       -- e.g. "Initial design", "Rev 2"
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'complete', 'signed-off', 'archived')),
  currency     TEXT,                       -- ISO 4217, for costing
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  created_by   TEXT REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audits_project ON audits (project_id);
CREATE INDEX IF NOT EXISTS idx_audits_status  ON audits (status);

-- =====================================================================
-- Load audit — appliance rows
-- =====================================================================

CREATE TABLE IF NOT EXISTS load_items (
  id                 TEXT PRIMARY KEY,
  audit_id           TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  power_watts        REAL NOT NULL,
  hours_per_day      REAL NOT NULL,
  quantity           INTEGER NOT NULL DEFAULT 1,
  power_factor       REAL,
  diversity_factor   REAL,
  essential          INTEGER NOT NULL DEFAULT 0,   -- 0/1 boolean
  usage_pattern      TEXT,                         -- e.g. "evening", "24h"
  notes              TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_load_items_audit ON load_items (audit_id);

-- =====================================================================
-- Energy analysis — daily totals + PV arrays + optional battery
--
-- The engine is called once per audit. Inputs are kept here so the
-- result can be reproduced exactly.
-- =====================================================================

CREATE TABLE IF NOT EXISTS energy_configs (
  id                     TEXT PRIMARY KEY,
  audit_id               TEXT NOT NULL UNIQUE
                         REFERENCES audits (id) ON DELETE CASCADE,
  daily_consumption_kwh  REAL NOT NULL,
  days                   INTEGER NOT NULL DEFAULT 1,
  battery_enabled        INTEGER NOT NULL DEFAULT 0,
  battery_capacity_kwh   REAL,
  battery_dod            REAL,
  battery_rte            REAL,
  battery_initial_soc    REAL,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_energy_configs_audit ON energy_configs (audit_id);

CREATE TABLE IF NOT EXISTS pv_arrays (
  id                TEXT PRIMARY KEY,
  energy_config_id  TEXT NOT NULL
                    REFERENCES energy_configs (id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  capacity_kwp      REAL NOT NULL,
  peak_sun_hours    REAL NOT NULL,
  performance_ratio REAL NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pv_arrays_energy
  ON pv_arrays (energy_config_id);

-- =====================================================================
-- Solar sizing
-- =====================================================================

CREATE TABLE IF NOT EXISTS solar_configs (
  id                  TEXT PRIMARY KEY,
  audit_id            TEXT NOT NULL UNIQUE
                      REFERENCES audits (id) ON DELETE CASCADE,
  daily_energy_kwh    REAL NOT NULL,
  peak_sun_hours      REAL NOT NULL,
  system_efficiency   REAL NOT NULL,
  design_margin       REAL NOT NULL,
  panel_name          TEXT NOT NULL,
  panel_watts         REAL NOT NULL,
  panel_vmp           REAL NOT NULL,
  panel_imp           REAL NOT NULL,
  panel_voc           REAL NOT NULL,
  panel_isc           REAL NOT NULL,
  max_series_panels   INTEGER,
  max_parallel_strings INTEGER,
  max_array_voc       REAL,
  min_array_vmp       REAL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_solar_configs_audit ON solar_configs (audit_id);

-- =====================================================================
-- Battery sizing
-- =====================================================================

CREATE TABLE IF NOT EXISTS battery_configs (
  id                     TEXT PRIMARY KEY,
  audit_id               TEXT NOT NULL UNIQUE
                         REFERENCES audits (id) ON DELETE CASCADE,
  daily_energy_kwh       REAL NOT NULL,
  autonomy_days          REAL NOT NULL,
  system_voltage         REAL NOT NULL,
  design_margin          REAL NOT NULL,
  temperature_derating   REAL NOT NULL,
  max_dod                REAL NOT NULL,
  round_trip_efficiency  REAL NOT NULL,
  cell_name              TEXT NOT NULL,
  cell_technology        TEXT NOT NULL,
  cell_voltage           REAL NOT NULL,
  cell_capacity_ah       REAL NOT NULL,
  cell_max_dod           REAL NOT NULL,
  cell_rte               REAL NOT NULL,
  cell_max_charge_a      REAL,
  max_parallel_strings   INTEGER,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_battery_configs_audit
  ON battery_configs (audit_id);

-- =====================================================================
-- Inverter sizing
-- =====================================================================

CREATE TABLE IF NOT EXISTS inverter_configs (
  id                    TEXT PRIMARY KEY,
  audit_id              TEXT NOT NULL UNIQUE
                        REFERENCES audits (id) ON DELETE CASCADE,
  continuous_load_w     REAL NOT NULL,
  peak_load_w           REAL NOT NULL,
  surge_load_w          REAL NOT NULL,
  system_voltage        REAL NOT NULL,
  output_voltage        REAL NOT NULL,
  output_frequency      REAL NOT NULL,
  power_factor          REAL NOT NULL,
  design_margin         REAL NOT NULL,
  inverter_efficiency   REAL NOT NULL,
  surge_duration_sec    REAL,
  type                  TEXT,
  topology              TEXT,
  max_dc_input_current  REAL,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inverter_configs_audit
  ON inverter_configs (audit_id);

-- =====================================================================
-- Charge controller sizing
-- =====================================================================

CREATE TABLE IF NOT EXISTS charge_controller_configs (
  id                     TEXT PRIMARY KEY,
  audit_id               TEXT NOT NULL UNIQUE
                         REFERENCES audits (id) ON DELETE CASCADE,
  pv_array_kwp           REAL NOT NULL,
  pv_vmp                 REAL NOT NULL,
  pv_voc                 REAL NOT NULL,
  pv_imp                 REAL NOT NULL,
  pv_isc                 REAL NOT NULL,
  battery_voltage        REAL NOT NULL,
  battery_capacity_ah    REAL NOT NULL,
  technology             TEXT NOT NULL CHECK (technology IN ('mppt', 'pwm')),
  design_margin          REAL NOT NULL,
  controller_efficiency  REAL NOT NULL,
  max_pv_input_voltage   REAL,
  max_pv_input_current   REAL,
  max_output_current     REAL,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_charge_controller_configs_audit
  ON charge_controller_configs (audit_id);

-- =====================================================================
-- Cable runs — one row per protected circuit
-- =====================================================================

CREATE TABLE IF NOT EXISTS cable_runs (
  id                       TEXT PRIMARY KEY,
  audit_id                 TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  role                     TEXT NOT NULL,      -- "battery", "pv-string", ...
  current_a                REAL NOT NULL,
  length_m                 REAL NOT NULL,
  system_voltage           REAL NOT NULL,
  allowable_drop_percent   REAL NOT NULL,
  material                 TEXT NOT NULL
                           CHECK (material IN ('copper', 'aluminium')),
  circuit_type             TEXT NOT NULL
                           CHECK (circuit_type IN
                             ('dc', 'ac-single-phase', 'ac-three-phase')),
  installation_method      TEXT NOT NULL
                           CHECK (installation_method IN
                             ('conduit', 'cable-tray', 'buried',
                              'free-air', 'enclosed')),
  ambient_temperature_c    REAL,
  conductor_temperature_c  REAL,
  grouping_count           INTEGER,
  design_margin            REAL,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cable_runs_audit ON cable_runs (audit_id);

-- =====================================================================
-- Protection devices — one row per circuit, mirroring cable runs
-- =====================================================================

CREATE TABLE IF NOT EXISTS protection_devices (
  id                       TEXT PRIMARY KEY,
  audit_id                 TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  role                     TEXT NOT NULL,
  voltage_type             TEXT NOT NULL CHECK (voltage_type IN ('dc', 'ac')),
  technology               TEXT NOT NULL,
  continuous_current_a     REAL NOT NULL,
  system_voltage_v         REAL NOT NULL,
  safety_factor            REAL,
  available_fault_current  REAL,
  device_voltage_rating    REAL,
  device_interrupt_rating  REAL,
  device_current_rating    REAL,
  quantity                 INTEGER NOT NULL DEFAULT 1,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_protection_devices_audit
  ON protection_devices (audit_id);

-- =====================================================================
-- Standalone voltage-drop calculations
--
-- Kept separate from cable_runs — these are ad-hoc queries that do not
-- belong to a cable sizing pass.
-- =====================================================================

CREATE TABLE IF NOT EXISTS voltage_drop_calculations (
  id                    TEXT PRIMARY KEY,
  audit_id              TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  label                 TEXT,
  current_a             REAL NOT NULL,
  length_m              REAL NOT NULL,
  system_voltage_v      REAL NOT NULL,
  material              TEXT NOT NULL,
  circuit_type          TEXT NOT NULL,
  conductor_area_mm2    REAL,
  target_drop_percent   REAL,
  conductor_temp_c      REAL,
  power_factor          REAL,
  reactance_ohm_per_km  REAL,
  created_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voltage_drop_audit
  ON voltage_drop_calculations (audit_id);

-- =====================================================================
-- Calculation results — traceability table
--
-- One row per engine per audit. Inputs and outputs are stored as JSON
-- so the record can be reproduced exactly, and the schema does not
-- change when a new engine is added.
--
-- Expected `engine` values (not enforced by CHECK, so it stays open):
--   load, energy, solar, battery, inverter, charge-controller,
--   cable, voltage-drop, protection, bom, costing, validation, report
-- =====================================================================

CREATE TABLE IF NOT EXISTS calculation_results (
  id                 TEXT PRIMARY KEY,
  audit_id           TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  engine             TEXT NOT NULL,
  engine_version     TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'valid'
                     CHECK (status IN ('valid', 'warning', 'invalid')),
  inputs_json        TEXT NOT NULL,
  assumptions_json   TEXT,
  result_json        TEXT NOT NULL,
  warnings_json      TEXT,
  errors_json        TEXT,
  computed_at        TEXT NOT NULL,
  computed_by        TEXT REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_calc_results_audit
  ON calculation_results (audit_id);
CREATE INDEX IF NOT EXISTS idx_calc_results_engine
  ON calculation_results (audit_id, engine);

-- =====================================================================
-- Bill of materials
-- =====================================================================

CREATE TABLE IF NOT EXISTS bom_items (
  id            TEXT PRIMARY KEY,
  audit_id      TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  specification TEXT,
  quantity      REAL NOT NULL,
  unit          TEXT NOT NULL,
  manufacturer  TEXT,
  part_number   TEXT,
  supplier      TEXT,
  unit_cost     REAL,
  currency      TEXT,
  notes         TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bom_items_audit    ON bom_items (audit_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_category ON bom_items (audit_id, category);

-- =====================================================================
-- Costing
-- =====================================================================

CREATE TABLE IF NOT EXISTS costing (
  id                  TEXT PRIMARY KEY,
  audit_id            TEXT NOT NULL UNIQUE
                      REFERENCES audits (id) ON DELETE CASCADE,
  currency            TEXT NOT NULL,
  waste_factor        REAL,
  discount_percent    REAL,
  tax_percent         REAL,
  installation_pct    REAL,
  transport_pct       REAL,
  engineering_pct     REAL,
  contingency_pct     REAL,
  material_subtotal   REAL,
  waste_cost          REAL,
  adjusted_materials  REAL,
  overheads_subtotal  REAL,
  contingency_cost    REAL,
  pre_discount_total  REAL,
  discount_amount     REAL,
  after_discount      REAL,
  tax_amount          REAL,
  grand_total         REAL,
  category_breakdown  TEXT,     -- JSON array
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_costing_audit ON costing (audit_id);

-- =====================================================================
-- Reports
--
-- The structured report document. Sections are stored as JSON — the
-- renderer (PDF/HTML) consumes this.
-- =====================================================================

CREATE TABLE IF NOT EXISTS reports (
  id                    TEXT PRIMARY KEY,
  audit_id              TEXT NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
  project_name          TEXT NOT NULL,
  client_name           TEXT,
  site_address          TEXT,
  auditor_name          TEXT,
  report_version        TEXT NOT NULL,
  calculation_version   TEXT NOT NULL,
  currency              TEXT,
  overall_status        TEXT NOT NULL
                        CHECK (overall_status IN
                          ('complete', 'partial', 'invalid')),
  document_json         TEXT NOT NULL,   -- ReportResult
  assumptions_json      TEXT,
  trace_json            TEXT,
  generated_at          TEXT NOT NULL,
  generated_by          TEXT REFERENCES users (id) ON DELETE SET NULL,
  deleted_at            TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_audit ON reports (audit_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated
  ON reports (generated_at DESC);

-- =====================================================================
-- Settings — one row per user
--
-- app_json       holds theme, language, date format, currency
-- engineering_json holds the preferred starting values for the sizing
-- features. schema_version supports future migrations.
-- =====================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  user_id           TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  schema_version    INTEGER NOT NULL DEFAULT 1,
  app_json          TEXT NOT NULL,
  engineering_json  TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

-- =====================================================================
-- Audit log — append-only
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id           TEXT PRIMARY KEY,
  actor_id     TEXT REFERENCES users (id) ON DELETE SET NULL,
  action       TEXT NOT NULL,     -- 'create', 'update', 'delete', 'sign'
  entity_type  TEXT NOT NULL,     -- 'project', 'audit', 'report', ...
  entity_id    TEXT NOT NULL,
  project_id   TEXT REFERENCES projects (id) ON DELETE SET NULL,
  details_json TEXT,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project
  ON audit_logs (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs (created_at DESC);

-- =====================================================================
-- Mark schema version 1
-- =====================================================================

INSERT OR IGNORE INTO schema_migrations (version, applied_at)
VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));