import { Navigate, Outlet, useLocation } from 'react-router-dom';

const RoleBasedProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token') !== null;
  // Get user role
  const userRole = localStorage.getItem('userRole');
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // If authenticated but not in allowed roles, redirect to appropriate dashboard
  if (!allowedRoles.includes(userRole)) {
    // Redirect to the dashboard based on their role
    let redirectPath;
    if (userRole === 'admin') {
      redirectPath = '/admin';
    } else if (userRole === 'mentor') {
      redirectPath = '/mentor';
    } else {
      redirectPath = '/user';
    }
    return <Navigate to={redirectPath} replace />;
  }
  
  // If authenticated and has allowed role, render the child routes
  return <Outlet />;
};

export default RoleBasedProtectedRoute;