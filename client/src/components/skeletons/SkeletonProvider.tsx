import React, { createContext, useContext, ReactNode } from "react";
import { AuthSkeleton } from "./AuthSkeleton";
import ContentSkeleton from "./ContentSkeleton";
import SidebarSkeleton from "./SidebarSkeleton";
import { SkeletonCircle} from "./BaseSkeleton";

interface SkeletonContextType {
  getSkeleton: (type: "content" | "auth") => React.ReactElement;
}

const SkeletonContext = createContext<SkeletonContextType | undefined>(
  undefined
);

export function SkeletonProvider({ children }: { children: ReactNode }) {
  const getSkeleton = (type: "content" | "auth") => {
    switch (type) {
      case "auth":
        return <AuthSkeleton />;
      case "content":
        return (
          <div className="min-h-screen h-screen bg-gray-50 overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white shadow-sm h-16 z-50">
              <div className="flex items-center justify-between px-4 h-full max-w-8xl mx-auto">
                <SkeletonCircle className="h-8 w-8" />
              </div>
            </header>

            {/* Layout container */}
            <div className="flex pt-16 h-full">
              {/* Sidebar */}
              <div className="fixed left-0 top-16 bottom-0 w-64 z-40">
                <SidebarSkeleton />
              </div>

              {/* Main Content */}
              <div className="flex-1 ml-64">
                <div className="container mx-auto px-6 py-8">
                  <ContentSkeleton />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <ContentSkeleton />;
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
