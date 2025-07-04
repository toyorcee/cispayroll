import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  SelectChangeEvent,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission, UserRole } from "../../../types/auth";
import { leaveService, LeaveRequest } from "../../../services/leaveService";
import { LeaveStatus } from "../../../types/employee";
import InfoIcon from "@mui/icons-material/Info";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaListUl,
} from "react-icons/fa";

type SortField = "startDate" | "endDate" | "status" | "employee";
type SortOrder = "asc" | "desc";

const TeamLeaveManagement: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [_rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Use React Query hooks to fetch data
  const { data: teamLeaves, isLoading } = leaveService.useGetTeamLeaves();

  // Approve and reject mutations
  const approveLeaveMutation = leaveService.useApproveLeave();
  const rejectLeaveMutation = leaveService.useRejectLeave();

  // Fetch departments if user is super admin
  useEffect(() => {
    const fetchDepartments = async () => {
      if (user?.role === UserRole.SUPER_ADMIN) {
        try {
          const response = await fetch("/api/departments");
          const data = await response.json();
          if (data.success) {
            setDepartments(data.data);
          }
        } catch (error) {
          console.error("Error fetching departments:", error);
        }
      }
    };

    fetchDepartments();
  }, [user?.role]);

  const handleApprove = async () => {
    if (!selectedLeave) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await approveLeaveMutation.mutateAsync({
        id: selectedLeave._id,
        notes: approvalNotes,
      });

      setIsApprovalModalOpen(false);
      setApprovalNotes("");
      setSelectedLeave(null);
    } catch (error) {
      console.error("Error approving leave:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to approve leave request"
      );
      toast.error("Failed to approve leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLeave) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await rejectLeaveMutation.mutateAsync({
        id: selectedLeave._id,
        notes: rejectionReason,
      });

      setIsRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedLeave(null);
    } catch (error) {
      console.error("Error rejecting leave:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reject leave request"
      );
      toast.error("Failed to reject leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectDialog = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setRejectDialogOpen(true);
  };

  const openApproveDialog = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setApprovalNotes("");
    setIsApprovalModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.approved:
        return "success";
      case LeaveStatus.rejected:
        return "error";
      case LeaveStatus.pending:
        return "warning";
      case LeaveStatus.cancelled:
        return "default";
      default:
        return "default";
    }
  };

  // Check user permissions
  const canApproveLeave = hasPermission(Permission.APPROVE_LEAVE);
  const canViewTeamLeave = hasPermission(Permission.VIEW_TEAM_LEAVE);
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  // If user has no team leave-related permissions, show error
  if (!canViewTeamLeave && !canApproveLeave) {
    return (
      <Alert severity="error">
        You don't have permission to view team leave requests.
      </Alert>
    );
  }

  // Filter and sort leaves
  const filteredAndSortedLeaves = teamLeaves
    ?.filter((leave: LeaveRequest) => {
      // Filter by status
      const statusMatch =
        statusFilter === "all" || leave.status === statusFilter;

      // Filter by department for super admin
      const departmentMatch =
        departmentFilter === "all" ||
        (isSuperAdmin && leave.user.department === departmentFilter);

      return statusMatch && departmentMatch;
    })
    .sort((a: LeaveRequest, b: LeaveRequest) => {
      let comparison = 0;
      switch (sortField) {
        case "startDate":
          comparison =
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "endDate":
          comparison =
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "employee":
          comparison = `${a.user.firstName} ${a.user.lastName}`.localeCompare(
            `${b.user.firstName} ${b.user.lastName}`
          );
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        Team Leave Management
        {isSuperAdmin && (
          <Tooltip title="As a Super Admin, you can approve/reject leaves from all departments">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {isAdmin && (
          <Tooltip title="As an Admin, you can only approve/reject leaves from your department">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Typography>

      <Box mb={6}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 flex items-center justify-between border border-blue-200">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredAndSortedLeaves?.length || 0}
                </p>
              </div>
              <FaListUl className="w-8 h-8 text-blue-500" />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-4 flex items-center justify-between border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-700">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAndSortedLeaves?.filter(
                    (l: any) => l.status === "approved"
                  ).length || 0}
                </p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg p-4 flex items-center justify-between border border-yellow-200">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredAndSortedLeaves?.filter(
                    (l: any) => l.status === "pending"
                  ).length || 0}
                </p>
              </div>
              <FaClock className="w-8 h-8 text-yellow-500" />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-4 flex items-center justify-between border border-red-200">
              <div>
                <p className="text-sm font-medium text-red-700">
                  Rejected/Cancelled
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredAndSortedLeaves?.filter(
                    (l: any) =>
                      l.status === "rejected" || l.status === "cancelled"
                  ).length || 0}
                </p>
              </div>
              <FaTimesCircle className="w-8 h-8 text-red-500" />
            </div>
          </Grid>
        </Grid>
      </Box>

      {/* Leave Requests Table */}
      <Card className="rounded-xl shadow-lg">
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl p-4 mb-0"
            >
              Team Leave Requests
            </Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e: SelectChangeEvent) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              {/* Department filter for super admin */}
              {isSuperAdmin && departments.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={departmentFilter}
                    label="Department"
                    onChange={(e: SelectChangeEvent) =>
                      setDepartmentFilter(e.target.value)
                    }
                  >
                    <MenuItem value="all">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>

          <TableContainer component={Paper} className="rounded-xl">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    <TableSortLabel
                      active={sortField === "employee"}
                      direction={sortField === "employee" ? sortOrder : "asc"}
                      onClick={() => handleSort("employee")}
                    >
                      Employee
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    Leave Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    <TableSortLabel
                      active={sortField === "startDate"}
                      direction={sortField === "startDate" ? sortOrder : "asc"}
                      onClick={() => handleSort("startDate")}
                    >
                      Start Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    <TableSortLabel
                      active={sortField === "endDate"}
                      direction={sortField === "endDate" ? sortOrder : "asc"}
                      onClick={() => handleSort("endDate")}
                    >
                      End Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    Days
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    Reason
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    <TableSortLabel
                      active={sortField === "status"}
                      direction={sortField === "status" ? sortOrder : "asc"}
                      onClick={() => handleSort("status")}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    <Tooltip title="Actions to approve or reject leave requests">
                      <span>Actions</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : !filteredAndSortedLeaves ||
                  filteredAndSortedLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      style={{ padding: 0 }}
                    >
                      <div style={{ padding: "48px 0" }}>
                        <div className="flex flex-col items-center justify-center">
                          <FaUsers
                            className="text-blue-200"
                            style={{ fontSize: 64, marginBottom: 16 }}
                          />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Team Leave Requests
                          </h3>
                          <p className="text-gray-500 mb-4 max-w-md mx-auto">
                            There are currently no leave requests from your
                            team. When team members request leave, they will
                            appear here for your review and action.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedLeaves.map((leave: LeaveRequest) => (
                    <TableRow key={leave._id}>
                      <TableCell>
                        {leave.user.firstName} {leave.user.lastName}
                      </TableCell>
                      <TableCell>{leave.type}</TableCell>
                      <TableCell>
                        {new Date(leave.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(leave.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {Math.ceil(
                          (new Date(leave.endDate).getTime() -
                            new Date(leave.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}
                      </TableCell>
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status.toUpperCase()}
                          color={getStatusColor(leave.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {leave.status === LeaveStatus.pending &&
                        canApproveLeave ? (
                          <Box>
                            <Tooltip title="Approve this leave request">
                              <Button
                                size="small"
                                color="success"
                                onClick={() => openApproveDialog(leave)}
                                sx={{ mr: 1 }}
                                disabled={approveLeaveMutation.isPending}
                              >
                                Approve
                              </Button>
                            </Tooltip>
                            <Tooltip title="Reject this leave request">
                              <Button
                                size="small"
                                color="error"
                                onClick={() => openRejectDialog(leave)}
                                disabled={rejectLeaveMutation.isPending}
                              >
                                Reject
                              </Button>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            {leave.status === LeaveStatus.approved
                              ? `Approved by ${
                                  leave.approvedBy?.firstName || "Admin"
                                }`
                              : leave.status === LeaveStatus.rejected
                              ? "Rejected"
                              : ""}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog
        open={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Leave Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Approval Notes"
            value={approvalNotes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setApprovalNotes(e.target.value)
            }
            placeholder="Enter any notes about the approval..."
            margin="normal"
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsApprovalModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} color="inherit" />
                <span>Approving...</span>
              </Box>
            ) : (
              "Approve"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog
        open={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRejectionReason(e.target.value)
            }
            placeholder="Enter the reason for rejection..."
            margin="normal"
            required
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsRejectionModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={isSubmitting || !rejectionReason.trim()}
          >
            {isSubmitting ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} color="inherit" />
                <span>Rejecting...</span>
              </Box>
            ) : (
              "Reject"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TeamLeaveManagement;
