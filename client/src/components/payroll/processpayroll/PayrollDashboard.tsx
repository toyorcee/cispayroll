import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Payroll } from "./admin/PayrollTable";
import {
  adminPayrollService,
  AdminPayrollProcessingStats,
} from "../../../services/adminPayrollService";
import { useAuth } from "../../../context/AuthContext";
import { UserRole } from "../../../types/auth";
import { toast } from "react-toastify";
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";

interface PayrollDashboardProps {
  payrolls: Payroll[];
  processingStats?: AdminPayrollProcessingStats;
}

const STATUS_COLORS = {
  processing: "#1976d2",
  completed: "#2e7d32",
  failed: "#d32f2f",
  approved: "#ed6c02",
  paid: "#9c27b0",
  pendingPayment: "#0288d1",
};

const PayrollDashboard: React.FC<PayrollDashboardProps> = ({
  payrolls,
  processingStats: initialProcessingStats,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [processingStats, setProcessingStats] =
    useState<AdminPayrollProcessingStats | null>(
      initialProcessingStats || null
    );
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<
    Array<{
      name: string;
      value: number;
      color: string;
    }>
  >([]);

  const totalPayrolls = payrolls.length;
  const totalAmount = payrolls.reduce((sum, p) => sum + p.netPay, 0);

  useEffect(() => {
    const fetchProcessingStats = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        console.log("Fetching processing statistics for role:", user?.role);

        const stats = await adminPayrollService.getProcessingStatistics(
          user?.role,
          timestamp
        );
        console.log("Received processing statistics:", stats);

        setProcessingStats(stats);

        // Prepare doughnut chart data
        const doughnutData = [
          {
            name: "Paid",
            value: stats.paidPayrolls,
            color: STATUS_COLORS.paid,
          },
          {
            name: "Processing",
            value: stats.processingPayrolls,
            color: STATUS_COLORS.processing,
          },
          {
            name: "Completed",
            value: stats.completedPayrolls || 0,
            color: STATUS_COLORS.completed,
          },
          {
            name: "Pending Payment",
            value: stats.pendingPaymentPayrolls,
            color: STATUS_COLORS.pendingPayment,
          },
          {
            name: "Failed",
            value: stats.failedPayrolls,
            color: STATUS_COLORS.failed,
          },
          {
            name: "Approved",
            value: stats.approvedPayrolls,
            color: STATUS_COLORS.approved,
          },
        ];

        // If all values are 0 but totalPayrolls > 0, add a "No Status" entry
        if (
          stats.totalPayrolls > 0 &&
          doughnutData.every((item) => item.value === 0)
        ) {
          doughnutData.push({
            name: "No Status",
            value: stats.totalPayrolls,
            color: "#cccccc", // Gray color for no status
          });
        } else {
          // Filter out zero values only if we have some non-zero values
          const nonZeroData = doughnutData.filter((item) => item.value > 0);
          if (nonZeroData.length > 0) {
            doughnutData.length = 0;
            doughnutData.push(...nonZeroData);
          }
        }

        console.log("Prepared doughnut data:", doughnutData);
        console.log("Doughnut data length:", doughnutData.length);

        setChartData(doughnutData);
      } catch (error) {
        console.error("Error fetching processing statistics:", error);
        toast.error("Failed to fetch processing statistics");
      } finally {
        setLoading(false);
      }
    };

    if (!initialProcessingStats) {
      console.log("No initial stats provided, fetching from API");
      fetchProcessingStats();
      const intervalId = setInterval(fetchProcessingStats, 1800000);
      return () => clearInterval(intervalId);
    } else {
      console.log("Using initial processing stats:", initialProcessingStats);

      // Handle initial stats for doughnut chart
      const initialDoughnutData = [
        {
          name: "Paid",
          value: initialProcessingStats.paidPayrolls,
          color: STATUS_COLORS.paid,
        },
        {
          name: "Processing",
          value: initialProcessingStats.processingPayrolls,
          color: STATUS_COLORS.processing,
        },
        {
          name: "Completed",
          value: initialProcessingStats.completedPayrolls || 0,
          color: STATUS_COLORS.completed,
        },
        {
          name: "Pending Payment",
          value: initialProcessingStats.pendingPaymentPayrolls,
          color: STATUS_COLORS.pendingPayment,
        },
        {
          name: "Failed",
          value: initialProcessingStats.failedPayrolls,
          color: STATUS_COLORS.failed,
        },
        {
          name: "Approved",
          value: initialProcessingStats.approvedPayrolls,
          color: STATUS_COLORS.approved,
        },
      ];

      // If all values are 0 but totalPayrolls > 0, add a "No Status" entry
      if (
        initialProcessingStats.totalPayrolls > 0 &&
        initialDoughnutData.every((item) => item.value === 0)
      ) {
        initialDoughnutData.push({
          name: "No Status",
          value: initialProcessingStats.totalPayrolls,
          color: "#cccccc", // Gray color for no status
        });
      } else {
        // Filter out zero values only if we have some non-zero values
        const nonZeroData = initialDoughnutData.filter(
          (item) => item.value > 0
        );
        if (nonZeroData.length > 0) {
          initialDoughnutData.length = 0;
          initialDoughnutData.push(...nonZeroData);
        }
      }

      console.log("Prepared initial doughnut data:", initialDoughnutData);
      console.log("Initial doughnut data length:", initialDoughnutData.length);

      setChartData(initialDoughnutData);
      setLoading(false);
    }
  }, [user?.role, initialProcessingStats]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Payroll Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* Single Summary Card for ALL Users */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255, 255, 255, 0.1)",
                clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                    Payroll Overview
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {user?.role === UserRole.SUPER_ADMIN
                      ? "Super Admin"
                      : "Admin"}{" "}
                    Dashboard
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
                  {processingStats?.totalPayrolls || totalPayrolls}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Payrolls
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    ₦
                    {(
                      processingStats?.totalAmountPaid || totalAmount
                    ).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Total Amount
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {processingStats?.paidPayrolls || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Paid
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingUpIcon sx={{ fontSize: 20, mr: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {processingStats?.paymentRate
                      ? `${processingStats.paymentRate.toFixed(1)}%`
                      : "0%"}{" "}
                    Success Rate
                  </Typography>
                </Box>
              </Box>

              {/* Status Badges */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {processingStats?.approvedPayrolls || 0} Approved
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: STATUS_COLORS.completed,
                    color: "white",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {processingStats?.completedPayrolls || 0} Completed
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: STATUS_COLORS.processing,
                    color: "white",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {processingStats?.processingPayrolls || 0} Processing
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: STATUS_COLORS.pendingPayment,
                    color: "white",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {processingStats?.pendingPaymentPayrolls || 0} Pending
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: STATUS_COLORS.failed,
                    color: "white",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {processingStats?.failedPayrolls || 0} Failed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Doughnut Chart */}
        <Grid item xs={12} md={8} sx={{ margin: "0 auto" }}>
          <Card elevation={3} sx={{ height: "100%", p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", textAlign: "center" }}
            >
              Payroll Status Distribution
            </Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={chartData}
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
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
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
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="350px"
              >
                <Typography variant="body1" color="textSecondary">
                  No payroll data available
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PayrollDashboard;
