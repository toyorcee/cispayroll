import {
  BaseSkeleton,
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
} from "./BaseSkeleton";

export function AuthSkeleton() {
  return (
    // Match the SignIn page layout exactly
    <div className="fixed inset-0 flex items-center justify-center pt-16">
      {/* Background with gradient - match the signin page */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 -z-20" />

      {/* Overlay - match the signin page */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent -z-10" />

      {/* Content */}
      <BaseSkeleton className="w-full max-w-md px-4">
        <div className="bg-white py-5 rounded-xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center items-center gap-2">
              <SkeletonCircle className="h-8 w-8" />
              <SkeletonText className="h-8 w-32" />
            </div>
            <SkeletonText className="h-6 w-64 mx-auto mt-4" />
          </div>

          {/* Form Container */}
          <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-xl p-6">
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <SkeletonText className="h-4 w-24 mb-1" />
                <SkeletonBox className="h-10 w-full rounded-lg" />
              </div>

              {/* Password Field */}
              <div>
                <SkeletonText className="h-4 w-24 mb-1" />
                <SkeletonBox className="h-10 w-full rounded-lg" />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <SkeletonText className="h-4 w-32" />
                <SkeletonText className="h-4 w-32" />
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <SkeletonBox className="h-10 w-full rounded-lg" />
                <div className="relative py-4">
                  <SkeletonText className="h-4 w-32 mx-auto" />
                </div>
                <SkeletonBox className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </BaseSkeleton>
    </div>
  );
}
