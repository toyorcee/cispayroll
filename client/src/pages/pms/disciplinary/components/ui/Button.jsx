import React from "react";

export const Button = ({ children, onClick, variant = "primary", size = "md" }) => {
  const baseClasses = "rounded-lg font-semibold focus:outline-none focus:ring-2";
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-blue-500 text-blue-500 hover:bg-blue-100",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
