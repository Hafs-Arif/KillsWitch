import React from "react";

const LoadingSpinner = ({ size = "medium", color = "accent" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  };

  const colorClasses = {
    accent: "border-[#c70007]",
    white: "border-[#ffffff]",
    gray: "border-[#4b4b4b]",
  };

  // Fallback for invalid props
  const validSize = sizeClasses[size] ? size : "medium";
  const validColor = colorClasses[color] ? color : "accent";

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[validSize]} border-t-2 border-b-2 ${colorClasses[validColor]} shadow-sm`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;