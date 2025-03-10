import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole, Permission } from "../../types/auth";
import { toast } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
}

export function ProtectedRoute({
  children,
  roles,
  permissions,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress
          sx={{
            color: "#16A34A",
          }}
          size={40}
        />
      </div>
    );
  }

  if (!user) {
    toast.error("Please login to access this page");
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (roles && !roles.includes(user.role)) {
    toast.error(`Access denied: Insufficient role privileges`);
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has required permissions
  if (
    permissions &&
    !permissions.every((permission) => user.permissions?.includes(permission))
  ) {
    toast.error(`Access denied: Required permissions not found`);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
