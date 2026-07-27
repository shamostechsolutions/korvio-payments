import { pawapayApiBaseUrl, pawapayApiToken } from "./config";

export class PawapayApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "PawapayApiError";
  }
}

function readFailureMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const failureReason = record.failureReason;
  if (failureReason && typeof failureReason === "object") {
    const reason = failureReason as Record<string, unknown>;
    const code = typeof reason.failureCode === "string" ? reason.failureCode : null;
    const message = typeof reason.failureMessage === "string" ? reason.failureMessage : null;
    if (code && message) return `${code}: ${message}`;
    if (message) return message;
    if (code) return code;
  }

  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;

  return null;
}

export function formatPawapayError(error: PawapayApiError): string {
  const detail = readFailureMessage(error.body);
  if (detail) {
    return `PawaPay rejected the request (${error.status}): ${detail}`;
  }
  return error.message;
}

export async function pawapayRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${pawapayApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${pawapayApiToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new PawapayApiError(
      `PawaPay API error (${response.status})`,
      response.status,
      body,
    );
  }

  return body as T;
}
