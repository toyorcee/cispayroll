"use client";

import { useState } from "react";
import {
  FaBell,
  FaClock,
  FaDollarSign,
  FaCalendar,
  FaPowerOff,
} from "react-icons/fa";
import {
  generalSettings,
  timezoneOptions,
  dateFormatOptions,
  languageOptions,
} from "../../../data/settings";

const ToggleButton = ({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}) => (
  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
    <div className="flex items-center space-x-3">
      {label === "Email Notifications" ? (
        <FaBell className="h-5 w-5 text-green-600" />
      ) : (
        <FaClock className="h-5 w-5 text-green-600" />
      )}
      <div>
        <p className="text-sm md:text-base font-medium text-gray-900">
          {label}
        </p>
        <p className="text-xs md:text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`group relative inline-flex items-center justify-between px-4 py-2 
                rounded-lg border-2 transition-all duration-300 ease-in-out w-32
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
        {enabled ? "On" : "Off"}
      </span>
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
    </button>
  </div>
);

export default function General() {
  const [notifications, setNotifications] = useState(
    generalSettings.quickSettings.notifications
  );
  const [autoBackup, setAutoBackup] = useState(
    generalSettings.quickSettings.autoBackup
  );

  const selectClasses = `mt-1 block w-full pl-3 pr-10 py-2 text-sm md:text-base 
                      border-gray-300 focus:outline-none focus:ring-0 
                      focus:border-green-500 rounded-lg cursor-pointer
                      !bg-green-600 text-white
                      transition-all duration-200 hover:!bg-green-700`;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Payroll Settings
          </h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaCalendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Processing Day
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {generalSettings.payrollSettings.processingDay}th of every
                  month
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaDollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Default Currency
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {generalSettings.payrollSettings.currency}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaClock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Fiscal Year
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {generalSettings.payrollSettings.fiscalYear}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaCalendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Pay Period
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {generalSettings.payrollSettings.payPeriod}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            System Preferences
          </h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-500">
                Timezone
              </label>
              <select className={selectClasses}>
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-500">
                Date Format
              </label>
              <select className={selectClasses}>
                {dateFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-500">
                Language
              </label>
              <select className={selectClasses}>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-500">
                Theme
              </label>
              <select className={selectClasses}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Quick Settings
          </h2>
          <div className="space-y-4">
            <ToggleButton
              enabled={notifications}
              onToggle={() => setNotifications(!notifications)}
              label="Email Notifications"
              description="Receive payroll processing notifications"
            />
            <ToggleButton
              enabled={autoBackup}
              onToggle={() => setAutoBackup(!autoBackup)}
              label="Automatic Backups"
              description="Daily backup of payroll data"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
