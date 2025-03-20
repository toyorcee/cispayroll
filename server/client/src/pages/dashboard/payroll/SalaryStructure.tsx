import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaTrash } from "react-icons/fa";
import { salaryStructureService } from "../../../services/salaryStructureService";
import { departmentService } from "../../../services/departmentService";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { ISalaryGrade } from "../../../types/salary";
import { DepartmentBasic } from "../../../types/employee";
import { Permission } from "../../../types/auth";
import { useAuth } from "../../../context/AuthContext";
import NewSalaryGrade from "../../../components/modals/NewSalaryGrade";
import { toast } from "react-hot-toast";
import EditSalaryGrade from "../../../components/modals/EditSalaryGrade";
import ViewSalaryGrade from "../../../components/modals/ViewSalaryGrade";
import { ConfirmationModal } from "../../../components/modals/ConfirmationModal";

export default function SalaryStructure() {
  const { user, loading: authLoading } = useAuth();
  const [salaryGrades, setSalaryGrades] = useState<ISalaryGrade[]>([]);
  const [departments, setDepartments] = useState<DepartmentBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<ISalaryGrade | null>(null);
  const [viewingGradeId, setViewingGradeId] = useState<string | null>(null);
  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null);

  const fetchSalaryGrades = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      console.log("🔍 Fetching salary grades...");
      const data = await salaryStructureService.getAllSalaryGrades();
      console.log("📥 Received salary grades:", data);
      setSalaryGrades(data);
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

  const handleSalaryGradeCreated = useCallback(() => {
    setIsModalOpen(false);
    // Refresh the list after creation
    fetchSalaryGrades();
    toast.success("Salary grade created successfully!");
  }, [fetchSalaryGrades]);

  // Log current state
  console.log("🏢 Current departments:", departments);
  console.log("💰 Current salary grades:", salaryGrades);

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

  // Update delete handler
  const handleDelete = async (gradeId: string) => {
    try {
      await salaryStructureService.deleteSalaryGrade(gradeId);
      fetchSalaryGrades(); // Refresh the list
      toast.success("Salary grade deleted successfully");
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
               transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
               animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
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
                className="rounded-md border-gray-300"
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
              {filteredGrades.map((grade) => {
                const {
                  basicSalary = 0,
                  totalAllowances = 0,
                  grossSalary = 0,
                } = salaryStructureService.calculateTotalSalary(grade) || {};

                return (
                  <tr
                    key={grade._id.toString()}
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
                        ₦{basicSalary.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Base Pay</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm md:text-base text-gray-900">
                        ₦{totalAllowances.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Additional Benefits
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm md:text-base font-medium text-green-600">
                        ₦{grossSalary.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Package</div>
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
                            onClick={() => {
                              console.log("🎯 Pre-fetch grade:", {
                                currentDept: grade.department,
                                deptId: grade.department?._id,
                                deptName: grade.department?.name,
                                fullGrade: grade,
                              });

                              salaryStructureService
                                .getSalaryGrade(grade._id.toString())
                                .then((freshGrade) => {
                                  console.log("📥 Fresh grade data:", {
                                    department: freshGrade.department,
                                    deptId: freshGrade.department?._id,
                                    deptName: freshGrade.department?.name,
                                  });
                                  setEditingGrade(freshGrade);
                                });
                            }}
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
                      <Link
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setViewingGradeId(grade._id.toString());
                        }}
                        className="text-xs md:text-sm px-2 py-1 bg-green-100 text-green-700 rounded-lg 
                                 hover:bg-green-200 transition-all duration-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <NewSalaryGrade
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSalaryGradeCreated}
      />

      {editingGrade && (
        <EditSalaryGrade
          isOpen={!!editingGrade}
          onClose={() => setEditingGrade(null)}
          onSuccess={() => {
            fetchSalaryGrades();
            setEditingGrade(null);
          }}
          grade={editingGrade}
        />
      )}

      {viewingGradeId && (
        <ViewSalaryGrade
          isOpen={!!viewingGradeId}
          onClose={() => setViewingGradeId(null)}
          gradeId={viewingGradeId}
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
