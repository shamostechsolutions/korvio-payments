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

export type PawapayFailure = {
  failureCode?: string;
  failureMessage?: string;
  payoutId?: string;
  status?: string;
  httpStatus?: number;
};

export function parsePawapayFailure(
  body: unknown,
  httpStatus?: number,
): PawapayFailure | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const failureReason = record.failureReason;
  const reason =
    failureReason && typeof failureReason === "object"
      ? (failureReason as Record<string, unknown>)
      : null;

  const failureCode =
    typeof reason?.failureCode === "string" ? reason.failureCode : undefined;
  const failureMessage =
    typeof reason?.failureMessage === "string"
      ? reason.failureMessage
      : typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : undefined;

  if (!failureCode && !failureMessage) return null;

  return {
    failureCode,
    failureMessage,
    payoutId: typeof record.payoutId === "string" ? record.payoutId : undefined,
    status: typeof record.status === "string" ? record.status : undefined,
    httpStatus,
  };
}

/** User-facing text: PawaPay's own failureMessage only (fallback to failureCode). */
export function formatPawapayError(error: PawapayApiError): string {
  const failure = parsePawapayFailure(error.body, error.status);
  if (failure?.failureMessage) return failure.failureMessage;
  if (failure?.failureCode) return failure.failureCode;
  return error.message;
}

export function logPawapayFailure(
  context: string,
  body: unknown,
  httpStatus?: number,
) {
  console.error(`[pawapay/${context}]`, {
    httpStatus,
    response: body,
    failure: parsePawapayFailure(body, httpStatus),
  });
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
    logPawapayFailure(path.replace(/^\//, ""), body, response.status);
    throw new PawapayApiError(
      `PawaPay API error (${response.status})`,
      response.status,
      body,
    );
  }

  return body as T;
}
