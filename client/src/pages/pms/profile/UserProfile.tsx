import { useAuth } from "../../../context/AuthContext.js";
import { UserRole } from "../../../types/auth.js";
import {
  Card,
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
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  ContactEmergency as EmergencyIcon,
  AccountBalance as AccountBalanceIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { Permission } from "../../../types/auth.js";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { employeeService } from "../../../services/employeeService";
import { getProfileImageUrl } from "../../../utils/imageUtils";

interface Qualification {
  _id: string;
  highestEducation: string;
  institution: string;
  yearGraduated: string;
  id: string;
}

interface OnboardingTask {
  _id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
  id: string;
}

export default function UserProfile() {
  const { user: authUser, hasPermission } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: user, isLoading } = employeeService.useGetUserProfile();
  const { mutate: updateImage } = employeeService.useUpdateProfileImage();

  // Add state for image URL
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");

  // Update image URL when user changes
  useEffect(() => {
    setProfileImageUrl(getProfileImageUrl(user || {}));
  }, [user]);

  const canEditProfile =
    !!authUser &&
    !!user &&
    authUser._id === user._id &&
    hasPermission(Permission.EDIT_PERSONAL_INFO);

  const handleImageClick = () => {
    if (canEditProfile) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await updateImage(file);
      toast.success("Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to update profile image");
    } finally {
      setIsUploading(false);
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
    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        return (
          <div className="space-y-4">
            <Typography variant="subtitle2" className="text-blue-700 mb-2">
              Department:{" "}
              {typeof user?.department === "string"
                ? user.department
                : user?.department?.name || "Not assigned"}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Position: {user?.position || "Not assigned"}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              {user?.position} at{" "}
              {typeof user?.department === "string"
                ? user.department
                : user?.department?.name || "Not assigned"}
            </Typography>
          </div>
        );
      case UserRole.ADMIN:
        return (
          <div className="space-y-4">
            <Typography variant="subtitle2" className="text-yellow-700 mb-2">
              Employee ID: {user?.employeeId}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Position: {user?.position || "Not assigned"}
            </Typography>
          </div>
        );
      case UserRole.USER:
        return (
          <div className="space-y-4">
            <Typography variant="subtitle2" className="text-green-700 mb-2">
              Employee ID: {user?.employeeId}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Position: {user?.position || "Not assigned"}
            </Typography>
          </div>
        );
      default:
        return null;
    }
  };

  const renderQualifications = () => {
    if (!user?.personalDetails?.qualifications?.length) return null;

    return (
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100 mt-4">
        <Box className="flex items-center space-x-2 mb-4">
          <BadgeIcon className="text-green-600" />
          <Typography variant="h6" className="text-gray-800 font-semibold">
            Qualifications
          </Typography>
        </Box>
        <div className="space-y-4">
          {user.personalDetails.qualifications.map((qual: Qualification) => (
            <div
              key={qual._id}
              className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg"
            >
              <BadgeIcon className="text-green-600 mt-1" />
              <div>
                <Typography variant="subtitle1" className="font-medium">
                  {qual.highestEducation}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {qual.institution}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  Graduated: {qual.yearGraduated}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderNextOfKin = () => {
    if (!user?.personalDetails?.nextOfKin) return null;

    return (
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100 mt-4">
        <Box className="flex items-center space-x-2 mb-4">
          <EmergencyIcon className="text-green-600" />
          <Typography variant="h6" className="text-gray-800 font-semibold">
            Next of Kin
          </Typography>
        </Box>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
            <BadgeIcon className="text-green-600" />
            <div>
              <Typography variant="subtitle2" className="text-gray-700">
                {user.personalDetails.nextOfKin.name}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                Relationship: {user.personalDetails.nextOfKin.relationship}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                Phone: {user.personalDetails.nextOfKin.phone}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                Address: {user.personalDetails.nextOfKin.address.street},{" "}
                {user.personalDetails.nextOfKin.address.city},{" "}
                {user.personalDetails.nextOfKin.address.state}
              </Typography>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderOnboardingStatus = () => {
    if (!user?.onboarding) return null;

    return (
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100 mt-4">
        <Box className="flex items-center space-x-2 mb-4">
          <CalendarIcon className="text-green-600" />
          <Typography variant="h6" className="text-gray-800 font-semibold">
            Onboarding Status
          </Typography>
        </Box>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography variant="subtitle2" className="text-gray-700">
              Status: {user.onboarding.status}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Progress: {user.onboarding.progress}%
            </Typography>
          </div>
          <div className="space-y-2">
            {user.onboarding.tasks.map((task: OnboardingTask) => (
              <div key={task._id} className="flex items-center space-x-2">
                <CircleIcon
                  className={`${
                    task.completed ? "text-green-600" : "text-gray-400"
                  }`}
                  sx={{ fontSize: 12 }}
                />
                <Typography
                  variant="body2"
                  className={task.completed ? "text-gray-600" : "text-gray-500"}
                >
                  {task.name}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
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
                    src={profileImageUrl}
                    alt={`${user?.firstName} ${user?.lastName}`}
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
                    {!user?.profileImageUrl &&
                      !user?.profileImage &&
                      `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
                  </Avatar>

                  {canEditProfile && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleImageUpload(e.target.files[0]);
                          }
                        }}
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
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 text-sm sm:text-base"
                >
                  {user?.role}
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
                      {user?.email}
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
                      {user?.phone}
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
                      {user?.personalDetails?.address?.street},
                      {user?.personalDetails?.address?.city},
                      {user?.personalDetails?.address?.state}
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
                        {user?.bankDetails?.bankName} -{" "}
                        {user?.bankDetails?.accountNumber}
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
                      {user?.emergencyContact?.name} (
                      {user?.emergencyContact?.relationship})
                      <br />
                      {user?.emergencyContact?.phone}
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
                    <div>
                      {user?.personalDetails?.middleName && (
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          Middle Name: {user.personalDetails.middleName}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        className="text-gray-700 text-sm sm:text-base"
                      >
                        Date of Birth:{" "}
                        {user?.personalDetails?.dateOfBirth
                          ? new Date(
                              user.personalDetails.dateOfBirth
                            ).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Not set"}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="text-gray-700 text-sm sm:text-base"
                      >
                        Marital Status:{" "}
                        {user?.personalDetails?.maritalStatus
                          ? user.personalDetails.maritalStatus
                              .charAt(0)
                              .toUpperCase() +
                            user.personalDetails.maritalStatus.slice(1)
                          : "Not set"}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="text-gray-700 text-sm sm:text-base"
                      >
                        Nationality:{" "}
                        {user?.personalDetails?.nationality || "Not set"}
                      </Typography>
                    </div>
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
                      {user?.personalDetails?.address ? (
                        <>
                          {user.personalDetails.address.street},<br />
                          {user.personalDetails.address.city},<br />
                          {user.personalDetails.address.state},<br />
                          {user.personalDetails.address.country}{" "}
                          {user.personalDetails.address.zipCode}
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
              <Box className="flex items-center space-x-2 mb-4">
                <BadgeIcon className="text-green-600" />
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold"
                >
                  Employment Details
                </Typography>
              </Box>

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
                          {user?.dateJoined
                            ? new Date(user.dateJoined).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )
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
                          {user?.position || "Not set"}
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
                          {user?.gradeLevel || "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-4 bg-gray-50 shadow-sm rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <BadgeIcon className="text-green-600 text-lg sm:text-xl" />
                      <div className="truncate">
                        <Typography
                          variant="caption"
                          className="text-gray-500 text-xs sm:text-sm font-medium"
                        >
                          Employee ID
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-800 text-sm sm:text-base font-semibold truncate"
                        >
                          {user?.employeeId || "Not set"}
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
                          {user?.workLocation || "Not set"}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-green-50 rounded-lg transition-colors duration-200">
                      <CircleIcon
                        className={`${getStatusColor(
                          user?.status
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
                            user?.status
                          )} font-medium text-sm sm:text-base`}
                        >
                          {user?.status?.charAt(0).toUpperCase() +
                            user?.status?.slice(1) || "Not set"}
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
                          {user?.lastLogin
                            ? new Date(user.lastLogin).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
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
                          {user?.isEmailVerified ? "Verified" : "Not Verified"}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Qualifications */}
            {renderQualifications()}

            {/* Next of Kin */}
            {renderNextOfKin()}

            {/* Onboarding Status */}
            {renderOnboardingStatus()}
          </div>
        </div>
      )}
    </div>
  );
}
