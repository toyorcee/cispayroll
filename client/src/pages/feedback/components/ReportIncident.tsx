import { useState } from "react";
import { AlertTriangle, Send, Calendar, Clock, MapPin } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const severityLevels = [
  "Low", 
  "Medium", 
  "High", 
  "Critical"
];

interface IncidentFormData {
  title: string;
  description: string;
  severity: string;
  location: string;
  dateTime: string;
  involvedPersons: string;
}

const ReportIncident = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IncidentFormData>({
    title: "",
    description: "",
    severity: "",
    location: "",
    dateTime: "",
    involvedPersons: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.severity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/feedback/incident", formData);
      toast.success("Incident reported successfully!");
      setFormData({
        title: "",
        description: "",
        severity: "",
        location: "",
        dateTime: "",
        involvedPersons: ""
      });
    } catch (error: any) {
      console.error("Error reporting incident:", error);
      toast.error(error.response?.data?.message || "Failed to report incident");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-100 p-2 rounded-full">
          <AlertTriangle className="text-amber-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Report an Incident</h2>
          <p className="text-gray-500 text-sm">
            Report workplace incidents, safety concerns, or policy violations
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-md mb-6">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> For emergencies requiring immediate attention, 
          please contact your supervisor or security directly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Incident Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of the incident"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="severity">
              Severity Level <span className="text-red-500">*</span>
            </label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="" disabled>Select severity</option>
              {severityLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="dateTime">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Date & Time</span>
              </div>
            </label>
            <input
              id="dateTime"
              name="dateTime"
              type="datetime-local"
              value={formData.dateTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>Location</span>
            </div>
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="Where did the incident occur?"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="involvedPersons">
            Involved Persons
          </label>
          <input
            id="involvedPersons"
            name="involvedPersons"
            type="text"
            value={formData.involvedPersons}
            onChange={handleChange}
            placeholder="Names or departments of people involved (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Please provide a detailed account of what happened..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            {loading ? (
              <span>Submitting...</span>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>Report Incident</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportIncident; 