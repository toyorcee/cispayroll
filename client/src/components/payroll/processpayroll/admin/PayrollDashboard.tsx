import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Payroll } from "./PayrollTable";

interface PayrollDashboardProps {
  payrolls: Payroll[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ payrolls }) => {
  // Calculate statistics
  const totalPayrolls = payrolls.length;
  const totalAmount = payrolls.reduce((sum, p) => sum + p.netPay, 0);
  const averageAmount = totalAmount / totalPayrolls || 0;

  // Status distribution
  const statusDistribution = payrolls.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Monthly distribution
  const monthlyDistribution = payrolls.reduce((acc, p) => {
    const monthYear = `${p.month} ${p.year}`;
    acc[monthYear] = (acc[monthYear] || 0) + p.netPay;
    return acc;
  }, {} as Record<string, number>);

  // Convert to chart data
  const statusData = Object.entries(statusDistribution).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const monthlyData = Object.entries(monthlyDistribution).map(
    ([month, amount]) => ({
      month,
      amount,
    })
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Total Payrolls
            </Typography>
            <Typography variant="h4">{totalPayrolls}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Total Amount
            </Typography>
            <Typography variant="h4">
              ${totalAmount.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Average Amount
            </Typography>
            <Typography variant="h4">
              ${averageAmount.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PayrollDashboard;
