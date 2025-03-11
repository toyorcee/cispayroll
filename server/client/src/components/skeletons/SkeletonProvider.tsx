import React, { createContext, useContext, ReactNode } from "react";
import { SkeletonType } from "../../types/skeleton";
import { AuthSkeleton } from "./AuthSkeleton";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PageSkeleton } from "./PageSkeleton";

interface SkeletonContextType {
  getSkeleton: (type: SkeletonType) => React.ReactElement;
}

const SkeletonContext = createContext<SkeletonContextType | undefined>(
  undefined
);

export function SkeletonProvider({ children }: { children: ReactNode }) {
  const getSkeleton = (type: SkeletonType): React.ReactElement => {
    switch (type) {
      case "auth":
        return <AuthSkeleton />;
      case "dashboard":
        return <DashboardSkeleton />;
      case "page":
      default:
        return <PageSkeleton />;
    }
  };

  return (
    <SkeletonContext.Provider value={{ getSkeleton }}>
      {children}
    </SkeletonContext.Provider>
  );
}

export function useSkeleton() {
  const context = useContext(SkeletonContext);
  if (!context) {
    throw new Error("useSkeleton must be used within a SkeletonProvider");
  }
  return context;
}
