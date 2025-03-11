import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Chart from "chart.js/auto";

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
}

const LineChart = ({ data }: LineChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: data,
          options: {
            responsive: true,
            animation: {
              duration: 2000,
              easing: "easeInOutQuart",
            },
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                cornerRadius: 8,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[300px] relative"
    >
      <canvas ref={chartRef} />
    </motion.div>
  );
};

export default LineChart;
