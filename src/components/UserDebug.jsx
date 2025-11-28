import React from "react";
import { useAuth } from "../contexts/AuthContext";

// Debug component để kiểm tra thông tin user
const UserDebug = () => {
  const { user } = useAuth();

  const getAuthData = () => {
    try {
      const authData = localStorage.getItem("evtb_auth");
      if (authData) {
        return JSON.parse(authData);
      }
    } catch (error) {
      console.error("Error parsing auth data:", error);
    }
    return null;
  };

  const authData = getAuthData();

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
        🔍 User Debug Info
      </h2>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Auth Context User:</h3>
          <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">LocalStorage Auth:</h3>
          <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Role Analysis:</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>roleId:</strong> {user?.roleId || "null"}</p>
            <p><strong>role:</strong> {user?.role || "null"}</p>
            <p><strong>roleName:</strong> {user?.roleName || "null"}</p>
            <p><strong>Is Member (roleId=2):</strong> {user?.roleId === 2 ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Is Member (role=2):</strong> {user?.role === 2 ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Is Member (roleName=member):</strong> {user?.roleName?.toLowerCase() === "member" ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Is Member (roleName=user):</strong> {user?.roleName?.toLowerCase() === "user" ? "✅ Yes" : "❌ No"}</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Payment Permission:</h3>
          <div className="text-sm text-green-800">
            {(() => {
              const userRoleId = user?.roleId || user?.role;
              const isMember = userRoleId === 2 || userRoleId === "2" || user?.roleName?.toLowerCase() === "member" || user?.roleName?.toLowerCase() === "user";
              return isMember ? (
                <p className="text-green-600 font-medium">✅ Có thể thanh toán</p>
              ) : (
                <p className="text-red-600 font-medium">❌ Không thể thanh toán</p>
              );
            })()}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>💡 Kiểm tra thông tin này để debug vấn đề role</p>
        </div>
      </div>
    </div>
  );
};

export default UserDebug;
