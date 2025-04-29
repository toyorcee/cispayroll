import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { allowanceService } from "../../../services/allowanceService";
import {
  Allowance,
  AllowanceStatus,
  AllowanceType,
  CalculationMethod,
  PayrollFrequency,
} from "../../../types/allowance";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { toast } from "react-toastify";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`allowance-tabpanel-${index}`}
      aria-labelledby={`allowance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MyAllowances: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [allowanceHistory, setAllowanceHistory] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [requestForm, setRequestForm] = useState({
    name: "",
    type: "" as AllowanceType,
    amount: "",
    description: "",
    calculationMethod: CalculationMethod.FIXED,
    frequency: PayrollFrequency.MONTHLY,
    effectiveDate: new Date().toISOString().split("T")[0],
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Function to reset the form
  const resetForm = () => {
    setRequestForm({
      name: "",
      type: "" as AllowanceType,
      amount: "",
      description: "",
      calculationMethod: CalculationMethod.FIXED,
      frequency: PayrollFrequency.MONTHLY,
      effectiveDate: new Date().toISOString().split("T")[0],
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
  };

  // Function to open the form
  const handleOpenForm = () => {
    resetForm();
    setOpenRequestForm(true);
  };

  // Function to close the form
  const handleCloseForm = () => {
    setOpenRequestForm(false);
    resetForm();
  };

  useEffect(() => {
    fetchAllowances();
    fetchAllowanceHistory();
  }, []);

  const fetchAllowances = async () => {
    try {
      if (!user?.role) {
        throw new Error("User role not found");
      }
      const response = await allowanceService.getAllAllowances(user.role);
      setAllowances(response.data);
    } catch (err) {
      setError("Failed to fetch allowances");
      console.error("Error fetching allowances:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowanceHistory = async () => {
    try {
      if (!user?.role) {
        throw new Error("User role not found");
      }
      const response = await allowanceService.getAllowanceHistory(user.role);
      setAllowanceHistory(response.data);
    } catch (err) {
      console.error("Error fetching allowance history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!user || !user._id) {
        throw new Error("User information is incomplete");
      }

      // Get department ID - it could be a string or an object
      const departmentId =
        typeof user.department === "string"
          ? user.department
          : user.department._id;

      if (!departmentId) {
        throw new Error("Department information is incomplete");
      }

      // Create the allowance request object
      const allowanceRequest = {
        ...requestForm,
        amount: Number(requestForm.amount),
        effectiveDate: new Date(requestForm.effectiveDate),
        employee: user._id,
        department: departmentId,
        scope: "individual" as const,
      };

      // Log the request for debugging
      console.log("Sending allowance request:", allowanceRequest);
      console.log("User role:", user.role);

      // Use the appropriate service method based on user role
      if (user.role === "ADMIN") {
        await allowanceService.requestAdminAllowance(allowanceRequest);
      } else {
        await allowanceService.createAllowance(allowanceRequest, user.role);
      }

      toast.success("Allowance request submitted successfully");
      handleCloseForm();
      fetchAllowances(); 
      fetchAllowanceHistory(); 
    } catch (err: any) {
      console.error("Error requesting allowance:", err);
      toast.error(err.message || "Failed to submit allowance request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Check if user has permission to view their own allowances
  if (!hasPermission(Permission.VIEW_OWN_ALLOWANCES)) {
    return (
      <Alert severity="error">
        You don't have permission to view your allowances.
      </Alert>
    );
  }

  const getStatusColor = (status: AllowanceStatus) => {
    switch (status) {
      case AllowanceStatus.APPROVED:
        return "success";
      case AllowanceStatus.PENDING:
        return "warning";
      case AllowanceStatus.REJECTED:
        return "error";
      default:
        return "default";
    }
  };

  const renderAllowanceTable = (
    allowances: Allowance[],
    isLoading: boolean
  ) => {
    if (isLoading) {
      return <CircularProgress />;
    }

    if (allowances.length === 0) {
      return <Typography>No allowances found.</Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Effective Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allowances.map((allowance) => (
              <TableRow key={allowance._id}>
                <TableCell>{allowance.name}</TableCell>
                <TableCell>{allowance.type}</TableCell>
                <TableCell>{formatCurrency(allowance.amount)}</TableCell>
                <TableCell>{allowance.frequency}</TableCell>
                <TableCell>
                  <Chip
                    label={allowance.status}
                    color={getStatusColor(allowance.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(allowance.effectiveDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">My Allowances</Typography>
        {hasPermission(Permission.REQUEST_ALLOWANCES) && (
          <Button variant="contained" color="primary" onClick={handleOpenForm}>
            Request New Allowance
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="allowance tabs"
            >
              <Tab label="Active Allowances" />
              <Tab label="Allowance History" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" className="mb-4">
              Active Allowances
            </Typography>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              renderAllowanceTable(allowances, loading)
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" className="mb-4">
              Allowance History
            </Typography>
            {renderAllowanceTable(allowanceHistory, historyLoading)}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Request Allowance Dialog */}
      <Dialog
        open={openRequestForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request New Allowance</DialogTitle>
        <form onSubmit={handleRequestSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allowance Name"
                  value={requestForm.name}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={requestForm.type}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      type: e.target.value as AllowanceType,
                    })
                  }
                  required
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
                  type="number"
                  label="Amount"
                  value={requestForm.amount}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      amount: e.target.value,
                    })
                  }
                  required
                  inputProps={{
                    min: "0",
                    step: "0.01",
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={requestForm.description}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Calculation Method"
                  value={requestForm.calculationMethod}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      calculationMethod: e.target.value as CalculationMethod,
                    })
                  }
                  required
                >
                  {Object.entries(CalculationMethod).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Frequency"
                  value={requestForm.frequency}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      frequency: e.target.value as PayrollFrequency,
                    })
                  }
                  required
                >
                  {Object.entries(PayrollFrequency).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Effective Date"
                  value={requestForm.effectiveDate}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      effectiveDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Year"
                  value={requestForm.year}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      year: Number(e.target.value),
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Month"
                  value={requestForm.month}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      month: Number(e.target.value),
                    })
                  }
                  required
                  inputProps={{ min: 1, max: 12 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default MyAllowances;
