import { motion, Variants } from "framer-motion";
import { SkeletonBox, SkeletonText } from "./BaseSkeleton";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, type: "spring" },
  }),
};

export default function IntegrationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Integration Categories */}
      {[1, 2].map((categoryIndex) => (
        <motion.div
          key={categoryIndex}
          custom={categoryIndex}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md"
        >
          <div className="p-4 md:p-6">
            {/* Category Header */}
            <div className="flex items-center mb-4">
              <SkeletonBox className="h-5 w-5 md:h-6 md:w-6 rounded" />
              <div className="ml-3">
                <SkeletonText className="h-6 w-32" />
                <SkeletonText className="h-4 w-48 mt-1" />
              </div>
            </div>

            {/* Integration Options */}
            <div className="space-y-4">
              {[1, 2, 3].map((optionIndex) => (
                <div
                  key={optionIndex}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex items-center">
                    <SkeletonBox className="h-6 w-6 md:h-8 md:w-8 rounded" />
                    <div className="ml-3">
                      <SkeletonText className="h-5 w-32" />
                      <SkeletonText className="h-3 w-24 mt-1" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <SkeletonBox className="h-6 w-20 rounded-full" />
                    <SkeletonBox className="h-4 w-16 rounded" />
                    <SkeletonBox className="h-4 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      {/* API Access Section */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md"
      >
        <div className="p-4 md:p-6">
          <SkeletonText className="h-6 w-24 mb-4" />
          <div className="space-y-4">
            {/* API Key */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <SkeletonText className="h-4 w-16" />
                <SkeletonText className="h-3 w-48 mt-1" />
              </div>
              <div className="flex items-center space-x-4">
                <SkeletonBox className="h-8 w-48 sm:w-64 rounded-lg" />
                <SkeletonBox className="h-4 w-12 rounded" />
                <SkeletonBox className="h-4 w-24 rounded" />
              </div>
            </div>

            {/* Webhook URL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <SkeletonText className="h-4 w-20" />
                <SkeletonText className="h-3 w-48 mt-1" />
              </div>
              <div className="flex items-center space-x-4">
                <SkeletonBox className="h-8 w-48 sm:w-64 rounded-lg" />
                <SkeletonBox className="h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
