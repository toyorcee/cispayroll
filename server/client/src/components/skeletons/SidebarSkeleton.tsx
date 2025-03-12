import { BaseSkeleton, SkeletonCircle, SkeletonText } from "./BaseSkeleton";

export default function SidebarSkeleton() {
  return (
    <div className="w-64 bg-white border-r h-full">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <SkeletonCircle className="h-5 w-5" />
            <SkeletonText className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
