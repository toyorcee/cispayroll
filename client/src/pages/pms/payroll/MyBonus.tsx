import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  IconButton,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { bonusService } from "../../../services/bonusService";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";

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

// Define the Bonus interface to match the API response
interface Bonus {
  _id: string;
  amount: number;
  reason: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  paymentDate: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

// Define the CreatePersonalBonusData interface to match the service
interface CreatePersonalBonusData {
  amount: number;
  reason: string;
  paymentDate: Date;
  type: string; // Add type to the interface
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bonusToDelete, setBonusToDelete] = useState<string | null>(null);

  // Fix the type issue by explicitly typing the response
  const {
    data: bonuses,
    isLoading,
    refetch,
  } = useQuery<Bonus[]>({
    queryKey: ["my-bonuses"],
    queryFn: async () => {
      try {
        const response = await bonusService.getMyBonuses();
        // Check if response.data exists and has a bonuses property
        if (
          response &&
          response.data &&
          response.data.bonuses &&
          Array.isArray(response.data.bonuses)
        ) {
          // Map the response to match our Bonus interface
          const mappedBonuses = response.data.bonuses.map((bonus: any) => ({
            _id: bonus._id,
            amount: bonus.amount,
            reason: bonus.reason,
            type: bonus.type,
            status: bonus.approvalStatus,
            createdAt: bonus.createdAt,
            paymentDate: bonus.paymentDate,
            employee: bonus.employee,
          }));

          // Filter out duplicates based on _id
          const uniqueBonuses = mappedBonuses.filter(
            (bonus, index, self) =>
              index === self.findIndex((b) => b._id === bonus._id)
          );

          console.log(
            `Found ${mappedBonuses.length} bonuses, ${uniqueBonuses.length} unique`
          );
          return uniqueBonuses;
        } else {
          console.error("Unexpected response format:", response);
          return [];
        }
      } catch (error) {
        console.error("Error fetching bonuses:", error);
        toast.error("Failed to fetch your bonus requests");
        return [];
      }
    },
  });

  const createBonusMutation = useMutation({
    mutationFn: (data: CreatePersonalBonusData) =>
      bonusService.createPersonalBonus(data),
    onSuccess: () => {
      toast.success("Bonus request created successfully!");
      setFormData({ amount: "", reason: "", paymentDate: null, type: "" });
      setSelectedType(null);
      setOpenDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create bonus request"
      );
    },
  });

  const deleteBonusMutation = useMutation({
    mutationFn: (id: string) => bonusService.deleteBonus(id),
    onSuccess: () => {
      toast.success("Bonus request deleted successfully!");
      setDeleteDialogOpen(false);
      setBonusToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete bonus request"
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

  const handleDeleteClick = (id: string) => {
    setBonusToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (bonusToDelete) {
      deleteBonusMutation.mutate(bonusToDelete);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setBonusToDelete(null);
  };

  if (isLoading) {
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5" component="h1">
          My Bonuses
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenDialog}
          startIcon={<span>+</span>}
        >
          Request Bonus
        </Button>
      </div>

      <div className="grid gap-4">
        {bonuses &&
          bonuses.map((bonus: Bonus) => (
            <Card className="mb-4 hover:shadow-lg transition-shadow duration-200 border border-gray-100">
              <CardContent>
                <Box className="flex justify-between items-start mb-4">
                  <Box className="flex items-center gap-3">
                    <Typography
                      className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        bonus.status.toLowerCase() === "approved"
                          ? "bg-green-100 text-green-800"
                          : bonus.status.toLowerCase() === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bonus.status}
                    </Typography>
                    {bonus.status.toLowerCase() === "pending" && (
                      <Tooltip title="Delete request">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(bonus._id)}
                          className="hover:bg-red-50"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" className="text-gray-500">
                    {new Date(bonus.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box className="grid grid-cols-2 gap-6 bg-green-50 p-4 rounded-lg">
                  <Box>
                    <Typography variant="body2" className="text-gray-600 mb-1">
                      Amount
                    </Typography>
                    <Typography
                      variant="h6"
                      className="font-bold text-green-700"
                    >
                      ₦{bonus.amount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" className="text-gray-600 mb-1">
                      Payment Date
                    </Typography>
                    <Typography
                      variant="h6"
                      className="font-bold text-gray-800"
                    >
                      {new Date(bonus.paymentDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Box className="mt-4">
                  <Typography variant="body2" className="text-gray-600 mb-1">
                    Reason
                  </Typography>
                  <Typography
                    variant="body1"
                    className="font-medium text-gray-800 bg-white p-3 rounded-lg border border-gray-100"
                  >
                    {bonus.reason}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}

        {(!bonuses || bonuses.length === 0) && (
          <Card>
            <CardContent>
              <Typography color="textSecondary" align="center">
                No bonuses found
              </Typography>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bonus Type Selection Dialog */}
      <Dialog
        open={openTypeDialog}
        onClose={handleCloseTypeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Bonus Type</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
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
                        ? "2px solid #1976d2"
                        : "1px solid #e0e0e0",
                    "&:hover": {
                      border: "2px solid #1976d2",
                      backgroundColor: "rgba(25, 118, 210, 0.04)",
                    },
                  }}
                  onClick={() => handleSelectType(type.id)}
                >
                  <Typography variant="h6">{type.label}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {type.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTypeDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Bonus Request Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Request{" "}
          {selectedType
            ? BONUS_TYPES.find((t) => t.id === selectedType)?.label
            : "Bonus"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedType && (
              <Alert severity="info" sx={{ mb: 3 }}>
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
                  },
                }}
              />
            </LocalizationProvider>

            <Alert severity="info" sx={{ mt: 3 }}>
              Your request will be reviewed by HR. Please provide a clear reason
              for your bonus request.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={createBonusMutation.isPending}
          >
            {createBonusMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Bonus Request</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this bonus request? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteBonusMutation.isPending}
          >
            {deleteBonusMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MyBonus;
