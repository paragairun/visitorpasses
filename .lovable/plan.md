## Goal
Let residents request adding a new vehicle or removing one of their existing vehicles. Each request goes to the admin for review; admin can edit the details before approving, or reject it.

## Database

New table `vehicle_change_requests`:
- `id`, `created_at`, `updated_at`
- `request_type` text — `'add'` or `'remove'`
- `requested_by` uuid (resident's user_id)
- `wing`, `flat_number` text (snapshot from resident profile)
- `owner_name`, `vehicle_number`, `vehicle_type` text (editable by admin)
- `target_vehicle_id` uuid nullable (for remove requests, points to `vehicles.id`)
- `status` text — `'pending' | 'approved' | 'rejected'`, default `'pending'`
- `notes` text nullable (admin notes / reason)
- `reviewed_by` uuid nullable, `reviewed_at` timestamptz nullable

RLS:
- Residents: INSERT where `requested_by = auth.uid()` and they have resident role; SELECT their own pending/processed requests.
- Admins: full SELECT / UPDATE / DELETE via `has_role(auth.uid(),'admin')`.

Trigger: `update_updated_at_column` on update.

On approval (handled in admin UI, not DB trigger to keep it explicit):
- `add` → insert into `vehicles` using request fields, then set status `approved`.
- `remove` → delete the `vehicles` row identified by `target_vehicle_id`, then set status `approved`.
- `rejected` → just update status + notes.

## Resident Portal (`src/pages/ResidentPortal.tsx`)

In the **My Vehicles** card:
- Add a "Request New Vehicle" button that opens a small form (vehicle number, type, owner name pre-filled). On submit → insert into `vehicle_change_requests` with `request_type='add'`. Toast: "Sent to admin for approval".
- Each existing vehicle row gets a "Request Removal" button → confirm dialog → insert request with `request_type='remove'` and `target_vehicle_id`. Toast confirmation.

New section **My Pending Requests**: list resident's `vehicle_change_requests` with status badge so they can track approval.

## Admin Panel (`src/pages/AdminPanel.tsx`)

New section **Vehicle Change Requests** (pending count badge):
- Table of pending requests showing type (Add / Remove), resident flat, current/proposed vehicle details, submitted date.
- "Review" opens an editable dialog:
  - For `add`: editable fields owner_name, vehicle_number, vehicle_type, wing, flat_number. Approve / Reject buttons.
  - For `remove`: read-only vehicle details to confirm, Approve / Reject buttons.
- On Approve: persist any edits to the request, perform the matching vehicles insert/delete, mark request approved.
- On Reject: prompt for optional reason, mark rejected.

## Files Touched
- New migration creating `vehicle_change_requests` with RLS + trigger.
- `src/pages/ResidentPortal.tsx` — add request form, removal buttons, my-requests list.
- `src/pages/AdminPanel.tsx` — new requests section + review dialog.
- (Possibly) small helper in `src/lib/` if logic grows.

No changes to existing `vehicles` schema or other tables. Existing QR / filename logic untouched.
