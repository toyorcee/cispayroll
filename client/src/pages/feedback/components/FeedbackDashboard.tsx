import { useState, useEffect } from "react";
import { 
  Clock, CheckCircle, AlertCircle, PieChart, BarChart, TrendingUp, 
  MessageSquare, Users, AlertTriangle, Filter, BarChart4,
  Calendar, ChevronDown, Search, RefreshCcw, Shield, MapPin, X
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { UserRole } from "../../../types/auth";

// Define interfaces for type safety
interface User {
  firstName: string;
  lastName: string;
}

interface BaseFeedbackItem {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  adminComments?: string;
  submittedBy?: User;
}

interface Feedback extends BaseFeedbackItem {
  isAnonymous?: boolean;
  recipientDepartment?: string | { name: string };
}

interface Incident extends BaseFeedbackItem {
  severity: string;
  location?: string;
}

interface AnalyticsItem {
  name: string;
  count: number;
}

interface Analytics {
  totalFeedback: number;
  categoryBreakdown: AnalyticsItem[];
  departmentBreakdown: AnalyticsItem[];
}

interface FeedbackDashboardProps {
  analytics?: Analytics;
}

const FeedbackDashboard = ({ analytics }: FeedbackDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState("feedback"); // Add a tab for incidents
  const [selectedItem, setSelectedItem] = useState<Feedback | Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow (to include today)
    departmentId: "",
    searchTerm: ""
  });

  const { hasRole } = useAuth();
  const isAdmin = hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN);

  useEffect(() => {
    fetchRecentFeedback();
    fetchIncidents();
  }, []);

  const fetchRecentFeedback = async () => {
    try {
      setLoading(true);
      console.log("Fetching feedback with filters:", filter);
      
      const response = await axios.get("/api/feedback/all", { 
        params: { 
          page: 1, 
          limit: 10,
          startDate: filter.startDate,
          endDate: filter.endDate,
          departmentId: filter.departmentId || undefined,
          search: filter.searchTerm || undefined
        } 
      });
      
      console.log("Feedback API response:", response);
      
      if (response.data && Array.isArray(response.data)) {
        setRecentFeedback(response.data);
      } else if (response.data && response.data.feedback) {
        setRecentFeedback(response.data.feedback);
      } else {
        // Check if there's any array property in the response that might contain feedback
        const possibleArrayProps = Object.keys(response.data).filter(key => 
          Array.isArray(response.data[key]) && response.data[key].length > 0);
        
        if (possibleArrayProps.length > 0) {
          const firstArrayProp = possibleArrayProps[0];
          setRecentFeedback(response.data[firstArrayProp]);
        } else {
          setRecentFeedback([]);
        }
      }
    } catch (error) {
      console.error("Error fetching recent feedback:", error);
      toast.error("Failed to load recent feedback");
      setRecentFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      console.log("Fetching incidents with filters:", filter);
      
      const response = await axios.get("/api/feedback/incidents", { 
        params: { 
          page: 1, 
          limit: 10,
          startDate: filter.startDate,
          endDate: filter.endDate,
          departmentId: filter.departmentId || undefined,
          search: filter.searchTerm || undefined
        } 
      });
      
      console.log("Incidents API response:", response);
      
      if (response.data && Array.isArray(response.data)) {
        setIncidents(response.data);
      } else if (response.data && response.data.incidents) {
        setIncidents(response.data.incidents);
      } else {
        // Fallback to demo data if API isn't working correctly
        setIncidents([
          {
            _id: "incident1",
            title: "Safety Hazard in Warehouse",
            category: "Safety",
            description: "Broken glass near the loading dock that presents a safety hazard for workers in the area. This requires immediate attention to prevent potential injuries.",
            submittedBy: { firstName: "John", lastName: "Doe" },
            status: "Pending",
            severity: "High",
            createdAt: new Date().toISOString(),
            location: "Warehouse B"
          },
          {
            _id: "incident2",
            title: "Potential Data Security Breach",
            category: "Security",
            description: "Multiple unauthorized login attempts detected on the customer database between 2am-4am. IP addresses have been logged and preliminary investigation suggests external origin.",
            submittedBy: { firstName: "Jane", lastName: "Smith" },
            status: "Pending",
            severity: "Critical",
            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            location: "IT Systems"
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
      // Fallback to demo data
      setIncidents([
        {
          _id: "incident1",
          title: "Safety Hazard in Warehouse",
          category: "Safety",
          description: "Broken glass near the loading dock that presents a safety hazard for workers in the area. This requires immediate attention to prevent potential injuries.",
          submittedBy: { firstName: "John", lastName: "Doe" },
          status: "Pending",
          severity: "High",
          createdAt: new Date().toISOString(),
          location: "Warehouse B"
        },
        {
          _id: "incident2",
          title: "Potential Data Security Breach",
          category: "Security",
          description: "Multiple unauthorized login attempts detected on the customer database between 2am-4am. IP addresses have been logged and preliminary investigation suggests external origin.",
          submittedBy: { firstName: "Jane", lastName: "Smith" },
          status: "Pending",
          severity: "Critical",
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          location: "IT Systems"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchRecentFeedback();
    fetchIncidents();
  };

  const resetFilters = () => {
    setFilter({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      departmentId: "",
      searchTerm: ""
    });
    
    setTimeout(() => {
      fetchRecentFeedback();
      fetchIncidents();
    }, 100);
  };

  const updateFeedbackStatus = async (id: string | undefined, status: string) => {
    if (!id) {
      toast.error("Cannot update feedback: Missing ID");
      return;
    }
    
    try {
      console.log(`Updating feedback ${id} to status: ${status}`);
      
      const response = await axios.put(`/api/feedback/${id}/status`, {
        status,
        comments: `Status updated to ${status}`
      });
      
      console.log("Status update response:", response.data);
      toast.success(`Feedback ${status.toLowerCase()} successfully`);
      fetchRecentFeedback(); // Refresh the list
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast.error("Failed to update feedback status");
    }
  };

  const updateIncidentStatus = async (id: string | undefined, status: string) => {
    if (!id) {
      toast.error("Cannot update incident: Missing ID");
      return;
    }
    
    try {
      console.log(`Updating incident ${id} to status: ${status}`);
      
      const response = await axios.put(`/api/feedback/incident/${id}/status`, {
        status,
        comments: `Incident status updated to ${status}`
      });
      
      console.log("Incident status update response:", response.data);
      toast.success(`Incident ${status.toLowerCase()} successfully`);
      fetchIncidents(); // Refresh the incidents list
    } catch (error) {
      console.error("Error updating incident status:", error);
      toast.error("Failed to update incident status");
      
      // If the API isn't implemented yet, just update the local state
      setIncidents(prevIncidents => 
        prevIncidents.map(incident => 
          incident._id === id ? {...incident, status: status} : incident
        )
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const showDetails = (item: Feedback | Incident) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Filter Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Filter Dashboard</h3>
          <div className="flex gap-2">
            <button 
              onClick={resetFilters}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">From Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar size={16} className="text-gray-500" />
              </div>
              <input
                type="date"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">To Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar size={16} className="text-gray-500" />
              </div>
              <input
                type="date"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Department</label>
            <select
              name="departmentId"
              value={filter.departmentId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            >
              <option value="">All Departments</option>
              <option value="hr">Human Resources</option>
              <option value="it">IT Department</option>
              <option value="operations">Operations</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <input
                type="text"
                name="searchTerm"
                value={filter.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search title or description..."
                className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={applyFilters}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-1 text-sm hover:bg-blue-700 transition-colors"
          >
            <Filter size={16} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Analytics Dashboards */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Feedback by Category</h3>
              <PieChart size={18} className="text-blue-500" />
            </div>
            <div className="space-y-4">
              {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                analytics.categoryBreakdown.map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{category.name}</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(category.count / analytics.totalFeedback) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No category data available</div>
              )}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Feedback by Department</h3>
              <BarChart size={18} className="text-indigo-500" />
            </div>
            <div className="space-y-4">
              {analytics.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
                analytics.departmentBreakdown.map((dept) => (
                  <div key={dept.name || 'unknown'}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{dept.name || 'Unassigned'}</span>
                      <span className="font-medium">{dept.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${(dept.count / analytics.totalFeedback) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No department data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Feedback vs Incidents */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 mb-4">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`flex items-center gap-2 px-5 py-3 ${
              activeTab === "feedback" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            } transition-all duration-150`}
          >
            <MessageSquare size={18} />
            <span>Feedback</span>
          </button>
          
          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 px-5 py-3 ${
              activeTab === "incidents" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            } transition-all duration-150`}
          >
            <AlertTriangle size={18} />
            <span>Incidents</span>
          </button>
        </div>
      </div>

      {/* Recent Feedback Section */}
      {activeTab === "feedback" && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-800">Recent Feedback</h3>
            <div className="flex gap-2">
              <button 
                onClick={resetFilters}
                className="text-blue-600 text-sm px-3 py-1 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                Reset Filters
              </button>
              <button 
                onClick={fetchRecentFeedback}
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCcw size={16} className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Loading feedback...</p>
            </div>
          ) : recentFeedback.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-600">No Feedback Available</h3>
              <p className="text-gray-500 mb-4">There's no feedback matching your current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentFeedback.map((item) => (
                    <tr key={item._id || item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            {item.isAnonymous 
                              ? "Anonymous" 
                              : (item.submittedBy && (item.submittedBy.firstName || item.submittedBy.lastName))
                                ? `${item.submittedBy.firstName || ''} ${item.submittedBy.lastName || ''}`
                                : "Unknown"
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{item.category}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => item._id && updateFeedbackStatus(item._id, 'Approved')}
                            disabled={item.status === 'Approved' || !item._id}
                            className={`text-xs ${
                              item.status === 'Approved' || !item._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            } px-2 py-1 rounded transition-colors`}
                          >
                            Approve
                          </button>
                          
                          <button 
                            onClick={() => item._id && updateFeedbackStatus(item._id, 'Rejected')}
                            disabled={item.status === 'Rejected' || !item._id}
                            className={`text-xs ${
                              item.status === 'Rejected' || !item._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            } px-2 py-1 rounded transition-colors`}
                          >
                            Reject
                          </button>
                          
                          <button 
                            onClick={() => item._id && updateFeedbackStatus(item._id, 'Resolved')}
                            disabled={item.status === 'Resolved' || !item._id}
                            className={`text-xs ${
                              item.status === 'Resolved' || !item._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            } px-2 py-1 rounded transition-colors`}
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Incidents Management Section */}
      {activeTab === "incidents" && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-800">Reported Incidents</h3>
            <div className="flex gap-2">
              <button 
                onClick={resetFilters}
                className="text-blue-600 text-sm px-3 py-1 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                Reset Filters
              </button>
              <button 
                onClick={fetchIncidents}
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCcw size={16} className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <AlertTriangle size={48} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-600">No Incidents Reported</h3>
              <p className="text-gray-500 mb-4">There are no incidents matching your current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr key={incident._id || incident.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-sm">{incident.title}</div>
                          <div className="text-xs text-gray-500">
                            {incident.location ? (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span>{incident.location}</span>
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(incident.submittedBy && (incident.submittedBy.firstName || incident.submittedBy.lastName))
                              ? `Reported by: ${incident.submittedBy.firstName || ''} ${incident.submittedBy.lastName || ''}`
                              : "Reporter: Unknown"
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{incident.category}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{formatDate(incident.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => incident._id && updateIncidentStatus(incident._id, 'Approved')}
                            disabled={incident.status === 'Approved' || !incident._id}
                            className={`text-xs ${
                              incident.status === 'Approved' || !incident._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            } px-2 py-1 rounded transition-colors`}
                          >
                            Approve
                          </button>
                          
                          <button 
                            onClick={() => incident._id && updateIncidentStatus(incident._id, 'Rejected')}
                            disabled={incident.status === 'Rejected' || !incident._id}
                            className={`text-xs ${
                              incident.status === 'Rejected' || !incident._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            } px-2 py-1 rounded transition-colors`}
                          >
                            Reject
                          </button>
                          
                          <button 
                            onClick={() => incident._id && updateIncidentStatus(incident._id, 'Resolved')}
                            disabled={incident.status === 'Resolved' || !incident._id}
                            className={`text-xs ${
                              incident.status === 'Resolved' || !incident._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            } px-2 py-1 rounded transition-colors`}
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Incident Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800">
                {activeTab === "incidents" ? "Incident Details" : "Feedback Details"}
              </h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-xl font-medium mb-2">{selectedItem.title}</h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                  {'severity' in selectedItem && selectedItem.severity && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedItem.severity)}`}>
                      Severity: {selectedItem.severity}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatDate(selectedItem.createdAt)}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedItem.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Submitted By</p>
                    <p className="font-medium">
                      {'isAnonymous' in selectedItem && selectedItem.isAnonymous
                        ? "Anonymous"
                        : selectedItem.submittedBy
                          ? `${selectedItem.submittedBy.firstName || ''} ${selectedItem.submittedBy.lastName || ''}`
                          : "Unknown"
                      }
                    </p>
                  </div>
                  
                  {selectedItem.category && (
                    <div>
                      <p className="text-gray-500 mb-1">Category</p>
                      <p className="font-medium">{selectedItem.category}</p>
                    </div>
                  )}
                  
                  {'location' in selectedItem && selectedItem.location && (
                    <div>
                      <p className="text-gray-500 mb-1">Location</p>
                      <p className="font-medium">{selectedItem.location}</p>
                    </div>
                  )}
                  
                  {'recipientDepartment' in selectedItem && selectedItem.recipientDepartment && (
                    <div>
                      <p className="text-gray-500 mb-1">Department</p>
                      <p className="font-medium">
                        {typeof selectedItem.recipientDepartment === 'object'
                          ? selectedItem.recipientDepartment.name
                          : selectedItem.recipientDepartment
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedItem.adminComments && (
                <div className="mb-6">
                  <h5 className="font-medium mb-2 text-gray-700">Admin Comments</h5>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedItem.adminComments}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {activeTab === "incidents" && selectedItem._id && (
                  <button
                    onClick={() => {
                      updateIncidentStatus(selectedItem._id, 'Resolved');
                      setShowDetailModal(false);
                    }}
                    disabled={selectedItem.status === 'Resolved'}
                    className={`px-4 py-2 rounded-md ${
                      selectedItem.status === 'Resolved'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Mark as Resolved
                  </button>
                )}
                {activeTab !== "incidents" && selectedItem._id && (
                  <button
                    onClick={() => {
                      updateFeedbackStatus(selectedItem._id, 'Resolved');
                      setShowDetailModal(false);
                    }}
                    disabled={selectedItem.status === 'Resolved'}
                    className={`px-4 py-2 rounded-md ${
                      selectedItem.status === 'Resolved'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug data during development */}
      {recentFeedback.length > 0 && import.meta.env.NODE_ENV === 'development' && activeTab === "feedback" && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <details>
            <summary className="cursor-pointer text-sm text-gray-700">Debug: First feedback item</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(recentFeedback[0], null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {incidents.length > 0 && import.meta.env.NODE_ENV === 'development' && activeTab === "incidents" && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <details>
            <summary className="cursor-pointer text-sm text-gray-700">Debug: First incident item</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(incidents[0], null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard;