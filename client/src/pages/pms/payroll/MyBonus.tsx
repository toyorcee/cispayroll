import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { bonusService, BonusResponse } from "../../../services/bonusService";
import { toast } from "react-toastify";

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

// Define the CreatePersonalBonusData interface to match the service
interface CreatePersonalBonusData {
  amount: number;
  reason: string;
  paymentDate: Date;
  type: string;
}

const MyBonus: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    reason: "",
    paymentDate: null as Date | null,
    type: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bonuses, setBonuses] = useState<BonusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchBonuses = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await bonusService.getMyBonuses(page, pagination.limit);
      setBonuses(response.data.bonuses);
      setPagination(response.data.pagination);
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

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    fetchBonuses(newPage);
  };

  const createBonusMutation = useMutation({
    mutationFn: (data: CreatePersonalBonusData) =>
      bonusService.createPersonalBonus(data),
    onSuccess: () => {
      toast.success("Bonus request created successfully!");
      setFormData({ amount: "", reason: "", paymentDate: null, type: "" });
      setSelectedType(null);
      setOpenDialog(false);
      fetchBonuses();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create bonus request"
      );
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = "Bonus type is required";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (!formData.reason) {
      newErrors.reason = "Reason is required";
    } else if (formData.reason.length < 10) {
      newErrors.reason =
        "Please provide a more detailed reason (at least 10 characters)";
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    } else if (formData.paymentDate < new Date()) {
      newErrors.paymentDate = "Payment date cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      createBonusMutation.mutate({
        amount: Number(formData.amount),
        reason: formData.reason,
        paymentDate: formData.paymentDate as Date,
        type: formData.type,
      });
    }
  };

  const handleOpenDialog = () => {
    setOpenTypeDialog(true);
  };

  const handleCloseTypeDialog = () => {
    setOpenTypeDialog(false);
  };

  const handleCloseFormDialog = () => {
    setOpenDialog(false);
    setFormData({ amount: "", reason: "", paymentDate: null, type: "" });
    setSelectedType(null);
    setErrors({});
  };

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setFormData({ ...formData, type });
    setOpenTypeDialog(false);
    setOpenDialog(true);
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">My Bonuses</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenDialog}
          startIcon={<span>+</span>}
        >
          Request Bonus
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <Typography variant="h6" className="mb-4">
                My Bonuses
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bonuses.length > 0 ? (
                      bonuses.map((bonus) => (
                        <TableRow key={bonus._id}>
                          <TableCell>{bonus.type}</TableCell>
                          <TableCell>{bonus.reason}</TableCell>
                          <TableCell>
                            ₦{bonus.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(bonus.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={bonus.approvalStatus}
                              color={
                                bonus.approvalStatus.toLowerCase() ===
                                "approved"
                                  ? "success"
                                  : bonus.approvalStatus.toLowerCase() ===
                                    "pending"
                                  ? "warning"
                                  : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">
                            No bonuses found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {pagination.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bonus Type Selection Dialog */}
      <Dialog
        open={openTypeDialog}
        onClose={handleCloseTypeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="text-gray-800">Select Bonus Type</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }} className="text-gray-600">
            Choose the type of bonus you want to request:
          </Typography>
          <Grid container spacing={2}>
            {BONUS_TYPES.map((type) => (
              <Grid item xs={12} sm={6} key={type.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    border:
                      selectedType === type.id
                        ? "2px solid #059669" // green-600
                        : "1px solid #e0e0e0",
                    "&:hover": {
                      border: "2px solid #059669",
                      backgroundColor: "rgba(5, 150, 105, 0.04)", // green-600 with opacity
                    },
                  }}
                  onClick={() => handleSelectType(type.id)}
                >
                  <Typography variant="h6" className="text-gray-800">
                    {type.label}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {type.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTypeDialog} className="text-gray-600">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bonus Request Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="text-gray-800">
          Request{" "}
          {selectedType
            ? BONUS_TYPES.find((t) => t.id === selectedType)?.label
            : "Bonus"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedType && (
              <Alert
                severity="info"
                sx={{ mb: 3 }}
                className="bg-green-50 text-green-800"
              >
                You selected:{" "}
                <strong>
                  {BONUS_TYPES.find((t) => t.id === selectedType)?.label}
                </strong>
              </Alert>
            )}

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
              }}
              sx={{ mb: 3 }}
              className="text-gray-800"
            />

            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={4}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              error={!!errors.reason}
              helperText={errors.reason}
              placeholder="Please provide a detailed explanation of why you deserve this bonus..."
              sx={{ mb: 3 }}
              className="text-gray-800"
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={formData.paymentDate}
                onChange={(newValue) =>
                  setFormData({ ...formData, paymentDate: newValue })
                }
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.paymentDate,
                    helperText: errors.paymentDate,
                    className: "text-gray-800",
                  },
                }}
              />
            </LocalizationProvider>

            <Alert
              severity="info"
              sx={{ mt: 3 }}
              className="bg-green-50 text-green-800"
            >
              Your request will be reviewed by HR. Please provide a clear reason
              for your bonus request.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} className="text-gray-600">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={createBonusMutation.isPending}
          >
            {createBonusMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MyBonus;
