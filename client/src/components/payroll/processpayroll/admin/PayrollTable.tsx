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
  AccessTime as AccessTimeIcon,
  Block as BlockIcon,
  Done as DoneIcon,
  HourglassTop as HourglassTopIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { PayrollStatus } from "../../../../types/payroll";
import { styled } from "@mui/material/styles";
import { User } from "../../../../types/auth";
import { UserRole } from "../../../../types/auth";

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
  frequency: string;
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
      timestamp?: string;
      remarks?: string;
    }>;
  };
  department?: {
    _id: string;
    name: string;
  };
}

interface PayrollTableProps {
  payrolls: Payroll[];
  onApprove: (payroll: Payroll) => void;
  onReject: (payroll: Payroll) => void;
  onView: (payroll: Payroll) => void;
  onViewApprovalJourney?: (payroll: Payroll) => void;
  onSubmitForApproval?: (payroll: Payroll) => void;
  onProcessPayment?: (payroll: Payroll) => void;
  onResubmit?: (payroll: Payroll) => void;
  selectedPayrolls: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  loading?: boolean;
  error?: string | null;
  currentUserRole?: string;
  user?: User | null;
}

const RotatingHourglass = styled(HourglassTopIcon)(() => ({
  animation: "rotate 2s linear infinite",
  "@keyframes rotate": {
    "0%": {
      transform: "rotate(0deg)",
    },
    "100%": {
      transform: "rotate(360deg)",
    },
  },
}));

const MAIN_GREEN = "#27ae60";
const LIGHT_GREEN_BG = "#f6fcf7";
const LIGHT_GREEN_ACCENT = "#eafaf1";

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 4px 24px 0 rgba(39, 174, 96, 0.10)",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: MAIN_GREEN,
  "& .MuiTableCell-head": {
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    background: MAIN_GREEN,
    letterSpacing: 0.5,
    paddingTop: 16,
    paddingBottom: 16,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: LIGHT_GREEN_BG,
  },
  "&:nth-of-type(even)": {
    backgroundColor: "#fff",
  },
  "&:hover": {
    backgroundColor: LIGHT_GREEN_ACCENT,
    transition: "background 0.2s",
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: "14px 16px",
  fontSize: 15,
  color: "#222",
  borderBottom: `1px solid ${LIGHT_GREEN_ACCENT}`,
}));

const StyledActionButton = styled(IconButton)(({ theme }) => ({
  color: MAIN_GREEN,
  background: LIGHT_GREEN_BG,
  borderRadius: 8,
  margin: "0 2px",
  "&:hover": {
    background: LIGHT_GREEN_ACCENT,
    color: "#219150",
  },
}));

