"use client";

import { useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaCube,
  FaCloud,
  FaLock,
  FaSync,
} from "react-icons/fa";
import { integrations, apiAccess } from "../../../data/settings";

export default function Integrations() {
  const [showApiKey, setShowApiKey] = useState(false);

  const iconMap = {
    CloudArrowUpIcon: FaCloud,
    LockClosedIcon: FaLock,
    ArrowPathIcon: FaSync,
  };

  return (
    <div className="space-y-6">
      {integrations.map((category) => {
        const IconComponent = iconMap[category.icon as keyof typeof iconMap];

        return (
          <div
            key={category.id}
            className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md"
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center mb-4">
                <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                <div className="ml-3">
                  <h2 className="text-base md:text-lg font-medium text-gray-900">
                    {category.name}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {category.options.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg 
                             hover:shadow-md transition-all duration-200 hover:border-green-200 gap-4 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <FaCube className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                      <div className="ml-3">
                        <h3 className="text-sm md:text-base font-medium text-gray-900">
                          {integration.name}
                        </h3>
                        {integration.status === "connected" && (
                          <p className="text-xs text-gray-500">
                            Last synced: {integration.lastSync}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {integration.status === "connected" ? (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheckCircle className="h-4 w-4 mr-1" />
                            Connected
                          </span>
                          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer">
                            Configure
                          </button>
                          <button className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200 cursor-pointer">
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FaTimesCircle className="h-4 w-4 mr-1" />
                            Available
                          </span>
                          <button className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer">
                            Connect
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* API Access */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            API Access
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">API Key</h3>
                <p className="text-xs md:text-sm text-gray-500">
                  Use this key to authenticate API requests
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={showApiKey ? apiAccess.apiKey : "••••••••••••••••"}
                  readOnly
                  className="block w-48 sm:w-64 rounded-lg border-gray-300 shadow-sm 
                           focus:border-green-500 focus:ring-0 text-sm bg-gray-50 cursor-pointer"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
                <button className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer">
                  Generate New
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Webhook URL
                </h3>
                <p className="text-xs md:text-sm text-gray-500">
                  Endpoint for receiving webhook events
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={apiAccess.webhookUrl}
                  readOnly
                  className="block w-48 sm:w-64 rounded-lg border-gray-300 shadow-sm 
                           focus:border-green-500 focus:ring-0 text-sm bg-gray-50 cursor-pointer"
                />
                <button className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
