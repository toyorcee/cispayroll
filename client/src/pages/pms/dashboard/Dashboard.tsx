import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { getRoleSpecificWelcomeMessage } from "../../../utils/dashboardUtils";
import { GlobalErrorBoundary } from "../../../components/error/GlobalErrorBoundary";
import { getRoleStats, DashboardStats } from "../../../data/dashboardData";
import { employeeService } from "../../../services/employeeService";
import StatCard from "../../../components/dashboard/StatCard";
import { departmentService } from "../../../services/departmentService";

// Lazy load chart components
const LineChart = lazy(() => import("../../../components/charts/LineChart"));
const BarChart = lazy(() => import("../../../components/charts/BarChart"));
const PieChart = lazy(() => import("../../../components/charts/PieChart"));

// Loading component for charts
const ChartLoading = () => (
  <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="animate-pulse text-gray-400">Loading chart...</div>
  </div>
);

export default function Dashboard() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<
    DashboardStats | undefined
  >(undefined);

  // Add refs for each chart section
  const distributionRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const isDistributionInView = useInView(distributionRef, { amount: 0.5 });
  const isPieChartInView = useInView(pieChartRef, { amount: 0.5 });
  const isLineChartInView = useInView(lineChartRef, { amount: 0.5 });

  const { data: chartStats } = departmentService.useGetDepartmentChartStats();

  // For admin/user specific stats
  // const { data: roleStats } = departmentService.useGetRoleSpecificStats(
  //   user?.role.toLowerCase() || "",
  //   hasPermission(Permission.VIEW_ALL_DEPARTMENTS)
  //     ? (typeof user?.department === "object"
  //         ? user.department._id
  //         : user?.department) || ""
  //     : user?._id || ""
  // );

  // Pie Chart - Department Size Distribution (percentage)
  const pieChartData = chartStats
    ? {
        labels: chartStats.departmentDistribution.labels.map((label, index) => {
          const value =
            chartStats.departmentDistribution.datasets[0].data[index];
          const total =
            chartStats.departmentDistribution.datasets[0].data.reduce(
              (a, b) => a + b,
              0
            );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label} (${percentage}%)`;
        }),
        datasets: [
          {
            data: chartStats.departmentDistribution.datasets[0].data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 159, 64, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    : null;

  // Bar Chart - Employee Distribution by Role
  const barChartData = chartStats
    ? {
        labels: chartStats.departmentDistribution.labels,
        datasets: [
          {
            label: "Regular Users",
            data: chartStats.departmentDistribution.datasets[2].data,
            backgroundColor: Array(
              chartStats.departmentDistribution.labels.length
            ).fill("rgba(54, 162, 235, 0.8)"),
            borderColor: Array(
              chartStats.departmentDistribution.labels.length
            ).fill("rgba(54, 162, 235, 1)"),
            borderWidth: 1,
          },
          {
            label: "Admins",
            data: chartStats.departmentDistribution.datasets[1].data,
            backgroundColor: Array(
              chartStats.departmentDistribution.labels.length
            ).fill("rgba(255, 206, 86, 0.8)"),
            borderColor: Array(
              chartStats.departmentDistribution.labels.length
            ).fill("rgba(255, 206, 86, 1)"),
            borderWidth: 1,
          },
        ],
      }
    : null;

  // Line Chart - Department Growth Trend
  const lineChartData = chartStats
    ? {
        labels: chartStats.departmentDistribution.labels,
        datasets: [
          {
            label: "Total Employees",
            data: chartStats.departmentDistribution.datasets[0].data,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.4,
          },
        ],
      }
    : null;

  // Add console logs for debugging
  console.log("Chart Stats:", chartStats);
  console.log("Pie Chart Data:", pieChartData);
  console.log("Bar Chart Data:", barChartData);
  console.log("Line Chart Data:", lineChartData);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const stats = await employeeService.getDashboardStats();
        setDashboardStats(stats);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  // Render different charts based on permissions
  const renderPermissionBasedCharts = () => {
    // Add debug logs
    console.log("User Role:", user?.role);
    console.log(
      "Has VIEW_ALL_DEPARTMENTS:",
      hasPermission(Permission.VIEW_ALL_DEPARTMENTS)
    );
    console.log("User Department:", user?.department);

    // Superadmin view
    if (hasPermission(Permission.VIEW_ALL_DEPARTMENTS)) {
      console.log("Rendering Superadmin Charts");
      return (
        <>
          <div
            ref={pieChartRef}
            className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]"
          >
            <h2 className="text-lg font-semibold mb-4">
              Department Size Distribution
            </h2>
            <Suspense fallback={<ChartLoading />}>
              {isPieChartInView && pieChartData && (
                <PieChart data={pieChartData} />
              )}
            </Suspense>
          </div>
          <div
            ref={distributionRef}
            className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]"
          >
            <h2 className="text-lg font-semibold mb-4">
              Employee Role Distribution
            </h2>
            <Suspense fallback={<ChartLoading />}>
              {isDistributionInView && barChartData && (
                <BarChart data={barChartData} />
              )}
            </Suspense>
          </div>
        </>
      );
    }

    // Admin view
    if (user?.role === "ADMIN" && user?.department) {
      console.log("Rendering Admin Charts");
      const { data: adminStats, isLoading: adminStatsLoading } =
        departmentService.useGetAdminDepartmentStats(
          typeof user.department === "object"
            ? user.department._id
            : user.department
        );

      console.log("Admin Stats:", adminStats);
      console.log("Admin Stats Loading:", adminStatsLoading);

      if (adminStatsLoading) return <ChartLoading />;
      if (!adminStats) return null;

      return (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Department Employee Status
            </h2>
            <Suspense fallback={<ChartLoading />}>
              <BarChart data={adminStats.departmentStats} />
            </Suspense>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Monthly Employee Growth
            </h2>
            <Suspense fallback={<ChartLoading />}>
              <LineChart data={adminStats.monthlyGrowth} />
            </Suspense>
          </div>
        </>
      );
    }

    console.log("No charts rendered - no matching conditions");
    return null;
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 p-6 rounded-lg shadow-lg border border-red-200"
      >
        <h2 className="text-red-800 text-lg font-semibold">
          Error Loading Dashboard
        </h2>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <GlobalErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 w-full overflow-x-hidden"
      >
        {/* Welcome Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h4 className="text-2xl font-semibold text-gray-800">
            Welcome back, {user?.firstName}!
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            {getRoleSpecificWelcomeMessage(user?.role)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {getRoleStats(user?.role, dashboardStats).map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard
                {...stat}
                icon={stat.icon}
                subtext={stat.subtext}
                href={stat.href}
                color={stat.color}
              />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="min-h-[500px] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {renderPermissionBasedCharts()}
          </div>

          {/* Department Overview Line Chart - Show for users with department view permission */}
          {hasAnyPermission([
            Permission.VIEW_ALL_DEPARTMENTS,
            Permission.MANAGE_DEPARTMENT_USERS,
          ]) && (
            <div
              ref={lineChartRef}
              className="bg-white p-6 rounded-lg shadow-lg min-h-[400px] mb-6"
            >
              <h2 className="text-lg font-semibold mb-4">
                Department Overview
              </h2>
              <Suspense fallback={<ChartLoading />}>
                {isLineChartInView && lineChartData && (
                  <LineChart data={lineChartData} />
                )}
              </Suspense>
            </div>
          )}
        </div>
      </motion.div>
    </GlobalErrorBoundary>
  );
}
