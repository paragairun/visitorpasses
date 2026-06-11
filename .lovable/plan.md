# Multi-Society Platform Conversion

Transform the current single-society portal (Triumph Tower CHSL) into a multi-tenant SaaS where any society can register, get approved by a platform super-admin, and operate its own isolated portal.

## Core concept

Every existing piece of user-facing data (profiles, residents, flats, vehicles, visitors, logs, registration requests, barrier devices) becomes **scoped to a `society_id`**. RLS policies are rewritten so users can only see/touch data belonging to their own society. A new `super_admin` role sits above everything and manages society onboarding.

## 1. Database changes (one migration)

**New tables**
- `societies` — `id`, `name`, `address_line`, `landmark`, `city`, `state`, `country`, `pin_code`, `status` (`pending` | `active` | `suspended`), `created_at`, `updated_at`.
- `society_registration_requests` — society details + proposed admin email/display name + hashed password marker + `status` (`pending` | `approved` | `rejected`) + review fields.

**Schema updates**
- Add `society_id uuid` (FK → `societies.id`) to: `profiles`, `user_roles`, `resident_flats`, `vehicles`, `visitor_requests`, `entry_logs`, `access_logs`, `barrier_devices`, `barrier_events`, `registration_requests`, `vehicle_change_requests`.
- Extend `app_role` enum with `super_admin`.

**Data migration (Triumph Tower as society #1)**
- Insert a `societies` row for Triumph Tower (status `active`).
- Backfill `society_id` on every existing row to that society's id.
- Make `society_id` `NOT NULL` after backfill.
- Promote whichever user(s) you designate to `super_admin` (default: `triumphtower2024@gmail.com` keeps `admin`; you tell me which email becomes the platform super-admin — happy to default to a new one).

**RLS rewrite**
- New SECURITY DEFINER helpers: `get_user_society_id(uuid)`, `is_super_admin(uuid)`.
- Every existing policy gets an additional `society_id = get_user_society_id(auth.uid())` clause.
- `super_admin` bypasses society scoping where appropriate (read-only platform views, society approval).
- `societies` table: super-admin full access; society admins read their own; residents/guards read minimal fields of their own.
- `society_registration_requests`: anyone can INSERT (signup); only super-admin can SELECT/UPDATE/DELETE.

## 2. Auth & registration flow

**New society signup** (`/register-society`)
- Public form: society name, address (line + landmark + city + state + country + pin), admin email, password + confirm, admin display name, phone.
- Submits to `society_registration_requests` (no auth user created yet).

**Super-admin review** (`/super-admin`)
- List pending requests with full details, approve/reject buttons.
- Approve: creates `societies` row (status `active`), creates the auth user via an edge function (`approve-society`) using the service role, assigns `admin` role + `society_id`, marks request approved.
- Reject: marks request rejected with reason.

**Resident/guard signup** (existing `Register.tsx` flow)
- Now requires picking a society first (dropdown of active societies).
- Existing approval flow continues, scoped to that society's admin.

## 3. Routing & UI

**Public**
- `/` — marketing landing page: hero, features, "Register your society" CTA, "Login" CTA, brief explainer.
- `/register-society` — society registration form.
- `/login` — unified login that detects role and routes to the right dashboard.
- Keep `/admin-login`, `/guard-login`, `/resident-login` as direct routes.

**Dashboards (society-scoped, unchanged UX but data is now filtered)**
- `/admin` — society admin panel.
- `/guard` — guard dashboard.
- `/resident` — resident portal.
- `/super-admin` — new: list societies, pending society requests, approve/reject, basic stats.

**Branding inside a society dashboard**
- Header shows the logged-in user's society name instead of hard-coded "Triumph Tower CHSL".

## 4. Edge functions

- `approve-society` — creates the auth user for the new society admin, links role + society_id (needs service role).
- `register-resident-guard` (already exists in spirit) — updated to set `society_id` on created user.

## 5. QR codes & visitor flow

- Visitor request QR/URL now includes `society_id` so a scanned QR routes the visitor to the right society's form.
- Guard scanner only acts on entries within their own society.

## Out of scope (can be follow-ups)

- Custom subdomains per society (e.g. `triumph.portal.app`).
- Per-society theming/logo upload.
- Billing/subscriptions.
- Cross-society analytics for super-admin beyond counts.

## Technical notes

- One migration handles: enum extension, new tables, column additions, backfill, NOT NULL, helper functions, full policy rewrite, GRANTs.
- Will need to drop and recreate every existing policy that references the affected tables.
- Existing `has_role(auth.uid(), 'admin')` checks across the app stay valid — they just become "admin of your own society" because of the added society_id RLS clause.
- I'll need one input from you during implementation: **which email should be the platform super-admin?** (Can be `triumphtower2024@gmail.com` itself, or a separate one you create.)
