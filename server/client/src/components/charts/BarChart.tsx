import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Chart from "chart.js/auto";
import { ChartType, ScriptableContext } from "chart.js";
import { useInView } from "framer-motion";

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
}

const BarChart = ({ data }: BarChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.5 });
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current && isInView) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            ...data,
            datasets: data.datasets.map((dataset) => ({
              ...dataset,
              borderWidth: 2,
              borderRadius: 8,
              hoverBorderWidth: 3,
              hoverBorderColor: dataset.borderColor.map((color) =>
                color.replace("rgb", "rgba").replace(")", ", 1)")
              ),
              hoverBackgroundColor: dataset.backgroundColor.map((color) =>
                color.replace("0.6", "0.8")
              ),
            })),
          },
          options: {
            responsive: true,
            animation: {
              duration: 2000,
              easing: "easeOutElastic",
              delay: (context: ScriptableContext<"bar">) => {
                return context.dataIndex * 300;
              },
            },
            transitions: {
              active: {
                animation: {
                  duration: 400,
                },
              },
            },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: {
                    size: 12,
                    weight: "bold",
                  },
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
                    return `${context.dataset.label}: ${context.formattedValue} employees`;
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
  }, [data, isInView]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 100 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
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

export default BarChart;
