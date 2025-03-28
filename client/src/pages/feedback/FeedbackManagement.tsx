import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  PieChart, 
  Users, 
  AlertTriangle, 
  FileText, 
  BarChart4, 
  Activity,
  CheckCircle,
  Clock,
  ClipboardCheck
} from "lucide-react";
import SubmitFeedback from "./components/SubmitFeedback";
import AnonymousFeedback from "./components/AnonymousFeedback";
import ReportIncident from "./components/ReportIncident";
import FeedbackDashboard from "./components/FeedbackDashboard";
import SurveyManagement from "./components/SurveyManagement";
import UserSurveys from "./components/UserSurveys";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";
import axios from "axios";

// Define Analytics interface for type safety
interface Analytics {
  totalFeedback?: number;
  totalIncidents?: number;
  resolvedFeedback?: number;
  pendingFeedback?: number;
  categoryBreakdown?: Array<{name: string, count: number}>;
  departmentBreakdown?: Array<{name: string, count: number}>;
}

const FeedbackManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { hasRole } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    } else {
      setActiveTab("feedback");
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/feedback/analytics");
      if (response.data && response.data.analytics) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container p-6 mx-auto">
      {/* Header Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Personnel Feedback System</h1>
        <p className="text-blue-100">
          Submit feedback, report incidents, and participate in company surveys to help us improve
        </p>
      </div>

      {/* Quick Stats for Admin */}
      {isAdmin && !loading && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Feedback</p>
                <p className="text-2xl font-bold">{analytics.totalFeedback || 0}</p>
              </div>
              <div className="rounded-full bg-blue-50 p-3">
                <MessageSquare size={20} className="text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Incidents</p>
                <p className="text-2xl font-bold">{analytics.totalIncidents || 0}</p>
              </div>
              <div className="rounded-full bg-amber-50 p-3">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Resolved</p>
                <p className="text-2xl font-bold">{analytics.resolvedFeedback || 0}</p>
              </div>
              <div className="rounded-full bg-green-50 p-3">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-2xl font-bold">{analytics.pendingFeedback || 0}</p>
              </div>
              <div className="rounded-full bg-orange-50 p-3">
                <Clock size={20} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Tabs */}
      <div className="mb-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="flex border-b overflow-x-auto">
          {isAdmin && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-5 py-3 ${
                activeTab === "dashboard" 
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                  : "text-gray-600 hover:bg-gray-50"
              } transition-all duration-150`}
            >
              <BarChart4 size={18} />
              <span>Dashboard</span>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab("feedback")}
            className={`flex items-center gap-2 px-5 py-3 ${
              activeTab === "feedback" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            } transition-all duration-150`}
          >
            <MessageSquare size={18} />
            <span>Submit Feedback</span>
          </button>
          
          <button
            onClick={() => setActiveTab("anonymous")}
            className={`flex items-center gap-2 px-5 py-3 ${
              activeTab === "anonymous" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            } transition-all duration-150`}
          >
            <Users size={18} />
            <span>Anonymous Feedback</span>
          </button>
          
          <button
            onClick={() => setActiveTab("incident")}
            className={`flex items-center gap-2 px-5 py-3 ${
              activeTab === "incident" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            } transition-all duration-150`}
          >
            <AlertTriangle size={18} />
            <span>Report Incident</span>
          </button>
          
          <button
            onClick={() => setActiveTab("mysurveys")}
            className={`flex items-center gap-2 px-5 py-3 ${
              activeTab === "mysurveys" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            } transition-all duration-150`}
          >
            <ClipboardCheck size={18} />
            <span>My Surveys</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab("surveys")}
              className={`flex items-center gap-2 px-5 py-3 ${
                activeTab === "surveys" 
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                  : "text-gray-600 hover:bg-gray-50"
              } transition-all duration-150`}
            >
              <FileText size={18} />
              <span>Surveys</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading feedback data...</p>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && isAdmin && <FeedbackDashboard analytics={analytics as any} />}
            {activeTab === "feedback" && <SubmitFeedback />}
            {activeTab === "anonymous" && <AnonymousFeedback />}
            {activeTab === "incident" && <ReportIncident />}
            {activeTab === "mysurveys" && <UserSurveys />}
            {activeTab === "surveys" && isAdmin && <SurveyManagement />}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement; 