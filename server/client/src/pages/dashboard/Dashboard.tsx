import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";
import { getRoleSpecificWelcomeMessage } from "../../utils/dashboardUtils";
import { GlobalErrorBoundary } from "../../components/error/GlobalErrorBoundary";
import {
  getRoleStats,
  getRoleActivities,
  payrollData,
  departmentData,
  departmentPieData,
} from "../../data/dashboardData";
import StatCard from "../../components/dashboard/StatCard";
import QuickActions from "../../components/dashboard/QuickActions";
import ActivityItem from "../../components/dashboard/ActivityItem";
import LineChart from "../../components/charts/LineChart";
import BarChart from "../../components/charts/BarChart";
import PieChart from "../../components/charts/PieChart";
import CreateAdminModal from "../../components/modals/CreateAdminModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState({
    payroll: payrollData,
    department: departmentData,
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Add refs for each chart section
  const payrollRef = useRef(null);
  const distributionRef = useRef(null);
  const pieChartRef = useRef(null);

  const isPayrollInView = useInView(payrollRef, { amount: 0.5 });
  const isDistributionInView = useInView(distributionRef, { amount: 0.5 });
  const isPieChartInView = useInView(pieChartRef, { amount: 0.5 });

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
          className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500"
        >
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {getRoleSpecificWelcomeMessage(user?.role)}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <QuickActions
          role={user?.role}
          permissions={user?.permissions}
          onAddAdmin={() => setIsAdminModalOpen(true)}
        />

        {/* Add the modal */}
        <CreateAdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          departments={departmentData.labels}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        {(user?.role === UserRole.SUPER_ADMIN ||
          user?.role === UserRole.ADMIN) && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <motion.div
                ref={payrollRef}
                initial={{ opacity: 0, x: -50 }}
                animate={
                  isPayrollInView
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -50 }
                }
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.4,
                  delay: 0.1,
                }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4">
                  Monthly Payroll Trends
                </h2>
                <LineChart data={chartData.payroll} />
              </motion.div>

              <motion.div
                ref={distributionRef}
                initial={{ opacity: 0, x: 50 }}
                animate={
                  isDistributionInView
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: 50 }
                }
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.4,
                  delay: 0.2,
                }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-4">
                  Employee Distribution
                </h2>
                <BarChart data={chartData.department} />
              </motion.div>
            </div>

            <motion.div
              ref={pieChartRef}
              initial={{ opacity: 0, y: 50 }}
              animate={
                isPieChartInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{
                duration: 0.8,
                type: "spring",
                bounce: 0.4,
                delay: 0.3,
              }}
              className="bg-white p-6 rounded-lg shadow-lg mx-auto w-full max-w-4xl"
            >
              <h2 className="text-lg font-semibold mb-6 text-center">
                Department Distribution Overview
              </h2>
              <PieChart data={departmentPieData} />
            </motion.div>
          </>
        )}

        {/* Recent Activity */}
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
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  index={index}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </GlobalErrorBoundary>
  );
}
