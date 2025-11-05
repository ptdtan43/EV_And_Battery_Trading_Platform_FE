import { apiRequest } from "./api";

/**
 * Report API functions
 */

// Create a new report
export const createReport = async (reportData) => {
    try {
        console.log("📢 Creating report:", reportData);

        const response = await apiRequest("/api/ReportedListing", {
            method: "POST",
            body: JSON.stringify(reportData),
        });

        console.log("✅ Report created successfully:", response);
        return response;
    } catch (error) {
        console.error("❌ Error creating report:", error);
        throw error;
    }
};

// Get all reports (Admin only)
export const getAllReports = async () => {
    try {
        const response = await apiRequest("/api/ReportedListing");
        return response;
    } catch (error) {
        console.error("❌ Error fetching all reports:", error);
        throw error;
    }
};

// Get report by ID
export const getReportById = async (reportId) => {
    try {
        const response = await apiRequest(`/api/ReportedListing/${reportId}`);
        return response;
    } catch (error) {
        console.error(`❌ Error fetching report ${reportId}:`, error);
        throw error;
    }
};

// Get reports by product ID
export const getReportsByProductId = async (productId) => {
    try {
        const response = await apiRequest(`/api/ReportedListing/product/${productId}`);
        return response;
    } catch (error) {
        console.error(`❌ Error fetching reports for product ${productId}:`, error);
        throw error;
    }
};

// Get reports by reporter ID
export const getReportsByReporterId = async (reporterId) => {
    try {
        const response = await apiRequest(`/api/ReportedListing/reporter/${reporterId}`);
        return response;
    } catch (error) {
        console.error(`❌ Error fetching reports by reporter ${reporterId}:`, error);
        throw error;
    }
};

// Get reports by status (Admin only)
export const getReportsByStatus = async (status) => {
    try {
        const response = await apiRequest(`/api/ReportedListing/status/${status}`);
        return response;
    } catch (error) {
        console.error(`❌ Error fetching reports with status ${status}:`, error);
        throw error;
    }
};

// Update report status (Admin only)
export const updateReportStatus = async (reportId, status) => {
    try {
        const response = await apiRequest(`/api/ReportedListing/${reportId}`, {
            method: "PUT",
            body: JSON.stringify(status),
        });
        return response;
    } catch (error) {
        console.error(`❌ Error updating report ${reportId}:`, error);
        throw error;
    }
};

// Delete report (Admin only)
export const deleteReport = async (reportId) => {
    try {
        await apiRequest(`/api/ReportedListing/${reportId}`, {
            method: "DELETE",
        });
        return true;
    } catch (error) {
        console.error(`❌ Error deleting report ${reportId}:`, error);
        throw error;
    }
};

// Report types
export const REPORT_TYPES = {
    SPAM: "Spam",
    SCAM: "Lừa đảo",
    FAKE_INFO: "Thông tin giả mạo",
    INAPPROPRIATE: "Nội dung không phù hợp",
    DUPLICATE: "Bài đăng trùng lặp",
    WRONG_CATEGORY: "Sai danh mục",
    PRICE_MANIPULATION: "Thao túng giá",
    OTHER: "Khác",
};

// Report status
export const REPORT_STATUS = {
    PENDING: "Pending",
    REVIEWED: "Reviewed",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
};

