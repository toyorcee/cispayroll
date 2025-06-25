import api from "./api";

export const profileService = {
  getProfile() {
    return api.get("/api/profile");
  },
  updateProfile(data: any) {
    return api.put("/api/profile", data);
  },
  updateProfileImage(file: File) {
    const formData = new FormData();
    formData.append("profileImage", file);
    return api.put("/api/profile/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
