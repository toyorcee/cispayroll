import React, { useRef, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const chartRef = useRef<ChartJS<"pie">>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      <Pie ref={chartRef} options={options} data={data} />
    </div>
  );
};

export default PieChart;
