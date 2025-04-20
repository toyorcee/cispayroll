import { useState, useEffect } from "react";
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  DialogActions,
  CircularProgress,
  Tooltip,
  Pagination,
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
  FaKey,
  FaMoneyBillWave,
  FaDownload,
  FaEnvelope,
} from "react-icons/fa";
import { offboardingService } from "../../../services/offboardingService";
import { toast } from "react-toastify";
import { Employee, OffboardingStatus } from "../../../types/employee";
import { OffboardingTask as ImportedOffboardingTask } from "../../../types/offboarding";

// Use the imported OffboardingTask type
type OffboardingTask = ImportedOffboardingTask;

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
  const limit = 6;

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
      const response = await offboardingService.getOffboardingUsers(
        page,
        limit
      );
      console.log("Fetched offboarding employees:", response);
      setEmployees(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalEmployees(response.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch offboarding employees:", error);
      toast.error("Failed to fetch offboarding employees");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
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
    setSelectedEmployee(employee);
    setShowTasksModal(true);
  };

  const handleCompleteTask = async (taskName: string, completed: boolean) => {
    if (!selectedEmployee?._id) {
      console.error("❌ No employee selected for completing task");
      return;
    }

    console.log("🔄 Starting task completion process:", {
      taskName,
      completed,
      employeeId: selectedEmployee._id,
    });

    try {
      // Optimistically update the local state
      setLocalEmployee((prev) => {
        if (!prev) return prev;
        const updatedEmployee = { ...prev };
        const task = updatedEmployee.offboarding?.tasks?.find(
          (t) => t.name === taskName
        );
        if (task) {
          task.completed = completed;
          task.completedAt = completed ? new Date().toISOString() : undefined;
          task.completedBy = completed ? "current_user" : undefined;
        }
        return updatedEmployee;
      });

      // Make API call in the background
      await offboardingService.completeTask(
        selectedEmployee._id,
        taskName,
        completed
      );

      // Show success message
      toast.success(
        `Task ${completed ? "completed" : "uncompleted"} successfully`
      );

      // Refresh employee list in the background without showing loading spinner
      const refreshEmployees = async () => {
        try {
          const response = await offboardingService.getOffboardingUsers(
            page,
            limit
          );
          setEmployees(response.data || []);
          setTotalPages(response.pagination?.totalPages || 1);
          setTotalEmployees(response.pagination?.total || 0);
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
        employeeId: selectedEmployee._id,
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
    }
  };

  const getTaskIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "documentation":
        return <FaFileAlt />;
      case "equipment_return":
        return <FaLaptop />;
      case "access_revocation":
        return <FaKey />;
      case "financial":
        return <FaMoneyBillWave />;
      default:
        return <FaTasks />;
    }
  };

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

  const handleEmailReport = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      await offboardingService.emailFinalSettlementReport(selectedEmployee._id);
      toast.success("Final settlement report sent via email");
    } catch (error) {
      console.error("Error sending final settlement report:", error);
      toast.error("Failed to send final settlement report");
    } finally {
      setLoading(false);
    }
  };

  const TasksModal = () => (
    <Dialog
      open={showTasksModal}
      onClose={() => setShowTasksModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="flex justify-between items-center">
        <div>
          <Typography variant="h5" component="span">
            Offboarding Tasks
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {localEmployee?.firstName} {localEmployee?.lastName}
          </Typography>
        </div>
        <Chip
          label={`${calculateProgress(
            localEmployee?.offboarding?.tasks
          )}% Complete`}
          color="primary"
          variant="outlined"
        />
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Exit Interview Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <FaFileAlt /> Exit Interview & Documentation
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      localEmployee?.offboarding?.tasks?.find(
                        (t) => t.name === "exit_interview"
                      )?.completed || false
                    }
                    onChange={(e) =>
                      handleCompleteTask("exit_interview", e.target.checked)
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Complete Exit Interview"
                  secondary="Schedule and complete exit interview with HR"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      localEmployee?.offboarding?.tasks?.find(
                        (t) => t.name === "documentation_handover"
                      )?.completed || false
                    }
                    onChange={(e) =>
                      handleCompleteTask(
                        "documentation_handover",
                        e.target.checked
                      )
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Documentation Handover"
                  secondary="Ensure all work documents are properly organized and handed over"
                />
              </ListItem>
            </List>
          </Box>

          {/* Equipment Return Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <FaLaptop /> Equipment & Access
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      localEmployee?.offboarding?.tasks?.find(
                        (t) => t.name === "equipment_return"
                      )?.completed || false
                    }
                    onChange={(e) =>
                      handleCompleteTask("equipment_return", e.target.checked)
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Return Company Equipment"
                  secondary="Return laptop, access cards, and other company property"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      localEmployee?.offboarding?.tasks?.find(
                        (t) => t.name === "access_revocation"
                      )?.completed || false
                    }
                    onChange={(e) =>
                      handleCompleteTask("access_revocation", e.target.checked)
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Revoke System Access"
                  secondary="Remove access to company systems and accounts"
                />
              </ListItem>
            </List>
          </Box>

          {/* Knowledge Transfer Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <FaTasks /> Knowledge Transfer
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      localEmployee?.offboarding?.tasks?.find(
                        (t) => t.name === "knowledge_transfer"
                      )?.completed || false
                    }
                    onChange={(e) =>
                      handleCompleteTask("knowledge_transfer", e.target.checked)
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Complete Knowledge Transfer"
                  secondary="Transfer ongoing projects and responsibilities to team members"
                />
              </ListItem>
            </List>
          </Box>

          {/* Final Settlement Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <FaMoneyBillWave /> Final Settlement
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      localEmployee?.offboarding?.tasks?.find(
                        (t) => t.name === "final_payroll_processing"
                      )?.completed || false
                    }
                    onChange={(e) =>
                      handleCompleteTask(
                        "final_payroll_processing",
                        e.target.checked
                      )
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Process Final Settlement"
                  secondary="Complete final salary, benefits, and clearance processing"
                />
              </ListItem>

              {/* Show these buttons only if final settlement is completed */}
              {localEmployee?.offboarding?.tasks?.find(
                (t) => t.name === "final_payroll_processing"
              )?.completed && (
                <Box sx={{ mt: 2 }}>
                  {/* Grid layout for buttons */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Tooltip
                        title="View Final Settlement Report in a new tab"
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<FaFileAlt />}
                          onClick={() => handleGenerateReport("view")}
                          disabled={generatingReport}
                          fullWidth
                        >
                          View Report
                        </Button>
                      </Tooltip>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Tooltip
                        title="Download Final Settlement Report as PDF"
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<FaDownload />}
                          onClick={() => handleGenerateReport("download")}
                          disabled={generatingReport}
                          fullWidth
                        >
                          Download
                        </Button>
                      </Tooltip>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Tooltip
                        title="Email Final Settlement Report to Employee"
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<FaEnvelope />}
                          onClick={handleEmailReport}
                          disabled={generatingReport}
                          fullWidth
                        >
                          Email
                        </Button>
                      </Tooltip>
                    </Grid>
                  </Grid>
                  {generatingReport && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                    >
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </Box>
              )}
            </List>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setShowTasksModal(false)}
          color="primary"
          variant="outlined"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

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

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#16a34a",
            fontWeight: 500,
            fontSize: "1.8rem",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            "& svg": {
              fontSize: "1.8rem",
            },
          }}
        >
          <FaUserCircle /> Offboarding Management
        </Typography>
        <Chip
          label="✨ Onboarding & Offboarding Ready"
          sx={{
            backgroundColor: "#ecfdf5",
            color: "#16a34a",
            fontWeight: 500,
            fontSize: "0.95rem",
            height: "36px",
            "& .MuiChip-label": {
              px: 2.5,
              py: 0.8,
            },
          }}
        />
      </Box>

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
                      borderRadius: 2,
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        transform: "translateY(-4px)",
                        transition: "all 0.3s ease",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: (theme) => {
                          const status =
                            employee.offboarding?.status?.toLowerCase();
                          switch (status) {
                            case "completed":
                              return "#16a34a";
                            case "in_progress":
                              return "#f59e0b";
                            case "pending":
                              return "#3b82f6";
                            case "cancelled":
                              return "#ef4444";
                            default:
                              return "#94a3b8";
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
                          "& .MuiChip-label": {
                            fontWeight: 500,
                          },
                        }}
                      />
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 3 }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                            {employee.profileImage ? (
                              <img
                                src={`http://localhost:5000/${employee.profileImage}`}
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
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <span className="text-primary font-medium">
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
                                fontSize: "1.1rem",
                                fontWeight: 500,
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
                          <Typography variant="body2">
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
                          <Typography variant="body2">
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
                        }}
                      >
                        <FaCalendarAlt size={14} style={{ marginRight: 8 }} />
                        <Typography variant="body2">
                          Exit Date:{" "}
                          <span style={{ color: "#16a34a", fontWeight: 500 }}>
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
                              fontWeight: 500,
                            }}
                          >
                            Progress
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#16a34a",
                              fontWeight: 500,
                            }}
                          >
                            {calculateProgress(employee.offboarding?.tasks)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgress(employee.offboarding?.tasks)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#f1f5f9",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 3,
                              backgroundColor: "#16a34a",
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
                            backgroundColor: "#16a34a",
                            "&:hover": {
                              backgroundColor: "#15803d",
                            },
                            textTransform: "none",
                            borderRadius: 1.5,
                            py: 1,
                          }}
                        >
                          Manage Tasks
                        </Button>
                      </Box>
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
            p: 4,
            backgroundColor: "#f8fafc",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#64748b",
              fontWeight: 500,
              mb: 1,
            }}
          >
            No Offboarding Employees
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            There are currently no employees in the offboarding process
          </Typography>
        </Box>
      )}

      <TasksModal />
    </Box>
  );
}
