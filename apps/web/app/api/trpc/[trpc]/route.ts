// tRPC calls go directly to the API (NEXT_PUBLIC_API_URL).
// This route is a no-op placeholder for SSR if needed later.
export async function GET() {
  return new Response("Use NEXT_PUBLIC_API_URL for tRPC calls", { status: 200 })
}

export async function POST() {
  return new Response("Use NEXT_PUBLIC_API_URL for tRPC calls", { status: 200 })
}
