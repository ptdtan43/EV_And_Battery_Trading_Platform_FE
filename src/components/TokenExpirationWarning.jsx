import React, { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Clock } from "lucide-react";
import tokenManager from "../lib/tokenManager";

export const TokenExpirationWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check token expiration every 30 seconds
    const checkInterval = setInterval(() => {
      const token = tokenManager.getToken();
      if (token && tokenManager.isTokenExpiringSoon(token)) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = Math.max(0, payload.exp - currentTime);

        setTimeLeft(timeLeft);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await tokenManager.refreshToken();
      setShowWarning(false);
      // Show success message
      if (window.showToast) {
        window.showToast({
          title: "✅ Token đã được làm mới",
          description: "Phiên đăng nhập đã được gia hạn thành công.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      if (window.showToast) {
        window.showToast({
          title: "❌ Không thể làm mới token",
          description: "Vui lòng đăng nhập lại để tiếp tục.",
          type: "error",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Phiên đăng nhập sắp hết hạn
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Phiên đăng nhập của bạn sẽ hết hạn trong{" "}
              <span className="font-mono font-bold">
                {formatTime(timeLeft)}
              </span>
              . Vui lòng lưu công việc và làm mới phiên đăng nhập.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Đang làm mới...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Làm mới ngay
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Tạm ẩn
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-yellow-400 hover:text-yellow-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

