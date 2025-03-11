import { BaseSkeleton, SkeletonBox, SkeletonText } from "./BaseSkeleton";

export function PageSkeleton() {
  return (
    <BaseSkeleton className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <SkeletonText className="h-8 w-1/3 mb-4" />
        <SkeletonText className="h-4 w-1/2" />
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Content Header / Filters / Actions */}
        <div className="flex justify-between items-center">
          <SkeletonText className="h-10 w-48" />
          <SkeletonBox className="h-10 w-32" />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Content Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonBox key={i} className="h-32" />
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <SkeletonText className="h-8 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    </BaseSkeleton>
  );
}
