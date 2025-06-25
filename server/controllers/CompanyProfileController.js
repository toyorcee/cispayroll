import CompanyProfile from "../models/CompanyProfile.js";

export const CompanyProfileController = {
  async getProfile(req, res) {
    try {
      console.log("🔍 [CompanyProfileController] Getting company profile");
      let profile = await CompanyProfile.findOne();

      if (!profile) {
        console.log(
          "📝 [CompanyProfileController] No profile found, creating default profile"
        );
        profile = await CompanyProfile.create({
          basic: {
            name: "Your Company Name", // Default value for required field
            registrationNumber: "",
            taxId: "",
            industry: "",
          },
          contact: {
            email: "",
            phone: "",
            website: "",
          },
          address: {
            street: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
          },
          legal: {
            incorporationDate: "",
            businessType: "",
            fiscalYear: "",
          },
        });
        console.log(
          "✅ [CompanyProfileController] Default profile created:",
          profile
        );
      } else {
        console.log(
          "✅ [CompanyProfileController] Existing profile found:",
          profile
        );
      }

      res.json({
        success: true,
        message: "Company profile retrieved successfully",
        data: profile,
      });
    } catch (err) {
      console.error(
        "❌ [CompanyProfileController] Error getting profile:",
        err
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch company profile",
        error: err.message,
      });
    }
  },

  async updateProfile(req, res) {
    try {
      console.log(
        "🔍 [CompanyProfileController] Updating company profile with data:",
        req.body
      );
      let profile = await CompanyProfile.findOne();

      const { _id, createdAt, updatedAt, __v, ...updateData } = req.body;

      if (!profile) {
        console.log(
          "📝 [CompanyProfileController] No profile found, creating new profile"
        );
        profile = await CompanyProfile.create(updateData);
      } else {
        console.log(
          "📝 [CompanyProfileController] Updating existing profile with filtered data:",
          updateData
        );
        await CompanyProfile.updateOne({ _id: profile._id }, updateData);
        profile = await CompanyProfile.findById(profile._id);
      }

      console.log(
        "✅ [CompanyProfileController] Profile updated successfully:",
        profile
      );
      res.json({
        success: true,
        message: "Company profile updated successfully",
        data: profile,
      });
    } catch (err) {
      console.error(
        "❌ [CompanyProfileController] Error updating profile:",
        err
      );
      res.status(500).json({
        success: false,
        message: "Failed to update company profile",
        error: err.message,
      });
    }
  },
};
