import User from "../models/User.js";

export const ProfileController = {
  // Get current user's profile
  async getProfile(req, res) {
    try {
      console.log(
        "🔍 [ProfileController] Getting profile for user ID:",
        req.user.id
      );

      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        console.log(
          "❌ [ProfileController] User not found for ID:",
          req.user.id
        );
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        "✅ [ProfileController] Profile retrieved successfully for user:",
        {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      );

      res.json(user);
    } catch (error) {
      console.error("❌ [ProfileController] Error getting profile:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Update current user's profile
  async updateProfile(req, res) {
    try {
      console.log(
        "🔄 [ProfileController] Updating profile for user ID:",
        req.user.id
      );
      console.log(
        "📥 [ProfileController] Request body received:",
        JSON.stringify(req.body, null, 2)
      );

      // Only allow safe fields to be updated
      const allowedFields = [
        "firstName",
        "lastName",
        "phone",
        "profileImage",
        "personalDetails",
        "emergencyContact",
        "bankDetails",
      ];

      const updates = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
          console.log(
            `✅ [ProfileController] Field '${key}' will be updated:`,
            req.body[key]
          );
        }
      }

      console.log(
        "📝 [ProfileController] Final updates object:",
        JSON.stringify(updates, null, 2)
      );

      const user = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        console.log(
          "❌ [ProfileController] User not found for update, ID:",
          req.user.id
        );
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        "✅ [ProfileController] Profile updated successfully for user:",
        {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          updatedFields: Object.keys(updates),
        }
      );

      res.json(user);
    } catch (error) {
      console.error("❌ [ProfileController] Error updating profile:", error);
      console.error("❌ [ProfileController] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      res.status(500).json({ message: error.message });
    }
  },

  // Update profile image
  async updateProfileImage(req, res) {
    try {
      console.log(
        "🔄 [ProfileController] Updating profile image for user ID:",
        req.user.id
      );

      if (!req.file) {
        console.log("❌ [ProfileController] No file uploaded.");
        return res.status(400).json({ message: "No image file uploaded." });
      }

      // Save only the relative path, not the full system path
      const profileImage = `uploads/profiles/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileImage: profileImage },
        { new: true, runValidators: false }
      ).select("-password");

      if (!user) {
        console.log(
          "❌ [ProfileController] User not found for image update, ID:",
          req.user.id
        );
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        "✅ [ProfileController] Profile image updated successfully for user:",
        {
          id: user._id,
          newImagePath: profileImage,
        }
      );

      res.json({
        message: "Profile image updated successfully",
        profileImage: profileImage,
      });
    } catch (error) {
      console.error(
        "❌ [ProfileController] Error updating profile image:",
        error
      );
      res.status(500).json({ message: error.message });
    }
  },
};
