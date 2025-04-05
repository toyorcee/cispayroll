import { useAuth } from "../../../context/AuthContext.js";
import { UserRole } from "../../../types/auth.js";
import {
  Card,
  Grid,
  Typography,
  Box,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  ContactEmergency as EmergencyIcon,
  AccountBalance as AccountBalanceIcon,
  School as SchoolIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { Permission } from "../../../types/auth.js";
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { employeeService } from "../../../services/employeeService";
import { useQueryClient } from "@tanstack/react-query";

interface Qualification {
  _id: string;
  highestEducation: string;
  institution: string;
  yearGraduated: string;
  id: string;
}

interface ImageUploadResponse {
  success: boolean;
  message: string;
  profileImage: string;
}

export default function UserProfile() {
  const { user: authUser, hasPermission, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: userDetails, isLoading } = employeeService.useGetUserById(
    authUser?._id
  );

  const canEditProfile = hasPermission(Permission.VIEW_PERSONAL_INFO);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !authUser) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
      toast.error("Please upload a valid image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/employees/profile/image`,
        {
        method: "POST",
          credentials: "include",
        body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      const data: ImageUploadResponse = await response.json();

      if (data.success) {
        // Invalidate and refetch the user query
        await queryClient.invalidateQueries({
          queryKey: ["user", authUser._id],
        });
        toast.success(data.message || "Profile image updated successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-600";
      case "inactive":
        return "text-gray-400";
      case "suspended":
        return "text-yellow-500";
      case "terminated":
        return "text-red-500";
      case "pending":
        return "text-blue-500";
      case "offboarding":
        return "text-orange-500";
      default:
        return "text-gray-400";
    }
  };

  const renderRoleSpecificInfo = () => {
    switch (userDetails?.role) {
      case UserRole.SUPER_ADMIN:
        return (
          <Card className="p-6 mb-4 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Administrative Access
              </Typography>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                  Super Admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <Typography
                  variant="subtitle2"
                  className="text-purple-700 mb-2"
                >
                  System Configuration
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Full access to system settings and configurations
                </Typography>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <Typography variant="subtitle2" className="text-blue-700 mb-2">
                  User Management
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Complete control over user accounts and permissions
                </Typography>
              </div>
            </div>
          </Card>
        );

      case UserRole.ADMIN:
        return (
          <Card className="p-6 mb-4 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Department Management
              </Typography>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                  Admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Typography variant="subtitle2" className="text-blue-700 mb-2">
                  Department:{" "}
                  {typeof userDetails?.department === "string"
                    ? userDetails.department
                    : userDetails?.department?.name || "Not assigned"}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Manage department resources and team members
                </Typography>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Typography variant="subtitle2" className="text-green-700 mb-2">
                  Payroll Access
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Process and manage department payroll
                </Typography>
              </div>
            </div>
          </Card>
        );

      case UserRole.USER:
        return (
          <Card className="p-6 mb-4 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Employee Information
              </Typography>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                  Employee
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <Typography variant="subtitle2" className="text-green-700 mb-2">
                  Position Details
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {userDetails?.position} at{" "}
                  {typeof userDetails?.department === "string"
                    ? userDetails.department
                    : userDetails?.department?.name || "Not assigned"}
                </Typography>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <Typography
                  variant="subtitle2"
                  className="text-yellow-700 mb-2"
                >
                  Employee ID: {userDetails?.employeeId}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Access your employee resources and benefits
                </Typography>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left column - Personal Information */}
          <div className="w-full lg:w-1/3">
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <Box className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="relative">
                <Avatar
                    src={
                      userDetails?.profileImageUrl ||
                      (userDetails?.profileImage
                        ? `${
                            import.meta.env.VITE_API_URL
                          }/${userDetails.profileImage.replace(/\\/g, "/")}`
                        : undefined) ||
                      "/default-avatar.png"
                    }
                    alt={`${userDetails?.firstName} ${userDetails?.lastName}`}
                  sx={{
                      width: { xs: 100, sm: 120 },
                      height: { xs: 100, sm: 120 },
                    mb: 2,
                    border: "4px solid #fff",
                    boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                    cursor: canEditProfile ? "pointer" : "default",
                      backgroundColor: "#e5e7eb",
                  }}
                  onClick={canEditProfile ? handleImageClick : undefined}
                  >
                    {!userDetails?.profileImageUrl &&
                      !userDetails?.profileImage &&
                      `${userDetails?.firstName?.[0]}${userDetails?.lastName?.[0]}`}
                  </Avatar>

                {canEditProfile && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/gif"
                      style={{ display: "none" }}
                    />
                    <Tooltip title="Update Photo">
                      <IconButton
                        size="small"
                        className="absolute bottom-0 right-0 bg-green-50 hover:bg-green-100 shadow-md"
                        sx={{
                          border: "2px solid #fff",
                          "&:hover": {
                            backgroundColor: "#f0fdf4",
                          },
                        }}
                        onClick={handleImageClick}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                            <CircularProgress
                              size={16}
                              className="text-green-600"
                            />
                        ) : (
                          <EditIcon className="text-green-600 w-4 h-4" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </div>
              <Typography
                variant="h5"
                  className="text-gray-800 font-semibold mt-4 text-base sm:text-lg md:text-xl text-center"
              >
                  {userDetails?.firstName} {userDetails?.lastName}
              </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 text-sm sm:text-base"
                >
                  {userDetails?.role}
              </Typography>
            </Box>

              <Divider className="my-3 sm:my-4" />

              <Box className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <EmailIcon className="text-green-600 text-base sm:text-lg" />
                <div>
                    <Typography
                      variant="caption"
                      className="text-gray-500 text-xs sm:text-sm"
                    >
                    Email
                  </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-sm sm:text-base break-all"
                    >
                      {userDetails?.email}
                  </Typography>
                </div>
              </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <PhoneIcon className="text-green-600 text-base sm:text-lg" />
                <div>
                    <Typography
                      variant="caption"
                      className="text-gray-500 text-xs sm:text-sm"
                    >
                    Phone
                  </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-sm sm:text-base"
                    >
                      {userDetails?.phone}
                  </Typography>
                </div>
              </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <LocationIcon className="text-green-600 text-base sm:text-lg" />
                <div>
                    <Typography
                      variant="caption"
                      className="text-gray-500 text-xs sm:text-sm"
                    >
                      Address
                  </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-sm sm:text-base"
                    >
                      {userDetails?.personalDetails?.address?.street},
                      {userDetails?.personalDetails?.address?.city},
                      {userDetails?.personalDetails?.address?.state}
                  </Typography>
                </div>
              </div>

                {canEditProfile && (
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <AccountBalanceIcon className="text-green-600 text-base sm:text-lg" />
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 text-xs sm:text-sm"
                      >
                        Bank Details
                      </Typography>
                      <Typography
                        variant="body2"
                        className="text-gray-700 text-sm sm:text-base"
                      >
                        {userDetails?.bankDetails?.bankName} -{" "}
                        {userDetails?.bankDetails?.accountNumber}
                      </Typography>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <EmergencyIcon className="text-green-600 text-base sm:text-lg" />
                        <div>
                          <Typography
                            variant="caption"
                      className="text-gray-500 text-xs sm:text-sm"
                          >
                      Emergency Contact
                          </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-sm sm:text-base"
                    >
                      {userDetails?.emergencyContact?.name} (
                      {userDetails?.emergencyContact?.relationship})
                      <br />
                      {userDetails?.emergencyContact?.phone}
                          </Typography>
                        </div>
                      </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <BadgeIcon className="text-green-600 text-base sm:text-lg" />
                        <div>
                          <Typography
                            variant="caption"
                      className="text-gray-500 text-xs sm:text-sm"
                          >
                      Personal Information
                          </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-sm sm:text-base"
                    >
                      {userDetails?.personalDetails?.middleName && (
                        <div>
                          Middle Name: {userDetails.personalDetails.middleName}
                        </div>
                      )}
                      <div>
                        Date of Birth:{" "}
                        {userDetails?.personalDetails?.dateOfBirth
                          ? new Date(
                              userDetails.personalDetails.dateOfBirth
                            ).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Not set"}
                      </div>
                      <div>
                        Marital Status:{" "}
                        {userDetails?.personalDetails?.maritalStatus
                          ? userDetails.personalDetails.maritalStatus
                              .charAt(0)
                              .toUpperCase() +
                            userDetails.personalDetails.maritalStatus.slice(1)
                          : "Not set"}
                      </div>
                      <div>
                        Nationality:{" "}
                        {userDetails?.personalDetails?.nationality || "Not set"}
                      </div>
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <LocationIcon className="text-green-600 text-base sm:text-lg" />
                  <div>
                    <Typography
                      variant="caption"
                      className="text-gray-500 text-xs sm:text-sm"
                    >
                      Full Address
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-sm sm:text-base"
                    >
                      {userDetails?.personalDetails?.address ? (
                        <>
                          {userDetails.personalDetails.address.street},<br />
                          {userDetails.personalDetails.address.city},<br />
                          {userDetails.personalDetails.address.state},<br />
                          {userDetails.personalDetails.address.country}{" "}
                          {userDetails.personalDetails.address.zipCode}
                        </>
                      ) : (
                        "Address not set"
                      )}
                    </Typography>
                  </div>
                </div>
              </Box>
            </Card>
          </div>

          {/* Right column - Role-specific and Employment Details */}
          <div className="w-full lg:w-2/3">
            {renderRoleSpecificInfo()}

            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold mb-4 sm:mb-6 text-base sm:text-lg"
              >
                Employment Details
              </Typography>

              {/* Replace inner Grid with flex */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Left column */}
                <div className="w-full sm:w-1/2">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <CalendarIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Join Date
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.dateJoined
                            ? new Date(
                                userDetails.dateJoined
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <BadgeIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Position
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.position || "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <BadgeIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Grade Level
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.gradeLevel || "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <BadgeIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Employee ID
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.employeeId || "Not set"}
                        </Typography>
                      </div>
                    </div>
                      </div>
                    </div>

                {/* Right column */}
                <div className="w-full sm:w-1/2">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <LocationIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Work Location
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.workLocation || "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-green-50 rounded-lg transition-colors duration-200">
                      <CircleIcon
                        className={`${getStatusColor(
                          userDetails?.status
                        )} animate-pulse`}
                        sx={{ fontSize: "12px" }}
                      />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Employment Status
                        </Typography>
                        <Typography
                          variant="body2"
                          className={`${getStatusColor(
                            userDetails?.status
                          )} font-medium text-sm sm:text-base`}
                        >
                          {userDetails?.status?.charAt(0).toUpperCase() +
                            userDetails?.status?.slice(1) || "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <CalendarIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Last Login
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.lastLogin
                            ? new Date(userDetails.lastLogin).toLocaleString(
                                "en-US",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )
                            : "Not available"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <EmailIcon className="text-green-600 text-base sm:text-lg" />
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm"
                        >
                          Email Status
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {userDetails?.isEmailVerified
                            ? "Verified"
                            : "Not Verified"}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
                    </div>
                  </div>
                )}
    </div>
  );
}
