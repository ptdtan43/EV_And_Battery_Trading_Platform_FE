// Token Management with Auto Refresh
class TokenManager {
  constructor() {
    this.refreshPromise = null;
    this.isRefreshing = false;
  }

  // Safely parse JWT payload (handles base64url and malformed tokens)
  safeParseJwt(token) {
    try {
      if (!token || typeof token !== 'string' || token.split('.').length < 2) {
        return null;
      }
      const base64Url = token.split('.')[1];
      // Convert base64url to base64
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = atob(padded);
      return JSON.parse(json);
    } catch (_e) {
      // Malformed or non-JWT token
      return null;
    }
  }

  // Get current token
  getToken() {
    try {
      const authData = localStorage.getItem("evtb_auth");
      if (!authData) return null;

      const parsed = JSON.parse(authData);
      return parsed?.token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    if (!token) return true;
    const payload = this.safeParseJwt(token);
    if (!payload || !payload.exp) {
      // If we cannot parse, don't spam logs and let backend validate
      return false;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  // Check if token will expire soon (within 5 minutes)
  isTokenExpiringSoon(token) {
    if (!token) return true;
    const payload = this.safeParseJwt(token);
    if (!payload || !payload.exp) {
      return false;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    return (payload.exp - currentTime) < fiveMinutes;
  }

  // Refresh token (if backend supports it)
  async refreshToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async _performRefresh() {
    try {
      console.log("🔄 Attempting to refresh token...");

      // DISABLED: Backend doesn't support token refresh yet
      // Just return null and let user re-login
      console.warn("⚠️ Token refresh not supported by backend");
      throw new Error("Token refresh not supported - please login again");

      /* UNCOMMENT WHEN BACKEND SUPPORTS REFRESH TOKEN
      const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || "https://ev-and-battery-trading-platform-be.onrender.com");
      
      // Try to refresh token from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.getRefreshToken()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.token;
        
        if (newToken) {
          // Update token in localStorage
          const authData = JSON.parse(localStorage.getItem("evtb_auth") || '{}');
          authData.token = newToken;
          localStorage.setItem("evtb_auth", JSON.stringify(authData));
          
          console.log("✅ Token refreshed successfully");
          return newToken;
        }
      }
      
      throw new Error("Failed to refresh token");
      */
    } catch (error) {
      console.warn("⚠️ Token refresh failed:", error);
      throw error;
    }
  }

  // Get refresh token
  getRefreshToken() {
    try {
      const authData = localStorage.getItem("evtb_auth");
      if (!authData) return null;

      const parsed = JSON.parse(authData);
      return parsed?.refreshToken || null;
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem("evtb_auth");
    console.log("🧹 Auth data cleared");
  }

  // Get valid token (refresh if needed)
  async getValidToken() {
    const token = this.getToken();

    if (!token) {
      console.log("❌ No token found");
      return null;
    }

    // SIMPLIFIED: Just return token without auto-refresh
    // Backend doesn't support refresh endpoint yet
    // Let token work until it truly fails (401), then user re-login

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Avoid noisy logs; backend will return 401 if truly invalid
      // DON'T clear auth automatically - let the API call fail and handle it
      // this.clearAuth();
      return token; // Return expired token, let backend respond with 401
    }

    // Check if token is expiring soon
    if (this.isTokenExpiringSoon(token)) {
      console.log("⚠️ Token expiring soon - user should re-login soon");
      // Just log warning, continue using token
      return token;
    }

    return token;
  }

  // Show token expiration warning
  showExpirationWarning() {
    // You can customize this to show a toast or modal
    console.warn("⚠️ Token will expire soon. Consider refreshing the page.");

    // Example: Show a toast notification
    if (window.showToast) {
      window.showToast({
        title: "⚠️ Phiên đăng nhập sắp hết hạn",
        description: "Vui lòng lưu công việc và đăng nhập lại để tiếp tục.",
        type: "warning",
        duration: 10000
      });
    }
  }

  // Start token monitoring
  startTokenMonitoring() {
    // Check token every minute
    setInterval(() => {
      const token = this.getToken();
      if (token && this.isTokenExpiringSoon(token)) {
        this.showExpirationWarning();
      }
    }, 60000); // Check every minute
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

// Start monitoring when module loads
if (typeof window !== 'undefined') {
  tokenManager.startTokenMonitoring();
}

export default tokenManager;

