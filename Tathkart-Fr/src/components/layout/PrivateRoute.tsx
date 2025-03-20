
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserRole, useAuth } from '@/context/AuthContext';

interface PrivateRouteProps {
  allowedRoles: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Show loading indicator if still checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tathkart-500"></div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has an allowed role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'user':
        return <Navigate to="/user" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'delivery':
        return <Navigate to="/delivery" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  // If all checks pass, render the protected route
  return <Outlet />;
};

export default PrivateRoute;
