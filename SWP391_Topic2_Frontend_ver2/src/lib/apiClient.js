// API Client chuẩn cho VNPay integration
export const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5044").replace(/\/+$/, "");

export async function apiFetch(path, init = {}, token) {
  const url = `${API_BASE}${path}`;
  
  console.log("🌐 API Request:", {
    url,
    method: init.method || "GET",
    hasToken: !!token,
    body: init.body
  });
  
  const config = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    },
    credentials: "omit" // Changed from "include" to "omit" to fix CORS
  };

  try {
    const res = await fetch(url, config);
    
    console.log("📡 API Response:", {
      status: res.status,
      statusText: res.statusText,
      url: res.url
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const errorMessage = `HTTP ${res.status}: ${text || res.statusText}`;
      
      // Handle specific error cases
      if (res.status === 401) {
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (res.status === 403) {
        throw new Error("Bạn không có quyền thực hiện thao tác này.");
      } else if (res.status >= 500) {
        throw new Error("Lỗi máy chủ. Vui lòng thử lại sau.");
      }
      
      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}

// Helper function to get auth token from localStorage
export function getAuthToken() {
  try {
    const authData = localStorage.getItem("evtb_auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.token || null;
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return null;
}

// Helper function to handle auth errors
export function handleAuthError(error) {
  if (error.message.includes("Phiên đăng nhập hết hạn")) {
    // Clear auth data and redirect to login
    localStorage.removeItem("evtb_auth");
    window.location.href = "/login";
    return true;
  }
  return false;
}