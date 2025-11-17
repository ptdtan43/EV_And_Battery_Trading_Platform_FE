// Payment API client riêng để tránh CORS issues
import { API_BASE } from "./apiClient";

export async function createPaymentRequest(body, token) {
  const url = `${API_BASE}/api/payment`;
  
  console.log("🌐 Payment API Request:", {
    url,
    method: "POST",
    hasToken: !!token,
    body: body
  });
  
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: "omit", // Không gửi credentials để tránh CORS
    body: JSON.stringify(body)
  };

  try {
    const res = await fetch(url, config);
    
    console.log("📡 Payment API Response:", {
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

    const result = await res.json();
    console.log("✅ Payment API Success:", result);
    return result;
    
  } catch (error) {
    console.error("❌ Payment API Error:", error);
    throw error;
  }
}

