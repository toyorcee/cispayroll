import { useEffect, useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";
import { DashboardSkeleton } from "../../components/skeletons/DashboardSkeleton";
import { getRoleSpecificWelcomeMessage } from "../../utils/dashboardUtils";
import { GlobalErrorBoundary } from "../../components/error/GlobalErrorBoundary";
import {
  getRoleStats,
  getRoleActivities,
  payrollData,
  departmentData,
} from "../../data/dashboardData";

// Correct way to implement prioritized lazy loading
const StatCardLazy = lazy(() => import("../../components/dashboard/StatCard"));
const QuickActionsLazy = lazy(
  () => import("../../components/dashboard/QuickActions")
);

// For medium priority components, wrap the import in Promise.resolve
const ActivityItemLazy = lazy(
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(import("../../components/dashboard/ActivityItem") as any);
      }, 100);
    })
);

// For lower priority components, wrap the import in Promise.resolve
const LineChartLazy = lazy(
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(import("../../components/charts/LineChart") as any);
      }, 300);
    })
);

const BarChartLazy = lazy(
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(import("../../components/charts/BarChart") as any);
      }, 300);
    })
);

export default function Dashboard() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState({
    payroll: payrollData,
    department: departmentData,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const fetchedStats = getRoleStats(user?.role);
        const fetchedActivities = getRoleActivities(user?.role);
        setStats(fetchedStats);
        setActivities(fetchedActivities);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      }
    };

    fetchDashboardData();
  }, [user?.role]);

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
      <Suspense fallback={<DashboardSkeleton />}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Welcome Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500"
          >
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {getRoleSpecificWelcomeMessage(user?.role)}
            </p>
          </motion.div>

          {/* Quick Actions - High Priority */}
          <Suspense
            fallback={
              <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
            }
          >
            <QuickActionsLazy
              role={user?.role}
              permissions={user?.permissions}
            />
          </Suspense>

          {/* Stats Grid - High Priority */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Suspense
                key={stat.name}
                fallback={
                  <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatCardLazy {...stat} />
                </motion.div>
              </Suspense>
            ))}
          </div>

          {/* Charts Section - Lower Priority */}
          {(user?.role === UserRole.SUPER_ADMIN ||
            user?.role === UserRole.ADMIN) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense
                fallback={
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                }
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-lg shadow-lg"
                >
                  <h2 className="text-lg font-semibold mb-4">Payroll Trends</h2>
                  <LineChartLazy data={chartData.payroll} />
                </motion.div>
              </Suspense>

              <Suspense
                fallback={
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                }
              >
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-lg shadow-lg"
                >
                  <h2 className="text-lg font-semibold mb-4">
                    Department Statistics
                  </h2>
                  <BarChartLazy data={chartData.department} />
                </motion.div>
              </Suspense>
            </div>
          )}

          {/* Recent Activity - Medium Priority */}
          <Suspense
            fallback={
              <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <div className="mt-4 space-y-4">
                  {activities.map((activity, index) => (
                    <ActivityItemLazy
                      key={activity.id}
                      activity={activity}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </Suspense>
        </motion.div>
      </Suspense>
    </GlobalErrorBoundary>
  );
}
