import React, { useState } from "react"; 
import { Dialog } from "@headlessui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CheckCircle, AlertCircle, FileText, PlusCircle } from "lucide-react";
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const employeeList = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Michael Johnson" },
];

const casesData = [
  {
    id: 1,
    title: "Incident at Warehouse",
    description: "Details about warehouse incident.",
    status: "Active",
    employee: "John Doe",
    evidence: "dummy_image1.jpg",
  },
  {
    id: 2,
    title: "Safety Violation",
    description: "Details about safety violation.",
    status: "Resolved",
    employee: "Jane Smith",
    evidence: "dummy_image2.jpg",
  },
  {
    id: 3,
    title: "Policy Breach",
    description: "Details about policy breach.",
    status: "Active",
    employee: "Michael Johnson",
    evidence: "dummy_image3.jpg",
  },
];

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
    title: {
      display: true,
      text: "Monthly Disciplinary Cases",
      font: { size: 16 },
    },
  },
};

const DisciplinaryDashboard = () => {
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [isCaseDetailsModalOpen, setIsCaseDetailsModalOpen] = useState(false);
  const [isLogCaseModalOpen, setIsLogCaseModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    incidentDetails: string;
    employee: string;
    date: string;
    evidenceFiles: File[];
  }>({
    title: "",
    incidentDetails: "",
    employee: "",
    date: "",
    evidenceFiles: [],
  });

  interface CaseData {
    id: number;
    title: string;
    description: string;
    status: string;
    employee: string;
    evidence: string;
  }

  const handleViewDetails = (caseData: CaseData) => {
    setSelectedCase(caseData);
    setIsCaseDetailsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileUpload = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      setFormData({ ...formData, evidenceFiles: Array.from(e.target.files) });
    }
  };

  const handleResolve = () => {
    if (selectedCase) {
      selectedCase.status = "Resolved"; // Simulate status change
      setIsCaseDetailsModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Log formData for debugging
      console.log("FormData content:", formData);

      const newCaseData = new FormData(); // Create FormData to handle files and text

      // Append form fields (check for missing/undefined values)
      if (
        !formData.title ||
        !formData.incidentDetails ||
        !formData.employee ||
        !formData.date
      ) {
        alert("Please fill in all required fields.");
        return; // Stop submission if fields are missing
      }

      newCaseData.append("title", formData.title);
      newCaseData.append("incidentDetails", formData.incidentDetails);
      newCaseData.append("employee", formData.employee);
      newCaseData.append("date", formData.date);

      // Append files and check if they exist
      if (formData.evidenceFiles && formData.evidenceFiles.length > 0) {
        formData.evidenceFiles.forEach((file) =>
          newCaseData.append("evidenceFiles", file)
        );
      }

      // Debugging: Log all FormData key-value pairs
      console.log("Submitting the following FormData:");
      newCaseData.forEach((value, key) => {
        console.log(`${key}:`, value); // This shows each key-value pair in the FormData
      });

      // Send POST request with the correct FormData object
      const response = await axios.post(
        "/api/disciplinary/cases",
        newCaseData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 201) {
        console.log("Case submitted successfully!", response.data);
        alert("Case logged successfully!");
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
            <p className="text-2xl font-semibold">170</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center space-x-4">
          <AlertCircle className="text-red-500 w-10 h-10" />
          <div>
            <p className="text-sm text-gray-600">Active Cases</p>
            <p className="text-2xl font-semibold">
              {casesData.filter((c) => c.status === "Active").length}
            </p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center space-x-4">
          <FileText className="text-blue-500 w-10 h-10" />
          <div>
            <p className="text-sm text-gray-600">Resolved Cases</p>
            <p className="text-2xl font-semibold">
              {casesData.filter((c) => c.status === "Resolved").length}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Resolved Cases</h2>
        <ul className="space-y-2">
          {casesData
            .filter((caseItem) => caseItem.status === "Resolved")
            .map((caseItem) => (
              <li
                key={caseItem.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <span>{caseItem.title}</span>
                <button
                  onClick={() => handleViewDetails(caseItem)}
                  className="bg-blue-600 text-white px-4 py-1 rounded-lg"
                >
                  View Details
                </button>
              </li>
            ))}
        </ul>
      </div>

      {/* Active Cases Section */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Active Cases</h2>
        <ul className="space-y-2">
          {casesData
            .filter((caseItem) => caseItem.status === "Active")
            .map((caseItem) => (
              <li
                key={caseItem.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
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
      </div>

      {/* Chart */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Case Statistics</h2>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <Dialog
        open={isCaseDetailsModalOpen}
        onClose={() => setIsCaseDetailsModalOpen(false)}
        className="relative z-10"
      >
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm"></div>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
            {/* Close Button */}
            <button
              onClick={() => setIsCaseDetailsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              ✖
            </button>

            <Dialog.Title className="text-2xl font-semibold mb-4">
              {selectedCase?.title}
            </Dialog.Title>

            {/* Employee Name */}
            <p className="text-sm text-gray-600 mb-2">
              <strong>Employee:</strong> {selectedCase?.employee}
            </p>

            <p className="mt-2 text-gray-700">{selectedCase?.description}</p>

            <img
              src={selectedCase?.evidence}
              alt="Evidence"
              className="w-full h-48 object-cover mt-4 rounded-lg border"
            />

            {selectedCase?.status === "Active" && (
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleResolve}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Resolve
                </button>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                  Approve
                </button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Log New Case Modal */}
      <Dialog
        open={isLogCaseModalOpen}
        onClose={() => setIsLogCaseModalOpen(false)}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm"></div>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsLogCaseModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              ✖
            </button>

            <Dialog.Title className="text-xl font-semibold mb-4">
              Log New Case
            </Dialog.Title>

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
                rows={4}
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
                {employeeList.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
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
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="mb-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
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
