import React, { useState } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Checkbox,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

export interface Payroll {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  month: number;
  year: number;
  status: string;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  createdAt: string;
  updatedAt: string;
  approvalFlow?: {
    currentLevel: string;
    history: Array<{
      level: string;
      status: string;
      action: string;
      user: string;
      timestamp: string;
      remarks: string;
    }>;
  };
}

interface PayrollTableProps {
  payrolls: Payroll[];
  loading: boolean;
  error: string | null;
  selectedPayrolls: string[];
  onSelectPayroll: (payrollId: string) => void;
  onSelectAllPayrolls: (payrollIds: string[]) => void;
  onViewDetails: (payroll: Payroll) => void;
  onSubmitForApproval: (payroll: Payroll) => void;
  onApprove: (payroll: Payroll) => void;
  onReject: (payroll: Payroll) => void;
  onProcessPayment: (payroll: Payroll) => void;
}

const PayrollTable: React.FC<PayrollTableProps> = ({
  payrolls,
  loading,
  error,
  selectedPayrolls,
  onSelectPayroll,
  onSelectAllPayrolls,
  onViewDetails,
  onSubmitForApproval,
  onApprove,
  onReject,
  onProcessPayment,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "default";
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "paid":
        return "info";
      default:
        return "default";
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelectedPayrolls = payrolls.map((payroll) => payroll._id);
      onSelectAllPayrolls(newSelectedPayrolls);
    } else {
      onSelectAllPayrolls([]);
    }
  };

  const formatApprovalLevel = (level: string | undefined) => {
    if (!level) return "N/A";

    return level
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (payrolls.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography>No payrolls found</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="payroll table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedPayrolls.length > 0 &&
                    selectedPayrolls.length < payrolls.length
                  }
                  checked={
                    payrolls.length > 0 &&
                    selectedPayrolls.length === payrolls.length
                  }
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approval Level</TableCell>
              <TableCell align="right">Total Earnings</TableCell>
              <TableCell align="right">Total Deductions</TableCell>
              <TableCell align="right">Net Pay</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((payroll) => (
                <TableRow
                  hover
                  key={payroll._id}
                  selected={selectedPayrolls.includes(payroll._id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPayrolls.includes(payroll._id)}
                      onChange={() => onSelectPayroll(payroll._id)}
                    />
                  </TableCell>
                  <TableCell>
                    {`${payroll.employee.firstName} ${payroll.employee.lastName}`}
                  </TableCell>
                  <TableCell>{`${payroll.month}/${payroll.year}`}</TableCell>
                  <TableCell>
                    <Chip
                      label={payroll.status}
                      color={getStatusColor(payroll.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {payroll.status === "PENDING" ? (
                      <Chip
                        label={formatApprovalLevel(
                          payroll.approvalFlow?.currentLevel
                        )}
                        color="warning"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={formatApprovalLevel(
                          payroll.approvalFlow?.currentLevel
                        )}
                        color="default"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(payroll.totalEarnings)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(payroll.totalDeductions)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(payroll.netPay)}
                  </TableCell>
                  <TableCell>{formatDate(payroll.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(payroll)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {payroll.status.toLowerCase() === "draft" && (
                      <Tooltip title="Submit for Approval">
                        <IconButton
                          size="small"
                          onClick={() => onSubmitForApproval(payroll)}
                        >
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {payroll.status.toLowerCase() === "pending" && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            onClick={() => onApprove(payroll)}
                          >
                            <CheckCircleIcon color="success" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            onClick={() => onReject(payroll)}
                          >
                            <CancelIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {payroll.status.toLowerCase() === "approved" && (
                      <Tooltip title="Process Payment">
                        <IconButton
                          size="small"
                          onClick={() => onProcessPayment(payroll)}
                        >
                          <PaymentIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={payrolls.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default PayrollTable;
