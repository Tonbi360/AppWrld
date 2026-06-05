import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const VALID_ROLES = ["user", "developer", "admin"] as const;
type Role = typeof VALID_ROLES[number];

const router = Router();

router.get("/admin/users", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users);
});

router.patch("/admin/users/:id/role", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { role } = req.body as { role: unknown };
  if (!role || !VALID_ROLES.includes(role as Role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: role as Role, updatedAt: new Date() })
    .where(eq(usersTable.id, req.params.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, role: updated.role });
});

export default router;
