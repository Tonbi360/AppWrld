---
name: Footer Admin Gate
description: Secret tap sequence in footer that reveals a passphrase gate for admin access.
---

Tapping "Built by Tonbi360" in the footer 5 times opens a modal with a passphrase input.

Passphrase: `360admin` — redirects to /admin on correct entry.

Only shows if user is NOT already an admin (role check).

**Why:** Tonbi360 (non-technical user) wanted a way to unlock admin without the nav link being visible to everyone.

**How to apply:** The gate is in `artifacts/app-world/src/components/layout/layout.tsx` Footer component.
