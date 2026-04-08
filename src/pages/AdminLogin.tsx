import { Shield } from "lucide-react";
import RoleLoginPage from "@/components/RoleLoginPage";

const AdminLogin = () => (
  <RoleLoginPage
    roleName="Committee Admin"
    roleKey="admin"
    icon={Shield}
    accentClass="bg-warning/20 text-warning"
    dashboardPath="/admin/dashboard"
    description="Triumph Tower CHSL — Admin Panel"
  />
);

export default AdminLogin;
