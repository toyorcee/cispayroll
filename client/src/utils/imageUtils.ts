import defaultAvatar from "../assets/user-avatar.png";

export const getProfileImageUrl = (profileData: {
  profileImage?: string;
  profileImageUrl?: string;
}) => {
  // console.log("Profile Image Data:", {
  //   profileImage: profileData.profileImage,
  //   profileImageUrl: profileData.profileImageUrl,
  //   apiUrl: import.meta.env.VITE_API_URL,
  // });

  if (profileData.profileImageUrl?.startsWith("http")) {
    console.log(
      "Using full URL from profileImageUrl:",
      profileData.profileImageUrl
    );
    return profileData.profileImageUrl;
  }

  const imagePath = profileData.profileImage || profileData.profileImageUrl;
  if (imagePath) {
    const cleanPath = imagePath.replace(/^\/+/, "");
    const fullUrl = `${import.meta.env.VITE_API_URL}/${cleanPath}`;
    return fullUrl;
  }

  return defaultAvatar;
};
