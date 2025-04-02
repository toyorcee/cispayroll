import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: "pending" | "approved" | "rejected";
  reason: string;
  days: number;
}

interface NewLeaveRequest {
  leaveType: string;
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
}

const UserLeaveManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([
    {
      leaveType: "Annual Leave",
      total: 20,
      used: 5,
      remaining: 15,
    },
    {
      leaveType: "Sick Leave",
      total: 10,
      used: 2,
      remaining: 8,
    },
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: "1",
      leaveType: "Annual Leave",
      startDate: new Date("2024-04-15"),
      endDate: new Date("2024-04-20"),
      status: "pending",
      reason: "Family vacation",
      days: 5,
    },
  ]);

  const [newRequest, setNewRequest] = useState<NewLeaveRequest>({
    leaveType: "",
    startDate: null,
    endDate: null,
    reason: "",
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewRequest({
      leaveType: "",
      startDate: null,
      endDate: null,
      reason: "",
    });
  };

  const handleSubmit = () => {
    if (newRequest.startDate && newRequest.endDate && newRequest.leaveType) {
      const days = Math.ceil(
        (newRequest.endDate.getTime() - newRequest.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const request: LeaveRequest = {
        id: Date.now().toString(),
        leaveType: newRequest.leaveType,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        status: "pending",
        reason: newRequest.reason || "",
        days,
      };

      setLeaveRequests([...leaveRequests, request]);
      handleCloseDialog();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "warning";
    }
  };

  // Check if user has permission to request leave
  if (!hasPermission(Permission.REQUEST_LEAVE)) {
    return (
      <Alert severity="error">
        You don't have permission to request leave.
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        My Leave Management
      </Typography>

      <Grid container spacing={3}>
        {/* Leave Balance */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Leave Balance
              </Typography>
              <Grid container spacing={2}>
                {leaveBalances.map((balance) => (
                  <Grid item xs={12} key={balance.leaveType}>
                    <Box mb={2}>
                      <Typography variant="subtitle1">
                        {balance.leaveType}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total: {balance.total} days
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Used: {balance.used} days
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Remaining: {balance.remaining} days
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Requests */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6">My Leave Requests</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenDialog}
                >
                  New Leave Request
                </Button>
              </Box>

              <Grid container spacing={2}>
                {leaveRequests.map((request) => (
                  <Grid item xs={12} key={request.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography variant="subtitle1">
                              {request.leaveType}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {request.startDate.toLocaleDateString()} -{" "}
                              {request.endDate.toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {request.days} days
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Reason: {request.reason}
                            </Typography>
                          </Box>
                          <Chip
                            label={request.status.toUpperCase()}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Leave Request Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Leave Request</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={newRequest.leaveType}
                label="Leave Type"
                onChange={(e) =>
                  setNewRequest({ ...newRequest, leaveType: e.target.value })
                }
              >
                {leaveBalances.map((balance) => (
                  <MenuItem key={balance.leaveType} value={balance.leaveType}>
                    {balance.leaveType} ({balance.remaining} days remaining)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={newRequest.startDate}
                onChange={(date) =>
                  setNewRequest({ ...newRequest, startDate: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={newRequest.endDate}
                onChange={(date) =>
                  setNewRequest({ ...newRequest, endDate: date })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>

            <TextField
              label="Reason"
              multiline
              rows={4}
              value={newRequest.reason}
              onChange={(e) =>
                setNewRequest({ ...newRequest, reason: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserLeaveManagement;
