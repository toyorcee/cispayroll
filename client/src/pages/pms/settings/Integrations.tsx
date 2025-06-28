"use client";

import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaCube,
  FaCloud,
  FaLock,
  FaSync,
  FaSpinner,
} from "react-icons/fa";
import { integrations, apiAccess } from "../../../data/settings";
import { toast } from "react-toastify";
import { integrationSettingsService } from "../../../services/integrationSettingsService";

export default function Integrations() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [integrationStates, setIntegrationStates] = useState<{
    [key: string]: string;
  }>({});
  const [apiKey, setApiKey] = useState(apiAccess.apiKey);
  const [generating, setGenerating] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(apiAccess.webhookUrl);
  const [webhookInput, setWebhookInput] = useState(apiAccess.webhookUrl);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [integrationsData, setIntegrationsData] = useState(integrations);
  const [_apiAccessData, setApiAccessData] = useState(apiAccess);

  const iconMap = {
    CloudArrowUpIcon: FaCloud,
    LockClosedIcon: FaLock,
    ArrowPathIcon: FaSync,
  };

  // Fetch integration settings on component mount
  useEffect(() => {
    fetchIntegrationSettings();
  }, []);

  const fetchIntegrationSettings = async () => {
    try {
      const response =
        await integrationSettingsService.getIntegrationSettings();
      const settings = response.data?.data || response.data;

      if (settings?.integrations && settings.integrations.length > 0) {
        setIntegrationsData(settings.integrations);
      } else {
        setIntegrationsData(integrations);
      }

      if (settings.apiAccess) {
        setApiAccessData(settings.apiAccess);
        setApiKey(settings.apiAccess.apiKey || apiAccess.apiKey);
        setWebhookUrl(settings.apiAccess.webhookUrl || apiAccess.webhookUrl);
        setWebhookInput(settings.apiAccess.webhookUrl || apiAccess.webhookUrl);
      }

      // Initialize integration states from backend data
      const initialStates: { [key: string]: string } = {};
      settings.integrations?.forEach((category: any) => {
        category.options?.forEach((option: any) => {
          initialStates[option.id] = option.status;
        });
      });
      setIntegrationStates(initialStates);
    } catch (err: any) {
      console.error(
        "❌ [Integrations] Failed to fetch integration settings:",
        err
      );
    }
  };

  const handleConnect = (integrationId: string, integrationName: string) => {
    setIntegrationStates((prev) => ({ ...prev, [integrationId]: "connected" }));
    toast.success(`${integrationName} connected successfully`);
  };

  const handleDisconnect = (integrationId: string, integrationName: string) => {
    setIntegrationStates((prev) => ({ ...prev, [integrationId]: "available" }));
    toast.success(`${integrationName} disconnected successfully`);
  };

  const handleConfigure = (integrationName: string) => {
    toast.info(`Configuring ${integrationName}...`);
  };

  const handleShowApiKey = () => {
    setShowApiKey(!showApiKey);
    toast.info(showApiKey ? "API key hidden" : "API key revealed");
  };

  const handleGenerateApiKey = async () => {
    setGenerating(true);
    try {
      const response = await integrationSettingsService.generateApiKey();
      const newApiKey = response.data.apiKey;

      setApiKey(newApiKey);
      setApiAccessData((prev) => ({ ...prev, apiKey: newApiKey }));
      setShowApiKey(true);
      toast.success("New API key generated successfully");
    } catch (err: any) {
      console.error("❌ [Integrations] Failed to generate API key:", err);
      toast.error(
        err.response?.data?.message || "Failed to generate new API key"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleEditWebhook = () => {
    setEditingWebhook(true);
    setWebhookInput(webhookUrl);
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const response = await integrationSettingsService.updateWebhookUrl(
        webhookInput
      );

      setWebhookUrl(webhookInput);
      setApiAccessData((prev) => ({ ...prev, webhookUrl: webhookInput }));
      setEditingWebhook(false);
      toast.success(
        response.data.message || "Webhook URL updated successfully"
      );
    } catch (err: any) {
      console.error("❌ [Integrations] Failed to save webhook URL:", err);
      toast.error(
        err.response?.data?.message || "Failed to update webhook URL"
      );
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleCancelWebhook = () => {
    setEditingWebhook(false);
    setWebhookInput(webhookUrl);
  };

  return (
    <div className="space-y-6">
      {integrationsData.map((category) => {
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
                {category.options.map((integration) => {
                  const currentStatus =
                    integrationStates[integration.id] || integration.status;

                  return (
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
                          {currentStatus === "connected" && (
                            <p className="text-xs text-gray-500">
                              Last synced: {integration.lastSync}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {currentStatus === "connected" ? (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheckCircle className="h-4 w-4 mr-1" />
                              Connected
                            </span>
                            <button
                              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                              onClick={() => handleConfigure(integration.name)}
                            >
                              Configure
                            </button>
                            <button
                              className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200 cursor-pointer"
                              onClick={() =>
                                handleDisconnect(
                                  integration.id,
                                  integration.name
                                )
                              }
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <FaTimesCircle className="h-4 w-4 mr-1" />
                              Available
                            </span>
                            <button
                              className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer"
                              onClick={() =>
                                handleConnect(integration.id, integration.name)
                              }
                            >
                              Connect
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  value={showApiKey ? apiKey : "••••••••••••••••"}
                  readOnly
                  className="block w-48 sm:w-64 rounded-lg border-gray-300 shadow-sm 
                           focus:border-green-500 focus:ring-0 text-sm bg-gray-50 cursor-pointer"
                />
                <button
                  onClick={handleShowApiKey}
                  className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
                <button
                  onClick={handleGenerateApiKey}
                  className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer flex items-center"
                  disabled={generating}
                >
                  {generating ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : null}
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
                {editingWebhook ? (
                  <>
                    <input
                      type="text"
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      className="block w-48 sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-0 text-sm bg-gray-50"
                      disabled={savingWebhook}
                    />
                    <button
                      onClick={handleSaveWebhook}
                      className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer flex items-center"
                      disabled={savingWebhook}
                    >
                      {savingWebhook ? (
                        <FaSpinner className="animate-spin mr-1" />
                      ) : null}
                      Save
                    </button>
                    <button
                      onClick={handleCancelWebhook}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                      disabled={savingWebhook}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={webhookUrl}
                      readOnly
                      className="block w-48 sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-0 text-sm bg-gray-50 cursor-pointer"
                    />
                    <button
                      onClick={handleEditWebhook}
                      className="text-sm !text-green-600 hover:!text-green-700 transition-colors duration-200 cursor-pointer"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
