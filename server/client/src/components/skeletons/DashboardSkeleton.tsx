import { motion } from "framer-motion";
import {
  BaseSkeleton,
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
} from "./BaseSkeleton";

export function DashboardSkeleton() {
  return (
    <BaseSkeleton className="space-y-6">
      {/* Welcome Section - Highest Priority */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-gray-200"
      >
        <SkeletonText className="h-8 w-48 mb-2" />
        <SkeletonText className="h-4 w-64" />
      </motion.div>

      {/* Quick Actions - High Priority */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SkeletonBox className="h-24" />
      </motion.div>

      {/* Stats Grid - High Priority */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * i }}
          >
            <SkeletonBox className="h-32" />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section - Lower Priority */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i === 1 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
          >
            <SkeletonBox className="h-64" />
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity - Medium Priority */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <SkeletonText className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
              className="flex items-start space-x-4"
            >
              <SkeletonCircle className="h-10 w-10" />
              <div className="flex-1">
                <SkeletonText className="h-4 w-3/4 mb-2" />
                <SkeletonText className="h-4 w-1/2" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </BaseSkeleton>
  );
}
