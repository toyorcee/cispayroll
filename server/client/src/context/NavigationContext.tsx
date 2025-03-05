import { createContext, useContext, useState, ReactNode } from "react";

type NavigationContextType = {
  activeMenuText: string;
  setActiveMenuText: (text: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeMenuText, setActiveMenuText] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const setMainMenuOnly = (text: string) => {
    const mainMenus = [
      "Dashboard",
      "Employees",
      "Payroll",
      "Reports",
      "Settings",
    ];
    if (mainMenus.includes(text)) {
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