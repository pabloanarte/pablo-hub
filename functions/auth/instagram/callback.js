// Adreça de retorn registrada a Meta (pablo-hub.pages.dev/auth/instagram/callback): passa el codi a l'API.
export function onRequest({ request }) {
  const u = new URL(request.url);
  return new Response(null, { status: 302, headers: { location: "/api/instagram/callback" + u.search } });
}
