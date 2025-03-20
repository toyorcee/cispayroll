export const TableSkeleton = () => {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-200">
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 border-b border-gray-200"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
  );
};
