import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  DialogContentText,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  leaveService,
  LeaveRequest,
  CreateLeaveRequest,
} from "../../../services/leaveService";
import { LeaveStatus } from "../../../types/employee";
import DeleteIcon from "@mui/icons-material/Delete";
import { FaCalendarAlt } from "react-icons/fa";

const PersonalLeaveManagement = () => {
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState<CreateLeaveRequest>({
    type: "",
    startDate: new Date(),
    endDate: new Date(),
    reason: "",
  });

  // React Query hooks
  const { data: leaves, isLoading } = leaveService.useGetMyLeaves();
  const requestLeaveMutation = leaveService.useRequestLeave();
  const cancelLeaveMutation = leaveService.useCancelLeave();
  const deleteLeaveMutation = leaveService.useDeleteLeave();

  const handleOpenLeaveModal = () => setOpenLeaveModal(true);
  const handleCloseLeaveModal = () => setOpenLeaveModal(false);

  const handleOpenCancelDialog = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setSelectedLeaveId(null);
    setOpenCancelDialog(false);
  };

  const handleOpenDeleteDialog = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedLeaveId(null);
    setOpenDeleteDialog(false);
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Submitting leave request:", leaveForm);
      await requestLeaveMutation.mutateAsync(leaveForm);
      console.log("Leave request submitted successfully");
      handleCloseLeaveModal();
      setLeaveForm({
        type: "",
        startDate: new Date(),
        endDate: new Date(),
        reason: "",
      });
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  const handleCancelLeave = async () => {
    if (!selectedLeaveId) return;

    try {
      console.log("Cancelling leave request:", selectedLeaveId);
      await cancelLeaveMutation.mutateAsync(selectedLeaveId);
      console.log("Leave request cancelled successfully");
      handleCloseCancelDialog();
    } catch (error) {
      console.error("Error cancelling leave:", error);
    }
  };

  const handleDeleteLeave = async () => {
    if (!selectedLeaveId) return;

    try {
      console.log("Deleting leave request:", selectedLeaveId);
      await deleteLeaveMutation.mutateAsync(selectedLeaveId);
      console.log("Leave request deleted successfully");
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Error deleting leave:", error);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Personal Leave Management</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenLeaveModal}
          >
            Request Leave
          </Button>
        </Box>

        {/* Leave Request Modal */}
        <Dialog
          open={openLeaveModal}
          onClose={handleCloseLeaveModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Request Leave</DialogTitle>
          <form onSubmit={handleSubmitLeave}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Leave Type</InputLabel>
                    <Select
                      value={leaveForm.type}
                      label="Leave Type"
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, type: e.target.value })
                      }
                      required
                    >
                      <MenuItem value="annual">Annual Leave</MenuItem>
                      <MenuItem value="sick">Sick Leave</MenuItem>
                      <MenuItem value="maternity">Maternity Leave</MenuItem>
                      <MenuItem value="paternity">Paternity Leave</MenuItem>
                      <MenuItem value="study">Study Leave</MenuItem>
                      <MenuItem value="unpaid">Unpaid Leave</MenuItem>
                      <MenuItem value="other">Other Leave</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={leaveForm.startDate}
                    onChange={(date) =>
                      setLeaveForm({
                        ...leaveForm,
                        startDate: date || new Date(),
                      })
                    }
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={leaveForm.endDate}
                    onChange={(date) =>
                      setLeaveForm({
                        ...leaveForm,
                        endDate: date || new Date(),
                      })
                    }
                    sx={{ width: "100%" }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Reason"
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, reason: e.target.value })
                    }
                    required
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseLeaveModal}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={requestLeaveMutation.isPending}
              >
                {requestLeaveMutation.isPending ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={openCancelDialog}
          onClose={handleCloseCancelDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Cancellation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this leave request? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCancelDialog}>No, Keep It</Button>
            <Button
              onClick={handleCancelLeave}
              color="error"
              variant="contained"
              disabled={cancelLeaveMutation.isPending}
            >
              {cancelLeaveMutation.isPending ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel It"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this leave request? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>No, Keep It</Button>
            <Button
              onClick={handleDeleteLeave}
              color="error"
              variant="contained"
              disabled={deleteLeaveMutation.isPending}
            >
              {deleteLeaveMutation.isPending ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Deleting...
                </>
              ) : (
                "Yes, Delete It"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leave List */}
        <Card className="rounded-xl shadow-lg">
          <CardContent>
            <Typography
              variant="h6"
              mb={2}
              className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl p-4"
            >
              My Leave Requests
            </Typography>
            <TableContainer component={Paper} className="rounded-xl">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                      Start Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                      End Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                      Reason
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : !leaves || leaves.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        style={{ padding: 0 }}
                      >
                        <div style={{ padding: "48px 0" }}>
                          <div className="flex flex-col items-center justify-center">
                            <FaCalendarAlt
                              className="text-blue-200"
                              style={{ fontSize: 64, marginBottom: 16 }}
                            />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              No Leave Requests
                            </h3>
                            <p className="text-gray-500 mb-4 max-w-md mx-auto">
                              You have not made any leave requests yet. When you
                              do, they will appear here for tracking and
                              management.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaves.map((leave: LeaveRequest) => (
                      <TableRow key={leave._id}>
                        <TableCell>{leave.type}</TableCell>
                        <TableCell>
                          {new Date(leave.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(leave.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{leave.reason}</TableCell>
                        <TableCell>
                          <Chip
                            label={leave.status}
                            color={getStatusColor(leave.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {leave.status === LeaveStatus.pending && (
                            <Box>
                              <Button
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleOpenCancelDialog(leave._id)
                                }
                                sx={{ mr: 1 }}
                              >
                                Cancel
                              </Button>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleOpenDeleteDialog(leave._id)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
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
      </Box>
    </LocalizationProvider>
  );
};

export default PersonalLeaveManagement;
