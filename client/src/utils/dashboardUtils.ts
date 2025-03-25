import { UserRole } from "../types/auth";

export const getRoleSpecificWelcomeMessage = (role?: UserRole): string => {
  const timeOfDay = new Date().getHours();
  const greeting =
    timeOfDay < 12
      ? "Good morning"
      : timeOfDay < 18
      ? "Good afternoon"
      : "Good evening";

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return `${greeting}! Here's your system overview for today.`;
    case UserRole.ADMIN:
      return `${greeting}! Your department's activities await your attention.`;
    case UserRole.USER:
      return `${greeting}! Here's your personal workspace.`;
    default:
      return `${greeting}! Welcome to the dashboard.`;
  }
};
