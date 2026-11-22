export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/+$/, "");

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json()) as
    | T
    | { message?: string | string[] };

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? payload.message
        : undefined;
    throw new Error(
      Array.isArray(message)
        ? message.join(" ")
        : message || `The API request failed (${response.status}).`,
    );
  }

  return payload as T;
}
