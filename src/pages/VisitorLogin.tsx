import { UserCheck } from "lucide-react";
import RoleLoginPage from "@/components/RoleLoginPage";

const VisitorLogin = () => (
  <RoleLoginPage
    roleName="Visitor Entry"
    roleKey="visitor"
    icon={UserCheck}
    accentClass="bg-accent/20 text-accent"
    dashboardPath="/visitor/form"
    description="Triumph Tower CHSL — Visitor Registration"
  />
);

export default VisitorLogin;
