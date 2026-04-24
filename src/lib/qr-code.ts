export const createOpaqueVehicleQrCode = () => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

  return `RES-${randomPart}`;
};