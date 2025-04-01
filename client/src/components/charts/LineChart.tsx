import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define proper tooltip types
// interface ChartTooltipContext {
//   dataset: {
//     label: string;
//     data: number[];
//   };
//   parsed: {
//     y: number;
//   };
//   formattedValue: string;
//   label: string;
// }

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }[];
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        position?: "top" | "bottom" | "left" | "right";
      };
      title?: {
        display?: boolean;
      };
      tooltip?: {
        callbacks?: {
          label?: (context: any) => string;
        };
      };
    };
    scales?: {
      y?: {
        beginAtZero?: boolean;
        ticks?: {
          callback?: (value: any) => string;
        };
      };
      x?: {
        grid?: {
          display?: boolean;
        };
      };
    };
  };
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  options: customOptions,
}) => {
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
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
  };

  const options = {
    ...defaultOptions,
    ...customOptions,
  };

  return (
    <div style={{ height: "300px" }}>
      <Line ref={chartRef} options={options} data={data} />
    </div>
  );
};

export default LineChart;
