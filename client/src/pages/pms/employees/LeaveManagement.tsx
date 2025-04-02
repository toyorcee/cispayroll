import React, { useState } from "react";
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
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: "pending" | "approved" | "rejected";
  reason: string;
  days: number;
}

interface LeaveStats {
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalLeaveDays: number;
}

const LeaveManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: "1",
      employeeName: "John Doe",
      leaveType: "Annual Leave",
      startDate: new Date("2024-04-15"),
      endDate: new Date("2024-04-20"),
      status: "pending",
      reason: "Family vacation",
      days: 5,
    },
  ]);

  const [stats, setStats] = useState<LeaveStats>({
    pendingRequests: 5,
    approvedRequests: 10,
    rejectedRequests: 2,
    totalLeaveDays: 45,
  });

  const handleApprove = (id: string) => {
    setLeaveRequests(
      leaveRequests.map((request) =>
        request.id === id ? { ...request, status: "approved" } : request
      )
    );
  };

  const handleReject = (id: string) => {
    setLeaveRequests(
      leaveRequests.map((request) =>
        request.id === id ? { ...request, status: "rejected" } : request
      )
    );
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

  // Check if user has permission to approve leave
  if (!hasPermission(Permission.APPROVE_LEAVE)) {
    return (
      <Alert severity="error">
        You don't have permission to approve leave requests.
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        Leave Management
      </Typography>

      {/* Statistics */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats.pendingRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {stats.approvedRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Approved Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {stats.rejectedRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Rejected Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {stats.totalLeaveDays}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Leave Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave Requests Table */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6">Leave Requests</Typography>
            <Button variant="contained" color="primary">
              Export
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.employeeName}</TableCell>
                    <TableCell>{request.leaveType}</TableCell>
                    <TableCell>
                      {request.startDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.endDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status.toUpperCase()}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <Box>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleApprove(request.id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleReject(request.id)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveManagement;
