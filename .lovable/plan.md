# Resident Profile Edit + Multi-Flat Registration

Add profile editing for residents (name, mobile, flats), support multiple flats per resident, and auto-fill owner name from the profile everywhere — never asked twice.

## 1. Database changes

**`profiles` table** — add `phone TEXT` column (nullable for now, validated at edit time).

**New table `resident_flats`** — represents the many-to-many between residents and flats. A resident's "flats" live here instead of (or in addition to) `profiles.wing`/`flat_number`.

Columns:
- `id uuid pk`
- `user_id uuid not null` (the resident)
- `wing text not null`
- `flat_number text not null`
- `is_primary boolean not null default false`
- `created_at timestamptz default now()`
- unique (`user_id`, `wing`, `flat_number`)

RLS:
- Resident can SELECT/INSERT/DELETE their own rows (`auth.uid() = user_id AND has_role(auth.uid(),'resident')`).
- Admin full access via `has_role(auth.uid(),'admin')`.
- Guards SELECT (so vehicle/visitor lookups still work) — same pattern as `vehicles`.

Backfill: copy existing `profiles.wing` + `profiles.flat_number` rows into `resident_flats` as `is_primary = true` for each resident with both fields set.

We keep `profiles.wing` / `profiles.flat_number` for backwards compat (treated as primary flat / display fallback) — no schema removal in this pass.

**`vehicles` RLS update** — extend "Residents can view own flat vehicles" so it matches any flat in `resident_flats` for the user (not only the profile's single flat). Existing single-flat residents still match through the backfill.

## 2. Edge function `resident-guest-passes`

- Pull all flats from `resident_flats` for the user; if empty, fall back to `profiles.wing` + `profiles.flat_number`.
- Accept an optional `flat_id` in `list` and `create` to pick which flat the pass is for; default to the primary flat.
- Response shape gains `flats: [{ id, wing, flat_number, flat_label, is_primary }]` plus the existing `resident` object reflecting the active flat.
- Guest pass `owner_name` always sourced from `profiles.display_name` — never from the client.

## 3. Resident Portal UI (`src/pages/ResidentPortal.tsx`)

**New "My Profile" card** at the top:
- Editable: Display Name, Mobile Number.
- Flats list: each row shows `Wing-Flat` with a Remove button; "Add Flat" row with wing + flat number inputs and an Add button. (Pure profile-side; not gated through admin approval — that's only for vehicles.)
- One "Save Profile" button persists name + phone via an `update` on `profiles`. Flat add/remove writes directly to `resident_flats`.

**Flat picker**: A compact `Select` at the top of "Generate Guest Pass" and "My Vehicles" / "Request New Vehicle" sections lets the resident switch the active flat. Hidden if the resident has only one flat.

**Remove "Owner Name" inputs** everywhere they used to be collected from the resident:
- Guest pass form: never had it (passes use `profiles.display_name` server-side). No change.
- "Request New Vehicle" form: drop the `owner_name` field — derive from `profiles.display_name` at submit.
- Removal request: keep using the existing vehicle's stored `owner_name`.

**Vehicles list filter** now driven by the currently-selected flat (`wing`/`flat_number`).

## 4. Admin side

- `VehicleChangeRequestsAdmin` review dialog keeps editable `owner_name` (admin override) — no UI change needed; `add` requests now arrive with the resident's profile name pre-filled.
- No admin UI changes required for multi-flat — admin already sees `wing` + `flat_number` per request/vehicle row.

## 5. Out of scope

- No QR generator changes.
- Guard dashboard, access logs, visitor form: unchanged (they read `wing` + `flat_number` from existing rows).
- No removal of `profiles.wing` / `profiles.flat_number` (kept as primary flat shadow).
- No dashboard sidebar refactor (separate request).

## Files touched

- New migration: add `profiles.phone`, create `resident_flats` + RLS, backfill from `profiles`, update `vehicles` SELECT policy for residents.
- `supabase/functions/resident-guest-passes/index.ts` — multi-flat aware.
- `src/pages/ResidentPortal.tsx` — profile card, flat picker, drop owner_name input.

After approval I'll run the migration first, then update the edge function and the portal.
