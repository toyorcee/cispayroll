import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { Permission, UserRole } from "../../../types/auth";
import { getRoleSpecificWelcomeMessage } from "../../../utils/dashboardUtils";
import { GlobalErrorBoundary } from "../../../components/error/GlobalErrorBoundary";
import { getRoleStats, DashboardStats } from "../../../data/dashboardData";
import { employeeService } from "../../../services/employeeService";
import StatCard from "../../../components/dashboard/StatCard";
import { departmentService } from "../../../services/departmentService";
import DepartmentStats from "../../../components/dashboard/DepartmentStats";
import { FaUsers, FaUserTie, FaUserPlus } from "react-icons/fa";

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

  const isDistributionInView = useInView(distributionRef, {
    amount: 0.1,
    margin: "100px 0px 0px 0px",
  });
  const isPieChartInView = useInView(pieChartRef, {
    amount: 0.1,
    margin: "100px 0px 0px 0px",
  });
  const isLineChartInView = useInView(lineChartRef, {
    amount: 0.1,
    margin: "100px 0px 0px 0px",
  });

  // Only fetch the appropriate chart stats based on user role
  const { data: chartStatsData } =
    user?.role === UserRole.SUPER_ADMIN
      ? departmentService.useGetDepartmentChartStats()
      : { data: null };

  const { data: adminChartStatsData } =
    user?.role === UserRole.ADMIN
      ? departmentService.useGetAdminDepartmentChartStats()
      : { data: null };

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
  const pieChartData = chartStatsData
    ? {
        labels: chartStatsData.departmentDistribution.labels.map(
          (label, index) => {
          const value =
              chartStatsData.departmentDistribution.datasets[0].data[index];
          const total =
              chartStatsData.departmentDistribution.datasets[0].data.reduce(
              (a, b) => a + b,
              0
            );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label} (${percentage}%)`;
          }
        ),
        datasets: [
          {
            data: chartStatsData.departmentDistribution.datasets[0].data,
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
  const barChartData = chartStatsData
    ? {
        labels: chartStatsData.departmentDistribution.labels,
        datasets: [
          {
            label: "Regular Users",
            data: chartStatsData.departmentDistribution.datasets[2].data,
            backgroundColor: Array(
              chartStatsData.departmentDistribution.labels.length
            ).fill("rgba(54, 162, 235, 0.8)"),
            borderColor: Array(
              chartStatsData.departmentDistribution.labels.length
            ).fill("rgba(54, 162, 235, 1)"),
            borderWidth: 1,
          },
          {
            label: "Admins",
            data: chartStatsData.departmentDistribution.datasets[1].data,
            backgroundColor: Array(
              chartStatsData.departmentDistribution.labels.length
            ).fill("rgba(255, 206, 86, 0.8)"),
            borderColor: Array(
              chartStatsData.departmentDistribution.labels.length
            ).fill("rgba(255, 206, 86, 1)"),
            borderWidth: 1,
          },
        ],
      }
    : null;

  // Line Chart - Department Growth Trend
  const lineChartData = chartStatsData
    ? {
        labels: chartStatsData.departmentDistribution.labels,
        datasets: [
          {
            label: "Total Employees",
            data: chartStatsData.departmentDistribution.datasets[0].data,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.4,
          },
        ],
      }
    : null;

  // Create admin-specific chart data
  const adminPieChartData = adminChartStatsData
    ? {
        labels: adminChartStatsData.departmentStats.labels.map(
          (label, index) => {
            const value =
              adminChartStatsData.departmentStats.datasets[0].data[index];
            const total =
              adminChartStatsData.departmentStats.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label} (${percentage}%)`;
          }
        ),
        datasets: [
          {
            data: adminChartStatsData.departmentStats.datasets[0].data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    : null;

  const adminBarChartData = adminChartStatsData
    ? {
        labels: adminChartStatsData.roleDistribution.labels,
        datasets: [
          {
            label: "Role Distribution",
            data: adminChartStatsData.roleDistribution.datasets[0].data,
            backgroundColor: [
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
            ],
            borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
            borderWidth: 1,
          },
        ],
      }
    : null;

  const adminLineChartData = adminChartStatsData
    ? {
        labels: adminChartStatsData.monthlyGrowth.labels,
        datasets: [
          {
            label: "Monthly Growth",
            data: adminChartStatsData.monthlyGrowth.datasets[0].data,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.4,
          },
        ],
      }
    : null;

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

  // Create admin-specific stat cards from admin chart stats
  const getAdminStatCards = () => {
    if (!adminChartStatsData) return [];

    // Extract data from admin chart stats
    const departmentSize =
      adminChartStatsData.departmentStats.datasets[0].data.reduce(
        (sum, val) => sum + val,
        0
      );
    const roleDistribution =
      adminChartStatsData.roleDistribution.datasets[0].data;
    const monthlyGrowth = adminChartStatsData.monthlyGrowth.datasets[0].data;

    // Calculate total growth
    const totalGrowth = monthlyGrowth.reduce((sum, val) => sum + val, 0);

    return [
      {
        name: "Department Size",
        value: departmentSize.toString(),
        subtext: "Total Employees",
        icon: FaUsers,
        href: "/employees",
        color: "blue" as const,
      },
      {
        name: "Administrative Staff",
        value: roleDistribution[0]?.toString() || "0",
        subtext: "Admin Users",
        icon: FaUserTie,
        href: "/employees",
        color: "green" as const,
      },
      {
        name: "Monthly Growth",
        value: totalGrowth.toString(),
        subtext: "New Employees",
        icon: FaUserPlus,
        href: "/employees/pending",
        color: "yellow" as const,
      },
      {
        name: "Active Staff",
        value: (
          departmentSize - (monthlyGrowth[monthlyGrowth.length - 1] || 0)
        ).toString(),
        subtext: "Currently Working",
        icon: FaUsers,
        href: "/employees",
        color: "blue" as const,
      },
    ];
  };

  // Render different charts based on permissions
  const renderPermissionBasedCharts = () => {
    // Check if user is an admin
    const isAdmin = user?.role === "ADMIN";

    // Admin view - prioritize this over superadmin view
    if (isAdmin) {
      // Use the admin chart data we created earlier
      if (adminChartStatsData) {
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
                {adminPieChartData && <PieChart data={adminPieChartData} />}
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
                {adminBarChartData && <BarChart data={adminBarChartData} />}
              </Suspense>
            </div>
            <div
              ref={lineChartRef}
              className="bg-white p-6 rounded-lg shadow-lg min-h-[400px] col-span-2"
            >
              <h2 className="text-lg font-semibold mb-4">Monthly Growth</h2>
              <Suspense fallback={<ChartLoading />}>
                {adminLineChartData && <LineChart data={adminLineChartData} />}
              </Suspense>
            </div>
          </>
        );
      }

      // Fallback if adminChartStats is not available
      return (
        <div className="col-span-2 row-span-2">
          <DepartmentStats />
        </div>
      );
    }

    // Superadmin view - only if not an admin
    if (hasPermission(Permission.VIEW_ALL_DEPARTMENTS) && !isAdmin) {
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
          {user?.role === UserRole.ADMIN && adminChartStatsData
            ? getAdminStatCards().map((stat, index) => (
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
              ))
            : getRoleStats(user?.role, dashboardStats).map((stat, index) => (
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
          ]) &&
            user?.role !== UserRole.ADMIN && (
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
