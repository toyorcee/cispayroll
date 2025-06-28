import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Pagination,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  Badge,
  Fade,
  Slide,
  DialogContentText,
} from "@mui/material";
import {
  Add as AddIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { allowanceService } from "../../../services/allowanceService";
import { Allowance, AllowanceType } from "../../../types/allowance";
import { formatCurrency } from "../../../utils/formatters";
import { toast } from "react-toastify";

type AllowanceWithDates = Allowance & {
  createdAt?: string | Date;
  effectiveDate?: string | Date;
};

// Helper to check if a date is in the current month
const isDateThisMonth = (dateStr?: string | Date) => {
  if (!dateStr) return false;
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

const MyAllowances: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [requestForm, setRequestForm] = useState({
    type: "" as AllowanceType,
    amount: "",
    description: "",
  });

  const thisMonthAllowances = useMemo(
    () =>
      (allowances as AllowanceWithDates[]).filter(
        (a) =>
          (isDateThisMonth(a.createdAt) || isDateThisMonth(a.effectiveDate)) &&
          (a.approvalStatus === "approved" || a.approvalStatus === "cancelled")
      ),
    [allowances]
  );
  const monthlyStats = useMemo(
    () => ({
      requested: thisMonthAllowances.length,
      remaining: Math.max(0, 3 - thisMonthAllowances.length),
      limit: 3,
    }),
    [thisMonthAllowances]
  );

  // Simple currency formatter for input
  const formatInputCurrency = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Ensure only one decimal point
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + "." + parts[1].substring(0, 2);
    }

    // Add commas for thousands
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    return parts.join(".");
  };

  // Convert formatted input to number
  const parseFormattedAmount = (formattedValue: string): number => {
    // Remove commas and convert to number
    const cleanValue = formattedValue.replace(/,/g, "");
    return parseFloat(cleanValue) || 0;
  };

  const fetchAllowances = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await allowanceService.getPersonalAllowances({
        page,
        limit: pagination.limit,
      });

      console.log("🔍 [MyAllowances] Received response:", {
        allowances: response.data.allowances?.length || 0,
        pagination: response.data.pagination,
      });

      console.log(
        "🔍 [MyAllowances] Current allowances:",
        response.data.allowances
      );

      setAllowances(response.data.allowances || []);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError("Failed to fetch allowances");
      console.error("Error fetching allowances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllowances();
  }, []);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchAllowances(newPage);
  };

  const handleOpenForm = () => {
    setOpenRequestForm(true);
  };

  const handleCloseForm = () => {
    setOpenRequestForm(false);
    setRequestForm({
      type: "" as AllowanceType,
      amount: "",
      description: "",
    });
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!user || !user._id) {
        throw new Error("User information is incomplete");
      }

      const response = await allowanceService.createPersonalAllowance({
        type: requestForm.type,
        amount: parseFormattedAmount(requestForm.amount),
        description: requestForm.description,
      });

      toast.success(response.message);
      handleCloseForm();
      fetchAllowances();
    } catch (err: any) {
      console.error("Error requesting allowance:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit allowance request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = (allowance: Allowance) => {
    setSelectedAllowance(allowance);
    setOpenCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAllowance) return;

    setCancelling(true);
    try {
      await allowanceService.cancelPersonalAllowance(selectedAllowance._id);
      toast.success("Allowance request cancelled successfully");
      setOpenCancelDialog(false);
      setSelectedAllowance(null);
      fetchAllowances();
    } catch (err: any) {
      console.error("Error cancelling allowance:", err);
      toast.error(
        err.response?.data?.message || "Failed to cancel allowance request"
      );
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon color="success" />;
      case "pending":
        return <PendingIcon color="warning" />;
      case "rejected":
        return <ErrorIcon color="error" />;
      case "cancelled":
        return <CancelIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const EmptyState = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      textAlign="center"
      p={4}
    >
      <Avatar
        sx={{
          width: 80,
          height: 80,
          bgcolor:
            monthlyStats.remaining === 0 ? "error.light" : "primary.light",
          mb: 2,
        }}
      >
        <ReceiptIcon sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        {monthlyStats.remaining === 0
          ? "Monthly Limit Reached"
          : "No Allowance Requests Yet"}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {monthlyStats.remaining === 0
          ? "You have reached your monthly limit of 3 allowance requests. Please wait until next month to submit more requests."
          : "You haven't submitted any allowance requests yet. Start by requesting your first allowance to get started."}
      </Typography>
      {hasPermission(Permission.REQUEST_ALLOWANCES) &&
        monthlyStats.remaining > 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
            size="large"
          >
            Request Your First Allowance
          </Button>
        )}
      {monthlyStats.remaining === 0 && (
        <Chip
          label={`${monthlyStats.requested}/${monthlyStats.limit} requests used this month`}
          color="error"
          variant="outlined"
          size="medium"
        />
      )}
    </Box>
  );

  const AllowanceCard = ({ allowance }: { allowance: Allowance }) => (
    <Card
      sx={{
        mb: 2,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
        border: 1,
        borderColor: "divider",
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {getStatusIcon(allowance.approvalStatus)}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {allowance.type}
                </Typography>
                <Chip
                  label={allowance.approvalStatus}
                  color={getStatusColor(allowance.approvalStatus) as any}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <MoneyIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency(allowance.amount)}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DescriptionIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" noWrap>
                  {allowance.description}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <BusinessIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1">
                  {allowance.department?.name || "N/A"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={1}>
            {allowance.approvalStatus === "pending" && (
              <Tooltip title="Cancel Request">
                <IconButton
                  color="error"
                  onClick={() => handleCancelRequest(allowance)}
                  size="small"
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (!hasPermission(Permission.VIEW_OWN_ALLOWANCES)) {
    return (
      <Box p={3}>
        <Alert severity="error" icon={<ErrorIcon />}>
          You don't have permission to view your allowances.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Allowances
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Manage your allowance requests and track their status
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            {monthlyStats.remaining === 0 && (
              <Chip
                label={`${monthlyStats.requested}/${monthlyStats.limit} requests this month`}
                color="error"
                variant="outlined"
                size="small"
              />
            )}
            {monthlyStats.remaining > 0 && (
              <Typography variant="body2" color="text.secondary">
                {monthlyStats.remaining} requests remaining
              </Typography>
            )}
            {monthlyStats.remaining === 0 && (
              <Typography
                variant="body2"
                color="error.main"
                fontWeight="medium"
              >
                Monthly limit reached
              </Typography>
            )}
          </Box>
        </Box>

        {hasPermission(Permission.REQUEST_ALLOWANCES) &&
          monthlyStats.remaining > 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenForm}
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Request New Allowance
            </Button>
          )}

        {hasPermission(Permission.REQUEST_ALLOWANCES) &&
          monthlyStats.remaining === 0 && (
            <Button
              variant="outlined"
              color="error"
              size="large"
              sx={{ borderRadius: 2 }}
              disabled
            >
              Monthly Limit Reached
            </Button>
          )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Badge
              badgeContent={
                allowances.filter((a) => a.approvalStatus === "pending").length
              }
              color="warning"
            >
              <PendingIcon color="warning" sx={{ fontSize: 40 }} />
            </Badge>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Pending
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Badge
              badgeContent={
                allowances.filter((a) => a.approvalStatus === "approved").length
              }
              color="success"
            >
              <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
            </Badge>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Approved
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Badge
              badgeContent={
                allowances.filter((a) => a.approvalStatus === "rejected").length
              }
              color="error"
            >
              <ErrorIcon color="error" sx={{ fontSize: 40 }} />
            </Badge>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Rejected
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Badge
              badgeContent={
                allowances.filter((a) => a.approvalStatus === "cancelled")
                  .length
              }
              color="error"
            >
              <CancelIcon color="error" sx={{ fontSize: 40 }} />
            </Badge>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Cancelled
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Badge
              badgeContent={monthlyStats.requested}
              color={monthlyStats.remaining === 0 ? "error" : "primary"}
            >
              <ReceiptIcon
                color={monthlyStats.remaining === 0 ? "error" : "primary"}
                sx={{ fontSize: 40 }}
              />
            </Badge>
            <Typography variant="h6" sx={{ mt: 1 }}>
              This Month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {monthlyStats.requested}/{monthlyStats.limit}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Badge
              badgeContent={monthlyStats.remaining}
              color={monthlyStats.remaining === 0 ? "error" : "success"}
            >
              <InfoIcon
                color={monthlyStats.remaining === 0 ? "error" : "success"}
                sx={{ fontSize: 40 }}
              />
            </Badge>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Remaining
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {monthlyStats.remaining} left
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="400px"
            >
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Box p={3}>
              <Alert severity="error" icon={<ErrorIcon />}>
                {error}
              </Alert>
            </Box>
          ) : allowances.length === 0 ? (
            <EmptyState />
          ) : (
            <Box p={3}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Your Allowance Requests ({allowances.length})
              </Typography>

              <Stack spacing={2}>
                {allowances.map((allowance) => (
                  <Fade in={true} key={allowance._id}>
                    <div>
                      <AllowanceCard allowance={allowance} />
                    </div>
                  </Fade>
                ))}
              </Stack>

              {pagination.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Request Allowance Dialog */}
      <Dialog
        open={openRequestForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        TransitionComponent={Slide}
        transitionDuration={300}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Request New Allowance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit a new allowance request for approval
          </Typography>
          <Box sx={{ mt: 2 }}>
            {monthlyStats.remaining === 0 && (
              <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                You have reached your monthly limit. Please wait until next
                month to submit more requests.
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <form onSubmit={handleRequestSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Allowance Type"
                  value={requestForm.type}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      type: e.target.value as AllowanceType,
                    })
                  }
                  required
                  variant="outlined"
                  disabled={monthlyStats.remaining === 0}
                >
                  {Object.entries(AllowanceType).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="text"
                  label="Amount (₦)"
                  value={requestForm.amount}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      amount: formatInputCurrency(e.target.value),
                    })
                  }
                  required
                  variant="outlined"
                  placeholder="50,000.00"
                  disabled={monthlyStats.remaining === 0}
                  InputProps={{
                    startAdornment: (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mr: 1 }}
                      >
                        ₦
                      </Typography>
                    ),
                  }}
                  helperText={
                    requestForm.amount
                      ? `Preview: ${formatCurrency(
                          parseFormattedAmount(requestForm.amount)
                        )}`
                      : "Enter amount in Naira (e.g., 50,000.00)"
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={requestForm.description}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      description: e.target.value,
                    })
                  }
                  required
                  variant="outlined"
                  placeholder="Please provide a detailed description of your allowance request..."
                  disabled={monthlyStats.remaining === 0}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleCloseForm} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || monthlyStats.remaining === 0}
              startIcon={
                submitting ? <CircularProgress size={20} /> : <AddIcon />
              }
              size="large"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Cancel Allowance Request
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your "{selectedAllowance?.type}"
            allowance request for{" "}
            {selectedAllowance && formatCurrency(selectedAllowance.amount)}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setOpenCancelDialog(false)}
            disabled={cancelling}
          >
            Keep Request
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            color="error"
            disabled={cancelling}
            startIcon={
              cancelling ? <CircularProgress size={20} /> : <CancelIcon />
            }
          >
            {cancelling ? "Cancelling..." : "Cancel Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyAllowances;
