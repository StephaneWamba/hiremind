import * as crypto from "crypto"

const WS_SECRET = process.env.WS_SECRET || "dev-secret-key"

export function createWsToken(sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30, // 30s TTL
    })
  ).toString("base64url")

  const signature = crypto
    .createHmac("sha256", WS_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url")

  return `${header}.${payload}.${signature}`
}

export function verifyWsToken(token: string): { sessionId: string } | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".")
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const expectedSignature = crypto
      .createHmac("sha256", WS_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url")

    if (signatureB64 !== expectedSignature) return null

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return { sessionId: payload.sessionId }
  } catch {
    return null
  }
}
