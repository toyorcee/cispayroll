import { FaPlus, FaCalculator, FaSearch } from "react-icons/fa";

interface EmptyStateProps {
  searchTerm?: string;
  onAddDeduction?: () => void;
}

export const EmptyState = ({ searchTerm, onAddDeduction }: EmptyStateProps) => {
  if (searchTerm) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 text-gray-300 mb-6">
          <FaSearch className="h-full w-full" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No deductions found
        </h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          No deductions match "{searchTerm}". Try adjusting your search terms or
          filters to find what you're looking for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            Clear Search
          </button>
          {onAddDeduction && (
            <button
              onClick={onAddDeduction}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Create New Deduction
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="mx-auto h-32 w-32 text-gray-300 mb-8">
        <FaCalculator className="h-full w-full" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        No deductions configured yet
      </h3>
      <p className="text-gray-500 mb-8 max-w-lg mx-auto">
        Get started by creating your first deduction. You can set up both
        statutory (mandatory) and voluntary (optional) deductions for your
        employees.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h4 className="text-lg font-semibold text-red-900 mb-2">
            Statutory Deductions
          </h4>
          <p className="text-red-700 text-sm">
            Mandatory deductions like PAYE tax, pension contributions, and NHF
            that apply to all employees.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <h4 className="text-lg font-semibold text-blue-900 mb-2">
            Voluntary Deductions
          </h4>
          <p className="text-blue-700 text-sm">
            Optional deductions like loans, insurance, and savings that
            employees can choose to participate in.
          </p>
        </div>
      </div>

      {onAddDeduction && (
        <button
          onClick={onAddDeduction}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <FaPlus className="mr-3 h-5 w-5" />
          Create Your First Deduction
        </button>
      )}

      <div className="mt-8 text-sm text-gray-400">
        <p>Need help? Check out our documentation or contact support.</p>
      </div>
    </div>
  );
};
