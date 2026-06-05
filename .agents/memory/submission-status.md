---
name: Submission Status Values
description: The 9 allowed submission status values and why text type was chosen over enum.
---

Status field is `text` type (NOT pgEnum) to avoid PostgreSQL enum migration pain in dev.

Valid values: `received | under_review | needs_info | confirmed | in_progress | fixed | released | rejected | duplicate`

**Why:** Changed from old 3-value enum (pending/approved/rejected) to 9-value system for richer status tracking. Using text type gives flexibility without ALTER TYPE migrations.

**How to apply:** Validate status values in server routes using `SUBMISSION_STATUSES` array exported from `lib/db/src/schema/submissions.ts`.
