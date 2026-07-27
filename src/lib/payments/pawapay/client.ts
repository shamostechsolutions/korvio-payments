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
