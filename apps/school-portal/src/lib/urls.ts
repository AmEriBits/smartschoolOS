export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");
