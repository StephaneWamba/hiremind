import { publicProcedure, router } from "../index"
import { db } from "@hiremind/db"
import { jobRoles } from "@hiremind/db"

export const rolesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.select().from(jobRoles)
  }),
})