const PayrollTable: React.FC<PayrollTableProps> = ({
  payrolls,
  onApprove,
  onReject,
  onView,
  onViewApprovalJourney = onView,
  onSubmitForApproval,
  onProcessPayment,
  onResubmit,
  selectedPayrolls,
  onSelectionChange,
  loading,
  error,
  user,
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

  const getStatusIcon = (
    status: string,
    _approvalFlow?: { currentLevel: string }
  ) => {
    switch (status) {
      case PayrollStatus.DRAFT:
        return undefined;
      case PayrollStatus.PENDING:
        return <AccessTimeIcon fontSize="small" color="warning" />;
      case PayrollStatus.APPROVED:
        return <DoneIcon fontSize="small" color="success" />;
      case PayrollStatus.REJECTED:
        return <BlockIcon fontSize="small" color="error" />;
      case PayrollStatus.COMPLETED:
        return <DoneIcon fontSize="small" color="success" />;
      default:
        return undefined;
    }
  };

  // Add this function to determine if the current user is the approver for this payroll
  const isCurrentApprover = (payroll: Payroll) => {
    if (!user || !payroll.approvalFlow?.currentLevel) return false;

    const userPosition = user.position?.toLowerCase() || "";
    const currentLevel = payroll.approvalFlow.currentLevel;

    switch (currentLevel) {
      case "DEPARTMENT_HEAD":
        return (
          userPosition.includes("department head") ||
          userPosition.includes("head of department") ||
          userPosition.includes("department director")
        );
      case "HR_MANAGER":
        return (
          userPosition.includes("hr manager") ||
          userPosition.includes("head of hr") ||
          userPosition.includes("hr head") ||
          userPosition.includes("head of human resources")
        );
      case "FINANCE_DIRECTOR":
        return (
          userPosition.includes("finance director") ||
          userPosition.includes("head of finance") ||
          userPosition.includes("finance head") ||
          userPosition.includes("director of finance")
        );
      case "SUPER_ADMIN":
        return (
          userPosition.includes("super admin") ||
          userPosition.includes("administrator") ||
          user.role === UserRole.SUPER_ADMIN
        );
      default:
        return false;
    }
  };

  // Update the getNextLevelLabel function to handle undefined values
  const getNextLevelLabel = (currentLevel: string | undefined) => {
    if (!currentLevel) return "Pending Approval";

    switch (currentLevel) {
      case "DEPARTMENT_HEAD":
        return "Waiting for Department Head Approval";
      case "HR_MANAGER":
        return "Waiting for HR Manager Approval";
      case "FINANCE_DIRECTOR":
        return "Waiting for Finance Director Approval";
      case "SUPER_ADMIN":
        return "Waiting for Super Admin Approval";
      default:
        return "Pending Approval";
    }
  };

  // Add this helper function to check if payroll is rejected
  const isPayrollRejected = (history: any[]) => {
    return history.some((h) => h.status === "REJECTED");
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
      <StyledTableContainer>
        <Table stickyHeader aria-label="payroll table">
          <StyledTableHead>
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
          </StyledTableHead>
          <TableBody>
            {filteredAndSortedPayrolls
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((payroll) => (
                <StyledTableRow
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={payroll.status}
                        color={getStatusColor(payroll.status) as any}
                        size="small"
                        icon={getStatusIcon(
                          payroll.status,
                          payroll.approvalFlow
                        )}
                      />
                      {payroll.approvalFlow?.currentLevel &&
                        payroll.status === "PENDING" && (
                          <Tooltip
                            title={`Waiting for ${payroll.approvalFlow.currentLevel
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0) + word.slice(1).toLowerCase()
                              )
                              .join(" ")}`}
                          >
                            <AccessTimeIcon fontSize="small" color="action" />
                          </Tooltip>
                        )}
                    </Box>
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
                        <StyledActionButton
                          size="small"
                          onClick={() => onView(payroll)}
                        >
                          <VisibilityIcon />
                        </StyledActionButton>
                      </Tooltip>

                      {payroll.status === "DRAFT" && onSubmitForApproval && (
                        <Tooltip title="Submit for Approval">
                          <StyledActionButton
                            size="small"
                            onClick={() => onSubmitForApproval(payroll)}
                          >
                            <SendIcon />
                          </StyledActionButton>
                        </Tooltip>
                      )}

                      {payroll.status === "PENDING" && (
                        <>
                          {isPayrollRejected(
                            payroll.approvalFlow?.history || []
                          ) ? (
                            <Tooltip title="Rejected - Click to view rejection details">
                              <StyledActionButton
                                size="small"
                                onClick={() => onView(payroll)}
                                color="error"
                              >
                                <ErrorOutlineIcon />
                              </StyledActionButton>
                            </Tooltip>
                          ) : isCurrentApprover(payroll) ? (
                            <>
                              <Tooltip title="Approve">
                                <StyledActionButton
                                  size="small"
                                  onClick={() => onApprove(payroll)}
                                  color="success"
                                >
                                  <CheckCircleIcon />
                                </StyledActionButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <StyledActionButton
                                  size="small"
                                  onClick={() => onReject(payroll)}
                                  color="error"
                                >
                                  <CancelIcon />
                                </StyledActionButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip
                              title={`Click to view approval journey - ${getNextLevelLabel(
                                payroll.approvalFlow?.currentLevel
                              )}`}
                            >
                              <StyledActionButton
                                size="small"
                                onClick={() => onViewApprovalJourney(payroll)}
                                color="info"
                              >
                                <RotatingHourglass />
                              </StyledActionButton>
                            </Tooltip>
                          )}
                        </>
                      )}

                      {payroll.status === "COMPLETED" && (
                        <Tooltip title="Fully Approved">
                          <StyledActionButton
                            size="small"
                            onClick={() => onView(payroll)}
                            color="success"
                          >
                            <DoneIcon />
                          </StyledActionButton>
                        </Tooltip>
                      )}

                      {payroll.status === "APPROVED" && onProcessPayment && (
                        <Tooltip title="Process Payment">
                          <StyledActionButton
                            size="small"
                            onClick={() => onProcessPayment(payroll)}
                            color="primary"
                          >
                            <PaymentIcon />
                          </StyledActionButton>
                        </Tooltip>
                      )}

                      {payroll.status === "REJECTED" && onResubmit && (
                        <Tooltip title="Resubmit Payroll">
                          <StyledActionButton
                            size="small"
                            onClick={() => onResubmit(payroll)}
                            color="primary"
                          >
                            <SendIcon />
                          </StyledActionButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
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
