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
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            ...data,
            datasets: data.datasets.map((dataset) => ({
              ...dataset,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 8,
              pointBackgroundColor: "white",
              pointHoverBackgroundColor: dataset.borderColor,
              pointBorderWidth: 2,
              pointHoverBorderWidth: 3,
              tension: 0.4,
              fill: true,
            })),
          },
          options: {
            responsive: true,
            animation: {
              duration: 2000,
              easing: "easeInOutQuart",
              delay: (context) => {
                const delay = context.dataIndex * 100;
                return delay;
              },
            },
            transitions: {
              active: {
                animation: {
                  duration: 400,
                },
              },
            },
            interaction: {
              intersect: false,
              mode: "index",
            },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: {
                    size: 12,
                    weight: "bold",
                  },
                  usePointStyle: true,
                  pointStyle: "circle",
                },
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                cornerRadius: 8,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
                callbacks: {
                  label: (context) => {
                    return `${context.dataset.label}: ${context.formattedValue}`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(0, 0, 0, 0.1)",
                  drawTicks: false,
                },
                border: {
                  display: false,
                },
                ticks: {
                  font: {
                    size: 12,
                    weight: "bold",
                  },
                },
              },
              x: {
                grid: {
                  display: false,
                },
                border: {
                  display: false,
                },
                ticks: {
                  font: {
                    size: 12,
                    weight: "bold",
                  },
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
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.8,
        type: "spring",
        bounce: 0.4,
        delay: 0.2,
      }}
      className="w-full h-[300px] relative"
    >
      <canvas ref={chartRef} />
    </motion.div>
  );
};

export default LineChart;
