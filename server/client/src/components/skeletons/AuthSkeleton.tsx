import { BaseSkeleton, SkeletonBox, SkeletonCircle, SkeletonText } from "./BaseSkeleton";

export function AuthSkeleton() {
  return (
    <BaseSkeleton className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
        {/* Logo/Icon */}
        <SkeletonCircle className="h-12 w-12 mx-auto" />
        
        {/* Title */}
        <SkeletonText className="h-6 w-3/4 mx-auto" />
        
        {/* Form Fields */}
        <div className="space-y-4">
          <SkeletonBox className="h-10 w-full" />
          <SkeletonBox className="h-10 w-full" />
          <SkeletonBox className="h-10 w-full" />
        </div>
      </div>
    </BaseSkeleton>
  );
}