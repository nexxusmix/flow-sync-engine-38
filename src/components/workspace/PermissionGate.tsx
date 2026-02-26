import { ReactNode } from "react";
import { useWorkspacePermissions } from "@/hooks/useWorkspacePermissions";

type Permission =
  | "manage_members"
  | "manage_settings"
  | "manage_billing"
  | "edit_content"
  | "view_content"
  | "manage_integrations"
  | "manage_projects"
  | "manage_finances"
  | "danger_zone";

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = useWorkspacePermissions();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
