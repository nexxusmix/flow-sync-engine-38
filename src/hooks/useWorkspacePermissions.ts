import { useWorkspaceMembers, WorkspaceRole } from "./useWorkspaceMembers";
import { useUserRole } from "./useUserRole";

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

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    "manage_members", "manage_settings", "manage_billing",
    "edit_content", "view_content", "manage_integrations",
    "manage_projects", "manage_finances", "danger_zone",
  ],
  admin: [
    "manage_members", "manage_settings",
    "edit_content", "view_content", "manage_integrations",
    "manage_projects", "manage_finances",
  ],
  editor: [
    "edit_content", "view_content", "manage_projects",
  ],
  viewer: [
    "view_content",
  ],
};

export function useWorkspacePermissions() {
  const { currentMember, isOwnerOrAdmin } = useWorkspaceMembers();
  const { isAdmin: isAppAdmin } = useUserRole();

  const workspaceRole: WorkspaceRole = currentMember?.role ?? "viewer";

  const can = (permission: Permission): boolean => {
    // App-level admins always have all permissions
    if (isAppAdmin) return true;
    return ROLE_PERMISSIONS[workspaceRole]?.includes(permission) ?? false;
  };

  return {
    workspaceRole,
    can,
    isOwnerOrAdmin,
    isAppAdmin,
  };
}
