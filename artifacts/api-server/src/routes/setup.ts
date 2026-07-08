import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SETUP_CODE = "360admin";

const router: IRouter = Router();

router.get("/setup/make-admin", async (req: Request, res: Response) => {
  const { code } = req.query;

  if (code !== SETUP_CODE) {
    res.status(403).json({ error: "Invalid setup code" });
    return;
  }

  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "You must be logged in first. Go to / and log in, then visit this URL again." });
    return;
  }

  const userId = req.user.id;

  await db
    .update(usersTable)
    .set({ role: "admin" })
    .where(eq(usersTable.id, userId));

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Admin Access Granted</title>
      <style>
        body { background: #0d0d11; color: #e2e8f0; font-family: system-ui, sans-serif;
          display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1a1a24; border-radius: 16px; padding: 2rem 3rem; text-align: center; max-width: 400px; }
        h1 { color: #8b5cf6; margin: 0 0 0.5rem; font-size: 1.5rem; }
        p { color: #94a3b8; margin: 0 0 1.5rem; }
        a { display: inline-block; background: #8b5cf6; color: #fff; text-decoration: none;
          padding: 0.625rem 1.5rem; border-radius: 8px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Admin access granted</h1>
        <p>Your account now has admin permissions. You can close this and go to the admin panel.</p>
        <a href="/admin">Go to Admin</a>
      </div>
    </body>
    </html>
  `);
});

export default router;
