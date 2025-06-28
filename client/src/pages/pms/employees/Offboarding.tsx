import { useState, useEffect, useRef } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
  DialogContentText,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaBuilding,
  FaBriefcase,
  FaTasks,
  FaFileAlt,
  FaLaptop,
  FaMoneyBillWave,
  FaEnvelope,
  FaSignOutAlt,
  FaUserTimes,
  FaClipboardCheck,
  FaShieldAlt,
  FaHandshake,
  FaDoorOpen,
  FaUserTie,
  FaCheckCircle,
  FaClipboardList,
  FaFilePdf,
  FaFileCsv,
  FaPrint,
  FaExclamationTriangle,
  FaCalculator,
} from "react-icons/fa";
import { offboardingService } from "../../../services/offboardingService";
import { toast } from "react-toastify";
import { Employee, OffboardingStatus } from "../../../types/employee";
import { OffboardingTask as ImportedOffboardingTask } from "../../../types/offboarding";
import Confetti from "react-dom-confetti";
import {
  generateOffboardingPDF,
  exportOffboardingToCSV,
  printOffboardingPDF,
} from "../../../utils/offboardingPdf";
import { settlementToCSV } from "../../../utils/formatters";

type OffboardingTask = ImportedOffboardingTask;

const CATEGORY_MAP: Record<string, { title: string; icon: React.ReactNode }> = {
  exit_interview: {
    title: "Exit Interview",
    icon: <FaFileAlt className="text-blue-400" />,
  },
  documentation: {
    title: "Documentation",
    icon: <FaClipboardCheck className="text-blue-400" />,
  },
  equipment_return: {
    title: "Equipment Return",
    icon: <FaLaptop className="text-emerald-400" />,
  },
  access_revocation: {
    title: "Access Revocation",
    icon: <FaShieldAlt className="text-emerald-400" />,
  },
  knowledge_transfer: {
    title: "Knowledge Transfer",
    icon: <FaTasks className="text-yellow-400" />,
  },
  financial: {
    title: "Final Settlement",
    icon: <FaMoneyBillWave className="text-green-400" />,
  },
};

// Beautiful Info Section for Offboarding Page
const OffboardingInfoSection = () => (
  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-8 shadow-sm">
    <div className="flex items-center mb-3">
      <FaSignOutAlt className="text-red-600 text-lg mr-2" />
      <h3 className="text-base font-semibold text-gray-800">
        Offboarding Management Info
      </h3>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <FaUserTimes className="text-red-600 text-xs" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-sm mb-1">
              Employee Exit Process
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Manages the complete <strong>exit process</strong> for employees
              leaving the organization.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <FaClipboardCheck className="text-orange-600 text-xs" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-sm mb-1">
              Task Management
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Track and complete</strong> all required offboarding tasks
              including equipment return, access revocation, and final
              settlement.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800 text-sm mb-2">
          Key Processes:
        </h4>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
            <FaFileAlt className="text-red-600 text-xs" />
          </div>
          <div>
            <h5 className="font-medium text-gray-700 text-xs mb-1">
              Exit Interview
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Complete exit interview and documentation handover.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
            <FaLaptop className="text-orange-600 text-xs" />
          </div>
          <div>
            <h5 className="font-medium text-gray-700 text-xs mb-1">
              Equipment Return
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Return company equipment and revoke system access.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
            <FaMoneyBillWave className="text-green-600 text-xs" />
          </div>
          <div>
            <h5 className="font-medium text-gray-700 text-xs mb-1">
              Final Settlement
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Process final payroll and generate settlement reports.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-red-200">
      <div className="flex items-center mb-2">
        <FaHandshake className="text-red-600 text-xs mr-1" />
        <span className="text-xs font-medium text-gray-700">Process Tips</span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
          <span>Ensure all tasks are completed before final settlement</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
          <span>Generate and email final settlement reports to employees</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>Track progress with visual progress indicators</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>Maintain compliance with exit documentation requirements</span>
        </div>
      </div>
    </div>
  </div>
);

// Helper to sanitize and format the employee object for export
function getExportableOffboardingEmployee(employee: any) {
  return {
    employee: {
      employeeId: employee.employeeId ? String(employee.employeeId) : "N/A",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      department: { name: employee.department?.name || "N/A" },
      position: employee.position || "N/A",
    },
    offboarding: {
      initiatedDate:
        employee.offboarding?.initiatedDate || employee.createdAt || new Date(),
      targetExitDate: employee.offboarding?.targetExitDate || "N/A",
      status: employee.offboarding?.status || "In Progress",
      progress:
        typeof employee.offboarding?.progress === "number"
          ? employee.offboarding.progress
          : 0,
      tasks: Array.isArray(employee.offboarding?.tasks)
        ? employee.offboarding.tasks.map((task: any) => ({
            category: task.category || "General",
            name: task.name || "N/A",
            completed: !!task.completed,
            dueDate: task.dueDate || "",
          }))
        : [],
    },
  };
}

