"use client";

import { useState } from "react";
import {
  FaBell,
  FaEnvelope,
  FaMobile,
  FaCommentAlt,
  FaPowerOff,
} from "react-icons/fa";
import {
  notificationCategories,
  defaultNotificationChannels,
} from "../../../data/settings";

// Add this custom toggle button style
const ToggleButton = ({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <button
    onClick={onToggle}
    className={`group relative inline-flex items-center justify-between w-full sm:w-48 px-4 py-2 
              rounded-lg border-2 transition-all duration-300 ease-in-out
              ${
                enabled
                  ? "border-green-500 !bg-green-50 hover:!bg-green-100"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
  >
    <span
      className={`text-sm font-medium transition-colors duration-300
                   ${enabled ? "text-green-700" : "text-gray-500"}`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
    <div
      className={`flex items-center space-x-2 transition-colors duration-300
                   ${enabled ? "text-green-600" : "text-gray-400"}`}
    >
      <span className="text-xs uppercase">{label}</span>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center
                     transition-all duration-300 transform
                     ${
                       enabled
                         ? "bg-green-500 rotate-0"
                         : "bg-gray-300 rotate-180"
                     }`}
      >
        <FaPowerOff
          className={`h-4 w-4 text-white transition-all duration-300
                             ${enabled ? "scale-100" : "scale-90"}`}
        />
      </div>
    </div>
  </button>
);

export default function Notifications() {
  const [emailEnabled, setEmailEnabled] = useState(
    defaultNotificationChannels.email
  );
  const [pushEnabled, setPushEnabled] = useState(
    defaultNotificationChannels.push
  );
  const [smsEnabled, setSmsEnabled] = useState(defaultNotificationChannels.sms);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Notification Channels
          </h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg hover:border-green-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center w-full sm:w-auto">
                <FaEnvelope className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                <span className="ml-3 text-sm md:text-base font-medium text-gray-900">
                  Email Notifications
                </span>
              </div>
              <ToggleButton
                enabled={emailEnabled}
                onToggle={() => setEmailEnabled(!emailEnabled)}
                label="Email"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg hover:border-green-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center w-full sm:w-auto">
                <FaMobile className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                <span className="ml-3 text-sm md:text-base font-medium text-gray-900">
                  Push Notifications
                </span>
              </div>
              <ToggleButton
                enabled={pushEnabled}
                onToggle={() => setPushEnabled(!pushEnabled)}
                label="Push"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg hover:border-green-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center w-full sm:w-auto">
                <FaCommentAlt className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                <span className="ml-3 text-sm md:text-base font-medium text-gray-900">
                  SMS Notifications
                </span>
              </div>
              <ToggleButton
                enabled={smsEnabled}
                onToggle={() => setSmsEnabled(!smsEnabled)}
                label="SMS"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      {notificationCategories.map((category) => (
        <div
          key={category.id}
          className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md"
        >
          <div className="p-4 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-gray-900 mb-1">
              {category.name}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              {category.description}
            </p>
            <div className="space-y-4">
              {category.events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-t gap-4
                           hover:bg-gray-50 transition-all duration-200 hover:shadow-sm rounded-lg px-4"
                >
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-900">
                      {event.name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {event.description}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      className={`p-2 rounded-full transition-all duration-200 cursor-pointer
                        transform hover:scale-110 hover:shadow-md
                        ${
                          event.email
                            ? "bg-green-100 !text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                    >
                      <FaEnvelope className="h-5 w-5" />
                    </button>
                    <button
                      className={`p-2 rounded-full transition-all duration-200 cursor-pointer
                        transform hover:scale-110 hover:shadow-md
                        ${
                          event.push
                            ? "bg-green-100 !text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                    >
                      <FaBell className="h-5 w-5" />
                    </button>
                    <button
                      className={`p-2 rounded-full transition-all duration-200 cursor-pointer
                        transform hover:scale-110 hover:shadow-md
                        ${
                          event.sms
                            ? "bg-green-100 !text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                    >
                      <FaCommentAlt className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
