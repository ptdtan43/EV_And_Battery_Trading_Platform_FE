import { useState } from "react";
import { XCircle, AlertTriangle, Clock, User } from "lucide-react";

export const RejectionReasonModal = ({
  isOpen,
  onClose,
  rejectionReason,
  rejectedAt,
  rejectedBy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Lý do từ chối
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Rejection Reason */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-2">
                  Lý do từ chối:
                </p>
                <p className="text-sm text-red-700 leading-relaxed">
                  {rejectionReason || "Không có lý do cụ thể"}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(rejectedAt || rejectedBy) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {rejectedAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      Từ chối lúc:{" "}
                      {new Date(rejectedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}
                {rejectedBy && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>Người từ chối: {rejectedBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
