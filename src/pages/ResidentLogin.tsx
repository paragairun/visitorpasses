import { ClipboardList } from "lucide-react";
import RoleLoginPage from "@/components/RoleLoginPage";

const ResidentLogin = () => (
  <RoleLoginPage
    roleName="Resident Portal"
    roleKey="resident"
    icon={ClipboardList}
    accentClass="bg-success/20 text-success"
    dashboardPath="/resident/dashboard"
    description="Triumph Tower CHSL — Resident Access"
  />
);

export default ResidentLogin;
