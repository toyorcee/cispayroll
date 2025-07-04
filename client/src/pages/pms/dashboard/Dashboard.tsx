import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
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
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaBell,
  FaHistory,
} from "react-icons/fa";
import { getUnreadNotificationCount } from "../../../services/notificationService";
import {
  adminPayrollService,
  AdminPayrollProcessingStats,
} from "../../../services/adminPayrollService";
import userService, { UserDashboardStats } from "../../../services/userService";
import { auditService } from "../../../services/auditService";
import { getProfileImageUrl } from "../../../utils/imageUtils";
import PayrollSummaryService from "../../../services/payrollSummaryService";
import { payrollService } from "../../../services/payrollService";

// Lazy load chart components
const LineChart = lazy(() => import("../../../components/charts/LineChart"));
const BarChart = lazy(() => import("../../../components/charts/BarChart"));
const PieChart = lazy(() => import("../../../components/charts/PieChart"));
const PayrollAnalyticsChart = lazy(
  () => import("../../../components/charts/PayrollAnalyticsChart")
);

const LazyRecentActivities = lazy(() =>
  import("../../../components/dashboard/RecentActivities").then((module) => ({
    default: module.RecentActivities,
  }))
);

// Loading component for charts
const ChartLoading = () => (
  <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="animate-pulse text-gray-400">Loading chart...</div>
  </div>
);

