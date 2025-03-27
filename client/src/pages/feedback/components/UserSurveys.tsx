import { useState, useEffect } from "react";
import { FileText, ClipboardCheck, Check, Clock, ArrowRight, Search, Filter, RefreshCcw } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import SurveyResponseModal from "./SurveyResponseModal";

// Define interfaces for type safety
interface SurveyQuestion {
  _id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Survey {
  _id: string;
  title: string;
  description: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  questions?: SurveyQuestion[];
  hasResponded?: boolean;
  responseCount?: number;
}

interface SurveyResponse {
  questionId: string;
  questionText: string;
  answer: string | string[];
}

// Ensure the modalSurvey is properly typed
interface SurveyResponseProps {
  survey: Survey;
  onClose: () => void;
  onSubmit: (responses: SurveyResponse[]) => void;
}

const UserSurveys = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [filter, setFilter] = useState("all"); // "all", "pending", "completed"
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUserSurveys();
  }, []);

  const fetchUserSurveys = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get("/api/feedback/survey/all");
      
      if (response.data && response.data.surveys) {
        // Only show active surveys
        const activeSurveys = response.data.surveys.filter(
          (survey: Survey) => survey.status === "Active" || survey.hasResponded
        );
        setSurveys(activeSurveys);
      } else {
        setSurveys([]);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast.error("Failed to load your surveys");
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSurvey = async (surveyId: string): Promise<void> => {
    try {
      const response = await axios.get(`/api/feedback/survey/${surveyId}`);
      if (response.data && response.data.survey) {
        setCurrentSurvey(response.data.survey);
        setShowResponseModal(true);
      }
    } catch (error) {
      console.error("Error fetching survey details:", error);
      toast.error("Failed to load survey");
    }
  };

  const handleSubmitResponse = async (responses: SurveyResponse[]): Promise<void> => {
    try {
      if (!currentSurvey) return;
      
      await axios.post(`/api/feedback/survey/${currentSurvey._id}/respond`, {
        responses
      });
      toast.success("Survey response submitted successfully!");
      setShowResponseModal(false);
      fetchUserSurveys(); // Refresh the list to update response status
    } catch (error: any) {
      console.error("Error submitting survey response:", error);
      toast.error(error.response?.data?.message || "Failed to submit response");
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter surveys based on user selection
  const getFilteredSurveys = () => {
    return surveys.filter(survey => {
      // Apply status filter
      if (filter === "pending" && survey.hasResponded) {
        return false;
      }
      if (filter === "completed" && !survey.hasResponded) {
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

  const filteredSurveys = getFilteredSurveys();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">My Surveys</h2>
        <p className="text-gray-500 text-sm">View and respond to assigned surveys</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
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
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Surveys</option>
              <option value="pending">Pending Response</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <button 
            onClick={fetchUserSurveys}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading surveys...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <ClipboardCheck size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No Surveys Available</h3>
          <p className="text-gray-500">
            {searchTerm || filter !== "all" 
              ? "No surveys match your current filters" 
              : "There are no surveys assigned to you at the moment."}
          </p>
          {searchTerm || filter !== "all" && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurveys.map((survey) => (
            <div 
              key={survey._id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-lg">{survey.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    survey.hasResponded 
                      ? 'bg-green-100 text-green-700' 
                      : new Date(survey.expiresAt) < new Date() 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {survey.hasResponded 
                      ? 'Completed' 
                      : new Date(survey.expiresAt) < new Date() 
                        ? 'Expired'
                        : 'Pending'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{survey.description}</p>
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Clock size={14} className="mr-1" />
                  <span>Expires: {formatDate(survey.expiresAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {survey.questions?.length || 0} questions
                  </span>
                  <button
                    onClick={() => handleOpenSurvey(survey._id)}
                    disabled={survey.hasResponded || new Date(survey.expiresAt) < new Date()}
                    className={`flex items-center px-3 py-1.5 rounded text-sm ${
                      survey.hasResponded || new Date(survey.expiresAt) < new Date()
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {survey.hasResponded ? (
                      <>
                        <Check size={14} className="mr-1" />
                        Completed
                      </>
                    ) : new Date(survey.expiresAt) < new Date() ? (
                      "Expired"
                    ) : (
                      <>
                        Start Survey
                        <ArrowRight size={14} className="ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResponseModal && currentSurvey && (
        <SurveyResponseModal
          survey={currentSurvey as any}
          onClose={() => setShowResponseModal(false)}
          onSubmit={handleSubmitResponse}
        />
      )}
    </div>
  );
};

export default UserSurveys; 