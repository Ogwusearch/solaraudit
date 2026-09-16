/**
 * SolarAudit — Cloudflare Worker (Hono)
 *
 * Thin HTTP layer over the engineering engines in src/engineering/.
 *
 * Boundary:
 *   HTTP request  ->  parse body  ->  engine call  ->  JSON response
 *
 * Engine routes are STATELESS by default. Passing ?auditId=<id> makes
 * the worker additionally record the request/result in D1 for that
 * audit. Persistence is optional and non-fatal: if the DB write fails,
 * the caller still gets the engineering result plus a saveError.
 *
 * Every engine-processed request returns HTTP 200. The engine's own
 * `isValid` field carries the engineering verdict. Non-200 responses
 * are reserved for transport problems (bad JSON, unknown route,
 * engine crash).
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

// ---------------------------------------------------------------------
// Engineering engines
// ---------------------------------------------------------------------

import { calculateLoad } from "../../src/engineering/load";
import { calculateEnergy } from "../../src/engineering/energy";
import { calculateSolar } from "../../src/engineering/solar";
import { calculateBattery } from "../../src/engineering/battery";
import { calculateInverter } from "../../src/engineering/inverter";
import { calculateChargeController } from "../../src/engineering/charge-controller";
import { calculateCable } from "../../src/engineering/cable";
import { calculateVoltageDrop } from "../../src/engineering/voltage-drop";
import { calculateProtection } from "../../src/engineering/protection";
import { calculateBom } from "../../src/engineering/bom";
import { calculateCosting } from "../../src/engineering/costing";
import { validateSystem } from "../../src/engineering/validation";
import { generateReport } from "../../src/engineering/report";
import { convertUnit } from "../../src/engineering/units";

// ---------------------------------------------------------------------
// Bindings
// ---------------------------------------------------------------------

interface Bindings {
  DB: D1Database;
}

type App = Hono<{ Bindings: Bindings }>;

// Minimal D1Database type — declared here so this file has no external
// @cloudflare/workers-types dependency. Replace with the real import
// once you install that package.
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
}
interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
}

// ---------------------------------------------------------------------
// Engine version stamp — recorded with every persisted result
// ---------------------------------------------------------------------

const ENGINE_VERSION = "0.1.0";

// ---------------------------------------------------------------------
// The engine path list — declared once, used by meta endpoints
// ---------------------------------------------------------------------

const ENGINE_PATHS = [
  "/api/load/calculate",
  "/api/energy/analyze",
  "/api/solar/size",
  "/api/battery/size",
  "/api/inverter/size",
  "/api/charge-controller/size",
  "/api/cable/size",
  "/api/voltage-drop/calculate",
  "/api/protection/size",
  "/api/bom/generate",
  "/api/costing/calculate",
  "/api/validation/validate",
  "/api/report/generate",
  "/api/units/convert",
].sort();

// =====================================================================
// Persistence helpers
//
// These are the ONLY places in the worker that touch D1. Engine
// routes call them optionally; the engines themselves stay pure.
// =====================================================================

interface PersistableResult {
  isValid?: boolean;
  warnings?: readonly string[];
  errors?: readonly string[];
}

function statusOf(result: PersistableResult): "valid" | "warning" | "invalid" {
  if (result.isValid === false) return "invalid";
  if (result.warnings && result.warnings.length > 0) return "warning";
  return "valid";
}

async function persistCalculation(
  db: D1Database,
  auditId: string,
  engine: string,
  input: unknown,
  result: PersistableResult & Record<string, unknown>,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO calculation_results
         (id, audit_id, engine, engine_version, status,
          inputs_json, result_json, warnings_json, errors_json, computed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      auditId,
      engine,
      ENGINE_VERSION,
      statusOf(result),
      JSON.stringify(input),
      JSON.stringify(result),
      JSON.stringify(result.warnings ?? []),
      JSON.stringify(result.errors ?? []),
      now,
    )
    .run();

  return id;
}

async function createProject(
  db: D1Database,
  input: { name: string; siteAddress?: string; auditorName?: string; clientName?: string },
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO projects
         (id, name, site_address, auditor_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.name,
      input.siteAddress ?? null,
      input.auditorName ?? null,
      now,
      now,
    )
    .run();

  return id;
}

async function createAudit(
  db: D1Database,
  projectId: string,
  label?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO audits
         (id, project_id, version, label, status, created_at, updated_at)
       VALUES (?, ?, 1, ?, 'draft', ?, ?)`,
    )
    .bind(id, projectId, label ?? null, now, now)
    .run();

  return id;
}

async function listCalculationResults(db: D1Database, auditId: string) {
  const { results } = await db
    .prepare(
      `SELECT id, engine, engine_version, status, computed_at
       FROM calculation_results
       WHERE audit_id = ?
       ORDER BY computed_at DESC`,
    )
    .bind(auditId)
    .all();
  return results ?? [];
}

// =====================================================================
// App
// =====================================================================

const app: App = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "*", // TODO: restrict to known origins
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// ---------------------------------------------------------------------
// Meta endpoints
// ---------------------------------------------------------------------

app.get("/", (c) =>
  c.json({
    name: "SolarAudit API",
    version: "0.1.0",
    description:
      "Engineering decision and audit platform — calculation API.",
    endpoints: {
      health: "GET /api/health",
      engines: "GET /api/engines",
      calculate: ENGINE_PATHS,
      persistence: {
        createProject: "POST /api/projects",
        listProjects: "GET /api/projects",
        createAudit: "POST /api/audits",
        auditResults: "GET /api/audits/:id/results",
        persistHint:
          "Pass ?auditId=<id> to any engine route to record the result.",
      },
    },
  }),
);

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "solaraudit-api",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/api/engines", (c) =>
  c.json({
    engines: ENGINE_PATHS.map((path) => ({ method: "POST", path })),
  }),
);

// ---------------------------------------------------------------------
// Engine dispatch
//
// Every engine route is wired through the same helper. The helper:
//   1. Parses the JSON body
//   2. Rejects non-object bodies at the transport level
//   3. Calls the engine
//   4. Optionally persists (when ?auditId=<id> is present)
//   5. Returns the engine's result verbatim + save metadata
//
// The engine owns all deeper validation. Persistence is optional.
// ---------------------------------------------------------------------

type Engine = (input: any) => unknown;

function engineHandler(engine: Engine, calculationType: string) {
  return async (c: any) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { error: "invalid_json", message: "Request body must be valid JSON." },
        400,
      );
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return c.json(
        {
          error: "invalid_body",
          message: "Request body must be a JSON object.",
        },
        400,
      );
    }

    let result: any;
    try {
      result = engine(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ error: "engine_error", message }, 500);
    }

    // Optional persistence — only when ?auditId=<id> is supplied AND
    // the D1 binding is available.
    const auditId = c.req.query("auditId");
    let savedId: string | null = null;
    let saveError: string | null = null;

    if (auditId && c.env?.DB) {
      try {
        savedId = await persistCalculation(
          c.env.DB,
          auditId,
          calculationType,
          body,
          result,
        );
      } catch (err) {
        // Persistence failure MUST NOT fail the request — the caller
        // still gets the engineering result plus a saveError field.
        saveError = err instanceof Error ? err.message : String(err);
      }
    }

    return c.json({
      ok: true,
      calculationType,
      result,
      savedToAuditId: savedId,
      saveError,
    });
  };
}

// ---------------------------------------------------------------------
// Engine routes — one line per engine
// ---------------------------------------------------------------------

app.post("/api/load/calculate", engineHandler(calculateLoad, "load"));

app.post("/api/energy/analyze", engineHandler(calculateEnergy, "energy"));

app.post("/api/solar/size", engineHandler(calculateSolar, "solar"));

app.post("/api/battery/size", engineHandler(calculateBattery, "battery"));

app.post("/api/inverter/size", engineHandler(calculateInverter, "inverter"));

app.post(
  "/api/charge-controller/size",
  engineHandler(calculateChargeController, "charge-controller"),
);

app.post("/api/cable/size", engineHandler(calculateCable, "cable"));

app.post(
  "/api/voltage-drop/calculate",
  engineHandler(calculateVoltageDrop, "voltage-drop"),
);

app.post(
  "/api/protection/size",
  engineHandler(calculateProtection, "protection"),
);

app.post("/api/bom/generate", engineHandler(calculateBom, "bom"));

app.post("/api/costing/calculate", engineHandler(calculateCosting, "costing"));

app.post(
  "/api/validation/validate",
  engineHandler(validateSystem, "validation"),
);

app.post("/api/report/generate", engineHandler(generateReport, "report"));

app.post("/api/units/convert", engineHandler(convertUnit, "units"));

// ---------------------------------------------------------------------
// Persistence endpoints — projects, audits, stored results
// ---------------------------------------------------------------------

app.post("/api/projects", async (c) => {
  const body: any = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.name) {
    return c.json(
      { error: "invalid_body", message: "Body must include { name }." },
      400,
    );
  }

  try {
    const id = await createProject(c.env.DB, {
      name: String(body.name),
      siteAddress: body.siteAddress ? String(body.siteAddress) : undefined,
      auditorName: body.auditorName ? String(body.auditorName) : undefined,
      clientName: body.clientName ? String(body.clientName) : undefined,
    });
    return c.json({ ok: true, id }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: "db_error", message }, 500);
  }
});

app.get("/api/projects", async (c) => {
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, name, site_address, updated_at
       FROM projects
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC`,
    )
    .all();
  return c.json({ projects: results ?? [] });
});

app.post("/api/audits", async (c) => {
  const body: any = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.projectId) {
    return c.json(
      { error: "invalid_body", message: "Body must include { projectId }." },
      400,
    );
  }

  try {
    const id = await createAudit(
      c.env.DB,
      String(body.projectId),
      body.label ? String(body.label) : undefined,
    );
    return c.json({ ok: true, id }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: "db_error", message }, 500);
  }
});

app.get("/api/audits/:id/results", async (c) => {
  const auditId = c.req.param("id");
  try {
    const results = await listCalculationResults(c.env.DB, auditId);
    return c.json({ auditId, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: "db_error", message }, 500);
  }
});

// ---------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------

app.notFound((c) =>
  c.json(
    {
      error: "not_found",
      message: `No route for ${c.req.method} ${c.req.path}.`,
    },
    404,
  ),
);

// ---------------------------------------------------------------------
// Error fallback
// ---------------------------------------------------------------------

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : String(err);
  return c.json({ error: "internal_error", message }, 500);
});

export default app;