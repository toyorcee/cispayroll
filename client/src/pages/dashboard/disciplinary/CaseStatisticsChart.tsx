import { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";

const CaseStatisticsChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Case Statistics",
        data: [],
        backgroundColor: ["#4CAF50", "#FF9800", "#F44336"], // Colors for each bar
      },
    ],
  });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get("/api/disciplinary/cases/statistics");
        const { labels, counts } = response.data;

        setChartData({
          labels,
          datasets: [
            {
              label: "Case Statistics",
              data: counts,
              backgroundColor: ["#4CAF50", "#FF9800", "#F44336"], // Colors for bars
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchChartData();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide legend if not needed
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Case Statistics</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default CaseStatisticsChart;
