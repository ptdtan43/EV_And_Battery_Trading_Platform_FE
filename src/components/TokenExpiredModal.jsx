import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const TokenExpiredModal = ({ isOpen, onClose, onRefresh }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">
            Phiên đăng nhập hết hạn
          </h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp
            tục sử dụng.
          </p>
          <p className="text-sm text-gray-500">
            Để bảo mật tài khoản, chúng tôi yêu cầu bạn xác thực lại sau một
            khoảng thời gian.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Đăng nhập lại
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
