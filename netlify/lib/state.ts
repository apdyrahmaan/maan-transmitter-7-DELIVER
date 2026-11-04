import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { applicationState, appSecrets } from "../../db/schema.js";
// CommonJS application modules shared with the local Express server.
import database from "../../database.js";
import auth from "../../auth.js";

const STATE_ID = "main";

export class StateConflictError extends Error {
  constructor() {
    super("Xogta waxaa isla markaas beddelay qof kale. Fadlan isku day mar kale.");
  }
}

async function loadState(): Promise<{ data: any; revision: number }> {
  const db = getDb();
  await db
    .insert(applicationState)
    .values({ id: STATE_ID, version: 0, data: database.getDefaultDatabase() })
    .onConflictDoNothing();
  const [row] = await db.select().from(applicationState).where(eq(applicationState.id, STATE_ID));
  return { data: database.normalizeDatabase(row.data), revision: row.version };
}

async function saveState(data: unknown, expectedRevision: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .update(applicationState)
    .set({ data, version: sql`${applicationState.version} + 1`, updatedAt: new Date() })
    .where(and(eq(applicationState.id, STATE_ID), eq(applicationState.version, expectedRevision)))
    .returning({ version: applicationState.version });
  if (rows.length === 0) throw new StateConflictError();
  return rows[0].version;
}

let secretReady = false;
async function ensureJwtSecret() {
  if (secretReady) return;
  const configured = process.env.JWT_SECRET;
  if (configured) {
    auth.setJwtSecret(configured);
  } else {
    const db = getDb();
    await db
      .insert(appSecrets)
      .values({ name: "jwt-secret", value: crypto.randomBytes(48).toString("hex") })
      .onConflictDoNothing();
    const [row] = await db.select().from(appSecrets).where(eq(appSecrets.name, "jwt-secret"));
    auth.setJwtSecret(row.value);
  }
  secretReady = true;
}

/**
 * Loads the application dataset, runs `work` against it, and saves it back if it
 * changed. Only one request runs per function instance at a time, so the
 * module-level request database in database.js is safe here.
 */
export async function withState<T>(work: () => Promise<T>): Promise<T> {
  process.env.MAAN_REMOTE_STORAGE = "1";
  await ensureJwtSecret();
  const { data, revision } = await loadState();
  database.setRequestDatabase(data, revision);
  try {
    const result = await work();
    const state = database.getRequestDatabaseState();
    if (state.dirty) await saveState(state.data, revision);
    return result;
  } finally {
    database.clearRequestDatabase();
  }
}
