import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { employeeService } from "../../../services/employeeService";
import { Employee, OffboardingChecklist } from "../../../types/employee";
import { Grid, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { FaSpinner, FaSync, FaFilter, FaSort } from "react-icons/fa";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";

type OffboardingStatus = "pending_exit" | "in_progress" | "completed";
type SortOption = "name" | "date" | "progress";

export default function Offboarding() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OffboardingStatus | "all">(
    "all"
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [processingFinal, setProcessingFinal] = useState<string | null>(null);
  const [confirmRevert, setConfirmRevert] = useState<string | null>(null);

  // Get unique departments from employees
  const departments = [...new Set(employees.map((emp) => emp.department))];

  useEffect(() => {
    fetchOffboardingEmployees();
  }, [refreshKey]);

  useEffect(() => {
    // Initial fetch
    fetchOffboardingEmployees();

    // Set up listener for updates
    const handleUpdate = () => {
      console.log("🔄 Offboarding list refresh triggered");
      fetchOffboardingEmployees();
    };

    // Listen for offboarding updates
    window.addEventListener("offboardingUpdated", handleUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("offboardingUpdated", handleUpdate);
    };
  }, []);

  const fetchOffboardingEmployees = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Fetching offboarding employees...");
      const response = await employeeService.getOffboardingEmployees();
      console.log("📥 Received data:", response);

      if (!response || !Array.isArray(response)) {
        console.error("❌ Invalid response format:", response);
        toast.error("Invalid data received");
        return;
      }

      setEmployees(response);
      console.log(`✅ Set ${response.length} employees to state`);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect for debugging
  useEffect(() => {
    console.log("🔄 Current employees in state:", employees);
  }, [employees]);

  const getFilteredAndSortedEmployees = () => {
    let filtered = [...employees];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.offboarding?.status === statusFilter
      );
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          );
        case "date":
          return (
            new Date(b.offboarding?.initiatedAt || 0).getTime() -
            new Date(a.offboarding?.initiatedAt || 0).getTime()
          );
        case "progress":
          const getProgress = (emp: Employee) => {
            const checklist = emp.offboarding?.checklist || {};
            return (
              Object.values(checklist).filter(Boolean).length /
              Object.values(checklist).length
            );
          };
          return getProgress(b) - getProgress(a);
        default:
          return 0;
      }
    });
  };

  const handleFinalOffboarding = async (employeeId: string) => {
    try {
      setProcessingFinal(employeeId);

      // 1. Archive employee
      await employeeService.archiveEmployee(employeeId);
      toast.success("Employee archived");

      // 2. Remove from payroll
      await employeeService.removeFromPayroll(employeeId);
      toast.success("Removed from payroll system");

      // 3. Generate final documents
      const { documents } = await employeeService.generateFinalDocuments(
        employeeId
      );

      // 4. Show success with document download option
      toast.success(
        <div>
          Final documents generated
          <button
            onClick={() => window.open(documents.url, "_blank")}
            className="ml-2 text-sky-500 hover:text-sky-600"
          >
            Download
          </button>
        </div>,
        { autoClose: false }
      );

      // 5. Update UI
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (error) {
      console.error("Error in final offboarding:", error);
      toast.error("Error completing final offboarding steps");
    } finally {
      setProcessingFinal(null);
    }
  };

  const updateOffboardingStatus = async (
    employeeId: string,
    checklistItem: keyof OffboardingChecklist
  ) => {
    try {
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee?.offboarding) return;

      const updatedChecklist = {
        ...employee.offboarding.checklist,
        [checklistItem]: !employee.offboarding.checklist[checklistItem],
      };

      // Calculate progress
      const completedItems =
        Object.values(updatedChecklist).filter(Boolean).length;
      const totalItems = Object.values(updatedChecklist).length;
      const progress = (completedItems / totalItems) * 100;

      // Determine new status
      let newStatus: OffboardingStatus;
      if (completedItems === 0) {
        newStatus = "pending_exit";
        toast.info("📝 Offboarding process started");
      } else if (completedItems === totalItems) {
        newStatus = "completed";
        toast.success("🎉 All steps completed! Starting final process...");
        // Trigger final offboarding
        await handleFinalOffboarding(employeeId);
      } else {
        newStatus = "in_progress";
        toast.info(`📊 Progress: ${Math.round(progress)}%`);
      }

      // Update in database
      await employeeService.updateOffboardingStatus(employeeId, {
        checklist: updatedChecklist,
        status: newStatus,
      });

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId
            ? {
                ...emp,
                offboarding: {
                  ...emp.offboarding!,
                  checklist: updatedChecklist,
                  status: newStatus,
                },
              }
            : emp
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  // Add this function to handle reverting
  const handleRevertToOnboarding = async (employeeId: string) => {
    try {
      await employeeService.revertToOnboarding(employeeId);
      toast.success("Employee reverted to onboarding status");
      // Remove from the current list
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (error) {
      console.error("Error reverting employee:", error);
      toast.error("Failed to revert employee status");
    }
  };

  // Update the checklist button render to show processing state
  const renderChecklistItem = (
    employee: Employee,
    key: string,
    value: boolean
  ) => (
    <button
      key={key}
      onClick={() =>
        updateOffboardingStatus(employee.id, key as keyof OffboardingChecklist)
      }
      disabled={processingFinal === employee.id}
      className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 text-left
        ${
          value
            ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 border border-blue-200 hover:shadow-sm hover:border-blue-300"
            : "bg-gradient-to-r from-gray-50 to-red-50 text-gray-600 border border-gray-200 hover:border-red-200 hover:shadow-sm"
        }
        ${
          processingFinal === employee.id ? "opacity-50 cursor-not-allowed" : ""
        }
      `}
    >
      <span className="text-xs font-medium capitalize truncate mr-2">
        {key
          .split(/(?=[A-Z])/)
          .join(" ")
          .toLowerCase()}
      </span>
      <div
        className={`h-3 w-3 rounded-full flex-shrink-0 transition-all duration-200 ${
          value
            ? "bg-gradient-to-r from-blue-500 to-green-500"
            : "bg-gradient-to-r from-gray-300 to-red-200"
        }`}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls section without heading */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <FormControl size="small" className="min-w-[180px]">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OffboardingStatus | "all")
              }
              label="Status"
              className="bg-white shadow-sm"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending_exit">
                <span className="flex items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-red-400 mr-2" />
                  Pending Exit
                </span>
              </MenuItem>
              <MenuItem value="in_progress">
                <span className="flex items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-400 to-green-400 mr-2" />
                  In Progress
                </span>
              </MenuItem>
              <MenuItem value="completed">
                <span className="flex items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-400 mr-2" />
                  Completed
                </span>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" className="min-w-[180px]">
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              label="Department"
              className="bg-white shadow-sm"
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="min-w-[180px]">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              label="Sort By"
              className="bg-white shadow-sm"
            >
              <MenuItem value="name">
                <span className="flex items-center">
                  <FaSort className="mr-2" />
                  Name
                </span>
              </MenuItem>
              <MenuItem value="date">
                <span className="flex items-center">
                  <FaSort className="mr-2" />
                  Date
                </span>
              </MenuItem>
              <MenuItem value="progress">
                <span className="flex items-center">
                  <FaSort className="mr-2" />
                  Progress
                </span>
              </MenuItem>
            </Select>
          </FormControl>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-3 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md ml-auto"
            title="Refresh"
          >
            <FaSync className={refreshKey > 0 ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Employee Grid with updated colors */}
      <Grid container spacing={3}>
        {getFilteredAndSortedEmployees().map((employee) => (
          <Grid item xs={12} sm={6} lg={4} key={employee.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-6 relative border border-gray-100 hover:border-blue-100 transition-all duration-300 hover:shadow-xl h-[400px] flex flex-col"
            >
              {/* Status Badge - now alone in the top right */}
              <div
                className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    employee.offboarding?.status === "completed"
                      ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border border-green-200"
                      : employee.offboarding?.status === "in_progress"
                      ? "bg-gradient-to-r from-blue-50 to-red-50 text-blue-700 border border-blue-200"
                      : "bg-gradient-to-r from-yellow-50 to-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {employee.offboarding?.status || "pending_exit"}
              </div>

              {/* Employee Info - more compact */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-100 via-red-50 to-green-50 rounded-full flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
                  <span className="text-blue-700 text-base font-bold">
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {`${employee.firstName} ${employee.lastName}`.length > 17
                      ? `${`${employee.firstName} ${employee.lastName}`.slice(
                          0,
                          17
                        )}...`
                      : `${employee.firstName} ${employee.lastName}`}
                  </h3>
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {employee.department} • {employee.position}
                  </p>
                  <p className="text-xs text-gray-500">
                    Started:{" "}
                    {new Date(
                      employee.offboarding?.initiatedAt || ""
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Checklist - more compact spacing */}
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(employee.offboarding?.checklist || {}).map(
                    ([key, value]) => renderChecklistItem(employee, key, value)
                  )}
                </div>
              </div>

              {/* Revert Button - new position */}
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => setConfirmRevert(employee.id)}
                  className="px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 flex items-center gap-2 border border-red-200 hover:border-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Revert to Onboarding
                </button>
              </div>

              {/* Progress Bar - fixed at bottom */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="text-blue-600 font-semibold">
                    {Math.round(
                      (Object.values(
                        employee.offboarding?.checklist || {}
                      ).filter(Boolean).length /
                        Object.values(employee.offboarding?.checklist || {})
                          .length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 transition-all duration-500"
                    style={{
                      width: `${
                        (Object.values(
                          employee.offboarding?.checklist || {}
                        ).filter(Boolean).length /
                          Object.values(employee.offboarding?.checklist || {})
                            .length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </Grid>
        ))}

        {getFilteredAndSortedEmployees().length === 0 && (
          <Grid item xs={12}>
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No employees match the current filters
            </div>
          </Grid>
        )}
      </Grid>

      {/* Updated confirmation dialog with lighter, more subtle styling */}
      {confirmRevert && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Revert
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to revert this employee back to onboarding
              status? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRevert(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRevertToOnboarding(confirmRevert);
                  setConfirmRevert(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                Confirm Revert
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
