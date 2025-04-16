import React, { useState, useMemo } from "react";
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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Search,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { PayrollStatus } from "../../../../types/payroll";

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
  onApprove: (payroll: Payroll) => void;
  onReject: (payroll: Payroll) => void;
  onView: (payroll: Payroll) => void;
  onSubmitForApproval?: (payroll: Payroll) => void;
  onProcessPayment?: (payroll: Payroll) => void;
  selectedPayrolls: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  loading?: boolean;
  error?: string | null;
}

const PayrollTable: React.FC<PayrollTableProps> = ({
  payrolls,
  onApprove,
  onReject,
  onView,
  onSubmitForApproval,
  onProcessPayment,
  selectedPayrolls,
  onSelectionChange,
  loading,
  error,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Payroll>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case PayrollStatus.DRAFT:
        return "default";
      case PayrollStatus.PENDING:
        return "warning";
      case PayrollStatus.PROCESSING:
        return "info";
      case PayrollStatus.APPROVED:
        return "success";
      case PayrollStatus.REJECTED:
        return "error";
      case PayrollStatus.PENDING_PAYMENT:
        return "warning";
      case PayrollStatus.PAID:
        return "success";
      case PayrollStatus.CANCELLED:
        return "error";
      case PayrollStatus.FAILED:
        return "error";
      case PayrollStatus.ARCHIVED:
        return "default";
      case PayrollStatus.COMPLETED:
        return "success";
      default:
        return "default";
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelectedPayrolls = filteredAndSortedPayrolls.map(
        (payroll) => payroll._id
      );
      onSelectionChange(newSelectedPayrolls);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectPayroll = (payrollId: string) => {
    const newSelectedPayrolls = selectedPayrolls.includes(payrollId)
      ? selectedPayrolls.filter((id) => id !== payrollId)
      : [...selectedPayrolls, payrollId];
    onSelectionChange(newSelectedPayrolls);
  };

  // Filter and sort payrolls
  const filteredAndSortedPayrolls = useMemo(() => {
    let result = [...payrolls];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((payroll) => {
        if (payroll.employee.firstName.toLowerCase().includes(searchLower))
          return true;
        if (payroll.employee.lastName.toLowerCase().includes(searchLower))
          return true;

        // Check full name
        const fullName =
          `${payroll.employee.firstName} ${payroll.employee.lastName}`.toLowerCase();
        if (fullName.includes(searchLower)) return true;

        // Check employee email
        if (payroll.employee.email.toLowerCase().includes(searchLower))
          return true;

        // Check month/year
        const monthYear = `${payroll.month}/${payroll.year}`;
        if (monthYear.includes(searchTerm)) return true;

        // Check status
        if (payroll.status.toLowerCase().includes(searchLower)) return true;

        // Check approval level
        if (
          payroll.approvalFlow?.currentLevel
            ?.toLowerCase()
            .includes(searchLower)
        )
          return true;

        // Check amounts
        if (payroll.totalEarnings.toString().includes(searchTerm)) return true;
        if (payroll.totalDeductions.toString().includes(searchTerm))
          return true;
        if (payroll.netPay.toString().includes(searchTerm)) return true;

        return false;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((payroll) => {
        // For "PENDING" status, include payrolls that are pending at any level
        if (statusFilter === "PENDING") {
          return payroll.status === "PENDING";
        }
        // For other statuses, match exactly
        return payroll.status === statusFilter;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "createdAt" || sortField === "updatedAt") {
        return sortDirection === "asc"
          ? new Date(aValue as string).getTime() -
              new Date(bValue as string).getTime()
          : new Date(bValue as string).getTime() -
              new Date(aValue as string).getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return result;
  }, [payrolls, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Payroll) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Payroll) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? (
      <ArrowUpward fontSize="small" />
    ) : (
      <ArrowDownward fontSize="small" />
    );
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
      <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(PayrollStatus).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {key
                  .split("_")
                  .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                  .join(" ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="payroll table">
          <TableHead>
            <TableRow
              sx={{
                "& th": { fontWeight: 700, borderBottom: "2px solid #2e7d32" },
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedPayrolls.length > 0 &&
                    selectedPayrolls.length < filteredAndSortedPayrolls.length
                  }
                  checked={
                    filteredAndSortedPayrolls.length > 0 &&
                    selectedPayrolls.length === filteredAndSortedPayrolls.length
                  }
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell
                onClick={() => handleSort("employee")}
                sx={{ cursor: "pointer" }}
              >
                Employee {getSortIcon("employee")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("month")}
                sx={{ cursor: "pointer" }}
              >
                Period {getSortIcon("month")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("status")}
                sx={{ cursor: "pointer" }}
              >
                Status {getSortIcon("status")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("totalEarnings")}
                sx={{ cursor: "pointer", textAlign: "right" }}
              >
                Earnings {getSortIcon("totalEarnings")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("totalDeductions")}
                sx={{ cursor: "pointer", textAlign: "right" }}
              >
                Deductions {getSortIcon("totalDeductions")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("netPay")}
                sx={{ cursor: "pointer", textAlign: "right" }}
              >
                Net Pay {getSortIcon("netPay")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("createdAt")}
                sx={{ cursor: "pointer" }}
              >
                Created {getSortIcon("createdAt")}
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedPayrolls
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
                      onChange={() => handleSelectPayroll(payroll._id)}
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
                    <Box
                      sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                    >
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onView(payroll)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {payroll.status === "DRAFT" && onSubmitForApproval && (
                        <Tooltip title="Submit for Approval">
                          <IconButton
                            size="small"
                            onClick={() => onSubmitForApproval(payroll)}
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {payroll.status === "PENDING" && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              onClick={() => onApprove(payroll)}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              onClick={() => onReject(payroll)}
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {payroll.status === "APPROVED" && onProcessPayment && (
                        <Tooltip title="Process Payment">
                          <IconButton
                            size="small"
                            onClick={() => onProcessPayment(payroll)}
                            color="primary"
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredAndSortedPayrolls.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default PayrollTable;
