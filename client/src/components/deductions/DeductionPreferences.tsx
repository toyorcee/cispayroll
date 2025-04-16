import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { deductionService } from "../../services/deductionService";
import { Deduction } from "../../types/deduction";

interface DeductionPreferencesProps {
  userId?: string;
  isAdmin?: boolean;
}

const DeductionPreferences: React.FC<DeductionPreferencesProps> = ({
  userId,
  isAdmin = false,
}) => {
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(
    null
  );
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [amount, setAmount] = useState<string>("");
  const [percentage, setPercentage] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch deductions and user preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all deductions
        const deductionsData = isAdmin
          ? await deductionService.adminService.getAllDeductions()
          : await deductionService.getAllDeductions();

        // Combine all deductions into a single array
        const allDeductions = [
          ...deductionsData.statutory,
          ...deductionsData.voluntary,
        ];

        setDeductions(allDeductions);

        // Fetch user preferences
        const preferences = await deductionService.getUserDeductionPreferences(
          userId
        );
        setUserPreferences(preferences);
      } catch (error) {
        console.error("Error fetching deduction data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAdmin]);

  // Check if a deduction is opted in
  const isOptedIn = (deductionId: string): boolean => {
    if (!userPreferences) return false;

    const standardVoluntary = userPreferences.voluntary.standardVoluntary || [];
    const customVoluntary = userPreferences.voluntary.customVoluntary || [];

    return (
      standardVoluntary.some(
        (d: any) => d.deduction === deductionId && d.opted
      ) ||
      customVoluntary.some((d: any) => d.deduction === deductionId && d.opted)
    );
  };

  // Handle opt-in for a deduction
  const handleOptIn = (deduction: Deduction) => {
    setSelectedDeduction(deduction);
    setOpenDialog(true);
  };

  // Handle opt-out for a deduction
  const handleOptOut = async (deductionId: string) => {
    try {
      await deductionService.removeVoluntaryDeduction(deductionId, userId);

      // Refresh user preferences
      const preferences = await deductionService.getUserDeductionPreferences(
        userId
      );
      setUserPreferences(preferences);
    } catch (error) {
      console.error("Error opting out of deduction:", error);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDeduction(null);
    setStartDate(new Date());
    setEndDate(undefined);
    setAmount("");
    setPercentage("");
    setNotes("");
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDeduction) return;

    try {
      await deductionService.addVoluntaryDeduction(
        selectedDeduction._id,
        {
          startDate,
          endDate,
          amount: amount ? Number(amount) : undefined,
          percentage: percentage ? Number(percentage) : undefined,
          notes,
        },
        userId
      );

      // Refresh user preferences
      const preferences = await deductionService.getUserDeductionPreferences(
        userId
      );
      setUserPreferences(preferences);

      handleCloseDialog();
    } catch (error) {
      console.error("Error opting in to deduction:", error);
    }
  };

  // Filter deductions by type
  const statutoryDeductions = deductions.filter((d) => d.type === "STATUTORY");
  const voluntaryDeductions = deductions.filter((d) => d.type === "VOLUNTARY");
  const departmentDeductions = deductions.filter(
    (d) => d.scope === "department"
  );

  if (loading) {
    return <Typography>Loading deduction preferences...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Deduction Preferences
      </Typography>

      {/* Statutory Deductions */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Statutory Deductions" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Statutory deductions are mandatory and cannot be opted out of.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Calculation Method</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statutoryDeductions.map((deduction) => (
                  <TableRow key={deduction._id}>
                    <TableCell>{deduction.name}</TableCell>
                    <TableCell>{deduction.description}</TableCell>
                    <TableCell>{deduction.calculationMethod}</TableCell>
                    <TableCell>
                      {deduction.calculationMethod === "PERCENTAGE"
                        ? `${deduction.value}%`
                        : `₦${deduction.value.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <Chip label="Mandatory" color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Voluntary Deductions */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Voluntary Deductions" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Voluntary deductions can be opted in or out of.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Calculation Method</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {voluntaryDeductions.map((deduction) => {
                  const isOpted = isOptedIn(deduction._id);

                  return (
                    <TableRow key={deduction._id}>
                      <TableCell>{deduction.name}</TableCell>
                      <TableCell>{deduction.description}</TableCell>
                      <TableCell>{deduction.calculationMethod}</TableCell>
                      <TableCell>
                        {deduction.calculationMethod === "PERCENTAGE"
                          ? `${deduction.value}%`
                          : `₦${deduction.value.toLocaleString()}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isOpted ? "Opted In" : "Opted Out"}
                          color={isOpted ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {isOpted ? (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOptOut(deduction._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOptIn(deduction)}
                          >
                            <AddIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Department-Specific Deductions */}
      {departmentDeductions.length > 0 && (
        <Card>
          <CardHeader title="Department-Specific Deductions" />
          <CardContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              These deductions are specific to your department.
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Calculation Method</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentDeductions.map((deduction) => {
                    const isOpted = isOptedIn(deduction._id);

                    return (
                      <TableRow key={deduction._id}>
                        <TableCell>
                          {deduction.name}
                          <Chip
                            label="Department"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </TableCell>
                        <TableCell>{deduction.description}</TableCell>
                        <TableCell>{deduction.calculationMethod}</TableCell>
                        <TableCell>
                          {deduction.calculationMethod === "PERCENTAGE"
                            ? `${deduction.value}%`
                            : `₦${deduction.value.toLocaleString()}`}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isOpted ? "Opted In" : "Opted Out"}
                            color={isOpted ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {isOpted ? (
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleOptOut(deduction._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          ) : (
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOptIn(deduction)}
                            >
                              <AddIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Opt-in Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Opt In to {selectedDeduction?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {selectedDeduction?.description}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => newValue && setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date (Optional)"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue || undefined)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            {selectedDeduction?.calculationMethod === "FIXED" && (
              <Grid item xs={12}>
                <TextField
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                />
              </Grid>
            )}

            {selectedDeduction?.calculationMethod === "PERCENTAGE" && (
              <Grid item xs={12}>
                <TextField
                  label="Percentage"
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  fullWidth
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Opt In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeductionPreferences;