export default function Offboarding() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [localEmployee, setLocalEmployee] = useState<Employee | null>(null);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Confirmation modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{
    type: "email" | "pdf" | "csv" | "print";
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // Calculation breakdown modal states
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [calculationDetails, _setCalculationDetails] = useState<any>(null);
  const [calculationLoading, _setCalculationLoading] = useState(false);

  useEffect(() => {
    fetchOffboardingEmployees();
  }, [page]);

  // Update local employee when selected employee changes
  useEffect(() => {
    if (selectedEmployee) {
      setLocalEmployee(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchOffboardingEmployees = async () => {
    try {
      setLoading(true);
      const response = await offboardingService.getOffboardingEmployees();
      console.log("Fetched offboarding employees:", response);

      // Transform OffboardingEmployee to Employee format
      const transformedEmployees: Employee[] = response.map(
        (offboardingEmp: any) => ({
          _id: offboardingEmp.id,
          id: offboardingEmp.id,
          employeeId: offboardingEmp.id,
          firstName: offboardingEmp.firstName,
          lastName: offboardingEmp.lastName,
          fullName: `${offboardingEmp.firstName} ${offboardingEmp.lastName}`,
          email: offboardingEmp.email,
          phone: "",
          role: "USER",
          department: offboardingEmp.department,
          position: offboardingEmp.position,
          gradeLevel: "",
          workLocation: "",
          status: "active",
          offboarding: {
            status: offboardingEmp.offboardingStatus,
            type: "voluntary_resignation" as const,
            reason: offboardingEmp.reason,
            targetExitDate: offboardingEmp.offboarding?.targetExitDate,
            tasks: offboardingEmp.offboarding?.tasks || [],
            progress: offboardingEmp.progress || 0,
          },
          permissions: [],
          progress: offboardingEmp.progress || 0,
          dateJoined: "",
          supervisor: offboardingEmp.supervisor?.name || "",
          tasks: [],
          onboardingStatus: "completed",
          bankDetails: {
            bankName: "",
            accountNumber: "",
            accountName: "",
            bankCode: "",
          },
          salary: {
            basic: 0,
            allowances: [],
            deductions: [],
          },
          taxInfo: {
            tin: "",
          },
          pensionInfo: {
            pensionNumber: "",
            pensionProvider: "",
            employeeContribution: 0,
            employerContribution: 0,
          },
          leave: {
            annual: 0,
            sick: 0,
            unpaid: 0,
          },
          overtime: {
            rate: 0,
            hoursWorked: 0,
          },
          emergencyContact: {
            name: "",
            relationship: "",
            phone: "",
          },
          profileImage: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastWorkingDate: new Date(),
          initiatedDate: new Date(),
          reason: offboardingEmp.reason,
          clearance: {
            itClearance: false,
            financeClearance: false,
            hrClearance: false,
            departmentClearance: false,
          },
        })
      );

      setEmployees(transformedEmployees);
      setTotalPages(1);
      setTotalEmployees(transformedEmployees.length);
    } catch (error) {
      console.error("Failed to fetch offboarding employees:", error);
      toast.error("Failed to fetch offboarding employees");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getStatusColor = (status?: OffboardingStatus) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "pending":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const calculateProgress = (tasks?: OffboardingTask[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const handleViewTasks = (employee: Employee) => {
    console.log(
      "[Offboarding] Viewing tasks for:",
      employee.fullName,
      employee.offboarding?.tasks
    );
    setSelectedEmployee(employee);
    setShowTasksModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerateReport = async (action: "view" | "download" = "view") => {
    if (!selectedEmployee) return;

    try {
      setGeneratingReport(true);
      const response = await offboardingService.getFinalSettlementReport(
        selectedEmployee._id
      );

      // Create a blob from the PDF data
      const blob = new Blob([response], { type: "application/pdf" });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      if (action === "download") {
        // Create a temporary link element for download
        const link = document.createElement("a");
        link.href = url;
        link.download = `final_settlement_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`;

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Open in a new tab for viewing
        window.open(url, "_blank");
      }

      // Clean up the URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      // Show success message
      toast.success(
        `Final settlement report ${
          action === "download" ? "downloaded" : "generated"
        } successfully`
      );
    } catch (error) {
      console.error("Error generating final settlement report:", error);
      toast.error("Failed to generate final settlement report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const TasksModal = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>(
      {}
    );
    const confettiRef = useRef(null);
    const tasks = localEmployee?.offboarding?.tasks || [];
    const completedCount = tasks.filter((t) => t.completed).length;
    const progress = tasks.length
      ? Math.round((completedCount / tasks.length) * 100)
      : 0;
    const allTasksComplete =
      tasks.length > 0 && completedCount === tasks.length;

    useEffect(() => {
      if (allTasksComplete) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }, [allTasksComplete]);

    const handleTaskComplete = async (taskName: string, completed: boolean) => {
      if (!localEmployee?._id || !localEmployee?.offboarding) {
        console.error("❌ No employee selected for completing task");
        return;
      }

      try {
        setLoadingTasks((prev) => ({ ...prev, [taskName]: true }));

        // Update local state immediately (optimistic update)
        const updatedTasks = localEmployee.offboarding!.tasks.map((task) =>
          task.name === taskName
            ? {
                ...task,
                completed,
                completedAt: completed ? new Date().toISOString() : undefined,
                completedBy: completed ? "current_user" : undefined,
              }
            : task
        );

        const newCompletedCount = updatedTasks.filter(
          (t) => t.completed
        ).length;
        const newProgress = Math.round(
          (newCompletedCount / updatedTasks.length) * 100
        );

        const updatedEmployee: Employee = {
          ...localEmployee,
          offboarding: {
            ...localEmployee.offboarding!,
            tasks: updatedTasks,
            progress: newProgress,
            status: localEmployee.offboarding!.status || "in_progress",
          },
        };

        setLocalEmployee(updatedEmployee);

        // Make API call to update the backend
        await offboardingService.completeOffboardingTask(
          localEmployee._id,
          taskName,
          completed,
          completed ? "Task completed" : "Task uncompleted"
        );

        // Show success message
        toast.success(
          `Task "${taskName}" ${
            completed ? "marked as complete" : "marked as incomplete"
          }`
        );

        // Refresh employee list in the background
        const refreshEmployees = async () => {
          try {
            const response = await offboardingService.getOffboardingEmployees();
            const transformedEmployees: Employee[] = response.map(
              (offboardingEmp: any) => ({
                _id: offboardingEmp.id,
                id: offboardingEmp.id,
                employeeId: offboardingEmp.id,
                firstName: offboardingEmp.firstName,
                lastName: offboardingEmp.lastName,
                fullName: `${offboardingEmp.firstName} ${offboardingEmp.lastName}`,
                email: offboardingEmp.email,
                phone: "",
                role: "USER",
                department: offboardingEmp.department,
                position: offboardingEmp.position,
                gradeLevel: "",
                workLocation: "",
                status: "active",
                offboarding: {
                  status: offboardingEmp.offboardingStatus,
                  type: "voluntary_resignation" as const,
                  reason: offboardingEmp.reason,
                  targetExitDate: offboardingEmp.offboarding?.targetExitDate,
                  tasks: offboardingEmp.offboarding?.tasks || [],
                  progress: offboardingEmp.progress || 0,
                },
                permissions: [],
                progress: offboardingEmp.progress || 0,
                dateJoined: "",
                supervisor: offboardingEmp.supervisor?.name || "",
                tasks: [],
                onboardingStatus: "completed",
                bankDetails: {
                  bankName: "",
                  accountNumber: "",
                  accountName: "",
                  bankCode: "",
                },
                salary: {
                  basic: 0,
                  allowances: [],
                  deductions: [],
                },
                taxInfo: {
                  tin: "",
                },
                pensionInfo: {
                  pensionNumber: "",
                  pensionProvider: "",
                  employeeContribution: 0,
                  employerContribution: 0,
                },
                leave: {
                  annual: 0,
                  sick: 0,
                  unpaid: 0,
                },
                overtime: {
                  rate: 0,
                  hoursWorked: 0,
                },
                emergencyContact: {
                  name: "",
                  relationship: "",
                  phone: "",
                },
                profileImage: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                lastWorkingDate: new Date(),
                initiatedDate: new Date(),
                reason: offboardingEmp.reason,
                clearance: {
                  itClearance: false,
                  financeClearance: false,
                  hrClearance: false,
                  departmentClearance: false,
                },
              })
            );
            setEmployees(transformedEmployees);
            setTotalPages(1);
            setTotalEmployees(transformedEmployees.length);
          } catch (error) {
            console.error("❌ Error refreshing employee list:", error);
          }
        };
        refreshEmployees();
      } catch (error) {
        console.error("❌ Error completing task:", {
          taskName,
          completed,
          error: error instanceof Error ? error.message : "Unknown error",
          employeeId: localEmployee._id,
        });

        // Revert optimistic update on error
        setLocalEmployee((prev) => {
          if (!prev) return prev;
          const updatedEmployee = { ...prev };
          const task = updatedEmployee.offboarding?.tasks?.find(
            (t) => t.name === taskName
          );
          if (task) {
            task.completed = !completed;
            task.completedAt = undefined;
            task.completedBy = undefined;
          }
          return updatedEmployee;
        });

        toast.error(
          `Failed to ${
            completed ? "complete" : "uncomplete"
          } task. Please try again.`
        );
      } finally {
        setLoadingTasks((prev) => ({ ...prev, [taskName]: false }));
      }
    };

    return (
      <Dialog
        open={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        maxWidth="md"
        fullWidth
      >
        {/* Header */}
        <div className="relative rounded-t-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
            {localEmployee?.profileImage ? (
              <img
                src={localEmployee.profileImage}
                alt={localEmployee.fullName}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <FaUserTie className="text-emerald-600 text-3xl" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
              <FaCheckCircle
                className={
                  allTasksComplete
                    ? "text-yellow-300 animate-bounceIn"
                    : "hidden"
                }
              />
              Offboarding Tasks
            </h2>
            <div className="text-sm text-emerald-100 font-medium">
              {localEmployee?.firstName} {localEmployee?.lastName}
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end">
            {/* Circular Progress Bar */}
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.6s" }}
                />
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  fontSize="20"
                  fill="#fff"
                  className="font-bold"
                >
                  {progress}%
                </text>
              </svg>
            </div>
          </div>
          {/* Confetti celebration */}
          <div
            ref={confettiRef}
            className="absolute left-1/2 -translate-x-1/2 top-0"
          >
            <Confetti active={showConfetti} />
          </div>
        </div>
        <DialogContent className="bg-white rounded-b-2xl p-0">
          <div className="p-6 space-y-6">
            {/* Export Buttons Section */}
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}
            >
              <Button
                variant="contained"
                startIcon={<FaFilePdf />}
                onClick={() => {
                  if (localEmployee) {
                    const exportData =
                      getExportableOffboardingEmployee(localEmployee);
                    generateOffboardingPDF(exportData);
                    toast.success("PDF report generated!");
                  }
                }}
                sx={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  },
                  textTransform: "none",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<FaFileCsv />}
                onClick={() => {
                  if (localEmployee) {
                    const exportData =
                      getExportableOffboardingEmployee(localEmployee);
                    exportOffboardingToCSV(exportData);
                    toast.success("CSV exported!");
                  }
                }}
                sx={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  },
                  textTransform: "none",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                Download CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<FaPrint />}
                onClick={() => {
                  if (localEmployee) {
                    const exportData =
                      getExportableOffboardingEmployee(localEmployee);
                    printOffboardingPDF(exportData);
                    toast.success("Print dialog opened!");
                  }
                }}
                sx={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  },
                  textTransform: "none",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                Print PDF
              </Button>
              {allTasksComplete && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<FaCalculator />}
                    onClick={() => handleGenerateReport("view")}
                    disabled={generatingReport}
                    sx={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                      },
                      "&:disabled": {
                        background: "#9ca3af",
                      },
                      textTransform: "none",
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  >
                    {generatingReport ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "View Settlement"
                    )}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FaFilePdf />}
                    onClick={() => handleGenerateReport("download")}
                    disabled={generatingReport}
                    sx={{
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                      },
                      "&:disabled": {
                        background: "#9ca3af",
                      },
                      textTransform: "none",
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  >
                    {generatingReport ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Download Settlement"
                    )}
                  </Button>
                </>
              )}
            </Box>

            {/* Group tasks by category */}
            {Object.entries(
              tasks.reduce((acc, task) => {
                if (!acc[task.category]) acc[task.category] = [];
                acc[task.category].push(task);
                return acc;
              }, {} as Record<string, OffboardingTask[]>)
            ).map(([category, group]) => (
              <div
                key={category}
                className="rounded-xl shadow-sm p-4 mb-4"
                style={{
                  background:
                    category === "financial"
                      ? "#f0fdf4"
                      : category === "knowledge_transfer"
                      ? "#fef9c3"
                      : category === "equipment_return" ||
                        category === "access_revocation"
                      ? "#ecfdf5"
                      : "#eff6ff",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {CATEGORY_MAP[category]?.icon}
                  <span
                    className={`font-semibold text-lg ${
                      category === "financial"
                        ? "text-green-700"
                        : category === "knowledge_transfer"
                        ? "text-yellow-700"
                        : category === "equipment_return" ||
                          category === "access_revocation"
                        ? "text-emerald-700"
                        : "text-blue-700"
                    }`}
                  >
                    {CATEGORY_MAP[category]?.title || category}
                  </span>
                </div>
                <div className="space-y-4">
                  {group.map((task) => (
                    <div
                      key={task.name}
                      className={`flex items-center justify-between p-4 rounded-xl shadow border transition-all duration-300 ${
                        task.completed
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {CATEGORY_MAP[category]?.icon}
                        </span>
                        <div>
                          <h3
                            className={`font-semibold ${
                              task.completed
                                ? "text-green-700 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {task.description || task.name}
                          </h3>
                          {task.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed:{" "}
                              {new Date(task.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!task.completed && !allTasksComplete && (
                          <button
                            onClick={() => handleTaskComplete(task.name, true)}
                            disabled={loadingTasks[task.name]}
                            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition-all duration-200"
                          >
                            {loadingTasks[task.name] ? "..." : "Mark Complete"}
                          </button>
                        )}
                        {task.completed && (
                          <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-500 text-xl animate-bounceIn" />
                            <button
                              onClick={() =>
                                handleTaskComplete(task.name, false)
                              }
                              disabled={loadingTasks[task.name]}
                              className="px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 transition-all duration-200"
                              title="Mark as incomplete"
                            >
                              {loadingTasks[task.name] ? "..." : "Undo"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* If no tasks, show empty state */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <FaClipboardList className="text-4xl text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No offboarding tasks assigned
                </h3>
                <p className="text-gray-500 text-center max-w-xs">
                  This employee does not have any offboarding tasks assigned
                  yet. Please contact HR or an administrator to assign tasks.
                </p>
                <button
                  onClick={() => setShowTasksModal(false)}
                  className="mt-6 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-center p-4">
            <button
              onClick={() => setShowTasksModal(false)}
              className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white text-lg shadow-lg"
              style={{
                background: "linear-gradient(90deg, #10b981 0%, #2563eb 100%)",
                transition: "background 0.3s",
              }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Detect if all offboarding employees are completed
  const allCompleted =
    employees.length > 0 &&
    employees.every((emp) => emp.offboarding?.status === "completed");

  // Show confetti when allCompleted transitions to true
  useEffect(() => {
    if (allCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [allCompleted]);

  // Reusable Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!confirmationAction) return null;

    return (
      <Dialog
        open={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#dc2626",
            fontWeight: 600,
          }}
        >
          <FaExclamationTriangle />
          {confirmationAction.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
            {confirmationAction.message}
          </DialogContentText>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "#fef3c7",
              borderRadius: 1,
              border: "1px solid #f59e0b",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#92400e", fontWeight: 600 }}
            >
              ⚠️ This action will affect {employees.length} employee
              {employees.length !== 1 ? "s" : ""} currently in the offboarding
              process.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowConfirmationModal(false)}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setShowConfirmationModal(false);
              try {
                await confirmationAction.action();
              } catch (error) {
                console.error("Action failed:", error);
              }
            }}
            variant="contained"
            color="error"
            disabled={generatingReport}
            sx={{ textTransform: "none" }}
          >
            {generatingReport ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Calculation Breakdown Modal Component
  const CalculationBreakdownModal = () => {
    if (calculationLoading) {
      return (
        <Dialog
          open={showCalculationModal}
          onClose={() => setShowCalculationModal(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress color="success" />
          </DialogContent>
        </Dialog>
      );
    }
    if (!calculationDetails) return null;

    // --- Add a clear log for the API response ---
    console.log("Breakdown API response:", calculationDetails);

    const settlement = calculationDetails.settlementDetails;
    const payrollData = calculationDetails.payrollData;

    return (
      <Dialog
        open={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#16a34a",
            fontWeight: 600,
          }}
        >
          <FaCalculator />
          Final Settlement Calculation Breakdown
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, color: "#374151" }}>
              Employee: {calculationDetails.employee?.fullName}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Department: {calculationDetails.employee?.department?.name} |
              Position: {calculationDetails.employee?.position} | Grade Level:{" "}
              {calculationDetails.employee?.gradeLevel}
            </Typography>
          </Box>

          {/* Basic Salary and Gratuity */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
              Basic Components
            </Typography>
            <TableContainer
              component={Paper}
              sx={{ border: "1px solid #e5e7eb" }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Component</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Amount (NGN)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Calculation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell align="right">
                      {settlement?.basicSalary?.toLocaleString()}
                    </TableCell>
                    <TableCell>From salary grade</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gratuity (10%)</TableCell>
                    <TableCell align="right">
                      {settlement?.gratuity?.toLocaleString()}
                    </TableCell>
                    <TableCell>10% of basic salary</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unused Leave Payment</TableCell>
                    <TableCell align="right">
                      {settlement?.unusedLeavePayment?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {settlement?.unusedLeaveDays || 0} days × Daily rate
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Allowances Breakdown */}
          {payrollData?.allowances && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
                Allowances Breakdown
              </Typography>
              <TableContainer
                component={Paper}
                sx={{ border: "1px solid #e5e7eb" }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Allowance</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Amount (NGN)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrollData.allowances.map(
                      (allowance: any, index: number) => {
                        let typeLabel = "";
                        if (allowance.calculationMethod === "fixed") {
                          typeLabel = "Fixed";
                        } else if (
                          allowance.calculationMethod === "percentage"
                        ) {
                          typeLabel = `Percentage (${allowance.value}%)`;
                        } else {
                          typeLabel = allowance.calculationMethod || "-";
                        }
                        return (
                          <TableRow key={index}>
                            <TableCell>{allowance.name}</TableCell>
                            <TableCell align="right">
                              {(
                                allowance.amount ??
                                allowance.value ??
                                0
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell>{typeLabel}</TableCell>
                          </TableRow>
                        );
                      }
                    )}
                    <TableRow sx={{ bgcolor: "#f0fdf4" }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Total Allowances
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {settlement?.totalAllowances?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Deductions Breakdown */}
          {payrollData?.deductions && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
                Deductions Breakdown
              </Typography>
              <TableContainer
                component={Paper}
                sx={{ border: "1px solid #e5e7eb" }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Deduction</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Amount (NGN)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrollData.deductions.statutory?.map(
                      (deduction: any, index: number) => (
                        <TableRow key={`statutory-${index}`}>
                          <TableCell>{deduction.name}</TableCell>
                          <TableCell align="right">
                            {deduction.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>Statutory</TableCell>
                        </TableRow>
                      )
                    )}
                    {payrollData.deductions.voluntary?.map(
                      (deduction: any, index: number) => (
                        <TableRow key={`voluntary-${index}`}>
                          <TableCell>{deduction.name}</TableCell>
                          <TableCell align="right">
                            {deduction.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>Voluntary</TableCell>
                        </TableRow>
                      )
                    )}
                    <TableRow sx={{ bgcolor: "#fef2f2" }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Total Deductions
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {settlement?.totalDeductions?.toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Final Calculation Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
              Final Calculation Summary
            </Typography>
            <TableContainer
              component={Paper}
              sx={{ border: "2px solid #16a34a" }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#16a34a" }}>
                    <TableCell sx={{ fontWeight: 600, color: "white" }}>
                      Calculation Step
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "white" }}
                      align="right"
                    >
                      Amount (NGN)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell align="right">
                      {settlement?.basicSalary?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>+ Gratuity</TableCell>
                    <TableCell align="right">
                      + {settlement?.gratuity?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>+ Unused Leave Payment</TableCell>
                    <TableCell align="right">
                      + {settlement?.unusedLeavePayment?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>+ Total Allowances</TableCell>
                    <TableCell align="right">
                      + {settlement?.totalAllowances?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>+ Total Bonuses</TableCell>
                    <TableCell align="right">
                      + {settlement?.totalBonuses?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ borderTop: "2px solid #dc2626" }}>
                    <TableCell sx={{ fontWeight: 600, color: "#dc2626" }}>
                      - Total Deductions
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: "#dc2626" }}
                    >
                      - {settlement?.totalDeductions?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow
                    sx={{ bgcolor: "#f0fdf4", borderTop: "3px solid #16a34a" }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: "#16a34a" }}>
                      <strong>FINAL SETTLEMENT AMOUNT</strong>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: "#16a34a" }}
                    >
                      <strong>
                        ₦{settlement?.totalSettlement?.toLocaleString()}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: "#f0f9ff",
              borderRadius: 1,
              border: "1px solid #0ea5e9",
            }}
          >
            <Typography variant="body2" sx={{ color: "#0c4a6e" }}>
              <strong>Calculation Date:</strong>{" "}
              {new Date(settlement?.calculationDate).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: "#0c4a6e", mt: 1 }}>
              <strong>Exit Date:</strong>{" "}
              {new Date(
                calculationDetails.employee?.offboarding?.actualExitDate
              ).toLocaleDateString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowCalculationModal(false)}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (allCompleted) {
    return (
      <Box
        sx={{
          textAlign: "center",
          mt: 8,
          p: 6,
          background: "linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%)",
          borderRadius: 3,
          border: "2px solid #bbf7d0",
          position: "relative",
        }}
      >
        <div
          ref={confettiRef}
          className="absolute left-1/2 -translate-x-1/2 top-0"
        >
          <Confetti active={showConfetti} />
        </div>
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
          <FaClipboardCheck className="text-4xl text-green-600 animate-bounce" />
        </div>
        <Typography
          variant="h4"
          sx={{ color: "#16a34a", fontWeight: 700, mb: 2 }}
        >
          All Offboarding Completed!
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "#64748b",
            mb: 3,
            maxWidth: "500px",
            mx: "auto",
            lineHeight: 1.6,
          }}
        >
          Fantastic! All employees have successfully completed their offboarding
          process. No one is currently in the exit pipeline.
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={`✅ ${employees.length} recently offboarded`}
            sx={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              color: "#16a34a",
              fontWeight: 600,
            }}
          />
          <Chip
            label="🎉 Exit process running smoothly"
            sx={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "#2563eb",
              fontWeight: 600,
            }}
          />
        </Box>
        {/* Recently Offboarded Employees */}
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h6"
            sx={{ color: "#16a34a", fontWeight: 600, mb: 2 }}
          >
            Recently Offboarded Employees
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {employees.map((emp) => (
              <Grid item key={emp._id}>
                <Chip
                  avatar={<FaUserCircle />}
                  label={`${emp.firstName} ${emp.lastName}`}
                  sx={{
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    fontWeight: 500,
                    fontSize: "1rem",
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header with Offboarding Branding */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          color: "white",
          boxShadow: "0 4px 20px rgba(220, 38, 38, 0.15)",
          position: "relative",
        }}
      >
        <div className="flex flex-col w-full md:w-auto">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.5rem" },
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: { xs: 2, md: 0 },
              "& svg": { fontSize: "2.2rem" },
            }}
          >
            <span className="inline-block mr-2">
              <FaUserTimes />
            </span>
            Offboarding Management
          </Typography>
          {/* Move the tag below and center on mobile */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: { xs: "center", md: "flex-start" },
              width: "100%",
            }}
          >
            <Chip
              label="🚪 Exit Process Management"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontWeight: 600,
                fontSize: "1rem",
                height: "40px",
                "& .MuiChip-label": { px: 3, py: 1 },
                maxWidth: { xs: "100%", md: "none" },
                whiteSpace: "normal",
              }}
            />
          </Box>
        </div>
      </Box>

      {/* Info Section */}
      <OffboardingInfoSection />

      {/* Bulk Final Settlement Actions */}
      {employees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <FaMoneyBillWave className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Final Settlement Actions
                </h3>
                <p className="text-sm text-gray-600">
                  Generate and send final settlement reports for offboarding
                  employees
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
                in offboarding
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bulk Email */}
            <button
              onClick={() => {
                setConfirmationAction({
                  type: "email",
                  title: "Send Final Settlement Emails",
                  message: `Are you sure you want to send final settlement reports via email to all ${employees.length} offboarding employees? This action cannot be undone.`,
                  action: async () => {
                    try {
                      setLoading(true);
                      const result =
                        await offboardingService.emailFinalSettlementReportBulk();
                      toast.success(
                        `Final settlement reports sent! ${result.sent} successful, ${result.failed} failed`
                      );
                      if (result.failed > 0) {
                        console.log("Failed emails:", result.details.failed);
                      }
                    } catch (error) {
                      console.error("Error sending bulk emails:", error);
                      toast.error("Failed to send final settlement reports");
                    } finally {
                      setLoading(false);
                    }
                  },
                });
                setShowConfirmationModal(true);
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <FaEnvelope className="text-lg" />
              {loading ? "Sending..." : "Email All"}
            </button>

            {/* Bulk PDF Download */}
            <button
              onClick={() => {
                setConfirmationAction({
                  type: "pdf",
                  title: "Download Final Settlement PDFs",
                  message: `Are you sure you want to download final settlement PDF reports for all ${employees.length} offboarding employees? This will generate a ZIP file with all PDFs.`,
                  action: async () => {
                    try {
                      setGeneratingReport(true);
                      const zipBlob =
                        await offboardingService.getFinalSettlementReportBulk();
                      console.log("Bulk PDF ZIP blob:", zipBlob);
                      const url = window.URL.createObjectURL(zipBlob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `final_settlements_${
                        new Date().toISOString().split("T")[0]
                      }.zip`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast.success("Final settlement PDFs downloaded!");
                    } catch (error) {
                      console.error("Error downloading bulk PDFs:", error);
                      toast.error("Failed to download final settlement PDFs");
                    } finally {
                      setGeneratingReport(false);
                    }
                  },
                });
                setShowConfirmationModal(true);
              }}
              disabled={generatingReport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <FaFilePdf className="text-lg" />
              {generatingReport ? "Generating..." : "Download All PDFs"}
            </button>

            {/* Bulk CSV Download */}
            <button
              onClick={() => {
                setConfirmationAction({
                  type: "csv",
                  title: "Download Final Settlement CSV",
                  message: `Are you sure you want to download final settlement data as CSV for all ${employees.length} offboarding employees? This will generate a comprehensive CSV file.`,
                  action: async () => {
                    try {
                      setGeneratingReport(true);
                      const details =
                        await offboardingService.getFinalSettlementDetailsBulk();
                      console.log("Bulk CSV data:", details);
                      let settlements = [];
                      if (Array.isArray(details)) {
                        settlements = details;
                      } else if (
                        details.settlementDetails &&
                        Array.isArray(details.settlementDetails)
                      ) {
                        settlements = details.settlementDetails;
                      }
                      if (settlements.length > 0) {
                        const csv = settlementToCSV(settlements);
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `final_settlements_${
                          new Date().toISOString().split("T")[0]
                        }.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        toast.success("Final settlement CSV downloaded!");
                      } else {
                        toast.error(
                          "No settlement details available for bulk export"
                        );
                      }
                    } catch (error) {
                      console.error("Error downloading bulk CSV:", error);
                      toast.error("Failed to download final settlement CSV");
                    } finally {
                      setGeneratingReport(false);
                    }
                  },
                });
                setShowConfirmationModal(true);
              }}
              disabled={generatingReport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <FaFileCsv className="text-lg" />
              {generatingReport ? "Generating..." : "Download CSV"}
            </button>

            {/* Bulk Print */}
            <button
              onClick={() => {
                setConfirmationAction({
                  type: "print",
                  title: "Print Final Settlement Reports",
                  message: `Are you sure you want to open print dialog for final settlement reports of all ${employees.length} offboarding employees? This will open multiple print windows.`,
                  action: async () => {
                    try {
                      setGeneratingReport(true);
                      const zipBlob =
                        await offboardingService.getFinalSettlementReportBulk();
                      const url = window.URL.createObjectURL(zipBlob);
                      const printWindow = window.open(url);
                      if (printWindow) {
                        printWindow.onload = () => printWindow.print();
                      }
                      toast.success("Print dialog opened for all settlements!");
                    } catch (error) {
                      console.error("Error printing bulk reports:", error);
                      toast.error("Failed to open print dialog");
                    } finally {
                      setGeneratingReport(false);
                    }
                  },
                });
                setShowConfirmationModal(true);
              }}
              disabled={generatingReport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <FaPrint className="text-lg" />
              {generatingReport ? "Opening..." : "Print All"}
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> These actions will process all employees
                currently in the offboarding process. Make sure all salary
                information is complete before generating final settlements.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {employees.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {employees.map((employee) => (
              <Grid item xs={12} sm={6} md={4} key={employee._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "2px solid transparent",
                      background:
                        "linear-gradient(135deg, #fff 0%, #fef2f2 100%)",
                      "&:hover": {
                        boxShadow: "0 8px 32px rgba(220, 38, 38, 0.15)",
                        transform: "translateY(-4px)",
                        transition: "all 0.3s ease",
                        border: "2px solid #dc2626",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "6px",
                        background: () => {
                          const status =
                            employee.offboarding?.status?.toLowerCase();
                          switch (status) {
                            case "completed":
                              return "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)";
                            case "in_progress":
                              return "linear-gradient(90deg, #f59e0b 0%, #f97316 100%)";
                            case "pending":
                              return "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)";
                            case "cancelled":
                              return "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
                            default:
                              return "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)";
                          }
                        },
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Chip
                        label={employee.offboarding?.status || "pending"}
                        color={getStatusColor(employee.offboarding?.status)}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          textTransform: "capitalize",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          "& .MuiChip-label": {
                            fontWeight: 600,
                          },
                        }}
                      />

                      {/* Exit Date Badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          left: 16,
                          background: "rgba(220, 38, 38, 0.1)",
                          color: "#dc2626",
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <FaDoorOpen size={12} />
                        Exit
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 3,
                          mt: 4,
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-orange-100 border-3 border-red-200">
                            {employee.profileImage ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/${
                                  employee.profileImage
                                }`}
                                alt={employee.fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "https://ui-avatars.com/api/?name=" +
                                    encodeURIComponent(employee.fullName);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                                <span className="text-white font-bold text-lg">
                                  {employee.firstName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <Box sx={{ ml: 2 }}>
                            <Typography
                              variant="h6"
                              component="div"
                              sx={{
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                color: "#1e293b",
                              }}
                            >
                              {employee.fullName}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#64748b",
                                fontSize: "0.875rem",
                              }}
                            >
                              {employee.email}
                            </Typography>
                          </Box>
                        </div>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1.5,
                            color: "#475569",
                          }}
                        >
                          <FaBuilding size={14} style={{ marginRight: 8 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {typeof employee.department === "object"
                              ? employee.department?.name
                              : "No Department"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            color: "#475569",
                          }}
                        >
                          <FaBriefcase size={14} style={{ marginRight: 8 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {employee.position}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 3,
                          color: "#475569",
                          background: "rgba(220, 38, 38, 0.05)",
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid rgba(220, 38, 38, 0.1)",
                        }}
                      >
                        <FaCalendarAlt
                          size={16}
                          style={{ marginRight: 8, color: "#dc2626" }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Exit Date:{" "}
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>
                            {employee.offboarding?.targetExitDate
                              ? new Date(
                                  employee.offboarding.targetExitDate
                                ).toLocaleDateString()
                              : "Not set"}
                          </span>
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#475569",
                              fontWeight: 600,
                            }}
                          >
                            Exit Progress
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#dc2626",
                              fontWeight: 700,
                            }}
                          >
                            {calculateProgress(employee.offboarding?.tasks)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgress(employee.offboarding?.tasks)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#fecaca",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              background:
                                "linear-gradient(90deg, #dc2626 0%, #ea580c 100%)",
                            },
                          }}
                        />
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleViewTasks(employee)}
                          startIcon={<FaTasks />}
                          sx={{
                            background:
                              "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #b91c1c 0%, #c2410c 100%)",
                            },
                            textTransform: "none",
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 600,
                            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
                          }}
                        >
                          Manage Exit Tasks
                        </Button>
                      </Box>

                      {/* Individual Settlement Actions - only show if 100% tasks complete */}
                      {calculateProgress(employee.offboarding?.tasks) ===
                        100 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#92400e",
                              fontWeight: 600,
                              mb: 1.5,
                              textAlign: "center",
                            }}
                          >
                            🏦 Final Settlement
                          </Typography>
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={async () => {
                                try {
                                  setGeneratingReport(true);
                                  await offboardingService.emailFinalSettlementReport(
                                    employee._id
                                  );
                                  toast.success(
                                    "Final settlement report sent to employee!"
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error sending final settlement email:",
                                    error
                                  );
                                  toast.error(
                                    "Failed to send final settlement email"
                                  );
                                } finally {
                                  setGeneratingReport(false);
                                }
                              }}
                              disabled={generatingReport}
                              startIcon={<FaEnvelope />}
                              sx={{
                                borderColor: "#10b981",
                                color: "#10b981",
                                "&:hover": {
                                  borderColor: "#059669",
                                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                                },
                                "&:disabled": {
                                  borderColor: "#9ca3af",
                                  color: "#9ca3af",
                                },
                                textTransform: "none",
                                borderRadius: 1.5,
                                px: 2,
                                py: 0.5,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              Email
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={async () => {
                                try {
                                  setGeneratingReport(true);
                                  const pdfBlob =
                                    await offboardingService.getFinalSettlementReport(
                                      employee._id
                                    );
                                  const url =
                                    window.URL.createObjectURL(pdfBlob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `final_settlement_${employee._id}.pdf`;
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  toast.success(
                                    "Final settlement PDF downloaded!"
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error downloading final settlement PDF:",
                                    error
                                  );
                                  toast.error(
                                    "Failed to download final settlement PDF"
                                  );
                                } finally {
                                  setGeneratingReport(false);
                                }
                              }}
                              disabled={generatingReport}
                              startIcon={<FaFilePdf />}
                              sx={{
                                borderColor: "#dc2626",
                                color: "#dc2626",
                                "&:hover": {
                                  borderColor: "#b91c1c",
                                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                                },
                                "&:disabled": {
                                  borderColor: "#9ca3af",
                                  color: "#9ca3af",
                                },
                                textTransform: "none",
                                borderRadius: 1.5,
                                px: 2,
                                py: 0.5,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              PDF
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Pagination Info */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {employees.length} of {totalEmployees} employees
            </Typography>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            p: 6,
            background: "linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)",
            borderRadius: 3,
            border: "2px solid rgba(220, 38, 38, 0.1)",
          }}
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
            <FaSignOutAlt className="text-3xl text-red-600" />
          </div>
          <Typography
            variant="h5"
            sx={{
              color: "#dc2626",
              fontWeight: 700,
              mb: 2,
            }}
          >
            No Employees in Offboarding
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#64748b",
              mb: 3,
              maxWidth: "500px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            There are currently no employees in the offboarding process. When
            employees are marked for exit, they will appear here for task
            management.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label="✅ All employees active"
              sx={{
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                color: "#16a34a",
                fontWeight: 600,
              }}
            />
            <Chip
              label="📋 Exit tasks ready"
              sx={{
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                color: "#2563eb",
                fontWeight: 600,
              }}
            />
            <Chip
              label="🚪 Exit process available"
              sx={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                color: "#dc2626",
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
      )}

      <TasksModal />
      <ConfirmationModal />
      <CalculationBreakdownModal />
    </Box>
  );
}
