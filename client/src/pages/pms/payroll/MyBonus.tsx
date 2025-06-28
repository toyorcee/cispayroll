import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Badge,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { bonusService, BonusResponse } from "../../../services/bonusService";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

// Define bonus types
const BONUS_TYPES = [
  {
    id: "personal",
    label: "Personal Bonus",
    description: "Request a bonus for personal reasons",
  },
  {
    id: "performance",
    label: "Performance Bonus",
    description: "Request a bonus for outstanding performance",
  },
  {
    id: "project",
    label: "Project Bonus",
    description: "Request a bonus for completing a project",
  },
  {
    id: "achievement",
    label: "Achievement Bonus",
    description: "Request a bonus for a specific achievement",
  },
];

const MyBonus: React.FC = () => {
  const { user } = useAuth();
  const [bonuses, setBonuses] = useState<BonusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<BonusResponse | null>(
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
  const [monthlyStats, setMonthlyStats] = useState({
    requested: 0,
    remaining: 3,
    limit: 3,
  });
  const [requestForm, setRequestForm] = useState({
    type: "" as string,
    amount: "",
    reason: "",
    paymentDate: null as Date | null,
  });

  const fetchBonuses = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await bonusService.getMyBonuses(page, pagination.limit);

      console.log("🔍 [MyBonus] Received response:", {
        bonuses: response.data.bonuses?.length || 0,
        pagination: response.data.pagination,
        monthlyStats: response.data.monthlyStats,
      });

      console.log("🔍 [MyBonus] Current bonuses:", response.data.bonuses);

      setBonuses(response.data.bonuses || []);
      setPagination(response.data.pagination);
      setMonthlyStats(response.data.monthlyStats);
      setError(null);
    } catch (err) {
      setError("Failed to fetch bonuses");
      console.error("Error fetching bonuses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonuses();
  }, []);

  // const handlePageChange = (
  //   _event: React.ChangeEvent<unknown>,
  //   newPage: number
  // ) => {
  //   setPagination((prev) => ({ ...prev, page: newPage }));
  //   fetchBonuses(newPage);
  // };

  const handleOpenForm = () => {
    setOpenRequestForm(true);
  };

  const handleCloseForm = () => {
    setOpenRequestForm(false);
    setRequestForm({
      type: "",
      amount: "",
      reason: "",
      paymentDate: null,
    });
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!user || !user._id) {
        throw new Error("User information is incomplete");
      }

      if (!requestForm.paymentDate) {
        throw new Error("Payment date is required");
      }

      const response = await bonusService.createPersonalBonus({
        type: requestForm.type,
        amount: parseFormattedAmount(requestForm.amount),
        reason: requestForm.reason,
        paymentDate: requestForm.paymentDate,
      });

      toast.success(response.message);
      handleCloseForm();
      fetchBonuses();
    } catch (err: any) {
      console.error("Error requesting bonus:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit bonus request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = (bonus: BonusResponse) => {
    setSelectedBonus(bonus);
    setOpenCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBonus) return;

    setCancelling(true);
    try {
      await bonusService.cancelPersonalBonus(selectedBonus._id);
      toast.success("Bonus request cancelled successfully");
      setOpenCancelDialog(false);
      setSelectedBonus(null);
      fetchBonuses();
    } catch (err: any) {
      console.error("Error cancelling bonus:", err);
      toast.error(
        err.response?.data?.message || "Failed to cancel bonus request"
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
          : "No Bonus Requests Yet"}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {monthlyStats.remaining === 0
          ? "You have reached your monthly limit of 3 bonus requests. Please wait until next month to submit more requests."
          : "You haven't submitted any bonus requests yet. Start by requesting your first bonus to get started."}
      </Typography>
      {monthlyStats.remaining > 0 && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
          size="large"
        >
          Request Your First Bonus
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

  const BonusCard = ({ bonus }: { bonus: BonusResponse }) => (
    <Card
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          boxShadow: 4,
          borderColor: "primary.main",
        },
        transition: "all 0.2s ease-in-out",
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h6" fontWeight="bold">
                {bonus.type}
              </Typography>
              <Chip
                label={bonus.approvalStatus}
                color={getStatusColor(bonus.approvalStatus)}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {bonus.reason}
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <Typography variant="h6" color="primary" fontWeight="bold">
                ₦{bonus.amount?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment: {new Date(bonus.paymentDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(bonus.approvalStatus)}
            {bonus.approvalStatus === "pending" && (
              <IconButton
                size="small"
                color="error"
                onClick={() => handleCancelRequest(bonus)}
                title="Cancel request"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="text.primary"
              gutterBottom
            >
              My Bonuses
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your bonus requests and track their status
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            {monthlyStats.remaining > 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenForm}
                size="large"
                sx={{
                  background:
                    "linear-gradient(45deg, #059669 30%, #10b981 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #047857 30%, #059669 90%)",
                  },
                }}
              >
                Request Bonus
              </Button>
            )}
            {monthlyStats.remaining === 0 && (
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
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ textAlign: "center", p: 2 }}>
              <Badge
                badgeContent={
                  bonuses.filter((b) => b.approvalStatus === "pending").length
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
                  bonuses.filter((b) => b.approvalStatus === "approved").length
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
                  bonuses.filter((b) => b.approvalStatus === "rejected").length
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
                  bonuses.filter((b) => b.approvalStatus === "cancelled").length
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
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: 2,
            p: 3,
            boxShadow: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : bonuses.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Your Bonus Requests
              </Typography>
              {bonuses.map((bonus) => (
                <BonusCard key={bonus._id} bonus={bonus} />
              ))}
            </>
          )}
        </Box>
      </Box>

      {/* Bonus Request Form Dialog */}
      <Dialog
        open={openRequestForm}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Request Bonus
          </Typography>
        </DialogTitle>
        <form onSubmit={handleRequestSubmit}>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Bonus Type
              </Typography>
              <Grid container spacing={2}>
                {BONUS_TYPES.map((type) => (
                  <Grid item xs={6} key={type.id}>
                    <Card
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border:
                          requestForm.type === type.id
                            ? "2px solid #059669"
                            : "1px solid #e0e0e0",
                        "&:hover": {
                          border: "2px solid #059669",
                          backgroundColor: "rgba(5, 150, 105, 0.04)",
                        },
                      }}
                      onClick={() =>
                        setRequestForm({ ...requestForm, type: type.id })
                      }
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {type.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <TextField
              fullWidth
              label="Amount"
              value={requestForm.amount}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  amount: formatInputCurrency(e.target.value),
                })
              }
              placeholder="0.00"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
              }}
            />

            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={4}
              value={requestForm.reason}
              onChange={(e) =>
                setRequestForm({ ...requestForm, reason: e.target.value })
              }
              placeholder="Please provide a detailed explanation of why you deserve this bonus..."
              sx={{ mb: 3 }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={requestForm.paymentDate}
                onChange={(newValue) =>
                  setRequestForm({ ...requestForm, paymentDate: newValue })
                }
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>

            <Alert severity="info" sx={{ mt: 3 }}>
              Your request will be reviewed by HR. Please provide a clear reason
              for your bonus request.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                submitting ||
                !requestForm.type ||
                !requestForm.amount ||
                !requestForm.reason ||
                !requestForm.paymentDate
              }
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
      >
        <DialogTitle>Cancel Bonus Request</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this bonus request? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>
            No, Keep It
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Yes, Cancel Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBonus;
