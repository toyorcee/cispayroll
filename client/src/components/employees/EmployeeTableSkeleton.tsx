export const EmployeeTableSkeleton = ({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) => {
  return (
    <div className="animate-pulse">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 w-1/4">
              <div className="h-4 bg-gray-200 rounded"></div>
            </th>
            {isSuperAdmin && (
              <th className="px-6 py-3 w-1/4">
                <div className="h-4 bg-gray-200 rounded"></div>
              </th>
            )}
            <th className="px-6 py-3 w-1/4">
              <div className="h-4 bg-gray-200 rounded"></div>
            </th>
            <th className="px-6 py-3 w-1/8">
              <div className="h-4 bg-gray-200 rounded"></div>
            </th>
            <th className="px-6 py-3 w-1/8">
              <div className="h-4 bg-gray-200 rounded"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
              {isSuperAdmin && (
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </td>
              )}
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
