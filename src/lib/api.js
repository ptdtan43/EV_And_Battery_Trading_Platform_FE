// Simple API helper for backend integration
// Reads base URL from VITE_API_BASE_URL, defaults to production URL

import tokenManager from './tokenManager';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

function getAuthToken() {
  try {
    const raw = localStorage.getItem("evtb_auth");
    if (!raw) {
      console.log("No auth data in localStorage");
      return null;
    }
    const parsed = JSON.parse(raw);
    const token = parsed?.token || null;

    // Check if token is expired
    if (token) {
      try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp && payload.exp < currentTime;

        if (isExpired) {
          console.warn("Token is expired, but keeping it for development");
          // Don't clear auth data in development
          // localStorage.removeItem("evtb_auth");
          // return null;
          console.log("DEVELOPMENT MODE: Keeping expired token");
          return token;
        }

        console.log("Auth token check:", {
          hasAuth: !!raw,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          isExpired: isExpired,
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
          parsedKeys: Object.keys(parsed || {}),
          parsedData: parsed
        });
      } catch (decodeError) {
        console.warn("Invalid token format, clearing auth data:", decodeError);
        localStorage.removeItem("evtb_auth");
        return null;
      }
    }

    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  // Use TokenManager to get valid token
  const token = await tokenManager.getValidToken();
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const isFormData = (typeof FormData !== 'undefined') && body instanceof FormData;

  // Don't send token for auth endpoints (login, register, forgot-password)
  const isAuthEndpoint = path.includes('/login') || path.includes('/register') || path.includes('/forgot-password');
  const shouldSendToken = token && !isAuthEndpoint;

  // Debug logging for all requests
  if (import.meta.env.DEV) {
    console.log('=== API REQUEST DEBUG ===');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Body:', body);
    console.log('Is FormData:', isFormData);
    console.log('Is Auth Endpoint:', isAuthEndpoint);
    console.log('Token:', shouldSendToken ? 'Present' : 'Not sending');
  }

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(shouldSendToken ? { Authorization: `Bearer ${token}` } : {}),
      // Merge custom headers (but don't override Content-Type or Authorization)
      ...(headers || {}),
    },
    body: body ? (isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body))) : undefined,
  });

  // Debug logging for registration requests
  if (path.includes('/User/register') && import.meta.env.DEV) {
    console.group('Registration Request Debug');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Headers:', {
      Accept: 'application/json',
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(shouldSendToken ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    });
    console.log('Body object:', body);
    console.log('Body stringified:', body ? (isFormData ? '[FormData]' : JSON.stringify(body)) : 'null');
    console.log('Is FormData:', isFormData);
    console.groupEnd();
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Debug logging for failed requests
  if (!res.ok && import.meta.env.DEV) {
    console.group('API Error Debug');
    console.log('URL:', url);
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    console.log('Response Text:', text);
    console.log('Parsed Data:', data);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    console.groupEnd();
  }

  if (!res.ok) {
    let message;

    // Handle 401 Unauthorized specifically
    if (res.status === 401) {
      console.warn("401 Unauthorized - Token may be expired or invalid");

      // Skip refresh for login/register endpoints
      const isAuthEndpoint = path.includes('/login') || path.includes('/register') || path.includes('/forgot-password');

      if (!isAuthEndpoint) {
        console.warn("Token invalid, clearing auth and redirecting to login");

        // Clear auth data
        tokenManager.clearAuth();

        // Redirect to login after a short delay (only if not already on login page)
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      } else {
        console.warn("Login/Auth endpoint failed - check credentials");
        // Use backend message for auth endpoints
        if (data && typeof data === 'object') {
          message = data.message || data.error || data.detail || data.title || 'Invalid email or password.';
        } else if (typeof data === 'string' && data.trim()) {
          message = data;
        } else {
          message = 'Invalid email or password.';
        }
        throw Object.assign(new Error(message), { status: res.status, data, response: res });
      }

      message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else {
      // Try to extract meaningful error message
      if (data && typeof data === 'object') {
        // Handle validation errors specifically
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map(err =>
            `${err.field || 'Field'}: ${err.message || err}`
          ).join(', ');
          message = `Validation errors: ${validationErrors}`;
        } else if (data.title && data.title.includes('validation')) {
          message = data.title;
        } else {
          message = data.message || data.error || data.detail || data.title || `Request failed (${res.status})`;
        }
      } else if (typeof data === 'string' && data.trim()) {
        message = data;
      } else {
        // Default messages based on status codes
        switch (res.status) {
          case 400:
            message = "Dữ liệu không hợp lệ";
            break;
          case 401:
            message = "Không có quyền truy cập";
            break;
          case 403:
            message = "Bị từ chối truy cập";
            break;
          case 404:
            message = "Không tìm thấy tài nguyên";
            break;
          case 409:
            message = "Dữ liệu đã tồn tại";
            break;
          case 500:
            message = "Lỗi máy chủ";
            break;
          default:
            message = `Request failed (${res.status})`;
        }
      }
    }

    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    error.response = res;
    throw error;
  }

  return data;
}

export { API_BASE_URL };

// ==================== CREDIT SYSTEM HELPERS ====================

/**
 * Quick helper to get current user's credits
 * Requires user to be logged in
 * @returns {Promise<number>} Current credit balance
 */
export async function getMyCredits() {
  try {
    // Get user from localStorage
    const authData = localStorage.getItem("evtb_auth");
    if (!authData) {
      throw new Error("User not logged in");
    }
    
    const { user } = JSON.parse(authData);
    const userId = user?.id || user?.userId;
    
    if (!userId) {
      throw new Error("User ID not found");
    }
    
    const response = await apiRequest(`/api/User/${userId}/listings/count`);
    return response.postCredits || 0;
  } catch (error) {
    console.error("Error getting user credits:", error);
    return 0;
  }
}

/**
 * Format price to Vietnamese currency
 * @param {number} price - Price in VND
 * @returns {string} Formatted price
 * @example
 * formatPrice(90000) // "90.000 ₫"
 */
export function formatPrice(price) {
  if (!price && price !== 0) return "0 ₫";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

/**
 * Format date to Vietnamese format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 * @example
 * formatDate("2024-01-15T10:30:00") // "15/01/2024 10:30"
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}
