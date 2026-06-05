---
name: Replit Auth + Role System
description: Auth architecture and role setup for AppWorld — how sessions, users, and roles work together.
---

Users table has `role` pgEnum: `user | developer | admin`. Default is `user`.

Sessions are stored in DB (sessionsTable). AuthMiddleware runs on every request and loads req.user from session.

Role is read fresh from DB on GET /auth/user so it reflects any admin changes without requiring re-login.

The `@workspace/replit-auth-web` lib (lib/replit-auth-web) wraps the auth fetch and exposes `useAuth()` hook. It is a composite lib and must be in root tsconfig.json references AND artifact tsconfig.json references.

**Protected routes**: /admin requires `admin` role, /dev requires `developer` role — enforced by ProtectedRoute component in app-world.

**Why:** Role-based access needed for three distinct platform experiences: users browse/submit, developers manage their apps, admins curate the queue.

**How to apply:** When adding new protected routes, wrap with `<ProtectedRoute requiredRole="...">`. Server-side, check `req.isAuthenticated() && req.user.role === "..."`.
