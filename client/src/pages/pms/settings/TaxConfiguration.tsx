"use client";

import { useState } from "react";
import { FaCalculator, FaPlus, FaTrash, FaPencilAlt } from "react-icons/fa";
import { taxBrackets, taxSettings } from "../../../data/settings";
import { Link } from "react-router-dom";

export default function TaxConfiguration() {
  const [isEditing, setIsEditing] = useState(false);

  const inputClasses =
    "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 " +
    "focus:outline-none focus:ring-0 focus:border-green-500 sm:text-sm " +
    "transition-all duration-200 hover:border-green-400 " +
    "disabled:bg-gray-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/pms/settings/tax/edit"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Save Changes" : "Edit Configuration"}
        </Link>
      </div>

      {/* Tax Brackets */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <FaCalculator className="h-5 w-5 md:h-6 md:w-6 text-green-600 mr-2" />
              <h2 className="text-base md:text-lg font-medium text-gray-900">
                Tax Brackets
              </h2>
            </div>
            {isEditing && (
              <button
                className="inline-flex items-center px-3 py-1 border border-transparent 
                         text-sm font-medium rounded-lg text-white !bg-green-600 
                         hover:!bg-green-700 transition-all duration-200 cursor-pointer
                         transform hover:-translate-y-1 hover:shadow-md"
              >
                <FaPlus className="h-4 w-4 mr-1" />
                Add Bracket
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  {isEditing && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxBrackets.map((bracket) => (
                  <tr
                    key={bracket.id}
                    className="hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{bracket.from.toLocaleString()} -{" "}
                      {bracket.to ? `₦${bracket.to.toLocaleString()}` : "Above"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bracket.rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bracket.description}
                    </td>
                    {isEditing && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="!text-green-600 hover:!text-green-700 mr-4 transition-all duration-200 
                                 cursor-pointer hover:scale-110"
                        >
                          <FaPencilAlt className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-700 transition-all duration-200 
                                 cursor-pointer hover:scale-110"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Other Tax Settings */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Other Tax Settings
          </h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div className="transition-all duration-200 hover:shadow-md rounded-lg p-4 hover:bg-gray-50">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Minimum Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={!isEditing}
                defaultValue={taxSettings.minimumTaxRate}
                className={`${inputClasses} ${
                  isEditing
                    ? "hover:border-green-500 hover:ring-1 hover:ring-green-500"
                    : ""
                }`}
              />
            </div>
            <div className="transition-all duration-200 hover:shadow-md rounded-lg p-4 hover:bg-gray-50">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Consolidated Relief Allowance (₦)
              </label>
              <input
                type="number"
                disabled={!isEditing}
                defaultValue={taxSettings.consolidatedReliefAllowance}
                className={`${inputClasses} ${
                  isEditing
                    ? "hover:border-green-500 hover:ring-1 hover:ring-green-500"
                    : ""
                }`}
              />
            </div>
            <div className="transition-all duration-200 hover:shadow-md rounded-lg p-4 hover:bg-gray-50">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Pension Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={!isEditing}
                defaultValue={taxSettings.pensionRate}
                className={`${inputClasses} ${
                  isEditing
                    ? "hover:border-green-500 hover:ring-1 hover:ring-green-500"
                    : ""
                }`}
              />
            </div>
            <div className="transition-all duration-200 hover:shadow-md rounded-lg p-4 hover:bg-gray-50">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                NHF Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={!isEditing}
                defaultValue={taxSettings.nhfRate}
                className={`${inputClasses} ${
                  isEditing
                    ? "hover:border-green-500 hover:ring-1 hover:ring-green-500"
                    : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
