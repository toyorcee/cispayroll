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
} from "@mui/icons-material";
import { Permission } from "../../../types/auth.js";

export default function UserProfile() {
  const { user, hasPermission } = useAuth();

  const canEditProfile = hasPermission(Permission.VIEW_PERSONAL_INFO);

  const renderRoleSpecificInfo = () => {
    switch (user?.role) {
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
                  {typeof user?.department === "string"
                    ? user.department
                    : user?.department?.name || "Not assigned"}
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
                  {user?.position} at{" "}
                  {typeof user?.department === "string"
                    ? user.department
                    : user?.department?.name || "Not assigned"}
                </Typography>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <Typography
                  variant="subtitle2"
                  className="text-yellow-700 mb-2"
                >
                  Employee ID: {user.employeeId}
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
    <div className="p-6 max-w-7xl mx-auto">
      <Typography variant="h4" className="mb-6 text-gray-800 font-bold">
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={4}>
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <Box className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar
                  src={user?.profileImage}
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    border: "4px solid #fff",
                    boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                  }}
                />
                {canEditProfile && (
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
                    >
                      <EditIcon className="text-green-600 w-4 h-4" />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
              <Typography
                variant="h5"
                className="text-gray-800 font-semibold mt-4"
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                {user?.role}
              </Typography>
            </Box>

            <Divider className="my-4" />

            <Box className="space-y-4">
              <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <EmailIcon className="text-gray-400" />
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    Email
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    {user?.email}
                  </Typography>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <PhoneIcon className="text-gray-400" />
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    Phone
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    {user?.phone}
                  </Typography>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <EmergencyIcon className="text-gray-400" />
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    Emergency Contact
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    {user?.emergencyContact
                      ? typeof user.emergencyContact === "string"
                        ? user.emergencyContact
                        : `${user.emergencyContact.name} (${user.emergencyContact.phone})`
                      : "Not set"}
                  </Typography>
                </div>
              </div>
            </Box>
          </Card>
        </Grid>

        {/* Role-specific and Employment Details */}
        <Grid item xs={12} md={8}>
          {renderRoleSpecificInfo()}

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <Typography
              variant="h6"
              className="text-gray-800 font-semibold mb-6"
            >
              Employment Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <CalendarIcon className="text-gray-400" />
                    <div>
                      <Typography variant="caption" className="text-gray-500">
                        Join Date
                      </Typography>
                    </div>
                  </div>

                  {(user?.role === UserRole.USER ||
                    user?.role === UserRole.ADMIN) && (
                    <>
                      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                        <BusinessIcon className="text-gray-400" />
                        <div>
                          <Typography
                            variant="caption"
                            className="text-gray-500"
                          >
                            Department
                          </Typography>
                          <Typography variant="body2" className="text-gray-700">
                            {typeof user?.department === "string"
                              ? user.department
                              : user?.department?.name || "Not assigned"}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                        <BadgeIcon className="text-gray-400" />
                        <div>
                          <Typography
                            variant="caption"
                            className="text-gray-500"
                          >
                            Position
                          </Typography>
                          <Typography variant="body2" className="text-gray-700">
                            {user?.position} at{" "}
                            {typeof user?.department === "string"
                              ? user.department
                              : user?.department?.name || "Not assigned"}
                          </Typography>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                {user?.role !== UserRole.SUPER_ADMIN && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <BadgeIcon className="text-gray-400" />
                      <div>
                        <Typography variant="caption" className="text-gray-500">
                          Employee ID
                        </Typography>
                        <Typography variant="body2" className="text-gray-700">
                          {user?.employeeId}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <LocationIcon className="text-gray-400" />
                      <div>
                        <Typography variant="caption" className="text-gray-500">
                          Work Location
                        </Typography>
                        <Typography variant="body2" className="text-gray-700">
                          {user?.workLocation}
                        </Typography>
                      </div>
                    </div>
                  </div>
                )}
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
