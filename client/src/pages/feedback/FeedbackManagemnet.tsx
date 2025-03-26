import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Shield, 
  BarChart2, 
  MessageCircle, 
  AlertTriangle, 
  Check, 
  X, 
  Edit, 
  Eye 
} from 'lucide-react';

// Types Definition
interface User {
  id: string;
  name: string;
  department: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Admin';
}

interface Report {
  id: string;
  title: string;
  description: string;
  author: string;
  department: string;
  type: 'Incident' | 'Feedback' | 'Suggestion';
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  anonymous: boolean;
  createdAt: Date;
  approvals: {
    hrApproval?: boolean;
    departmentHeadApproval?: boolean;
  };
}

interface Survey {
  id: string;
  title: string;
  questions: string[];
  anonymous: boolean;
  department?: string;
  responses: any[];
}

const PersonnelReportingSystem: React.FC = () => {
  // State Management
  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    department: 'IT',
    role: 'Employee'
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeView, setActiveView] = useState<'reports' | 'surveys' | 'dashboard'>('dashboard');

  // New Report/Survey Creation State
  const [newReport, setNewReport] = useState<Partial<Report>>({
    type: 'Feedback',
    status: 'Pending',
    anonymous: false
  });

  const [newSurvey, setNewSurvey] = useState<Partial<Survey>>({
    questions: [''],
    anonymous: true
  });

  // Create Report
  const createReport = () => {
    if (!newReport.title || !newReport.description) {
      alert('Please fill all required fields');
      return;
    }

    const report: Report = {
      ...newReport,
      id: `RPT-${Date.now()}`,
      author: newReport.anonymous ? 'Anonymous' : currentUser.name,
      department: currentUser.department,
      createdAt: new Date(),
      approvals: {}
    } as Report;

    setReports(prev => [...prev, report]);
    setNewReport({ type: 'Feedback', status: 'Pending', anonymous: false });
  };

  // Create Survey
  const createSurvey = () => {
    if (!newSurvey.title || newSurvey.questions.length === 0 || newSurvey.questions[0] === '') {
      alert('Please provide a title and at least one question');
      return;
    }

    const survey: Survey = {
      ...newSurvey,
      id: `SRV-${Date.now()}`,
      responses: []
    } as Survey;

    setSurveys(prev => [...prev, survey]);
    setNewSurvey({ questions: [''], anonymous: true });
  };

  // Approve Report
  const approveReport = (reportId: string, approvalType: 'hr' | 'departmentHead') => {
    setReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? {
              ...report, 
              approvals: {
                ...report.approvals,
                [approvalType === 'hr' ? 'hrApproval' : 'departmentHeadApproval']: true
              },
              status: report.approvals.hrApproval && report.approvals.departmentHeadApproval 
                ? 'Approved' 
                : 'Under Review'
            }
          : report
      )
    );
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-blue-100 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <BarChart2 className="text-blue-600" size={40} />
          <span className="text-3xl font-bold text-blue-800">{reports.length}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold">Total Reports</h3>
      </div>
      <div className="bg-green-100 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <MessageCircle className="text-green-600" size={40} />
          <span className="text-3xl font-bold text-green-800">{surveys.length}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold">Active Surveys</h3>
      </div>
      <div className="bg-red-100 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <AlertTriangle className="text-red-600" size={40} />
          <span className="text-3xl font-bold text-red-800">
            {reports.filter(r => r.status !== 'Approved').length}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold">Pending Approvals</h3>
      </div>
    </div>
  );

  // Render Reports Section
  const renderReports = () => (
    <div className="space-y-4">
      {/* Report Creation Form */}
      <div className="bg-gray-100 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Create New Report</h2>
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="Report Title" 
            className="p-2 border rounded"
            value={newReport.title || ''}
            onChange={(e) => setNewReport(prev => ({...prev, title: e.target.value}))}
          />
          <select 
            className="p-2 border rounded"
            value={newReport.type}
            onChange={(e) => setNewReport(prev => ({...prev, type: e.target.value as any}))}
          >
            <option value="Feedback">Feedback</option>
            <option value="Incident">Incident</option>
            <option value="Suggestion">Suggestion</option>
          </select>
        </div>
        <textarea 
          placeholder="Detailed Description" 
          className="w-full p-2 border rounded mt-4 h-32"
          value={newReport.description || ''}
          onChange={(e) => setNewReport(prev => ({...prev, description: e.target.value}))}
        />
        <div className="flex items-center mt-4 space-x-4">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={newReport.anonymous}
              onChange={(e) => setNewReport(prev => ({...prev, anonymous: e.target.checked}))}
            />
            <span>Submit Anonymously</span>
          </label>
          <button 
            onClick={createReport}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Submit Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Reports</h2>
        {reports.map(report => (
          <div key={report.id} className="bg-white border p-4 rounded-lg mb-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{report.title}</h3>
                <p className="text-sm text-gray-600">
                  {report.anonymous ? 'Anonymous' : report.author} | {report.department}
                </p>
                <p className="mt-2">{report.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {currentUser.role === 'HR' && !report.approvals.hrApproval && (
                  <button 
                    onClick={() => approveReport(report.id, 'hr')}
                    className="text-green-500 hover:bg-green-100 p-2 rounded"
                  >
                    <Check />
                  </button>
                )}
                {currentUser.role === 'Manager' && !report.approvals.departmentHeadApproval && (
                  <button 
                    onClick={() => approveReport(report.id, 'departmentHead')}
                    className="text-green-500 hover:bg-green-100 p-2 rounded"
                  >
                    <Check />
                  </button>
                )}
                <span className={`px-2 py-1 rounded text-xs ${
                  report.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {report.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Surveys Section
  const renderSurveys = () => (
    <div className="space-y-4">
      {/* Survey Creation Form */}
      <div className="bg-gray-100 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Create New Survey</h2>
        <input 
          placeholder="Survey Title" 
          className="w-full p-2 border rounded mb-4"
          value={newSurvey.title || ''}
          onChange={(e) => setNewSurvey(prev => ({...prev, title: e.target.value}))}
        />
        {newSurvey.questions.map((question, index) => (
          <div key={index} className="flex mb-2">
            <input 
              placeholder={`Question ${index + 1}`}
              className="w-full p-2 border rounded"
              value={question}
              onChange={(e) => {
                const updatedQuestions = [...(newSurvey.questions || [])];
                updatedQuestions[index] = e.target.value;
                setNewSurvey(prev => ({...prev, questions: updatedQuestions}));
              }}
            />
            {index === newSurvey.questions.length - 1 && (
              <button 
                onClick={() => setNewSurvey(prev => ({
                  ...prev, 
                  questions: [...(prev.questions || []), '']
                }))}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                +
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center mt-4 space-x-4">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={newSurvey.anonymous}
              onChange={(e) => setNewSurvey(prev => ({...prev, anonymous: e.target.checked}))}
            />
            <span>Anonymous Survey</span>
          </label>
          <button 
            onClick={createSurvey}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Survey
          </button>
        </div>
      </div>

      {/* Surveys List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Surveys</h2>
        {surveys.map(survey => (
          <div key={survey.id} className="bg-white border p-4 rounded-lg mb-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{survey.title}</h3>
                <p className="text-sm text-gray-600">
                  {survey.questions.length} Questions | {survey.anonymous ? 'Anonymous' : 'Named'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {survey.responses.length} Responses
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-10">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Personnel Reporting System</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeView === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <BarChart2 /> <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveView('reports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeView === 'reports' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <FileText /> <span>Reports</span>
            </button>
            <button 
              onClick={() => setActiveView('surveys')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeView === 'surveys' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <MessageCircle /> <span>Surveys</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-md rounded-lg p-6">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'reports' && renderReports()}
          {activeView === 'surveys' && renderSurveys()}
        </div>
      </div>
    </div>
  );
};

export default PersonnelReportingSystem;