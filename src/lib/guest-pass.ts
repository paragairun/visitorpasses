export interface GuestPassPayload {
  type: "guest_pass";
  request_id: string;
  visitor_name: string;
  phone: string;
  vehicle_number: string;
  purpose: string | null;
  flat_number: string;
  wing: string;
  owner_name: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const encodeGuestPass = (payload: GuestPassPayload) => JSON.stringify(payload);

export const decodeGuestPass = (value: string): GuestPassPayload | null => {
  try {
    const parsed = JSON.parse(value);

    if (
      parsed?.type !== "guest_pass" ||
      !isNonEmptyString(parsed.request_id) ||
      !isNonEmptyString(parsed.visitor_name) ||
      !isNonEmptyString(parsed.phone) ||
      !isNonEmptyString(parsed.vehicle_number) ||
      !isNonEmptyString(parsed.flat_number) ||
      !isNonEmptyString(parsed.wing) ||
      !isNonEmptyString(parsed.owner_name)
    ) {
      return null;
    }

    return {
      type: "guest_pass",
      request_id: parsed.request_id,
      visitor_name: parsed.visitor_name,
      phone: parsed.phone,
      vehicle_number: parsed.vehicle_number,
      purpose: typeof parsed.purpose === "string" && parsed.purpose.trim().length > 0 ? parsed.purpose : null,
      flat_number: parsed.flat_number,
      wing: parsed.wing,
      owner_name: parsed.owner_name,
    };
  } catch {
    return null;
  }
};