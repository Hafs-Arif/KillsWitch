// Utility functions for handling redirects based on user roles

export const getRedirectPath = (userRole, nextUrl = null) => {
  // For admin users
  if (userRole === 'admin') {
    // If there's a next parameter and it's an admin route, go there
    // Otherwise, go to admin dashboard
    return (nextUrl && nextUrl.startsWith('/Admin')) ? nextUrl : '/Admin';
  }
  
  // For regular users
  // Go to next URL if it exists and it's not an admin route, otherwise go to home
  return (nextUrl && !nextUrl.startsWith('/Admin')) ? nextUrl : '/';
};

export const getRedirectMessage = (userRole) => {
  return userRole === 'admin' 
    ? "Login successful! Redirecting to Admin Dashboard..."
    : "Login successful! Redirecting to Home Page...";
};

export const getUserRoleFromToken = (token) => {
  if (!token) return null;
  
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.role || payload.userRole || null;
    }
  } catch (e) {
    console.log("Could not decode token for role:", e);
  }
  
  return null;
};