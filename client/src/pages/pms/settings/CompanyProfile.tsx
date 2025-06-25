import { useEffect, useState } from "react";
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaIdCard } from "react-icons/fa";
import { settingsService } from "../../../services/settingsService";
import { Button } from "@mui/material";
import CompanyProfileSkeleton from "../../../components/skeletons/CompanyProfileSkeleton";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";

export default function CompanyProfile() {
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isSuperAdmin, isAdmin } = useAuth();

  useEffect(() => {
    // Log user information for debugging
    console.log("🔍 [CompanyProfile] User info:", {
      user: user
        ? {
            _id: user._id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
          }
        : null,
      isSuperAdmin: isSuperAdmin(),
      isAdmin: isAdmin(),
    });

    settingsService
      .getCompanyProfile()
      .then((res) => {
        console.log(
          "✅ [CompanyProfile] Company profile loaded successfully:",
          res.data
        );
        // Handle new response structure
        const profileData = res.data.data || res.data;
        setCompanyProfile(profileData);
        setEditProfile(profileData);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error(
          "❌ [CompanyProfile] Error loading company profile:",
          err
        );
        setLoading(false);
        if (err.response?.status === 403) {
          setError("Access denied. Super admin permissions required.");
        } else {
          setError("Failed to load company profile. Please try again.");
        }
      });
  }, [user, isSuperAdmin, isAdmin]);

  const handleChange = (section: string, field: string, value: string) => {
    setEditProfile((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await settingsService.updateCompanyProfile(editProfile);
      console.log("✅ [CompanyProfile] Save response:", response);

      // Handle new response structure
      const profileData = response.data.data || response.data;
      setCompanyProfile(profileData);
      setIsEditing(false);

      // Show success toast
      const message =
        response.data.message || "Company profile updated successfully";
      toast.success(message);
    } catch (err: any) {
      console.error("❌ [CompanyProfile] Error saving profile:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to update company profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditProfile(companyProfile);
    setIsEditing(false);
  };

  const inputClasses =
    "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm md:text-base " +
    "focus:outline-none focus:ring-green-500 focus:border-green-500 " +
    "transition-all duration-200 hover:border-green-400 " +
    "disabled:bg-gray-50 disabled:cursor-not-allowed";

  if (loading) {
    return <CompanyProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Access Denied
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                {user && (
                  <p className="mt-1">
                    Current role:{" "}
                    <span className="font-medium">{user.role}</span>
                    {user.permissions.length > 0 && (
                      <span className="ml-2">
                        Permissions: {user.permissions.join(", ")}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!editProfile) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <Button
            variant="contained"
            color="success"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        )}
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
                value={editProfile.basic?.name || ""}
                onChange={(e) => handleChange("basic", "name", e.target.value)}
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
                value={editProfile.basic?.registrationNumber || ""}
                onChange={(e) =>
                  handleChange("basic", "registrationNumber", e.target.value)
                }
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
                value={editProfile.basic?.taxId || ""}
                onChange={(e) => handleChange("basic", "taxId", e.target.value)}
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
                value={editProfile.basic?.industry || ""}
                onChange={(e) =>
                  handleChange("basic", "industry", e.target.value)
                }
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
                value={editProfile.contact?.email || ""}
                onChange={(e) =>
                  handleChange("contact", "email", e.target.value)
                }
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
                value={editProfile.contact?.phone || ""}
                onChange={(e) =>
                  handleChange("contact", "phone", e.target.value)
                }
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
                value={editProfile.contact?.website || ""}
                onChange={(e) =>
                  handleChange("contact", "website", e.target.value)
                }
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
                value={editProfile.address?.street || ""}
                onChange={(e) =>
                  handleChange("address", "street", e.target.value)
                }
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
                value={editProfile.address?.city || ""}
                onChange={(e) =>
                  handleChange("address", "city", e.target.value)
                }
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
                value={editProfile.address?.state || ""}
                onChange={(e) =>
                  handleChange("address", "state", e.target.value)
                }
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
                value={editProfile.address?.country || ""}
                onChange={(e) =>
                  handleChange("address", "country", e.target.value)
                }
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
                value={editProfile.address?.postalCode || ""}
                onChange={(e) =>
                  handleChange("address", "postalCode", e.target.value)
                }
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
                value={editProfile.legal?.incorporationDate || ""}
                onChange={(e) =>
                  handleChange("legal", "incorporationDate", e.target.value)
                }
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
                value={editProfile.legal?.businessType || ""}
                onChange={(e) =>
                  handleChange("legal", "businessType", e.target.value)
                }
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
                value={editProfile.legal?.fiscalYear || ""}
                onChange={(e) =>
                  handleChange("legal", "fiscalYear", e.target.value)
                }
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
