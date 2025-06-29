import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  FaChartLine,
  FaUsers,
  FaLayerGroup,
  FaMoneyBillWave,
  FaPiggyBank,
  FaReceipt,
  FaClock,
} from "react-icons/fa";
import PayrollSummaryService, {
  PayrollSummaryAnalytics,
} from "../../services/payrollSummaryService";
import { formatCurrency } from "../../utils/formatters";
import { useAuth } from "../../context/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PayrollAnalyticsChartProps {
  className?: string;
  height?: string;
}

interface ChartMetric {
  key: keyof PayrollSummaryAnalytics;
  label: string;
  color: string;
  backgroundColor: string;
  format: (value: number) => string;
  visible: boolean;
  icon: React.ReactNode;
}

const PayrollAnalyticsChart: React.FC<PayrollAnalyticsChartProps> = ({
  className = "",
  height = "400px",
}) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<PayrollSummaryAnalytics[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMetric, _setSelectedMetric] =
    useState<string>("totalProcessed");
  const [showDepartmentView, setShowDepartmentView] = useState(false);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(analyticsData.map((item) => item.year))
    ).sort((a, b) => b - a);

    const currentYear = new Date().getFullYear();
    const allYears = new Set([
      ...years,
      currentYear,
      currentYear + 1,
      currentYear + 2,
    ]);

    return Array.from(allYears).sort((a, b) => b - a);
  }, [analyticsData]);

  const metrics: ChartMetric[] = [
    {
      key: "totalProcessed",
      label: "Employees Processed",
      color: "#3B82F6",
      backgroundColor: "#EFF6FF",
      format: (value: number) => `${value.toLocaleString()} employees`,
      visible: true,
      icon: <FaUsers />,
    },
    {
      key: "totalBatches",
      label: "Payroll Batches",
      color: "#10B981",
      backgroundColor: "#ECFDF5",
      format: (value: number) => `${value} batches`,
      visible: true,
      icon: <FaLayerGroup />,
    },
    {
      key: "totalNetPay",
      label: "Total Net Pay",
      color: "#F59E0B",
      backgroundColor: "#FFFBEB",
      format: (value: number) => formatCurrency(value),
      visible: true,
      icon: <FaMoneyBillWave />,
    },
    {
      key: "totalGrossPay",
      label: "Total Gross Pay",
      color: "#EF4444",
      backgroundColor: "#FEF2F2",
      format: (value: number) => formatCurrency(value),
      visible: true,
      icon: <FaPiggyBank />,
    },
    {
      key: "totalDeductions",
      label: "Total Deductions",
      color: "#8B5CF6",
      backgroundColor: "#F5F3FF",
      format: (value: number) => formatCurrency(value),
      visible: true,
      icon: <FaReceipt />,
    },
    {
      key: "avgProcessingTime",
      label: "Avg Processing Time",
      color: "#EC4899",
      backgroundColor: "#FDF2F8",
      format: (value: number) => `${(value / 1000).toFixed(1)}s`,
      visible: true,
      icon: <FaClock />,
    },
  ];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await PayrollSummaryService.getSummaryAnalytics(
          {
            year: selectedYear,
          },
          user?.role,
          user?.permissions
        );
        setAnalyticsData(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch analytics data");
        console.error("Error fetching payroll analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedYear, user?.role, user?.permissions]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!analyticsData.length) return null;

    // Group data by month and department
    const monthlyData: Record<number, PayrollSummaryAnalytics[]> = {};

    analyticsData.forEach((item) => {
      if (!monthlyData[item.month]) {
        monthlyData[item.month] = [];
      }
      monthlyData[item.month].push(item);
    });

    // Create datasets for each visible metric
    const datasets = metrics
      .filter((metric) => metric.visible)
      .map((metric) => {
        const data = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const monthData = monthlyData[month] || [];

          // Sum up the metric across all departments for this month
          return monthData.reduce((sum, item) => {
            const value = item[metric.key];
            return sum + (typeof value === "number" ? value : 0);
          }, 0);
        });

        return {
          label: metric.label,
          data,
          borderColor: metric.color,
          backgroundColor: metric.backgroundColor,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: metric.color,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        };
      });

    return {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      datasets,
    };
  }, [analyticsData, metrics]);

  // Create department-specific datasets if multiple departments exist
  const departmentChartData = useMemo(() => {
    if (!analyticsData.length) return null;

    // Get unique departments
    const departments = Array.from(
      new Set(analyticsData.map((item) => item.departmentName).filter(Boolean))
    );

    if (departments.length <= 1) return null;

    // Group data by department and month
    const departmentData: Record<
      string,
      Record<number, PayrollSummaryAnalytics[]>
    > = {};

    analyticsData.forEach((item) => {
      const deptName = item.departmentName || "Unknown";
      if (!departmentData[deptName]) {
        departmentData[deptName] = {};
      }
      if (!departmentData[deptName][item.month]) {
        departmentData[deptName][item.month] = [];
      }
      departmentData[deptName][item.month].push(item);
    });

    // Create datasets for each department (focusing on totalProcessed)
    const departmentColors = [
      "rgb(59, 130, 246)", // Blue
      "rgb(16, 185, 129)", // Green
      "rgb(245, 158, 11)", // Yellow
      "rgb(239, 68, 68)", // Red
      "rgb(139, 92, 246)", // Purple
      "rgb(236, 72, 153)", // Pink
    ];

    const datasets = departments.map((dept, index) => {
      const data = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = departmentData[dept as string]?.[month] || [];

        return monthData.reduce(
          (sum: number, item: PayrollSummaryAnalytics) => {
            return sum + (item.totalProcessed || 0);
          },
          0
        );
      });

      return {
        label: `${dept} - Employees Processed`,
        data,
        borderColor: departmentColors[index % departmentColors.length],
        backgroundColor: departmentColors[index % departmentColors.length]
          .replace("rgb", "rgba")
          .replace(")", ", 0.1)"),
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: departmentColors[index % departmentColors.length],
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1,
      };
    });

    return {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      datasets,
    };
  }, [analyticsData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: "bold" as const,
          },
        },
      },
      title: {
        display: true,
        text: `Payroll Analytics - ${selectedYear}`,
        font: {
          size: 18,
          weight: "bold" as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any[]) => {
            return `Month: ${context[0].label}`;
          },
          label: (context: any) => {
            const metric = metrics.find(
              (m) => m.label === context.dataset.label
            );
            return `${context.dataset.label}: ${
              metric?.format(context.parsed.y) || context.parsed.y
            }`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: any) => {
            // Format based on the selected metric
            const metric = metrics.find((m) => m.label === selectedMetric);
            if (
              metric?.key === "totalNetPay" ||
              metric?.key === "totalGrossPay" ||
              metric?.key === "totalDeductions"
            ) {
              return formatCurrency(value);
            }
            return value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-64 text-red-600">
          <div className="text-center">
            <FaChartLine className="text-4xl mb-4 mx-auto" />
            <p className="text-lg font-semibold">Failed to load analytics</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaChartLine className="text-2xl" />
            <div>
              <h3 className="text-xl font-bold">Payroll Analytics Dashboard</h3>
              <p className="text-blue-100 text-sm">
                Comprehensive overview of payroll processing metrics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {availableYears.map((year) => {
                const currentYear = new Date().getFullYear();
                const isFuture = year > currentYear;
                const hasData = analyticsData.some(
                  (item) => item.year === year
                );

                return (
                  <option key={year} value={year} className="text-gray-800">
                    {year} {isFuture ? "(Future)" : hasData ? "" : "(No Data)"}
                  </option>
                );
              })}
            </select>

            {/* Department View Toggle */}
            {departmentChartData && (
              <button
                onClick={() => setShowDepartmentView(!showDepartmentView)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showDepartmentView
                    ? "bg-white/30 border-white/50 text-white"
                    : "bg-white/10 border-white/30 text-white/80 hover:bg-white/20"
                }`}
              >
                {showDepartmentView ? "Main View" : "Department View"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-6">
        {(showDepartmentView ? departmentChartData : chartData) ? (
          <div style={{ height }}>
            <Line
              data={showDepartmentView ? departmentChartData! : chartData!}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: showDepartmentView
                      ? `Department Payroll Analytics - ${selectedYear}`
                      : `Payroll Analytics - ${selectedYear}`,
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <FaChartLine className="text-4xl mb-4 mx-auto" />
              <p className="text-lg font-semibold">No data available</p>
              <p className="text-sm">
                No payroll data found for the selected year
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Summary */}
      {analyticsData.length > 0 && (
        <div className="bg-gray-50 p-8 border-t">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Year Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 auto-rows-fr">
            {metrics.map((metric) => {
              const totalValue = analyticsData.reduce((sum, item) => {
                const value = item[metric.key];
                return sum + (typeof value === "number" ? value : 0);
              }, 0);

              return (
                <motion.div
                  key={metric.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  }}
                  className="rounded-2xl shadow-md p-6 bg-white border border-gray-100 hover:shadow-lg transition-all group cursor-pointer flex flex-col min-w-0"
                  style={{
                    background: `linear-gradient(120deg, ${metric.backgroundColor} 60%, #fff 100%)`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="inline-flex items-center justify-center rounded-full shadow-sm"
                      style={{
                        background: metric.color + "22",
                        color: metric.color,
                        width: 40,
                        height: 40,
                        fontSize: 22,
                        fontWeight: 700,
                        boxShadow: `0 2px 8px ${metric.color}22`,
                      }}
                    >
                      {metric.icon}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: metric.color }}
                    ></span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 group-hover:text-gray-700 mb-1 whitespace-nowrap">
                    {metric.label}
                  </div>
                  <div className="text-xl md:text-2xl font-extrabold text-gray-900 group-hover:text-primary-700 break-words min-w-0">
                    {metric.format(totalValue)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PayrollAnalyticsChart;
