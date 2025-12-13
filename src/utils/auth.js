import Cookies from 'js-cookie';

export const logout = () => {
  // Remove all auth-related cookies
  Cookies.remove('token');
  Cookies.remove('user');
  Cookies.remove('username');
  
  // Clear localStorage
  localStorage.clear();
  
  // Redirect to login page
  window.location.href = '/login';
};

export const getUser = () => {
  try {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  const token = Cookies.get('token');
  return !!token;
};
