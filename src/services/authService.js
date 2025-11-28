// Authentication Service
import apiService from './apiService';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      const response = await apiService.login(credentials);
      
      // Store auth data in localStorage
      if (response.token) {
        localStorage.setItem('evtb_auth', JSON.stringify({
          token: response.token,
          user: response.user,
          refreshToken: response.refreshToken
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('evtb_auth');
    console.log('User logged out');
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const authData = localStorage.getItem('evtb_auth');
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get auth token
  getToken() {
    try {
      const authData = localStorage.getItem('evtb_auth');
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed.token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiService.refreshToken();
      
      if (response.token) {
        const authData = JSON.parse(localStorage.getItem('evtb_auth') || '{}');
        authData.token = response.token;
        localStorage.setItem('evtb_auth', JSON.stringify(authData));
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      return await apiService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      return await apiService.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }
}

export default new AuthService();
