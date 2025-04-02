import { useState } from "react";
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaIdCard } from "react-icons/fa";
import { companyProfile } from "../../../data/settings";
import { Link } from "react-router-dom";

export default function CompanyProfile() {
  const [isEditing, setIsEditing] = useState(false);

  const inputClasses =
    "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm md:text-base " +
    "focus:outline-none focus:ring-green-500 focus:border-green-500 " +
    "transition-all duration-200 hover:border-green-400 " +
    "disabled:bg-gray-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/pms/settings/company/edit"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
          onClick={() => setIsEditing(!isEditing)}
        >
          <span className="text-sm md:text-base">
            {isEditing ? "Save Changes" : "Edit Profile"}
          </span>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <FaBuilding className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Basic Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.basic.name}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.basic.registrationNumber}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Tax ID
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.basic.taxId}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Industry
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.basic.industry}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <FaPhone className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Contact Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                disabled={!isEditing}
                defaultValue={companyProfile.contact.email}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                disabled={!isEditing}
                defaultValue={companyProfile.contact.phone}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                disabled={!isEditing}
                defaultValue={companyProfile.contact.website}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <FaMapMarkerAlt className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Address
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.address.street}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.address.city}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.address.state}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.address.country}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.address.postalCode}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <FaIdCard className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Legal Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Incorporation Date
              </label>
              <input
                type="date"
                disabled={!isEditing}
                defaultValue={companyProfile.legal.incorporationDate}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Business Type
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.legal.businessType}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                Fiscal Year
              </label>
              <input
                type="text"
                disabled={!isEditing}
                defaultValue={companyProfile.legal.fiscalYear}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
