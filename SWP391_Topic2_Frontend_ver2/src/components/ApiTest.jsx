import React, { useState } from "react";
import { useAuthToken } from "../hooks/useAuthToken";
import { apiFetch } from "../lib/apiClient";

// Simple API test component
const ApiTest = () => {
  const { token, isAuthenticated } = useAuthToken();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🧪 Testing API connection...");
      
      // Test basic API connection
      const response = await apiFetch("/api/test", {
        method: "GET"
      }, token);
      
      setResult({
        success: true,
        data: response,
        message: "API connection successful"
      });
      
    } catch (err) {
      console.error("❌ API test failed:", err);
      setError({
        message: err.message,
        type: "API Error"
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🧪 Testing Payment API...");
      console.log("🔑 Token:", token);
      
      const paymentData = {
        orderId: 1,
        productId: null,
        amount: 100000,
        paymentType: "Deposit"
      };
      
      console.log("📤 Sending payment data:", paymentData);
      
      const response = await apiFetch("/api/payment", {
        method: "POST",
        body: JSON.stringify(paymentData)
      }, token);
      
      setResult({
        success: true,
        data: response,
        message: "Payment API test successful"
      });
      
    } catch (err) {
      console.error("❌ Payment API test failed:", err);
      setError({
        message: err.message,
        type: "Payment API Error",
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const testToken = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🧪 Testing Token...");
      console.log("🔑 Token:", token);
      
      // Test with a simple endpoint that requires auth
      const response = await apiFetch("/api/User", {
        method: "GET"
      }, token);
      
      setResult({
        success: true,
        data: response,
        message: "Token test successful"
      });
      
    } catch (err) {
      console.error("❌ Token test failed:", err);
      setError({
        message: err.message,
        type: "Token Error",
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-medium">🔒 Vui lòng đăng nhập để test API</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
        🧪 API Test Tool
      </h2>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p><strong>API Base:</strong> {import.meta.env.VITE_API_BASE || "http://localhost:5044"}</p>
          <p><strong>Token:</strong> {token ? "✅ Present" : "❌ Missing"}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={testToken}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Token"}
          </button>
          
          <button
            onClick={testApiConnection}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test API Connection"}
          </button>
          
          <button
            onClick={testPaymentApi}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Payment API"}
          </button>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h3 className="font-medium text-green-800 mb-2">✅ Success</h3>
            <p className="text-sm text-green-700 mb-2">{result.message}</p>
            <pre className="text-xs text-green-600 bg-green-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
            <p className="text-sm text-red-700 mb-2">{error.type}</p>
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>💡 Mở Developer Tools (F12) để xem console logs</p>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
