import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Chart from "chart.js/auto";
import { ChartData, ChartDataset, Color } from "chart.js";

interface PieChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

interface PieChartData {
  labels: string[];
  datasets: PieChartDataset[];
}

interface PieChartProps {
  data: PieChartData;
}

const PieChart = ({ data }: PieChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef(null);
  const chartInstance = useRef<Chart | null>(null);
  const isInView = useInView(containerRef, { amount: 0.5 });

  const chartColors = [
    "rgba(59, 130, 246, 0.8)", // Blue
    "rgba(16, 185, 129, 0.8)", // Green
    "rgba(245, 158, 11, 0.8)", // Yellow
    "rgba(239, 68, 68, 0.8)", // Red
    "rgba(139, 92, 246, 0.8)", // Purple
    "rgba(14, 165, 233, 0.8)", // Sky
    "rgba(236, 72, 153, 0.8)", // Pink
  ] as const;

  useEffect(() => {
    if (chartRef.current && isInView) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "pie",
          data: {
            ...data,
            datasets: data.datasets.map((dataset) => ({
              ...dataset,
              borderWidth: 2,
              hoverBorderWidth: 3,
              hoverOffset: 15,
              offset: 5,
              borderColor: "white",
              backgroundColor: chartColors,
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: 20,
            },
            animation: {
              animateScale: true,
              animateRotate: true,
              duration: 2000,
              easing: "easeInOutQuart",
            },
            plugins: {
              legend: {
                position: "right",
                labels: {
                  padding: 20,
                  font: {
                    size: 13,
                    weight: "bold",
                  },
                  generateLabels: (chart) => {
                    const datasets = chart.data.datasets as ChartDataset<
                      "pie",
                      number[]
                    >[];
                    if (!datasets || datasets.length === 0) return [];

                    const total = datasets[0].data.reduce((a, b) => a + b, 0);
                    const labels = chart.data.labels;
                    if (!labels) return [];

                    return labels.map((label, i) => {
                      const value = datasets[0].data[i];
                      const percentage = ((value / total) * 100).toFixed(1);
                      return {
                        text: `${label} (${percentage}%)`,
                        fillStyle: chartColors[i] as string,
                        strokeStyle: "white",
                        lineWidth: 2,
                        hidden: false,
                        index: i,
                      };
                    });
                  },
                },
                onClick: (e, legendItem) => {
                  if (
                    chartInstance.current &&
                    typeof legendItem.index === "number"
                  ) {
                    chartInstance.current.toggleDataVisibility(
                      legendItem.index
                    );
                    chartInstance.current.update();
                  }
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
                    const dataset = context.dataset as ChartDataset<
                      "pie",
                      number[]
                    >;
                    const total = dataset.data.reduce((a, b) => a + b, 0);
                    const value = context.parsed as number;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return ` ${context.label}: ${context.formattedValue} employees (${percentage}%)`;
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
    <div className="flex justify-center items-center h-[400px]">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.9, rotate: -180 }}
        animate={
          isInView
            ? { opacity: 1, scale: 1, rotate: 0 }
            : { opacity: 0, scale: 0.9, rotate: -180 }
        }
        transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        className="w-full h-full"
      >
        <canvas ref={chartRef} />
      </motion.div>
    </div>
  );
};

export default PieChart;
