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
} from "@mui/material";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaBuilding,
  FaBriefcase,
} from "react-icons/fa";
import { employeeService } from "../../../services/employeeService";
import { toast } from "react-toastify";
import { Employee, OffboardingStatus } from "../../../types/employee";

export default function Offboarding() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffboardingEmployees();
  }, []);

  const fetchOffboardingEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getOffboardingUsers();
      setEmployees(response.data);
    } catch (error) {
      toast.error("Failed to fetch offboarding employees");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: OffboardingStatus) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      default:
        return "error";
    }
  };

  const calculateProgress = (
    checklist?: { completed: boolean; _id: string; id: string }[]
  ) => {
    if (!checklist || checklist.length === 0) return 0;
    const completed = checklist.filter((item) => item.completed).length;
    return (completed / checklist.length) * 100;
  };

  const handleRevert = async (employeeId: string) => {
    try {
      await employeeService.revertToOnboarding(employeeId);
      toast.success("Employee reverted to onboarding successfully");
      // Refresh the list after successful revert
      fetchOffboardingEmployees();
    } catch (error) {
      toast.error("Failed to revert employee status");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold" }}>
        Offboarding Employees
      </Typography>

      {employees && employees.length > 0 ? (
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
                    "&:hover": {
                      boxShadow: 6,
                      transform: "translateY(-4px)",
                      transition: "all 0.3s",
                    },
                  }}
                >
                  <CardContent>
                    {/* Status Chip */}
                    <Chip
                      label={employee.offboarding?.status || "pending_exit"}
                      color={getStatusColor(employee.offboarding?.status)}
                      size="small"
                      sx={{ position: "absolute", top: 16, right: 16 }}
                    />

                    {/* Employee Info */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FaUserCircle size={40} color="#1976d2" />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6" component="div">
                          {employee.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.employeeId}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Department & Position */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <FaBuilding size={16} style={{ marginRight: 8 }} />
                        <Typography variant="body2">
                          {employee.department?.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <FaBriefcase size={16} style={{ marginRight: 8 }} />
                        <Typography variant="body2">
                          {employee.position}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Start Date */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FaCalendarAlt size={16} style={{ marginRight: 8 }} />
                      <Typography variant="body2">
                        Started:{" "}
                        {new Date(
                          employee.offboarding?.initiatedAt || ""
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Offboarding Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={calculateProgress(
                          employee.offboarding?.checklist
                        )}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={() => {
                          /* Handle view details */
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={() => handleRevert(employee._id)}
                      >
                        Revert
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No employees in offboarding process</Typography>
      )}
    </Box>
  );
}
