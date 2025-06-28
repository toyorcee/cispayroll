import { useAuth } from "../../../context/AuthContext.js";
import { UserRole } from "../../../types/auth.js";
import {
  Card,
  Typography,
  Box,
  Avatar,
  Divider,
  CircularProgress,
  Button,
  TextField,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  ContactEmergency as EmergencyIcon,
  AccountBalance as AccountBalanceIcon,
  Circle as CircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { employeeService } from "../../../services/employeeService";
import { getProfileImageUrl } from "../../../utils/imageUtils";
import { profileService } from "../../../services/profileService";
import { toast } from "react-toastify";

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
  const { refreshUser } = useAuth();
  const {
    data: user,
    isLoading,
    refetch,
  } = employeeService.useGetUserProfile();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Add state for image URL
  const [_profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update image URL when user changes
  useEffect(() => {
    setProfileImageUrl(getProfileImageUrl(user || {}));
    if (user) {
      setForm(user);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePersonalDetailsChange = (e: any) => {
    setForm({
      ...form,
      personalDetails: {
        ...form.personalDetails,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleAddressChange = (e: any) => {
    setForm({
      ...form,
      personalDetails: {
        ...form.personalDetails,
        address: {
          ...form.personalDetails.address,
          [e.target.name]: e.target.value,
        },
      },
    });
  };

  const handleQualificationChange = (index: number, e: any) => {
    const newQualifications = [...form.personalDetails.qualifications];
    newQualifications[index] = {
      ...newQualifications[index],
      [e.target.name]: e.target.value,
    };
    setForm({
      ...form,
      personalDetails: {
        ...form.personalDetails,
        qualifications: newQualifications,
      },
    });
  };

  const addQualification = () => {
    const newQualification = {
      _id: `temp-${Date.now()}`,
      highestEducation: "",
      institution: "",
      yearGraduated: "",
      id: `temp-${Date.now()}`,
    };
    setForm({
      ...form,
      personalDetails: {
        ...form.personalDetails,
        qualifications: [
          ...(form.personalDetails?.qualifications || []),
          newQualification,
        ],
      },
    });
  };

  const removeQualification = (index: number) => {
    const newQualifications = [...form.personalDetails.qualifications];
    newQualifications.splice(index, 1);
    setForm({
      ...form,
      personalDetails: {
        ...form.personalDetails,
        qualifications: newQualifications,
      },
    });
  };

  const handleEmergencyContactChange = (e: any) => {
    setForm({
      ...form,
      emergencyContact: {
        ...form.emergencyContact,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      bankDetails: {
        ...form.bankDetails,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await profileService.updateProfileImage(file);
      refetch();
      await refreshUser();
      toast.success("Profile image updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile image.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allowed = [
        "firstName",
        "lastName",
        "phone",
        "personalDetails",
        "emergencyContact",
        "bankDetails",
      ];
      const data: any = {};
      for (const key of allowed) {
        if (form[key] !== undefined) data[key] = form[key];
      }
      if (
        data.personalDetails &&
        Array.isArray(data.personalDetails.qualifications)
      ) {
        data.personalDetails.qualifications =
          data.personalDetails.qualifications.map((qual: any) => {
            const cleaned = { ...qual };
            if (
              cleaned._id &&
              typeof cleaned._id === "string" &&
              cleaned._id.startsWith("temp-")
            ) {
              delete cleaned._id;
            }
            if (
              cleaned.id &&
              typeof cleaned.id === "string" &&
              cleaned.id.startsWith("temp-")
            ) {
              delete cleaned.id;
            }
            return cleaned;
          });
      }
      await profileService.updateProfile(data);
      toast.success("Profile updated successfully!");
      setEditMode(false);
      refetch();
      await refreshUser();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Update failed. Please try again."
      );
    } finally {
      setSaving(false);
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
    const qualifications = user?.personalDetails?.qualifications || [];
    const hasQualifications = qualifications.length > 0;

    return (
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100 mt-4">
        <Box className="flex items-center justify-between mb-4">
          <Box className="flex items-center space-x-2">
            <BadgeIcon className="text-green-600" />
            <Typography variant="h6" className="text-gray-800 font-semibold">
              Qualifications
            </Typography>
          </Box>
          {editMode && (
            <Button
              variant="outlined"
              size="small"
              onClick={addQualification}
              sx={{
                borderColor: "#16a34a",
                color: "#16a34a",
                "&:hover": {
                  borderColor: "#15803d",
                  backgroundColor: "#f0fdf4",
                },
              }}
            >
              Add Qualification
            </Button>
          )}
        </Box>

        {!hasQualifications && !editMode ? (
          <Typography
            variant="body2"
            className="text-gray-500 text-center py-4"
          >
            No qualifications added yet.
          </Typography>
        ) : (
          <div className="space-y-4">
            {editMode
              ? (form.personalDetails?.qualifications || []).map(
                  (qual: Qualification, index: number) => (
                    <div
                      key={qual._id || index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <Box className="flex justify-between items-center mb-3">
                        <Typography
                          variant="subtitle2"
                          className="text-gray-700"
                        >
                          Qualification {index + 1}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => removeQualification(index)}
                          sx={{
                            color: "#dc2626",
                            "&:hover": { backgroundColor: "#fef2f2" },
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Highest Education"
                            name="highestEducation"
                            value={qual.highestEducation || ""}
                            onChange={(e) =>
                              handleQualificationChange(index, e)
                            }
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Institution"
                            name="institution"
                            value={qual.institution || ""}
                            onChange={(e) =>
                              handleQualificationChange(index, e)
                            }
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Year Graduated"
                            name="yearGraduated"
                            value={qual.yearGraduated || ""}
                            onChange={(e) =>
                              handleQualificationChange(index, e)
                            }
                            fullWidth
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </div>
                  )
                )
              : qualifications.map((qual: Qualification) => (
                  <div
                    key={qual._id}
                    className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <BadgeIcon className="text-green-600 mt-1" />
                    <div className="flex-1">
                      <Typography
                        variant="subtitle1"
                        className="font-medium text-gray-800"
                      >
                        {qual.highestEducation || "Not specified"}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {qual.institution || "Institution not specified"}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Graduated: {qual.yearGraduated || "Year not specified"}
                      </Typography>
                    </div>
                  </div>
                ))}
          </div>
        )}
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
    <div className="flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full relative">
      {/* Top action buttons */}
      <Box
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 10,
          display: "flex",
          gap: 2,
        }}
      >
        {!editMode ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditMode(true)}
            sx={{
              backgroundColor: "#16a34a",
              color: "white",
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              boxShadow: 2,
              "&:hover": { backgroundColor: "#15803d" },
            }}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                backgroundColor: "#16a34a",
                color: "white",
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: 2,
                "&:hover": { backgroundColor: "#15803d" },
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setEditMode(false)}
              sx={{ ml: 1 }}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>
      {isLoading || !form ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left column - Personal Information */}
            <div className="w-full lg:w-1/3">
              <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <Box className="flex flex-col items-center mb-4 sm:mb-6">
                  <div className="relative">
                    <Avatar
                      src={getProfileImageUrl(user)}
                      alt={`${user?.firstName} ${user?.lastName}`}
                      sx={{
                        width: 100,
                        height: 100,
                        mb: 2,
                        cursor: "pointer",
                      }}
                      onClick={handleImageClick}
                    >
                      {!user?.profileImage &&
                        `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
                    </Avatar>
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
                          sx={{ border: "2px solid #fff" }}
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
                      {editMode ? (
                        <TextField
                          name="phone"
                          value={form.phone || ""}
                          onChange={handleChange}
                          variant="standard"
                          size="small"
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {user?.phone}
                        </Typography>
                      )}
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
                      {editMode ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              label="Street"
                              name="street"
                              value={
                                form.personalDetails?.address?.street || ""
                              }
                              onChange={handleAddressChange}
                              fullWidth
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="City"
                              name="city"
                              value={form.personalDetails?.address?.city || ""}
                              onChange={handleAddressChange}
                              fullWidth
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="State"
                              name="state"
                              value={form.personalDetails?.address?.state || ""}
                              onChange={handleAddressChange}
                              fullWidth
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Country"
                              name="country"
                              value={
                                form.personalDetails?.address?.country || ""
                              }
                              onChange={handleAddressChange}
                              fullWidth
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Zip Code"
                              name="zipCode"
                              value={
                                form.personalDetails?.address?.zipCode || ""
                              }
                              onChange={handleAddressChange}
                              fullWidth
                              margin="normal"
                            />
                          </Grid>
                        </Grid>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {user?.personalDetails?.address?.street},
                          {user?.personalDetails?.address?.city},
                          {user?.personalDetails?.address?.state}
                        </Typography>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <AccountBalanceIcon className="text-green-600 text-base sm:text-lg" />
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 text-xs sm:text-sm"
                      >
                        Bank Details
                      </Typography>
                      {editMode ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                          <TextField
                            label="Bank Name"
                            name="bankName"
                            value={form.bankDetails?.bankName || ""}
                            onChange={handleBankDetailsChange}
                            variant="standard"
                            size="small"
                          />
                          <TextField
                            label="Account Number"
                            name="accountNumber"
                            value={form.bankDetails?.accountNumber || ""}
                            onChange={handleBankDetailsChange}
                            variant="standard"
                            size="small"
                          />
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {user?.bankDetails?.bankName} -{" "}
                          {user?.bankDetails?.accountNumber}
                        </Typography>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <EmergencyIcon className="text-green-600 text-base sm:text-lg" />
                    <div>
                      <Typography
                        variant="caption"
                        className="text-gray-500 text-xs sm:text-sm"
                      >
                        Emergency Contact
                      </Typography>
                      {editMode ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                          <TextField
                            label="Name"
                            name="name"
                            value={form.emergencyContact?.name || ""}
                            onChange={handleEmergencyContactChange}
                            variant="standard"
                            size="small"
                          />
                          <TextField
                            label="Relationship"
                            name="relationship"
                            value={form.emergencyContact?.relationship || ""}
                            onChange={handleEmergencyContactChange}
                            variant="standard"
                            size="small"
                          />
                          <TextField
                            label="Phone"
                            name="phone"
                            value={form.emergencyContact?.phone || ""}
                            onChange={handleEmergencyContactChange}
                            variant="standard"
                            size="small"
                          />
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          {user?.emergencyContact?.name} (
                          {user?.emergencyContact?.relationship})
                          <br />
                          {user?.emergencyContact?.phone}
                        </Typography>
                      )}
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
                      {editMode ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                          <TextField
                            label="Middle Name"
                            name="middleName"
                            value={
                              editMode
                                ? form.personalDetails?.middleName
                                : user.personalDetails?.middleName
                            }
                            onChange={handlePersonalDetailsChange}
                            InputProps={{ readOnly: !editMode }}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                            value={
                              form.personalDetails?.dateOfBirth
                                ? form.personalDetails.dateOfBirth.split("T")[0]
                                : ""
                            }
                            onChange={handlePersonalDetailsChange}
                            variant="standard"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            label="Marital Status"
                            name="maritalStatus"
                            value={form.personalDetails?.maritalStatus || ""}
                            onChange={handlePersonalDetailsChange}
                            variant="standard"
                            size="small"
                          />
                          <TextField
                            label="Nationality"
                            name="nationality"
                            value={form.personalDetails?.nationality || ""}
                            onChange={handlePersonalDetailsChange}
                            variant="standard"
                            size="small"
                          />
                        </Box>
                      ) : (
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
                      )}
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
                              ? new Date(user.lastLogin).toLocaleString(
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
                            {user?.isEmailVerified
                              ? "Verified"
                              : "Not Verified"}
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
          {/* Bottom action buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 6,
              mb: 2,
              gap: 2,
            }}
          >
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{
                  backgroundColor: "#16a34a",
                  color: "white",
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  boxShadow: 2,
                  "&:hover": { backgroundColor: "#15803d" },
                }}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{
                    backgroundColor: "#16a34a",
                    color: "white",
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: 2,
                    "&:hover": { backgroundColor: "#15803d" },
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(false)}
                  sx={{ ml: 1 }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </>
      )}
    </div>
  );
}
