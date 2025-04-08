import { departmentService } from "../../services/departmentService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../../context/AuthContext";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Custom tooltip for the bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-600">Count: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for the pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-gray-600">Count: {payload[0].value}</p>
        <p className="text-sm text-gray-600">
          Percentage: {payload[0].payload.percent.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for the line chart
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-600">
          New Employees: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function DepartmentStats() {
  const { user } = useAuth();

  // Only fetch chart stats if the user is an admin
  const { data: chartStats, isLoading } =
    user?.role === "ADMIN"
      ? departmentService.useGetAdminDepartmentChartStats()
      : { data: null, isLoading: false };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 h-64 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 h-64 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 h-64 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!chartStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Calculate totals for summary
  const totalEmployees = chartStats.departmentStats.datasets[0].data.reduce(
    (sum, val) => sum + val,
    0
  );
  const totalAdmins = chartStats.roleDistribution.datasets[0].data[0] || 0;
  const totalRegularUsers =
    chartStats.roleDistribution.datasets[0].data[1] || 0;
  const totalGrowth = chartStats.monthlyGrowth.datasets[0].data.reduce(
    (sum, val) => sum + val,
    0
  );

  // Prepare data for charts
  const departmentData = chartStats.departmentStats.datasets[0].data.map(
    (value, index) => ({
      name: chartStats.departmentStats.labels[index],
      value,
    })
  );

  const roleData = chartStats.roleDistribution.datasets[0].data.map(
    (value, index) => ({
      name: chartStats.roleDistribution.labels[index],
      value,
      percent: value / totalEmployees,
    })
  );

  const growthData = chartStats.monthlyGrowth.datasets[0].data.map(
    (value, index) => ({
      month: chartStats.monthlyGrowth.labels[index],
      newEmployees: value,
    })
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-gray-500 mt-1">
              {chartStats.departmentStats.labels[0]}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdmins}</div>
            <p className="text-xs text-gray-500 mt-1">
              {chartStats.roleDistribution.labels[0]}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegularUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {chartStats.roleDistribution.labels[1]}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGrowth}</div>
            <p className="text-xs text-gray-500 mt-1">New Employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department Size Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Department Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="newEmployees"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