// Loading component for RecentActivities
const RecentActivitiesLoading = () => (
  <div className="bg-white p-6 rounded-lg shadow-lg animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="space-y-4">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Add clock component
const Clock = ({ textClassName }: { textClassName?: string }) => {
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
    <div
      className={`flex items-center space-x-4 text-green-600 text-sm font-bold ${
        textClassName || ""
      }`}
    >
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

function getDisplayRole(role?: string) {
  if (!role) return "";
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Administrator",
    ADMIN: "Administrator",
    USER: "User",
  };
  return (
    map[role] || role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  );
}

// Helper to format runtime in seconds
function formatRuntime(ms?: number) {
  if (!ms || ms === 0) return "0s";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function Dashboard() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<
    DashboardStats | UserDashboardStats | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [processingStats, setProcessingStats] =
    useState<AdminPayrollProcessingStats | null>(null);
  const [userRecentActivities, setUserRecentActivities] = useState<number>(0);
  const [recentActivitiesCount, setRecentActivitiesCount] = useState(0);
  const [avgProcessingTime, setAvgProcessingTime] = useState<number>(0);
  const [lastMonthStats, setLastMonthStats] = useState({
    approved: 0,
    paid: 0,
    completed: 0,
  });
  const [thisMonthStats, setThisMonthStats] = useState({
    approved: 0,
    paid: 0,
    completed: 0,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const lineChartData = chartStatsData
  //   ? {
  //       labels: chartStatsData.departmentDistribution.labels,
  //       datasets: [
  //         {
  //           label: "Total Employees",
  //           data: chartStatsData.departmentDistribution.datasets[0].data,
  //           borderColor: "rgba(75, 192, 192, 1)",
  //           backgroundColor: "rgba(75, 192, 192, 0.2)",
  //           tension: 0.4,
  //         },
  //       ],
  //     }
  //   : null;

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

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Use different services based on user role
      let stats;

      if (user?.role === UserRole.USER) {
        // For regular users, just get the dashboard stats
        try {
          stats = await userService.getUserDashboardStats();
          // Set recent activities from the dashboard stats
          setUserRecentActivities(stats.recentActivities || 0);
        } catch (err) {
          console.error("Error fetching user dashboard stats:", err);
          // Fallback to employee service if user service fails
          stats = await employeeService.getDashboardStats();
          setUserRecentActivities(0);
        }
      } else if (user?.role === UserRole.ADMIN) {
        // For admins
        stats = await employeeService.getDashboardStats();
        try {
          const adminStats =
            await adminPayrollService.getProcessingStatistics();
          setProcessingStats(adminStats);
        } catch (err) {
          console.error("Error fetching admin processing stats:", err);
          setProcessingStats(null);
        }
      } else {
        // For super admins
        stats = await employeeService.getDashboardStats();
        try {
          const adminStats =
            await adminPayrollService.getProcessingStatistics();
          setProcessingStats(adminStats);
        } catch (err) {
          console.error("Error fetching admin processing stats:", err);
          setProcessingStats(null);
        }
      }

      const unreadCount = await getUnreadNotificationCount();

      setDashboardStats(stats);
      setUnreadNotifications(unreadCount);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Fetch payroll summary processing statistics for SUPER_ADMIN
    if (user?.role === UserRole.SUPER_ADMIN) {
      PayrollSummaryService.getProcessingStatistics(
        user?.role,
        user?.permissions
      )
        .then((stats) => {
          setAvgProcessingTime(stats.avgProcessingTime || 0);
          console.log(
            "[Dashboard] PayrollSummary avgProcessingTime:",
            stats.avgProcessingTime
          );
        })
        .catch((err) => {
          console.error(
            "[Dashboard] Error fetching PayrollSummary avgProcessingTime:",
            err
          );
        });
      payrollService
        .getProcessingStatistics()
        .then((stats) => {
          setLastMonthStats(
            stats.lastMonth || { approved: 0, paid: 0, completed: 0 }
          );
          setThisMonthStats(
            stats.thisMonth || { approved: 0, paid: 0, completed: 0 }
          );
        })
        .catch((err) => {
          console.error(
            "[Dashboard] Error fetching lastMonth/thisMonth stats:",
            err
          );
        });
    }
  }, [user?.role, user?.permissions]);

  useEffect(() => {
    auditService.getRecentActivities(1000).then((activities) => {
      setRecentActivitiesCount(activities.length);
    });
  }, []);

  // Create admin-specific stat cards from admin chart stats
  const getAdminStatCards = () => {
    if (!adminChartStatsData) return [];

    const departmentSize =
      adminChartStatsData.departmentStats.datasets[0].data.reduce(
        (sum, val) => sum + val,
        0
      );
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
        name: "Recent Activities",
        value:
          user?.role === UserRole.USER
            ? userRecentActivities.toString()
            : processingStats?.recentActivityCount?.toString() || "0",
        subtext: "In the last 24 hours",
        icon: FaHistory,
        href: "/audit-logs",
        color: "green" as const,
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

  // Helper function to get recent activities count based on user role
  const getRecentActivitiesCount = () => {
    if (user?.role === UserRole.USER) {
      return userRecentActivities;
    } else {
      return processingStats?.recentActivityCount || 0;
    }
  };

  // Render different charts based on permissions
  const renderPermissionBasedCharts = () => {
    const isAdmin = user?.role === UserRole.ADMIN;

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
        <div className="bg-white p-6 rounded-lg shadow-lg min-h-[400px] col-span-2">
          <h2 className="text-lg font-semibold mb-6">Department Overview</h2>
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-600 mb-6 text-center max-w-2xl">
              Welcome to your department dashboard. Here you can see information
              about your team and department.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-lg flex flex-col">
                <h3 className="font-medium text-blue-800 text-sm mb-2">
                  Department
                </h3>
                <p className="text-xl font-bold text-blue-600 truncate">
                  {dashboardStats?.departmentName || "Your Department"}
                </p>
                <p className="text-blue-500 text-sm mt-1">
                  Finance and Accounting
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg flex flex-col">
                <h3 className="font-medium text-green-800 text-sm mb-2">
                  Team Size
                </h3>
                <p className="text-xl font-bold text-green-600">
                  {dashboardStats?.teamMembers || 0}
                </p>
                <p className="text-green-500 text-sm mt-1">
                  In Your Department
                </p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg flex flex-col">
                <h3 className="font-medium text-yellow-800 text-sm mb-2">
                  Active Colleagues
                </h3>
                <p className="text-xl font-bold text-yellow-600">
                  {dashboardStats?.activeColleagues || 0}
                </p>
                <p className="text-yellow-500 text-sm mt-1">
                  Currently Working
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg flex flex-col">
                <h3 className="font-medium text-purple-800 text-sm mb-2">
                  Recent Activities
                </h3>
                <p className="text-xl font-bold text-purple-600">
                  {getRecentActivitiesCount()}
                </p>
                <p className="text-purple-500 text-sm mt-1">
                  In the last 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
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
        className="space-y-8 w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-white min-h-screen p-6"
      >
        {/* Gradient Welcome Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8 rounded-2xl shadow-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 p-8 flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <div className="flex items-center gap-5">
            <img
              src={getProfileImageUrl(user || {})}
              alt={user ? `${user.firstName} ${user.lastName}` : "Profile"}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
            <div>
              <h4 className="text-3xl font-bold text-white mb-1">
                Welcome back, {user?.firstName}!
              </h4>
              <p className="text-lg text-emerald-100">
                {getRoleSpecificWelcomeMessage(user?.role)}
              </p>
              <p className="text-white text-base font-semibold mt-1 opacity-90">
                {getDisplayRole(user?.role)}
              </p>
              <div className="mt-2 sm:hidden">
                <Clock textClassName="text-white" />
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <Clock textClassName="text-white" />
          </div>
        </motion.div>

        {/* Stats Grid with Gradient Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array(4)
                .fill(0)
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full"
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
                  className="w-full"
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
            : user?.role === UserRole.SUPER_ADMIN
            ? [
                ...getRoleStats(user?.role ?? UserRole.USER, dashboardStats)
                  .map((stat) =>
                    stat.name === "Recent Activities"
                      ? { ...stat, value: recentActivitiesCount.toString() }
                      : stat
                  )
                  .map((stat, index) => (
                    <motion.div
                      key={stat.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full"
                    >
                      <StatCard
                        {...stat}
                        icon={stat.icon}
                        subtext={stat.subtext}
                        href={stat.href}
                        color={stat.color}
                      />
                    </motion.div>
                  )),
                <motion.div
                  key="System Performance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
                >
                  <StatCard
                    name="System Performance"
                    value={formatRuntime(avgProcessingTime)}
                    subtext="Avg. Processing Time"
                    icon={FaClock}
                    href="#"
                    color="purple"
                    customGradient="from-pink-100 via-purple-100 to-pink-200"
                  />
                </motion.div>,
                <motion.div
                  key="LastMonthStats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full"
                >
                  <StatCard
                    name="Last Month"
                    value={
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-600">
                          Approved:{" "}
                          <span className="font-bold text-green-600">
                            {lastMonthStats.approved}
                          </span>
                        </span>
                        <span className="text-xs text-gray-600">
                          Paid:{" "}
                          <span className="font-bold text-blue-600">
                            {lastMonthStats.paid}
                          </span>
                        </span>
                        <span className="text-xs text-gray-600">
                          Completed:{" "}
                          <span className="font-bold text-purple-600">
                            {lastMonthStats.completed}
                          </span>
                        </span>
                      </div>
                    }
                    subtext="Approved, Paid, Completed"
                    icon={FaCalendarAlt}
                    href="#"
                    color="blue"
                    customGradient="from-blue-100 via-green-100 to-blue-200"
                  />
                </motion.div>,
                <motion.div
                  key="ThisMonthStats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full"
                >
                  <StatCard
                    name="This Month"
                    value={
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-600">
                          Approved:{" "}
                          <span className="font-bold text-green-600">
                            {thisMonthStats.approved}
                          </span>
                        </span>
                        <span className="text-xs text-gray-600">
                          Paid:{" "}
                          <span className="font-bold text-blue-600">
                            {thisMonthStats.paid}
                          </span>
                        </span>
                        <span className="text-xs text-gray-600">
                          Completed:{" "}
                          <span className="font-bold text-purple-600">
                            {thisMonthStats.completed}
                          </span>
                        </span>
                      </div>
                    }
                    subtext="Approved, Paid, Completed"
                    icon={FaCalendarAlt}
                    href="#"
                    color="purple"
                    customGradient="from-purple-100 via-pink-100 to-pink-200"
                  />
                </motion.div>,
              ]
            : getRoleStats(user?.role ?? UserRole.USER, dashboardStats)
                .map((stat) =>
                  stat.name === "Recent Activities"
                    ? { ...stat, value: recentActivitiesCount.toString() }
                    : stat
                )
                .map((stat, index) => (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full"
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

        {/* System Performance Stat Card */}
        {/* Removed the separate grid for System Performance */}

        {/* Charts Section */}
        <div className="min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Suspense fallback={<ChartLoading />}>
              {renderPermissionBasedCharts()}
            </Suspense>
          </div>

          {/* Payroll Analytics Chart */}
          {hasAnyPermission([
            Permission.VIEW_PAYROLL_STATS,
            Permission.VIEW_ALL_DEPARTMENTS,
          ]) && (
            <div className="mb-6">
              <Suspense fallback={<ChartLoading />}>
                <PayrollAnalyticsChart height="500px" />
              </Suspense>
            </div>
          )}
        </div>

        {/* Recent Activities Section - At the end */}
        <div className="mb-6">
          <Suspense fallback={<RecentActivitiesLoading />}>
            <div className="rounded-2xl shadow-xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-6">
              <LazyRecentActivities />
            </div>
          </Suspense>
        </div>
      </motion.div>
    </GlobalErrorBoundary>
  );
}
