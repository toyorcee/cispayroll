import { useState } from "react";

interface AvatarProps {
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({
  profileImage,
  firstName,
  lastName,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = () => {
    const firstInitial = firstName?.[0] || "";
    const lastInitial = lastName?.[0] || "";
    return firstInitial + lastInitial || "??";
  };

  const sizeClasses = {
    sm: "w-9 h-9 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-20 h-20 text-xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-green-100 rounded-full flex items-center justify-center overflow-hidden ${className}`}
    >
      {profileImage && !imageError ? (
        <img
          src={`${import.meta.env.VITE_API_URL}/${profileImage.replace(
            /\\/g,
            "/"
          )}`}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium text-green-600">{getInitials()}</span>
      )}
    </div>
  );
}
