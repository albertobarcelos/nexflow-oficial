export const getRolePermissions = (role: string) => {
  switch (role) {
    case "administrator":
      return ["manage_leads", "manage_opportunities", "manage_tasks", "manage_collaborators", "view_reports", "edit_settings"];
    case "closer":
      return ["manage_leads", "manage_opportunities", "manage_tasks"];
    case "partnership_director":
      return ["manage_leads", "manage_opportunities", "manage_tasks", "view_reports"];
    case "partner":
      return ["manage_leads", "view_opportunities"];
    default:
      return [];
  }
};
