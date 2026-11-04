import type { Config } from "@netlify/functions";
import serverless from "serverless-http";
import app from "../../server.js";
import { withState, StateConflictError } from "../lib/state.js";

const BINARY_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
];

const expressHandler = serverless(app, { binary: BINARY_TYPES });

// Converts the incoming web Request into the event shape the Express adapter expects.
async function toEvent(req: Request) {
  const url = new URL(req.url);
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => (headers[key] = value));
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => (query[key] = value));
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : null;
  // Express only parses a body when its length is declared.
  if (body && body.length) headers["content-length"] = String(body.length);
  else delete headers["content-length"];
  return {
    httpMethod: req.method,
    path: url.pathname,
    headers,
    queryStringParameters: Object.keys(query).length ? query : null,
    body: body && body.length ? body.toString("base64") : null,
    isBase64Encoded: Boolean(body && body.length),
    requestContext: {},
  };
}

function toResponse(result: any) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(result.headers || {})) {
    headers.set(key, String(value));
  }
  for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
    headers.delete(key);
    for (const value of values as unknown[]) headers.append(key, String(value));
  }
  const body = result.body
    ? result.isBase64Encoded
      ? Buffer.from(result.body, "base64")
      : result.body
    : null;
  return new Response(body, { status: result.statusCode || 200, headers });
}

export default async (req: Request, context: unknown) => {
  try {
    const event = await toEvent(req);
    const result = await withState(() => expressHandler(event, context as any) as Promise<any>);
    return toResponse(result);
  } catch (error) {
    const conflict = error instanceof StateConflictError;
    if (!conflict) console.error("API function error:", error);
    return Response.json(
      {
        success: false,
        message: conflict
          ? (error as Error).message
          : "Server-ka khalad ayaa ka dhacay. Fadlan isku day mar kale.",
      },
      { status: conflict ? 409 : 500 }
    );
  }
};

export const config: Config = {
  path: "/api/*",
};
