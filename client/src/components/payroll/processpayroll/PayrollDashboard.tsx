import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Payroll } from "./admin/PayrollTable";
import {
  adminPayrollService,
  AdminPayrollProcessingStats,
} from "../../../services/adminPayrollService";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import {
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

interface PayrollDashboardProps {
  payrolls: Payroll[];
}

const STATUS_COLORS = {
  processing: "#1976d2",
  completed: "#2e7d32",
  failed: "#d32f2f",
  approved: "#ed6c02",
  paid: "#9c27b0",
  pendingPayment: "#0288d1",
};

const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ payrolls }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [processingStats, setProcessingStats] =
    useState<AdminPayrollProcessingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const totalPayrolls = payrolls.length;
  const totalAmount = payrolls.reduce((sum, p) => sum + p.netPay, 0);

  useEffect(() => {
    const fetchProcessingStats = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const stats = await adminPayrollService.getProcessingStatistics(
          user?.role,
          timestamp
        );
        setProcessingStats(stats);
      } catch (error) {
        console.error("Error fetching processing statistics:", error);
        toast.error("Failed to fetch processing statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchProcessingStats();

    const intervalId = setInterval(fetchProcessingStats, 1800000);

    return () => clearInterval(intervalId);
  }, [user?.role]);

  const processingStatusData = processingStats
    ? [
        {
          name: "Processing",
          value: processingStats.processingPayrolls,
          color: STATUS_COLORS.processing,
        },
        {
          name: "Completed",
          value: processingStats.completedPayrolls,
          color: STATUS_COLORS.completed,
        },
        {
          name: "Failed",
          value: processingStats.failedPayrolls,
          color: STATUS_COLORS.failed,
        },
        {
          name: "Approved",
          value: processingStats.approvedPayrolls,
          color: STATUS_COLORS.approved,
        },
        {
          name: "Paid",
          value: processingStats.paidPayrolls,
          color: STATUS_COLORS.paid,
        },
        {
          name: "Pending Payment",
          value: processingStats.pendingPaymentPayrolls,
          color: STATUS_COLORS.pendingPayment,
        },
      ]
    : [];

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{ p: 2, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
        >
          <Typography variant="body2" fontWeight="bold">
            {payload[0].name}
          </Typography>
          <Typography variant="body2">Count: {payload[0].value}</Typography>
          {payload[0].payload.percentage && (
            <Typography variant="body2">
              Percentage: {payload[0].payload.percentage.toFixed(1)}%
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Payroll Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card
            elevation={3}
            sx={{
              height: "100%",
              backgroundColor: theme.palette.primary.light,
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AssessmentIcon sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                  Total Payrolls
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {processingStats?.totalPayrolls || totalPayrolls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            elevation={3}
            sx={{
              height: "100%",
              backgroundColor: theme.palette.success.light,
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PaymentIcon sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                  Total Amount
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                ₦
                {(
                  processingStats?.totalAmountPaid || totalAmount
                ).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            elevation={3}
            sx={{
              height: "100%",
              backgroundColor: theme.palette.warning.light,
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PendingActionsIcon sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                  Processing
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {processingStats?.processingPayrolls || 0}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.875rem" }}>
                {processingStats?.processingRate
                  ? `${processingStats.processingRate.toFixed(1)}% of total`
                  : ""}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            elevation={3}
            sx={{
              height: "100%",
              backgroundColor: theme.palette.info.light,
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                  Paid
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {processingStats?.paidPayrolls || 0}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.875rem" }}>
                {processingStats?.paymentRate
                  ? `${processingStats.paymentRate.toFixed(1)}% of total`
                  : ""}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Statistics */}
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress size={60} />
            </Box>
          </Grid>
        ) : processingStats ? (
          <>
            <Grid item xs={12}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ mt: 2, mb: 3, fontWeight: "bold" }}
              >
                Processing Statistics
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={8} sx={{ margin: "0 auto" }}>
              <Card elevation={3} sx={{ height: "100%", p: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", textAlign: "center" }}
                >
                  Payroll Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={processingStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={160}
                      innerRadius={80}
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0.05
                          ? `${name}: ${(percent * 100).toFixed(0)}%`
                          : ""
                      }
                    >
                      {processingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: "#666", fontSize: "0.9em" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </>
        ) : null}
      </Grid>
    </Box>
  );
};

export default PayrollDashboard;
