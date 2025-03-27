import { useState, useEffect } from "react";
import { FileText, Plus, Edit, Trash, CheckSquare, ArrowRight, Search, RefreshCcw, Clock } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import CreateSurveyModal from "./CreateSurveyModal";

// Define interfaces
interface SurveyQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Survey {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  createdAt: string;
  expiresAt: string;
  status: "Draft" | "Active" | "Expired" | "Closed";
  responseCount: number;
  questionCount: number;
  questions?: SurveyQuestion[];
  isPublished?: boolean;
}

// Add SurveyData interface for CreateSurveyModal
interface SurveyData extends Survey {
  targetDepartments: string[];
}

const SurveyManagement = () => {
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("Fetching surveys...");
      const response = await axios.get("/api/feedback/survey/all", {
        params: { limit: 100 }
      });
      
      console.log("Survey response:", response.data);
      
      if (response.data && response.data.surveys) {
        setSurveys(response.data.surveys);
      } else {
        // Fallback to mock data
        setSurveys(mockSurveys);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
      // Fallback to mock data
      setSurveys(mockSurveys);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = (): void => {
    setCurrentSurvey(null);
    setShowCreateModal(true);
  };

  const handleEditSurvey = (survey: Survey): void => {
    // Create a deep copy to prevent reference issues
    const surveyToEdit = JSON.parse(JSON.stringify(survey));
    console.log("Editing survey:", surveyToEdit);
    setCurrentSurvey(surveyToEdit);
    setShowCreateModal(true);
  };

  const handleDeleteSurvey = async (id: string): Promise<void> => {
    if (!id) return; // Add a null check to prevent calling with undefined
    if (!confirm("Are you sure you want to delete this survey? This will also delete all responses.")) return;
    
    try {
      console.log(`Deleting survey ${id}...`);
      await axios.delete(`/api/feedback/survey/${id}`);
      toast.success("Survey deleted successfully");
      fetchSurveys(); // Refresh the list
    } catch (error) {
      console.error("Error deleting survey:", error);
      toast.error("Failed to delete survey");
    }
  };

  const handleSaveSurvey = async (surveyData: any): Promise<void> => {
    try {
      if (currentSurvey) {
        // Update existing survey
        console.log("Updating survey:", currentSurvey._id, surveyData);
        const response = await axios.put(`/api/feedback/survey/${currentSurvey._id}`, surveyData);
        
        if (response.data && response.data.success) {
          toast.success("Survey updated successfully");
          fetchSurveys(); // Refresh the list to get updated data
        } else {
          throw new Error("Failed to update survey");
        }
      } else {
        // Create new survey
        console.log("Creating new survey:", surveyData);
        const response = await axios.post("/api/feedback/survey/create", surveyData);
        
        if (response.data && response.data.survey) {
          toast.success("Survey created successfully");
          fetchSurveys(); // Refresh the list
        } else {
          throw new Error("Failed to create survey");
        }
      }
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("Error saving survey:", error);
      toast.error(`Failed to save survey: ${error.message}`);
    }
  };

  // Filter and search functions
  const getFilteredSurveys = (): Survey[] => {
    return surveys.filter(survey => {
      // Apply status filter
      if (statusFilter !== "all" && survey.status !== statusFilter) {
        return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          survey.title.toLowerCase().includes(searchLower) ||
          survey.description.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Mock data for development/testing
  const mockSurveys: Survey[] = [
    {
      _id: "1",
      title: "Employee Satisfaction Survey",
      description: "Help us understand how we can improve your workplace experience",
      createdAt: "2023-06-15T10:00:00",
      expiresAt: "2023-07-15T23:59:59",
      status: "Active",
      responseCount: 42,
      questionCount: 10
    },
    {
      _id: "2",
      title: "Work From Home Experience",
      description: "Share your thoughts about remote work arrangements",
      createdAt: "2023-06-01T09:30:00",
      expiresAt: "2023-06-30T23:59:59",
      status: "Expired",
      responseCount: 65,
      questionCount: 8
    },
    {
      _id: "3",
      title: "IT Services Feedback",
      description: "Rate the quality of IT support and services",
      createdAt: "2023-06-10T14:15:00",
      expiresAt: "2023-07-10T23:59:59",
      status: "Active",
      responseCount: 28,
      questionCount: 12
    }
  ];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSurveys = getFilteredSurveys();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Surveys & Questionnaires</h2>
          <p className="text-gray-500 text-sm">Create and manage employee surveys</p>
        </div>
        <button
          onClick={handleCreateSurvey}
          className="bg-blue-600 text-white rounded-md px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Create New Survey</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search surveys..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          
          <button 
            onClick={fetchSurveys}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading surveys...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FileText size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No Surveys Available</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "No surveys match your current filters" 
              : "Create your first survey to gather employee feedback"}
          </p>
          {searchTerm || statusFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-2 px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={handleCreateSurvey}
              className="mt-2 bg-blue-600 text-white rounded-md px-4 py-2 inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Create Survey</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSurveys.map((survey) => (
                  <tr key={survey._id || survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{survey.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{survey.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(survey.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {formatDate(survey.expiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        survey.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        survey.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                        survey.status === 'Expired' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800' // Closed
                      }`}>
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {survey.responseCount} responses
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => handleEditSurvey(survey)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Edit Survey"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            const id = survey._id || survey.id;
                            if (id) handleDeleteSurvey(id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Survey"
                        >
                          <Trash size={18} />
                        </button>
                        <a 
                          href={`#/view-responses/${survey._id || survey.id}`} 
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Responses"
                        >
                          <CheckSquare size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateSurveyModal
          survey={currentSurvey as any}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveSurvey}
        />
      )}
    </div>
  );
};

export default SurveyManagement; 