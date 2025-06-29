"use client";

import { useState, useEffect } from "react";
import {
  FaBell,
  FaClock,
  FaDollarSign,
  FaCalendar,
  FaPowerOff,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { settingsService } from "../../../services/settingsService";
import { toast } from "react-toastify";
import { notificationPreferenceService } from "../../../services/notificationPreferenceService";
import { useAuth } from "../../../context/AuthContext";

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
                rounded-lg border-2 transition-all duration-300 ease-in-out w-32 cursor-pointer
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
  const { user } = useAuth();
  // System settings state
  const [_systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Payroll settings state
  const [payrollSettings, setPayrollSettings] = useState({
    processingDay: 25,
    currency: "NGN",
    fiscalYear: "2024",
    payPeriod: "monthly",
  });
  const [editingPayroll, setEditingPayroll] = useState(false);
  const [tempPayrollSettings, setTempPayrollSettings] = useState({
    processingDay: 25,
    currency: "NGN",
    fiscalYear: "2024",
    payPeriod: "monthly",
  });

  // Quick settings state
  const [_notifications, setNotifications] = useState(true);

  // Notification preferences state
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [_notifPrefLoading, setNotifPrefLoading] = useState(true);

  const selectClasses = `mt-1 block w-full pl-3 pr-10 py-2 text-sm md:text-base 
                      border-gray-300 focus:outline-none focus:ring-0 
                      focus:border-green-500 rounded-lg cursor-pointer
                      !bg-green-600 text-white
                      transition-all duration-200 hover:!bg-green-700`;

  const inputClasses = `mt-1 block w-full px-3 py-2 text-sm md:text-base 
                      border border-gray-300 focus:outline-none focus:ring-0 
                      focus:border-green-500 rounded-lg
                      transition-all duration-200`;

  // Fetch system settings on component mount
  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);

      // Fetch general settings (accessible to all users)
      const generalResponse = await settingsService.getGeneralSettings();
      const generalSettings = generalResponse.data.data;

      // Update local state with fetched general data
      if (generalSettings.quickSettings) {
        setNotifications(generalSettings.quickSettings.notifications);
      }

      // Only fetch payroll settings if user is SUPER_ADMIN
      if (user?.role === "SUPER_ADMIN") {
        try {
          const response = await settingsService.getSystemSettings(
            user?.role,
            user?.permissions
          );
          const settings = response.data.data;
          setSystemSettings(settings);

          // Update local state with fetched payroll data
          if (settings.payrollSettings) {
            setPayrollSettings(settings.payrollSettings);
            setTempPayrollSettings(settings.payrollSettings);
          }
        } catch (payrollError) {
          console.warn("Could not fetch payroll settings:", payrollError);
          // Continue without payroll settings
        }
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePayrollEdit = () => {
    setTempPayrollSettings({ ...payrollSettings });
    setEditingPayroll(true);
  };

  const handlePayrollSave = async () => {
    try {
      setSaving(true);
      const updatedSettings = {
        payrollSettings: tempPayrollSettings,
      };

      await settingsService.updateSystemSettings(
        updatedSettings,
        user?.role,
        user?.permissions
      );
      setPayrollSettings(tempPayrollSettings);
      setEditingPayroll(false);
      toast.success("Payroll settings updated successfully");
    } catch (error) {
      console.error("Error updating payroll settings:", error);
      toast.error("Failed to update payroll settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePayrollCancel = () => {
    setTempPayrollSettings(payrollSettings);
    setEditingPayroll(false);
  };

  // Fetch notification preferences on mount
  useEffect(() => {
    console.log(
      "🚀 [Frontend] Component mounted, fetching notification preferences..."
    );
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setNotifPrefLoading(true);
      console.log("🔄 [Frontend] Fetching notification preferences...");
      const res = await notificationPreferenceService.getPreferences();
      console.log("📥 [Frontend] Received preferences response:", res.data);
      const prefs = res.data.data.preferences;
      setInAppEnabled(prefs.inApp.enabled);
      setEmailEnabled(prefs.email.enabled);
      console.log(
        "✅ [Frontend] Updated local state - InApp:",
        prefs.inApp.enabled,
        "Email:",
        prefs.email.enabled
      );
    } catch (e) {
      console.error("❌ [Frontend] Error fetching preferences:", e);
      // fallback to true
      setInAppEnabled(true);
      setEmailEnabled(true);
    } finally {
      setNotifPrefLoading(false);
    }
  };

  const handleInAppToggle = async () => {
    try {
      setNotifPrefLoading(true);
      const newValue = !inAppEnabled;
      console.log("🔄 [Frontend] Toggling In-App notifications to:", newValue);

      // Call backend and get updated preferences
      const res = await notificationPreferenceService.toggleChannel(
        "inApp",
        newValue
      );
      console.log("📥 [Frontend] In-App toggle response:", res.data);

      const updated = res.data.data.preferences.inApp.enabled;
      setInAppEnabled(updated);
      console.log("✅ [Frontend] In-App notifications updated to:", updated);
      toast.success(`In-App notifications ${updated ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error("❌ [Frontend] Error toggling In-App notifications:", e);
      toast.error("Failed to update in-app notification preference");
    } finally {
      setNotifPrefLoading(false);
    }
  };

  const handleEmailPrefToggle = async () => {
    try {
      setNotifPrefLoading(true);
      const newValue = !emailEnabled;
      console.log("🔄 [Frontend] Toggling Email notifications to:", newValue);

      // Call backend and get updated preferences
      const res = await notificationPreferenceService.toggleChannel(
        "email",
        newValue
      );
      console.log("📥 [Frontend] Email toggle response:", res.data);

      const updated = res.data.data.preferences.email.enabled;
      setEmailEnabled(updated);
      console.log("✅ [Frontend] Email notifications updated to:", updated);
      toast.success(`Email notifications ${updated ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error("❌ [Frontend] Error toggling Email notifications:", e);
      toast.error("Failed to update email notification preference");
    } finally {
      setNotifPrefLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Log what sections are visible to the current user
  console.log("👤 [Frontend] User role:", user?.role);
  console.log(
    "👤 [Frontend] Payroll Settings visible:",
    user?.role === "SUPER_ADMIN"
  );
  console.log("👤 [Frontend] Notification Preferences visible: ALL ROLES");
  console.log(
    "👤 [Frontend] Current notification states - Email:",
    emailEnabled,
    "InApp:",
    inAppEnabled
  );

  return (
    <div className="space-y-6">
      {/* Payroll Settings: Only show for SUPER_ADMIN */}
      {user?.role === "SUPER_ADMIN" && (
        <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-medium text-gray-900">
                Payroll Settings
              </h2>
              {!editingPayroll ? (
                <button
                  onClick={handlePayrollEdit}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaEdit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePayrollSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <FaSave className="h-4 w-4" />
                    <span>{saving ? "Saving..." : "Save"}</span>
                  </button>
                  <button
                    onClick={handlePayrollCancel}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FaTimes className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <FaCalendar className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-500">
                    Processing Day
                  </p>
                  {editingPayroll ? (
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={tempPayrollSettings.processingDay}
                      onChange={(e) =>
                        setTempPayrollSettings({
                          ...tempPayrollSettings,
                          processingDay: parseInt(e.target.value),
                        })
                      }
                      className={inputClasses}
                    />
                  ) : (
                    <p className="text-sm md:text-base text-gray-900">
                      {payrollSettings.processingDay}th of every month
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <FaDollarSign className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-500">
                    Default Currency
                  </p>
                  {editingPayroll ? (
                    <select
                      value={tempPayrollSettings.currency}
                      onChange={(e) =>
                        setTempPayrollSettings({
                          ...tempPayrollSettings,
                          currency: e.target.value,
                        })
                      }
                      className={selectClasses}
                    >
                      <option value="NGN">NGN - Nigerian Naira</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  ) : (
                    <p className="text-sm md:text-base text-gray-900">
                      {payrollSettings.currency}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <FaClock className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-500">
                    Fiscal Year
                  </p>
                  {editingPayroll ? (
                    <input
                      type="text"
                      value={tempPayrollSettings.fiscalYear}
                      onChange={(e) =>
                        setTempPayrollSettings({
                          ...tempPayrollSettings,
                          fiscalYear: e.target.value,
                        })
                      }
                      className={inputClasses}
                    />
                  ) : (
                    <p className="text-sm md:text-base text-gray-900">
                      {payrollSettings.fiscalYear}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <FaCalendar className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-500">
                    Pay Period
                  </p>
                  {editingPayroll ? (
                    <select
                      value={tempPayrollSettings.payPeriod}
                      onChange={(e) =>
                        setTempPayrollSettings({
                          ...tempPayrollSettings,
                          payPeriod: e.target.value,
                        })
                      }
                      className={selectClasses}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  ) : (
                    <p className="text-sm md:text-base text-gray-900">
                      {payrollSettings.payPeriod === "monthly"
                        ? "Monthly"
                        : payrollSettings.payPeriod === "weekly"
                        ? "Weekly"
                        : payrollSettings.payPeriod === "biweekly"
                        ? "Bi-weekly"
                        : payrollSettings.payPeriod === "quarterly"
                        ? "Quarterly"
                        : payrollSettings.payPeriod === "annual"
                        ? "Annual"
                        : payrollSettings.payPeriod}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences: Show for all roles */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Quick Settings
          </h2>
          <div className="space-y-4">
            <ToggleButton
              enabled={emailEnabled}
              onToggle={handleEmailPrefToggle}
              label="Email Notifications"
              description="Receive payroll processing notifications via email"
            />
            <ToggleButton
              enabled={inAppEnabled}
              onToggle={handleInAppToggle}
              label="In-App Notifications"
              description="Receive payroll processing notifications in-app"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
