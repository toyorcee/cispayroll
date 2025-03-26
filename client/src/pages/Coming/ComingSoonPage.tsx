import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import comingsoomimage from '../../assets/commingsoon.png';

const ComingSoonPage: React.FC = () => {
  const { moduleName } = useParams<{ moduleName: string }>();
  const navigate = useNavigate();

  const moduleDescriptions: { [key: string]: string } = {
    'Payroll & Benefits': 'Our comprehensive salary and benefits management system is being refined to provide you with the most seamless experience.',
    'Personnel Onboarding': 'We\'re developing a streamlined digital onboarding process to make new hire integration smooth and efficient.',
    'Transfer Management': 'A robust system to handle employee transfers and track departmental changes is on its way.',
    'ID System': 'Our secure personnel identification and verification portal is under careful development.',
    'Performance': 'An advanced tool to track goals, provide feedback, and support employee development is coming soon.',
    'Offboarding': 'We\'re creating an efficient system to manage exit processes and final settlements.',
    'Skills & Competency': 'A comprehensive platform to map and develop workforce capabilities is in progress.',
    'Time & Attendance': 'An intelligent system to monitor work hours, shifts, and manage leave is being crafted.',
    'Reports & Feedback': 'A powerful tool to generate insights and collect employee input is being developed.',
    'Disciplinary': 'A fair and transparent system to handle incidents and maintain policy compliance is on its way.',
    'Self-Service': 'An employee portal for profile and request management is being designed.',
    'Approvals': 'A sophisticated multi-level approval workflow tracking system is coming soon.'
  };

  const description = moduleDescriptions[moduleName || ''] || 
    'We are working hard to bring this exciting feature to you soon!';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 
      flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-5xl w-full bg-white shadow-2xl rounded-3xl 
        border border-green-100 grid grid-cols-2 overflow-hidden">
        {/* Illustration Side */}
        <div className="bg-green-50 flex items-center justify-center p-12">
          <img 
            src={comingsoomimage} 
            alt="Coming Soon Illustration" 
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>

        {/* Content Side */}
        <div className="p-12 flex flex-col justify-center relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 text-green-600 hover:bg-green-100 
            rounded-full p-2 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="absolute top-6 right-6 bg-green-100 text-green-600 
            rounded-full p-3 animate-pulse">
            <Construction className="w-6 h-6" />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-700 mb-4">
              Coming Soon
            </h1>
            
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              {moduleName}
            </h2>
            
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {description}
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <p className="text-green-700 font-medium text-lg flex items-center justify-center">
                <span className="mr-3">🚧</span>
                We're working diligently to bring this feature to you!
                <span className="ml-3">🛠️</span>
              </p>
            </div>
            
            <div className="flex justify-center space-x-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-3 w-3 bg-green-400 rounded-full animate-pulse"
                ></div>
              ))}
            </div>
            
            <button 
              onClick={() => navigate(-1)}
              className="w-full max-w-[300px] py-4 rounded-xl
              bg-green-600 text-white text-lg font-semibold 
              hover:bg-green-700 transition-colors 
              flex items-center justify-center"
            >
              <ArrowLeft className="mr-3 w-5 h-5" />
              Back to Modules
            </button>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-4 text-center">
        <div className="text-base font-medium text-green-600">
          Powered by Century Information Systems
        </div>
        <div className="text-xs text-gray-500">
          All rights Reserved • Version 1.0
        </div>
      </footer>
    </div>
  );
};

export default ComingSoonPage;