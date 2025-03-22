import {
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
} from "./BaseSkeleton";

export default function TableSkeleton() {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Employee",
                "Type",
                "Duration",
                "Status",
                "Date",
                "Actions",
              ].map((header) => (
                <th key={header} className="px-6 py-3">
                  <SkeletonText className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <SkeletonCircle className="h-10 w-10" />
                    <div className="ml-4">
                      <SkeletonText className="h-4 w-32 mb-1" />
                      <SkeletonText className="h-3 w-24" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <SkeletonText className="h-4 w-24" />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <SkeletonText className="h-4 w-20 mb-1" />
                    <SkeletonText className="h-3 w-32" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <SkeletonBox className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <SkeletonText className="h-4 w-24" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <SkeletonBox className="h-8 w-16 rounded" />
                    <SkeletonBox className="h-8 w-16 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
