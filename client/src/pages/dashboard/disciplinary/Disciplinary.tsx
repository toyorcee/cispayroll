import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Title } from "chart.js";
import { Bar } from "react-chartjs-2";
import { CheckCircle, AlertCircle, FileText, UploadCloud, PlusCircle } from "lucide-react";
import axios from "axios";
import { employeeService } from "../../../services/employeeService";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const chartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Monthly Cases",
      data: [12, 18, 10, 20, 15, 22],
      backgroundColor: "#6366F1",
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    tooltip: { enabled: true },
    title: { display: true, text: "Monthly Disciplinary Cases", font: { size: 16 } },
  },
};

const DisciplinaryDashboard = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [isCaseDetailsModalOpen, setIsCaseDetailsModalOpen] = useState(false);
  const [isLogCaseModalOpen, setIsLogCaseModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    incidentDetails: "",
    employee: "",
    date: "",
    evidenceFiles: [],
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ label: "Monthly Cases", data: [], backgroundColor: "#6366F1" }],
  });
  const [loading, setLoading] = useState(true);

  const handleViewDetails = (caseData) => {
    setSelectedCase(caseData);
    setIsCaseDetailsModalOpen(true);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileUpload = (e) => setFormData({ ...formData, evidenceFiles: Array.from(e.target.files) });

  const handleResolve = () => {
    if (selectedCase) {
      selectedCase.status = "Resolved"; // Simulate status change
      setIsCaseDetailsModalOpen(false);
    }
  };


// State Hooks
const [employees, setEmployees] = useState([]);
const [activeCases, setActiveCases] = useState([]);
const [loadingEmployees, setLoadingEmployees] = useState(true);
const [loadingCases, setLoadingCases] = useState(true);
const [error, setError] = useState(null);



  const fetchMonthlyCases = async () => {
    try {
      const response = await axios.get("/api/disciplinary/monthly-cases"); // Call backend endpoint
      const caseData = response.data; // Example format: [{_id: 1, count: 10}, {_id: 2, count: 12}]

      // Map data to labels and counts
      const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const labels = [];
      const data = [];

      // Create an array of last 6 months dynamically
      const currentMonth = new Date().getMonth();
      for (let i = 5; i >= 0; i--) {
        labels.push(monthLabels[(currentMonth - i + 12) % 12]);
      }

      // Initialize data array with zeros
      const monthlyCounts = Array(6).fill(0);

      // Fill data dynamically based on fetched case data
      caseData.forEach((entry) => {
        const monthIndex = (entry._id - (currentMonth - 5 + 12) % 12 + 6) % 6; // Calculate the last 6 months' index
        monthlyCounts[monthIndex] = entry.count;
      });

      // Update chart state
      setChartData({
        labels,
        datasets: [{ label: "Monthly Cases", data: monthlyCounts, backgroundColor: "#6366F1" }],
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMonthlyCases();
  }, []);
  // Fetch active employees on component mount
  useEffect(() => {
    const fetchActiveEmployees = async () => {
      try {
        const filters = { role: "USER", status: "active" }; // Filter by role and active status
        const response = await employeeService.getEmployees(filters);
        console.log("API Response (Employees):", response.data);
        setEmployees(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch active employees.");
        console.error("Error fetching employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchActiveEmployees();
  }, []);

    const fetchActiveCases = async () => {
      try {
        const response = await axios.get("/api/disciplinary/cases", {
          params: { status: "Active" }, // Pass query params to filter by status
        });
        console.log("Fetched Active Cases:", response.data);
        setActiveCases(response.data); // Update state with active cases
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch active cases.");
        console.error("Error fetching active cases:", err);
      } finally {
        setLoadingCases(false);
      }
    };

    useEffect(() => {
      fetchActiveCases(); // Call it once during component mount
    }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Log formData for debugging
      console.log("FormData content:", formData);
  
      const newCaseData = new FormData(); // Create FormData to handle files and text
  
      // Append form fields (check for missing/undefined values)
      if (!formData.title || !formData.incidentDetails || !formData.employee || !formData.date) {
        alert("Please fill in all required fields.");
        return; // Stop submission if fields are missing
      }
  
      newCaseData.append("title", formData.title);
      newCaseData.append("incidentDetails", formData.incidentDetails);
      newCaseData.append("employee", formData.employee);
      newCaseData.append("date", formData.date);
  
      // Append files and check if they exist
      if (formData.evidenceFiles && formData.evidenceFiles.length > 0) {
        formData.evidenceFiles.forEach((file) => newCaseData.append("evidenceFiles", file));
      }
  
      // Debugging: Log all FormData key-value pairs
      console.log("Submitting the following FormData:");
      newCaseData.forEach((value, key) => {
        console.log(`${key}:`, value); // This shows each key-value pair in the FormData
      });
  
      // Send POST request with the correct FormData object
      const response = await axios.post("/api/disciplinary/cases", newCaseData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.status === 201) {
        console.log("Case submitted successfully!", response.data);
        toast.success("Case logged successfully!");
        fetchActiveCases();
        fetchMonthlyCases();
        setIsLogCaseModalOpen(false); // Close modal on success
      } else {
        alert("Something went wrong while saving the case.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error submitting case:", error.response.data); // Log backend error details
        alert(error.response.data.error || "Failed to log the case.");
      } else {
        console.error("Unexpected error:", error);
        alert("Failed to log the case due to an unexpected error.");
      }
    }
  };
  
  

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header with Log New Case */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Disciplinary Dashboard</h1>
        <button
          onClick={() => setIsLogCaseModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg space-x-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Log New Case</span>
        </button>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center space-x-4">
          <CheckCircle className="text-green-500 w-10 h-10" />
          <div>
            <p className="text-sm text-gray-600">Total Cases</p>
            <p className="text-2xl font-semibold">{activeCases.filter((c) => c.status === "Active").length}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center space-x-4">
          <AlertCircle className="text-red-500 w-10 h-10" />
          <div>
            <p className="text-sm text-gray-600">Active Cases</p>
            <p className="text-2xl font-semibold">{activeCases.filter((c) => c.status === "Active").length}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center space-x-4">
          <FileText className="text-blue-500 w-10 h-10" />
          <div>
            <p className="text-sm text-gray-600">Resolved Cases</p>
            <p className="text-2xl font-semibold">{activeCases.filter((c) => c.status === "Resolved").length}</p>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Resolved Cases</h2>
        <ul className="space-y-2">
        {activeCases
          .filter((caseItem) => caseItem.status === "Resolved")
          .map((caseItem) => (
            <li key={caseItem.id} className="p-3 border rounded-lg flex justify-between items-center">
              <span>{caseItem.title}</span>
              <button onClick={() => handleViewDetails(caseItem)} className="bg-blue-600 text-white px-4 py-1 rounded-lg">
                View Details
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Active Cases Section */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Active Cases</h2>

        {loadingCases ? (
          <p>Loading active cases...</p> // Show loading state while fetching cases
        ) : activeCases.length > 0 ? (
          <ul className="space-y-2">
            {activeCases.map((caseItem) => (
              <li key={caseItem.id} className="p-3 border rounded-lg flex justify-between items-center">
                <span>{caseItem.title}</span>
                <button
                  onClick={() => handleViewDetails(caseItem)}
                  className="bg-red-600 text-white px-4 py-1 rounded-lg"
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No active cases found.</p> // Handle empty state if no active cases exist
        )}
      </div>

      {/* Chart */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Case Statistics</h2>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <Dialog open={isCaseDetailsModalOpen} onClose={() => setIsCaseDetailsModalOpen(false)} className="relative z-10">
  <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm"></div>
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
      {/* Close Button */}
      <button
        onClick={() => setIsCaseDetailsModalOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        ✖
      </button>

      {/* Title */}
      <Dialog.Title className="text-2xl font-semibold mb-4">{selectedCase?.title}</Dialog.Title>

      {/* Employee Name */}
      <p className="text-sm text-gray-600 mb-2">
        <strong>Employee:</strong> {selectedCase?.employee?.fullName || "Employee name not available"}
      </p>

      {/* Description */}
      <p className="mt-2 text-gray-700">{selectedCase?.description}</p>

      {/* Evidence Image */}
      {selectedCase?.evidence ? (
        <img
          src={`http://localhost:5000${selectedCase?.evidence}`} // Use the saved image path
          alt="Evidence"
          className="w-full h-48 object-cover mt-4 rounded-lg border"
        />
      ) : (
        <p className="text-gray-500 mt-4">No evidence image provided</p>
      )}

      {/* Action Buttons */}
      {selectedCase?.status === "Active" && (
        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleResolve}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Resolve
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Approve</button>
        </div>
      )}
    </Dialog.Panel>
  </div>
</Dialog>





            {/* Log New Case Modal */}
            <Dialog open={isLogCaseModalOpen} onClose={() => setIsLogCaseModalOpen(false)} className="relative z-10">
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm"></div>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsLogCaseModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              ✖
            </button>

            <Dialog.Title className="text-xl font-semibold mb-4">Log New Case</Dialog.Title>

            {/* Form Submission */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <input
                type="text"
                name="title"
                placeholder="Case Title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border rounded-lg p-2"
                required
              />

              <textarea
                name="incidentDetails"
                placeholder="Incident Details"
                value={formData.incidentDetails}
                onChange={handleInputChange}
                className="w-full border rounded-lg p-2"
                rows="4"
                required
              />

              <select
                name="employee"
                value={formData.employee}
                onChange={handleInputChange}
                className="w-full border rounded-lg p-2"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full border rounded-lg p-2"
                required
              />

              <div className="w-full border rounded-lg p-2">
                <label className="block mb-1">Upload Evidence</label>
                <input type="file" multiple onChange={handleFileUpload} className="mb-2" />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Submit
              </button>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

    </div>
  );
};

export default DisciplinaryDashboard;
