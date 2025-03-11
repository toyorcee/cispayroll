import React from "react";
import { motion } from "framer-motion";

// Shimmer Effect Component
export const ShimmerEffect = () => (
  <div className="absolute inset-0">
    <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
);

// Base Container
interface BaseSkeletonProps {
  children: React.ReactNode;
  className?: string;
}

export function BaseSkeleton({ children, className = "" }: BaseSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`animate-pulse ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Reusable Components
export const SkeletonBox = ({ className = "" }: { className?: string }) => (
  <div
    className={`bg-gray-200 rounded-lg relative overflow-hidden ${className}`}
  >
    <ShimmerEffect />
  </div>
);

export const SkeletonText = ({ className = "" }: { className?: string }) => (
  <div
    className={`h-4 bg-gray-200 rounded relative overflow-hidden ${className}`}
  >
    <ShimmerEffect />
  </div>
);

export const SkeletonCircle = ({ className = "" }: { className?: string }) => (
  <div
    className={`rounded-full bg-gray-200 relative overflow-hidden ${className}`}
  >
    <ShimmerEffect />
  </div>
);
