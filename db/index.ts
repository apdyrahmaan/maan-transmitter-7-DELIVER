import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema.js";

// Created on first use so the connection details provided by the Netlify
// runtime are read at request time, not while the module is loading.
let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  client ??= drizzle({ schema });
  return client;
}
