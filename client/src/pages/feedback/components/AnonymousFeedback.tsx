import { useState, useEffect } from "react";
import { Users, Send, Check, EyeOff } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const categories = [
  "Work Environment",
  "Management",
  "Compensation",
  "Benefits",
  "Processes",
  "Technology",
  "Team Dynamics",
  "Professional Development",
  "Other",
];

// Define interfaces
interface Department {
  _id: string;
  name: string;
}

interface FeedbackFormData {
  title: string;
  category: string;
  description: string;
  recipientDepartment: string;
}

const AnonymousFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<FeedbackFormData>({
    title: "",
    category: "",
    description: "",
    recipientDepartment: "",
  });

  useEffect(() => {
    // Fetch departments from the server
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("/api/departments");
        if (response.data && response.data.departments) {
          setDepartments(response.data.departments);
        } else {
          setDepartments([
            { _id: "hr", name: "Human Resources" },
            { _id: "it", name: "IT Department" },
            { _id: "operations", name: "Operations" },
            { _id: "finance", name: "Finance" },
            { _id: "management", name: "Management" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        // Fallback to default departments
        setDepartments([
          { _id: "hr", name: "Human Resources" },
          { _id: "it", name: "IT Department" },
          { _id: "operations", name: "Operations" },
          { _id: "finance", name: "Finance" },
          { _id: "management", name: "Management" },
        ]);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/feedback/anonymous", formData);
      setSuccess(true);
      toast.success("Anonymous feedback submitted successfully!");

      // Reset form after short delay to show success state
      setTimeout(() => {
        setFormData({
          title: "",
          category: "",
          description: "",
          recipientDepartment: "",
        });
        setSuccess(false);
      }, 2000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        console.error("Error submitting anonymous feedback:", error);
        toast.error(error.response.data.message);
      } else {
        console.error("Error submitting anonymous feedback:", error);
        toast.error("Failed to submit feedback");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {success ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your anonymous feedback has been submitted successfully. Your
            identity remains completely confidential.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Users className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-semibold">Anonymous Feedback</h2>
            </div>
            <p className="text-purple-100 ml-12">
              Share feedback without revealing your identity
            </p>
          </div>

          <div className="flex items-center gap-3 bg-purple-50 border-l-4 border-purple-500 p-4 m-6 rounded-r-lg">
            <EyeOff className="text-purple-600 flex-shrink-0" size={20} />
            <p className="text-sm text-purple-700">
              <strong>Your privacy is protected:</strong> This feedback will be
              completely anonymous. Your identity will not be recorded or
              tracked in any way.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="title"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Briefly describe your feedback"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="category"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="recipientDepartment"
              >
                Recipient Department
              </label>
              <select
                id="recipientDepartment"
                name="recipientDepartment"
                value={formData.recipientDepartment}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="">Select a department (optional)</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="description"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed feedback..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Submit Anonymous Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AnonymousFeedback;
