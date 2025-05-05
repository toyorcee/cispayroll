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
  Box,
  Pagination,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { allowanceService } from "../../../services/allowanceService";
import { Allowance, AllowanceType } from "../../../types/allowance";
import { formatCurrency } from "../../../utils/formatters";
import { toast } from "react-toastify";

const MyAllowances: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const fetchAllowances = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await allowanceService.getPersonalAllowances({
        page,
        limit: pagination.limit,
      });
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
        amount: Number(requestForm.amount),
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

  if (!hasPermission(Permission.VIEW_OWN_ALLOWANCES)) {
    return (
      <Alert severity="error">
        You don't have permission to view your allowances.
      </Alert>
    );
  }

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
                My Allowances
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allowances.length > 0 ? (
                      allowances.map((allowance) => (
                        <TableRow key={allowance._id}>
                          <TableCell>{allowance.type}</TableCell>
                          <TableCell>{allowance.description}</TableCell>
                          <TableCell>
                            {formatCurrency(allowance.amount)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={allowance.approvalStatus}
                              color={
                                allowance.approvalStatus === "approved"
                                  ? "success"
                                  : allowance.approvalStatus === "pending"
                                  ? "warning"
                                  : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{allowance.department?.name}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">
                            No allowances found
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
