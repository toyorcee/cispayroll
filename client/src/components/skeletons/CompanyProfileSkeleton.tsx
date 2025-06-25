import {
  SkeletonBox,
  SkeletonText,
} from "../../components/skeletons/BaseSkeleton";

export default function CompanyProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Edit Button Skeleton */}
      <div className="flex justify-end">
        <SkeletonBox className="h-10 w-32 rounded-lg" />
      </div>

      {/* Basic Information Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <SkeletonBox className="h-5 w-5 mr-2 rounded" />
            <SkeletonText className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <SkeletonText className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <SkeletonBox className="h-5 w-5 mr-2 rounded" />
            <SkeletonText className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <SkeletonText className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Address Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <SkeletonBox className="h-5 w-5 mr-2 rounded" />
            <SkeletonText className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            {/* Street Address (full width) */}
            <div className="sm:col-span-2">
              <SkeletonText className="h-4 w-32 mb-2" />
              <SkeletonBox className="h-10 w-full" />
            </div>
            {/* City, State, Country, Postal Code */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <SkeletonText className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Information Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <SkeletonBox className="h-5 w-5 mr-2 rounded" />
            <SkeletonText className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <SkeletonText className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
