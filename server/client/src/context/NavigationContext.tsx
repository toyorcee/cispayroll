import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "../types/auth";
import { useAuth } from "./AuthContext";

type NavigationContextType = {
  activeMenuText: string;
  setActiveMenuText: (text: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  getAvailableMenus: () => string[];
};

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeMenuText, setActiveMenuText] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const getAvailableMenus = () => {
    const baseMenus = ["Dashboard"];

    if (!user) return baseMenus;

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return [...baseMenus, "Employees", "Payroll", "Reports", "Settings"];
      case UserRole.ADMIN:
        return [...baseMenus, "Employees", "Payroll", "Reports"];
      case UserRole.USER:
        return [
          ...baseMenus,
          "My Profile",
          "Payslips",
          "Documents",
          "Leave Management",
        ];
      default:
        return baseMenus;
    }
  };

  const setMainMenuOnly = (text: string) => {
    const availableMenus = getAvailableMenus();
    if (availableMenus.includes(text)) {
      setActiveMenuText(text);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        activeMenuText,
        setActiveMenuText: setMainMenuOnly,
        isSidebarOpen,
        setIsSidebarOpen,
        getAvailableMenus,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
