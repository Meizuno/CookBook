const SKIP_PATHS = [
  "/api/auth/google",
  "/api/auth/callback",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/_nuxt_icon/",
];

export default defineEventHandler(async (event) => {
  const path = event.path ?? "";
  if (SKIP_PATHS.some((p) => path.startsWith(p))) return;

  // Run auth for both page requests and API requests
  // For page requests: cookies are set on the real browser response
  // For API requests: user is available via event.context
  if (path.startsWith("/api/") || !path.includes(".")) {
    await authenticate(event);
  }
});
