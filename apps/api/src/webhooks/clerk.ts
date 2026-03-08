import { Webhook } from "svix"
import { db } from "@hiremind/db"
import { users } from "@hiremind/db"
import { eq } from "drizzle-orm"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ""

export async function handleClerkWebhook(body: string, signature: string) {
  const wh = new Webhook(webhookSecret)

  let evt
  try {
    evt = wh.verify(body, {
      "svix-id": signature.split("_")[0],
      "svix-signature": signature.split("_")[1],
      "svix-timestamp": signature.split("_")[2],
    })
  } catch (err) {
    console.error("Webhook signature verification failed", err)
    throw new Error("Unauthorized")
  }

  const { type, data } = evt as { type: string; data: Record<string, unknown> }

  if (type === "user.created") {
    const { id, email_addresses, first_name, last_name } = data as {
      id: string
      email_addresses: Array<{ email_address: string }>
      first_name?: string
      last_name?: string
    }
    const email = email_addresses?.[0]?.email_address || ""
    const name = [first_name, last_name].filter(Boolean).join(" ") || ""

    await db.insert(users).values({
      clerkId: id,
      email,
      name: name || null,
    })

    console.log(`✅ User created: ${id}`)
  }

  if (type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = data as {
      id: string
      email_addresses: Array<{ email_address: string }>
      first_name?: string
      last_name?: string
    }
    const email = email_addresses?.[0]?.email_address || ""
    const name = [first_name, last_name].filter(Boolean).join(" ") || ""

    await db
      .update(users)
      .set({
        email,
        name: name || null,
      })
      .where(eq(users.clerkId, id))

    console.log(`✅ User updated: ${id}`)
  }
}
