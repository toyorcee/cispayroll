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
import {
  FaUsers,
  FaUserTie,
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaBell,
} from "react-icons/fa";
import { getUnreadNotificationCount } from "../../../services/notificationService";

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

// Add clock component
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Africa/Lagos",
  };
  const timeString = time.toLocaleTimeString("en-US", options);
  const dateString = time.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center space-x-4 text-green-600 text-sm font-bold">
      <FaCalendarAlt className="text-lg" />
      <div>{dateString}</div>
      <FaClock className="text-lg" />
      <div>{timeString}</div>
    </div>
  );
};

// Add loading state for stat cards
const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-gray-200 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="p-3 rounded-full bg-gray-100">
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<
    DashboardStats | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  // Only fetch the appropriate chart stats based on user role
  const { data: chartStatsData } =
    user?.role === UserRole.SUPER_ADMIN
      ? departmentService.useGetDepartmentChartStats()
      : { data: null };

  const { data: adminChartStatsData } =
    user?.role === UserRole.ADMIN
      ? departmentService.useGetAdminDepartmentChartStats()
      : { data: null };

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
        setIsLoading(true);
        const [stats, unreadCount] = await Promise.all([
          employeeService.getDashboardStats(),
          getUnreadNotificationCount(),
        ]);
        setDashboardStats(stats);
        setUnreadNotifications(unreadCount);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  // Create admin-specific stat cards from admin chart stats
  const getAdminStatCards = () => {
    if (!adminChartStatsData) return [];

    const departmentSize =
      adminChartStatsData.departmentStats.datasets[0].data.reduce(
        (sum, val) => sum + val,
        0
      );
    const roleDistribution =
      adminChartStatsData.roleDistribution.datasets[0].data;
    const totalGrowth =
      adminChartStatsData.monthlyGrowth.datasets[0].data.reduce(
        (sum, val) => sum + val,
        0
      );

    return [
      {
        name: "Total Employees",
        value: departmentSize.toString(),
        subtext: "Including Admins and Staff",
        icon: FaUsers,
        href: "/employees",
        color: "blue" as const,
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
        name: "Unread Notifications",
        value: unreadNotifications.toString(),
        subtext: "Notifications",
        icon: FaBell,
        href: "/notifications",
        color: "red" as const,
      },
    ];
  };

  // Render different charts based on permissions
  const renderPermissionBasedCharts = () => {
    const isAdmin = user?.role === "ADMIN";

    if (isAdmin) {
      if (adminChartStatsData) {
        return (
          <>
            <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
              <h2 className="text-lg font-semibold mb-4">
                Department Size Distribution
              </h2>
              <Suspense fallback={<ChartLoading />}>
                {adminPieChartData && <PieChart data={adminPieChartData} />}
              </Suspense>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
              <h2 className="text-lg font-semibold mb-4">
                Employee Role Distribution
              </h2>
              <Suspense fallback={<ChartLoading />}>
                {adminBarChartData && <BarChart data={adminBarChartData} />}
              </Suspense>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px] col-span-2">
              <h2 className="text-lg font-semibold mb-4">Monthly Growth</h2>
              <Suspense fallback={<ChartLoading />}>
                {adminLineChartData && <LineChart data={adminLineChartData} />}
              </Suspense>
            </div>
          </>
        );
      }

      return (
        <div className="col-span-2 row-span-2">
          <DepartmentStats />
        </div>
      );
    }

    if (hasPermission(Permission.VIEW_ALL_DEPARTMENTS) && !isAdmin) {
      return (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Department Size Distribution
            </h2>
            <Suspense fallback={<ChartLoading />}>
              {pieChartData && <PieChart data={pieChartData} />}
            </Suspense>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Employee Role Distribution
            </h2>
            <Suspense fallback={<ChartLoading />}>
              {barChartData && <BarChart data={barChartData} />}
            </Suspense>
          </div>
        </>
      );
    }

    if (user?.role === UserRole.USER) {
      return (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Department Size Distribution
            </h2>
            <Suspense fallback={<ChartLoading />}>
              {pieChartData && <PieChart data={pieChartData} />}
            </Suspense>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Employee Role Distribution
            </h2>
            <Suspense fallback={<ChartLoading />}>
              {barChartData && <BarChart data={barChartData} />}
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
  <Suspense fallback={<ChartLoading />}>
    {renderPermissionBasedCharts()}
  </Suspense>;

  return (
    <GlobalErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-white min-h-screen p-6"
      >
        {/* Welcome Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
        >
          <div>
            <h4 className="text-2xl font-semibold text-gray-800">
              Welcome back, {user?.firstName}!
            </h4>
            <p className="mt-1 text-sm text-gray-600">
              {getRoleSpecificWelcomeMessage(user?.role)}
            </p>
          </div>
          <Clock />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? // Show loading skeletons while data is loading
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StatCardSkeleton />
                  </motion.div>
                ))
            : user?.role === UserRole.ADMIN && adminChartStatsData
            ? // Admin stats
              getAdminStatCards().map((stat, index) => (
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
            : // Other roles stats
              getRoleStats(user?.role, dashboardStats).map((stat, index) => (
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
        <div className="min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Suspense fallback={<ChartLoading />}>
              {renderPermissionBasedCharts()}
            </Suspense>
          </div>

          {/* Department Overview Line Chart - Show for users with department view permission */}
          {hasAnyPermission([
            Permission.VIEW_ALL_DEPARTMENTS,
            Permission.MANAGE_DEPARTMENT_USERS,
          ]) &&
            user?.role !== UserRole.ADMIN && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px] mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Department Overview
                </h2>
                <Suspense fallback={<ChartLoading />}>
                  {lineChartData && <LineChart data={lineChartData} />}
                </Suspense>
              </div>
            )}
        </div>
      </motion.div>
    </GlobalErrorBoundary>
  );
}
