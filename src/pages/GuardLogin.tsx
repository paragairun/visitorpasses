import { ScanLine } from "lucide-react";
import RoleLoginPage from "@/components/RoleLoginPage";

const GuardLogin = () => (
  <RoleLoginPage
    roleName="Security Guard"
    roleKey="guard"
    icon={ScanLine}
    accentClass="bg-primary/20 text-primary"
    dashboardPath="/guard/dashboard"
    description="Triumph Tower CHSL — Guard Portal"
  />
);

export default GuardLogin;
