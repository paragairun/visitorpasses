# Primary & Child Resident Accounts

## Goal

Each flat has exactly one **primary** resident. The primary can invite **child accounts** (Family or Tenant) directly — no admin approval — with limited, read-mostly access.

## Account Capabilities

| Capability | Primary | Child (Family / Tenant) |
|---|---|---|
| Register vehicles, request changes | ✅ | ❌ |
| Generate guest passes | ✅ | ✅ |
| View flat vehicles | ✅ | ✅ |
| View entry/exit logs for flat vehicles | ✅ | ✅ |
| Edit flat / vehicle details | ✅ | ❌ |
| Edit own name & phone | ✅ | ✅ |
| Edit anything else on profile | ✅ | ❌ |
| Manage child accounts | ✅ (sees list, can add/remove) | ❌ |

## Database Changes

1. **`profiles`**
   - Add `parent_user_id uuid NULL` — null = primary; non-null = child of that primary
   - Add `child_type text NULL` — `'family'` or `'tenant'` (only for children)

2. **`resident_flats`**
   - Enforce one primary per flat: partial unique index on `(wing, flat_number)` where the owning user has no parent. (Implemented via a `BEFORE INSERT/UPDATE` trigger because the parent flag lives in `profiles`.)

3. **RLS updates**
   - **`vehicles`** — children inherit "view own flat vehicles" via parent's `resident_flats`. Update existing SELECT policy to also match flats of `parent_user_id`.
   - **`vehicle_change_requests`** — INSERT restricted to primaries only (block when `profiles.parent_user_id IS NOT NULL`).
   - **`resident_flats`** — INSERT/UPDATE/DELETE restricted to primaries only.
   - **`profiles`** — primary can SELECT child profiles where `parent_user_id = auth.uid()`; child can update only `display_name` and `phone` of own row (enforced via trigger that rejects changes to `wing`/`flat_number`).
   - **Guest passes / entry logs** — already keyed off flat; extend SELECT to include parent's flats.

4. **Helper function** `public.is_primary_resident(_user_id)` — `SELECT parent_user_id IS NULL FROM profiles WHERE user_id = _user_id`. Used in policies.

## Account Creation Flow

Primary resident, in their portal → **"Family & Tenants"** section:

- Form: email, full name, child type (Family / Tenant)
- Calls new edge function `create-child-account` (service role):
  - Verifies caller is a primary resident (`has_role('resident')` AND `parent_user_id IS NULL`)
  - Creates auth user with auto-generated temp password, `email_confirm: true`
  - Inserts `user_roles(role='resident')`
  - Inserts `profiles` with `parent_user_id = caller.id`, `child_type`, primary's `wing`/`flat_number`
  - Returns temp password for primary to share with child
- No `registration_requests` row, no admin approval

Child sign-in: same `/resident` login. Their portal hides write actions and the "Family & Tenants" section.

## UI Changes

**`ResidentPortal.tsx`**
- Detect `isChild = profile.parent_user_id !== null`
- Sidebar items conditionally rendered:
  - Hide for child: "Add Vehicle", "Request Vehicle Change", "Manage Flats"
  - Show for child: "Guest Pass" (default), "My Vehicles" (read-only), "Entry/Exit Logs"
- Profile page:
  - Primary: existing fields + new **Family & Tenants** card listing children (name, email, type, added on) with **Add Child** button and **Remove** action
  - Child: only `display_name` and `phone` editable; flat/wing shown read-only; show badge "Family" or "Tenant" and "Linked to: <primary name>"

**`AdminPanel`** — Optional: in Resident Registry, show a "Type" column (Primary / Family / Tenant) and the parent for children.

## Edge Functions

- **New:** `supabase/functions/create-child-account/index.ts` — described above
- **New:** `supabase/functions/delete-child-account/index.ts` — primary deletes own child (verifies parent_user_id matches caller); reuses delete-user logic
- Existing `submit-visitor-request` and `resident-guest-passes` already work for any authenticated resident; no change needed beyond confirming child role passes.

## Out of Scope

- Email notifications (separate pending request — needs domain setup)
- Changing primary resident transfer flow
- Per-child granular permission toggles

## Files Touched

- `supabase/migrations/<new>.sql` — schema, trigger, RLS, helper fn
- `supabase/functions/create-child-account/index.ts` (new)
- `supabase/functions/delete-child-account/index.ts` (new)
- `src/pages/ResidentPortal.tsx` — gating + Family & Tenants section
- `src/components/UserRegistry.tsx` (admin) — show child relationship column
