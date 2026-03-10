/**
 * Get the public origin for the request (for redirects).
 * Use headers so we get the real host in production; request.url can be internal (localhost) on some hosts.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  // If request.url has a real host (not localhost), use it
  if (url.hostname && url.hostname !== "localhost") {
    return url.origin;
  }
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protoRaw = headers.get("x-forwarded-proto") ?? url.protocol ?? "https";
  const proto = protoRaw.split(",")[0].trim().toLowerCase();
  if (host) {
    const hostClean = host.split(",")[0].trim();
    return `${proto === "https" ? "https" : "http"}://${hostClean}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
}
