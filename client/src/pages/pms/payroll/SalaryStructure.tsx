import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { salaryStructureService } from "../../../services/salaryStructureService";
import { ISalaryGrade } from "../../../types/salary";
import { departmentService } from "../../../services/departmentService";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { DepartmentBasic } from "../../../types/department";
import { Permission } from "../../../types/auth";
import { useAuth } from "../../../context/AuthContext";
import NewSalaryGrade from "../../../components/modals/NewSalaryGrade";
import { toast } from "react-toastify";
import ViewSalaryGrade from "../../../components/modals/ViewSalaryGrade";
import { ConfirmationModal } from "../../../components/modals/ConfirmationModal";
import EditSalaryGrade from "../../../components/modals/EditSalaryGrade";

export default function SalaryStructure() {
  const { user, loading: authLoading } = useAuth();
  const [salaryGrades, setSalaryGrades] = useState<ISalaryGrade[]>([]);
  const [departments, setDepartments] = useState<DepartmentBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewingGradeId, setViewingGradeId] = useState<string | null>(null);
  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null);
  const [editingGrade, setEditingGrade] = useState<ISalaryGrade | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const fetchSalaryGrades = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const grades = await salaryStructureService.getAllSalaryGrades();

      // Calculate totals silently without logs
      const gradesWithTotals = grades.map((grade) => {
        const basicSalary = Number(grade.basicSalary);
        let totalAllowances = 0;

        grade.components.forEach((component) => {
          if (component.isActive && component.type === "allowance") {
            if (component.calculationMethod === "percentage") {
              totalAllowances += Math.round(
                (basicSalary * component.value) / 100
              );
            } else {
              totalAllowances += component.value;
            }
          }
        });

        return {
          ...grade,
          totalAllowances,
          grossSalary: basicSalary + totalAllowances,
        };
      });

      setSalaryGrades(gradesWithTotals);
      setError(null);
    } catch (error) {
      console.error("Error fetching salary grades:", error);
      setError("Failed to fetch salary grades");
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const fetchDepartments = useCallback(async () => {
    try {
      console.log("🔍 Fetching departments...");
      const departments = await departmentService.getAllDepartments();
      console.log("📥 Received departments:", departments);
      setDepartments(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    }
  }, []);

  // Single fetch on mount
  useEffect(() => {
    fetchSalaryGrades();
    fetchDepartments();
  }, []); // Empty dependency array - only runs once on mount

  const canEditSalaryStructure = user?.permissions?.includes(
    Permission.EDIT_SALARY_STRUCTURE
  );
  const canManageSalaryStructure = user?.permissions?.includes(
    Permission.MANAGE_SALARY_STRUCTURE
  );

  // Filter grades by department
  const filteredGrades =
    selectedDepartment === "all"
      ? salaryGrades
      : salaryGrades.filter(
          (grade) => grade.department?._id === selectedDepartment
        );

  // Simplify the handlers
  const handleViewClick = (grade: ISalaryGrade) => {
    setViewingGradeId(grade._id.toString());
  };

  const handleAddGrade = () => {
    setIsNewModalOpen(true);
  };

  const handleEditClick = (grade: ISalaryGrade) => {
    setEditingGrade(grade);
  };

  // Update delete handler
  const handleDelete = async (gradeId: string) => {
    try {
      await salaryStructureService.deleteSalaryGrade(gradeId);
      await fetchSalaryGrades(); // Refresh the list
      setDeleteGradeId(null);
    } catch (error) {
      console.error("Failed to delete grade:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-white">{error}</h3>
            <button
              onClick={fetchSalaryGrades}
              className="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canManageSalaryStructure && (
        <div className="flex justify-end">
          <button
            onClick={handleAddGrade}
            className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
               transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
               cursor-pointer focus:outline-none focus:ring-0 disabled:opacity-50"
          >
            <FaPlus className="h-5 w-5 mr-2" />
            Add Grade Level
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Salary Grades</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-md border-green-600 py-1.5 pl-3 pr-8 text-sm"
              >
                <option value="all">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Grade Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Gross Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((grade) => (
                <tr
                  key={grade._id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      {grade.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      ₦{(grade.basicSalary || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Base Pay</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      ₦{grade.totalAllowances?.toLocaleString() || "0"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Additional Benefits
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base font-medium text-green-600">
                      ₦{grade.grossSalary?.toLocaleString() || "0"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Basic + Allowances
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      {grade.department?.name || "All Departments"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {grade.department?.name
                        ? "Department Specific"
                        : "Global Grade"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canEditSalaryStructure && (
                      <>
                        <button
                          onClick={() => handleEditClick(grade)}
                          className="text-xs md:text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-lg 
                                   hover:bg-blue-200 transition-all duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteGradeId(grade._id)}
                          className="text-xs md:text-sm px-2 py-1 bg-red-100 text-red-700 rounded-lg 
                                   hover:bg-red-200 transition-all duration-200"
                        >
                          <FaTrash size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewClick(grade)}
                      className="text-xs md:text-sm px-2 py-1 bg-green-100 text-green-700 rounded-lg 
                               hover:bg-green-200 transition-all duration-200"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isNewModalOpen && (
        <NewSalaryGrade
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false);
            fetchSalaryGrades(); // Refresh the list
          }}
        />
      )}

      {viewingGradeId && (
        <ViewSalaryGrade
          isOpen={!!viewingGradeId}
          onClose={() => setViewingGradeId(null)}
          gradeId={viewingGradeId}
        />
      )}

      {editingGrade && (
        <EditSalaryGrade
          isOpen={!!editingGrade}
          onClose={() => setEditingGrade(null)}
          onSuccess={() => {
            setEditingGrade(null);
            fetchSalaryGrades(); // Refresh the list
          }}
          grade={editingGrade}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteGradeId}
        onClose={() => setDeleteGradeId(null)}
        onConfirm={() => deleteGradeId && handleDelete(deleteGradeId)}
        title="Delete Salary Grade"
        message="Are you sure you want to delete this salary grade? This action cannot be undone."
        confirmText="Delete Grade"
        cancelText="Cancel"
      />
    </div>
  );
}
