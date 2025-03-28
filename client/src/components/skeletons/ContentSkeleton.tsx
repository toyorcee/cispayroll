// import { motion } from "framer-motion";
import {
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
} from "./BaseSkeleton";

export default function ContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action Button Area */}
      <div className="flex justify-end">
        <SkeletonBox className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <SkeletonCircle className="h-6 w-6 flex-shrink-0" />
                <div className="ml-5 flex-1">
                  <SkeletonText className="h-4 w-24 mb-1" />
                  <SkeletonText className="h-6 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow w-full">
        <div className="flex gap-4">
          <SkeletonBox className="h-10 w-40" />
          <SkeletonBox className="h-10 w-40" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Employee",
                  "Department",
                  "Position",
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
                        <SkeletonText className="h-3 w-48" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonText className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonText className="h-4 w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonBox className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonText className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <SkeletonCircle className="h-8 w-8" />
                      <SkeletonCircle className="h-8 w-8" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
