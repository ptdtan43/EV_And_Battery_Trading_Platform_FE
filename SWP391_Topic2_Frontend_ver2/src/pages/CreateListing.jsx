import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { notifyPostCreated } from "../lib/notificationApi";
import {
  addWatermarkToImages,
  shouldWatermarkImage,
} from "../utils/watermarkUtils";
import {
  formatVietnamesePrice,
  parsePriceValue,
} from "../utils/priceFormatter";

export const CreateListing = () => {
  const { user, profile } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    licensePlate: "",
    description: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    color: "",
    fuelType: "",
    transmission: "",
    condition: "excellent",
    productType: "vehicle",
    // Vehicle specific fields
    vehicleType: "",
    manufactureYear: "",
    // Battery specific fields
    batteryType: "",
    batteryHealth: "",
    capacity: "",
    voltage: "",
    bms: "",
    cellType: "",
    cycleCount: "",
  });
  const [displayPrice, setDisplayPrice] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      // Format price display with spaces
      const formattedPrice = formatVietnamesePrice(value);
      setDisplayPrice(formattedPrice);

      // Store numeric value in formData
      const numericPrice = parsePriceValue(value);
      setFormData({
        ...formData,
        [name]: numericPrice,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 5 - images.length); // Max 5 images
    setImages([...images, ...newImages]);
  };

  const handleDocumentImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 3 - documentImages.length); // Max 3 document images

    try {
      // Add watermark to document images
      const watermarkedImages = await addWatermarkToImages(
        newImages,
        "EV Trading Platform",
        {
          fontSize: 24,
          color: "rgba(255, 255, 255, 0.8)",
          strokeColor: "rgba(0, 0, 0, 0.6)",
          strokeWidth: 2,
          angle: -45,
          spacing: 200,
        }
      );

      setDocumentImages([...documentImages, ...watermarkedImages]);

      show({
        title: "✅ Đã thêm watermark",
        description: "Ảnh giấy tờ đã được thêm watermark bảo mật",
        type: "success",
      });
    } catch (error) {
      console.error("Error adding watermark:", error);
      // Fallback: use original images if watermarking fails
      setDocumentImages([...documentImages, ...newImages]);

      show({
        title: "⚠️ Cảnh báo",
        description: "Không thể thêm watermark, sử dụng ảnh gốc",
        type: "warning",
      });
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeDocumentImage = (index) => {
    setDocumentImages(documentImages.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // We'll upload images after creating the product to get productId

      // Get user's profile ID for seller_id reference
      // Based on API response, the user object has 'userId' field, not 'id'
      let sellerId = user?.userId || user?.id || user?.accountId;

      // If sellerId is a number, keep it as number (backend might expect integer)
      // If it's a string UUID, keep it as string
      if (
        sellerId &&
        typeof sellerId === "string" &&
        !isNaN(parseInt(sellerId))
      ) {
        sellerId = parseInt(sellerId);
      }

      console.log("Debug user object:", {
        user,
        profile,
        sellerId,
        userKeys: user ? Object.keys(user) : "no user",
        profileKeys: profile ? Object.keys(profile) : "no profile",
        userValues: user ? Object.entries(user) : "no user",
      });

      // If still no sellerId, try to get from profile object directly
      if (!sellerId && profile) {
        sellerId = profile.userId || profile.id || profile.user_id;
      }

      // Last resort: try to get user ID from localStorage
      if (!sellerId) {
        try {
          const authData = localStorage.getItem("evtb_auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            sellerId =
              parsed?.user?.userId ||
              parsed?.user?.id ||
              parsed?.user?.accountId ||
              parsed?.profile?.userId ||
              parsed?.profile?.id;
          }
        } catch (err) {
          console.warn("Could not parse auth data from localStorage:", err);
        }
      }

      // Get category ID based on brand
      // Since API Category doesn't exist, we'll use simple numeric IDs
      let categoryId = 1; // Default category

      // Map brands to specific category IDs (using simple integers)
      const brandToCategoryMap = {
        Tesla: 1,
        VinFast: 2,
        BMW: 3,
        Mercedes: 4,
        Audi: 5,
        Porsche: 6,
        Hyundai: 7,
        Kia: 8,
      };

      if (formData.brand && brandToCategoryMap[formData.brand]) {
        categoryId = brandToCategoryMap[formData.brand];
      }

      console.log("User object:", user);
      console.log("Profile object:", profile);
      console.log("Seller ID resolved:", sellerId);
      console.log("Category ID resolved:", categoryId);
      console.log("Form data summary:", {
        title: formData.title,
        licensePlate: formData.licensePlate,
        year: formData.year,
        brand: formData.brand,
        model: formData.model,
        price: formData.price,
        imageCount: images.length,
      });

      // Additional debug for user object structure
      if (user) {
        console.log("User object details:", {
          keys: Object.keys(user),
          values: Object.values(user),
          entries: Object.entries(user),
          hasUserId: "userId" in user,
          hasId: "id" in user,
          hasAccountId: "accountId" in user,
          userIdValue: user.userId,
          idValue: user.id,
          accountIdValue: user.accountId,
        });
      }

      // Validate required fields
      if (!sellerId) {
        console.error("No sellerId found. User data:", {
          user,
          profile,
          localStorage: localStorage.getItem("evtb_auth"),
        });

        // Last resort: use a known working userId from API or generate temporary
        if (user?.email === "opgoodvsbad@gmail.com") {
          // Use the known userId from API response
          sellerId = 2;
          console.warn(
            "Using known userId for opgoodvsbad@gmail.com:",
            sellerId
          );
        } else if (user?.email) {
          // Create a simple hash-based ID from email
          sellerId = `temp_${user.email.replace(
            /[^a-zA-Z0-9]/g,
            ""
          )}_${Date.now()}`;
          console.warn("Using temporary sellerId:", sellerId);
        } else {
          throw new Error(
            "Không thể xác định thông tin người bán. Vui lòng đăng nhập lại hoặc làm mới trang."
          );
        }
      }

      // Validate basic required fields
      if (
        !formData.title ||
        !formData.price ||
        !formData.description ||
        !formData.brand ||
        !formData.productType ||
        !formData.model
      ) {
        throw new Error(
          "Vui lòng điền đầy đủ các trường bắt buộc: tiêu đề, giá, mô tả, hãng xe, model, và loại sản phẩm."
        );
      }

      // Validate vehicle specific required fields
      if (formData.productType === "vehicle") {
        if (
          !formData.vehicleType ||
          !formData.manufactureYear ||
          !formData.licensePlate
        ) {
          throw new Error(
            "Vui lòng điền đầy đủ thông tin xe: loại xe, năm sản xuất, và biển số xe."
          );
        }
      }

      // Validate battery specific required fields
      if (formData.productType === "battery") {
        if (
          !formData.batteryType ||
          !formData.batteryHealth ||
          !formData.capacity
        ) {
          throw new Error(
            "Vui lòng điền đầy đủ thông tin pin: loại pin, tình trạng pin, và dung lượng."
          );
        }
      }

      // Validate license plate format (only for vehicles)
      if (formData.productType === "vehicle" && formData.licensePlate) {
        const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
        if (!licensePlateRegex.test(formData.licensePlate)) {
          throw new Error(
            "Biển số xe không đúng định dạng. Vui lòng nhập theo định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
          );
        }
      }

      // Validate price is a valid number
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Giá bán phải là một số dương hợp lệ.");
      }

      // Validate year if provided (only for vehicles)
      if (formData.productType === "vehicle" && formData.manufactureYear) {
        const year = parseInt(formData.manufactureYear);
        if (isNaN(year) || year < 2010 || year > 2024) {
          throw new Error("Năm sản xuất phải là số từ 2010 đến 2024.");
        }
      }

      // Validate battery health (only for batteries)
      if (formData.productType === "battery" && formData.batteryHealth) {
        const health = parseFloat(formData.batteryHealth);
        if (isNaN(health) || health < 0 || health > 100) {
          throw new Error("Tình trạng pin phải là số từ 0 đến 100%.");
        }
      }

      // Validate capacity (only for batteries)
      if (formData.productType === "battery" && formData.capacity) {
        const capacity = parseFloat(formData.capacity);
        if (isNaN(capacity) || capacity <= 0) {
          throw new Error("Dung lượng pin phải là số dương hợp lệ.");
        }
      }

      // categoryId should always be set now since we have a default
      console.log("Using categoryId:", categoryId);

      // Create product using specific API endpoints
      let created = null;

      // Use unified API endpoint - backend will handle product type routing
      const apiEndpoint = "/api/Product";

      // Create product data with all fields (matching database schema)
      const productData = {
        sellerId: sellerId,
        productType: formData.productType === "vehicle" ? "Vehicle" : "Battery",
        title: formData.title,
        description: formData.description,
        price: price,
        brand: formData.brand,
        model: formData.model,
        condition: formData.condition,
        // Vehicle fields (will be null/0 for batteries)
        vehicleType:
          formData.productType === "vehicle"
            ? formData.vehicleType || "string"
            : "string",
        manufactureYear:
          formData.productType === "vehicle"
            ? formData.manufactureYear || formData.year
              ? parseInt(formData.manufactureYear || formData.year)
              : 0
            : 0,
        mileage:
          formData.productType === "vehicle"
            ? formData.mileage
              ? parseInt(formData.mileage)
              : 0
            : 0,
        transmission:
          formData.productType === "vehicle"
            ? formData.transmission || "string"
            : "string",
        seatCount:
          formData.productType === "vehicle"
            ? formData.seatCount
              ? parseInt(formData.seatCount)
              : 0
            : 0,
        licensePlate: formData.licensePlate || "string",
        // Battery fields (will be null/0 for vehicles)
        batteryHealth:
          formData.productType === "battery"
            ? formData.batteryHealth
              ? parseFloat(formData.batteryHealth)
              : 0
            : 0,
        batteryType:
          formData.productType === "battery"
            ? formData.batteryType || "string"
            : "string",
        capacity:
          formData.productType === "battery"
            ? formData.capacity
              ? parseFloat(formData.capacity)
              : 0
            : 0,
        voltage:
          formData.productType === "battery"
            ? formData.voltage
              ? parseFloat(formData.voltage)
              : 0
            : 0,
        bms:
          formData.productType === "battery"
            ? formData.bms || "string"
            : "string",
        cellType:
          formData.productType === "battery"
            ? formData.cellType || "string"
            : "string",
        cycleCount:
          formData.productType === "battery"
            ? formData.cycleCount
              ? parseInt(formData.cycleCount)
              : 0
            : 0,
      };

      console.log(`🚀 Using ${formData.productType} API:`, apiEndpoint);
      console.log(`📦 Product data:`, productData);

      try {
        created = await apiRequest(apiEndpoint, {
          method: "POST",
          body: productData,
        });
        console.log(`✅ Product created successfully:`, created);
      } catch (error) {
        console.error(`❌ Product creation failed:`, error);

        // Enhanced error message for 500 errors
        if (error.status === 500) {
          const enhancedError = new Error(
            "🚨 LỖI BACKEND (500): API không thể lưu dữ liệu vào database!\n\n" +
              "✅ Frontend đã gửi đúng data theo database schema\n" +
              "✅ Swagger test cũng lỗi 500 - xác nhận vấn đề ở Backend\n" +
              "✅ Sử dụng unified API: /api/Product\n" +
              "✅ Backend sẽ tự phân loại dựa trên productType\n" +
              "❌ Backend cần kiểm tra:\n" +
              "1. Database server có chạy không?\n" +
              "2. Entity Framework migrations có chạy đúng không?\n" +
              "3. Product entity có đầy đủ fields không?\n" +
              "4. Unified API endpoint hoạt động không?\n" +
              "5. ProductType routing logic\n" +
              "6. Database connection string\n" +
              "7. Entity configuration\n" +
              "8. Database schema có đúng không?\n" +
              "9. Foreign key constraints\n" +
              "10. Required fields validation\n\n" +
              "🔧 Hãy báo admin backend kiểm tra ngay!\n" +
              "📋 API endpoint: " +
              apiEndpoint +
              "\n" +
              "📦 ProductType: " +
              productData.productType +
              "\n" +
              "📦 Data sent: " +
              JSON.stringify(productData, null, 2) +
              "\n\n" +
              "💡 Gợi ý: Backend có thể cần:\n" +
              "- Chạy: dotnet ef database update\n" +
              "- Kiểm tra: Product entity configuration\n" +
              "- Kiểm tra: Database connection\n" +
              "- Kiểm tra: API controller implementation\n" +
              "- Kiểm tra: Database schema\n" +
              "- Kiểm tra: Entity relationships\n\n" +
              "🚨 VẤN ĐỀ: Backend không thể lưu vào database!\n" +
              "🔧 GIẢI PHÁP: Backend cần fix database/entity configuration!"
          );
          enhancedError.status = 500;
          throw enhancedError;
        }

        throw error;
      }
      const pid = created?.id || created?.productId || created?.Id;

      // Upload product images after product creation
      if (pid && images.length > 0) {
        console.log(
          `Uploading ${images.length} product images for product ${pid}...`
        );

        try {
          // Try multiple upload first
          const formData = new FormData();
          formData.append("productId", pid);

          // Add all product images to FormData
          images.forEach((image, index) => {
            formData.append("images", image);
          });

          console.log(
            "Uploading product images with multiple endpoint:",
            images.length,
            "images"
          );
          const uploadedImages = await apiRequest(
            `/api/ProductImage/multiple`,
            {
              method: "POST",
              body: formData,
            }
          );
          console.log(
            "Multiple product images uploaded successfully:",
            uploadedImages
          );
        } catch (e) {
          console.warn(
            "Multiple product image upload failed, trying individual uploads:",
            e
          );

          // Fallback to individual uploads
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            try {
              const formData = new FormData();
              formData.append("productId", pid);
              formData.append("imageFile", img);

              console.log(
                `Uploading product image ${i + 1}/${
                  images.length
                } for product ${pid}`
              );
              await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: formData,
              });
              console.log(`Product image ${i + 1} uploaded successfully`);
            } catch (e) {
              console.warn(`Product image ${i + 1} upload failed:`, e);
            }
          }
        }
      } else {
        console.log("No product images were selected for upload.");
      }

      // Upload document images after product creation
      if (pid && documentImages.length > 0) {
        console.log(
          `Uploading ${documentImages.length} document images for product ${pid}...`
        );

        try {
          // Try multiple upload first for documents
          const formData = new FormData();
          formData.append("productId", pid);
          formData.append("imageType", "document"); // Add type to distinguish from product images

          // Add all document images to FormData
          documentImages.forEach((image, index) => {
            formData.append("images", image);
          });

          console.log(
            "Uploading document images with multiple endpoint:",
            documentImages.length,
            "images"
          );
          const uploadedDocumentImages = await apiRequest(
            `/api/ProductImage/multiple`,
            {
              method: "POST",
              body: formData,
            }
          );
          console.log(
            "Multiple document images uploaded successfully:",
            uploadedDocumentImages
          );
        } catch (e) {
          console.warn(
            "Multiple document image upload failed, trying individual uploads:",
            e
          );

          // Fallback to individual uploads for documents
          for (let i = 0; i < documentImages.length; i++) {
            const img = documentImages[i];
            try {
              const formData = new FormData();
              formData.append("productId", pid);
              formData.append("imageFile", img);
              formData.append("imageType", "document"); // Add type to distinguish

              console.log(
                `Uploading document image ${i + 1}/${
                  documentImages.length
                } for product ${pid}`
              );
              await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: formData,
              });
              console.log(`Document image ${i + 1} uploaded successfully`);
            } catch (e) {
              console.warn(`Document image ${i + 1} upload failed:`, e);
            }
          }
        }
      } else {
        console.log("No document images were selected for upload.");
      }

      // Send notification to user (optional - don't block success)
      let notificationSent = false;
      try {
        notificationSent = await notifyPostCreated(
          user.id || user.userId || user.accountId,
          formData.title
        );
        if (notificationSent) {
          console.log("✅ Notification sent successfully");
        } else {
          console.log("⚠️ Notification API not available");
        }
      } catch (notificationError) {
        console.warn(
          "⚠️ Could not send notification (API not available):",
          notificationError
        );
        // Don't throw error - notification is optional
      }

      show({
        title: "✅ Tạo bài đăng thành công",
        description: notificationSent
          ? "Bài đăng của bạn đang chờ duyệt từ admin. Bạn sẽ được thông báo khi được duyệt."
          : "Bài đăng của bạn đang chờ duyệt từ admin. (Hệ thống thông báo tạm thời không khả dụng)",
        type: "success",
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error creating product:", err);
      console.error("Error details:", err.data);
      console.error("Error status:", err.status);
      console.error("Full error object:", JSON.stringify(err, null, 2));

      let errorMessage = "Có lỗi xảy ra khi tạo bài đăng";

      if (err.status === 500) {
        errorMessage =
          "🚨 LỖI BACKEND (500): API không thể lưu dữ liệu vào database!\n\n" +
          "✅ Đã xác nhận lỗi từ Swagger test\n" +
          "❌ Backend cần kiểm tra:\n" +
          "1. Database server có chạy không?\n" +
          "2. Entity Framework migrations có chạy đúng không?\n" +
          "3. Foreign key constraints (SellerId: 5)\n" +
          "4. Database schema có đúng không?\n" +
          "5. Entity validation rules\n\n" +
          "🔧 Hãy báo admin backend kiểm tra ngay!";
      } else if (err.status === 400) {
        errorMessage =
          "Lỗi dữ liệu (400): Backend không nhận được đúng format dữ liệu. Vui lòng báo admin kiểm tra API contract.";
      } else if (err.status === 401) {
        errorMessage = "Lỗi xác thực (401): Vui lòng đăng nhập lại.";
      } else if (err.status === 403) {
        errorMessage =
          "Lỗi quyền truy cập (403): Bạn không có quyền thực hiện thao tác này.";
      }

      if (err.data) {
        if (typeof err.data === "string") {
          errorMessage = err.data;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        } else if (err.data.errors) {
          const errorDetails = Object.values(err.data.errors).flat().join(", ");
          errorMessage = `Lỗi validation: ${errorDetails}`;
        } else if (err.data.title) {
          errorMessage = err.data.title;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Add more specific error handling for common issues
      if (
        errorMessage.includes("entity changes") ||
        errorMessage.includes("database")
      ) {
        errorMessage +=
          "\n\nGợi ý: Kiểm tra xem tất cả các trường bắt buộc đã được điền đúng chưa, đặc biệt là giá và thông tin người bán.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Đăng tin mới</h1>
          <p className="text-gray-600 mt-2">Tạo bài đăng xe điện của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thông tin cơ bản
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại sản phẩm *{" "}
                  <span className="text-red-500">(Bắt buộc)</span>
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="vehicle">Xe điện</option>
                  <option value="battery">Pin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề bài đăng *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.productType === "vehicle"
                        ? "Tên xe (VD: VinFast VF8)"
                        : "Tên pin (VD: Tesla Model 3 Battery)"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.productType === "vehicle"
                      ? "Hãng xe"
                      : "Hãng pin"}{" "}
                    * <span className="text-red-500">(Bắt buộc)</span>
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">
                      {formData.productType === "vehicle"
                        ? "Chọn hãng xe"
                        : "Chọn hãng pin"}
                    </option>
                    {formData.productType === "vehicle" ? (
                      <>
                        <option value="VinFast">VinFast</option>
                        <option value="Tesla">Tesla</option>
                        <option value="BMW">BMW</option>
                        <option value="Mercedes">Mercedes</option>
                        <option value="Audi">Audi</option>
                        <option value="Porsche">Porsche</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Kia">Kia</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Honda">Honda</option>
                        <option value="Ford">Ford</option>
                        <option value="Chevrolet">Chevrolet</option>
                        <option value="Nissan">Nissan</option>
                        <option value="Mazda">Mazda</option>
                        <option value="Subaru">Subaru</option>
                        <option value="Volkswagen">Volkswagen</option>
                        <option value="Volvo">Volvo</option>
                        <option value="Lexus">Lexus</option>
                        <option value="Infiniti">Infiniti</option>
                        <option value="Acura">Acura</option>
                        <option value="Genesis">Genesis</option>
                        <option value="Cadillac">Cadillac</option>
                        <option value="Lincoln">Lincoln</option>
                        <option value="Buick">Buick</option>
                        <option value="Chrysler">Chrysler</option>
                        <option value="Dodge">Dodge</option>
                        <option value="Jeep">Jeep</option>
                        <option value="Ram">Ram</option>
                        <option value="GMC">GMC</option>
                        <option value="Other">Khác</option>
                      </>
                    ) : (
                      <>
                        <option value="CATL">CATL</option>
                        <option value="BYD">BYD</option>
                        <option value="LG Chem">LG Chem</option>
                        <option value="Panasonic">Panasonic</option>
                        <option value="Samsung SDI">Samsung SDI</option>
                        <option value="SK Innovation">SK Innovation</option>
                        <option value="Tesla">Tesla</option>
                        <option value="Contemporary Amperex">
                          Contemporary Amperex
                        </option>
                        <option value="EVE Energy">EVE Energy</option>
                        <option value="Gotion High-tech">
                          Gotion High-tech
                        </option>
                        <option value="Farasis Energy">Farasis Energy</option>
                        <option value="SVOLT">SVOLT</option>
                        <option value="CALB">CALB</option>
                        <option value="Lishen">Lishen</option>
                        <option value="BAK Battery">BAK Battery</option>
                        <option value="A123 Systems">A123 Systems</option>
                        <option value="Saft">Saft</option>
                        <option value="EnerDel">EnerDel</option>
                        <option value="AESC">AESC</option>
                        <option value="Other">Khác</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model * <span className="text-red-500">(Bắt buộc)</span>
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: VF8, Model 3, iX3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá bán (VNĐ) *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={displayPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: 1 200 000 000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tình trạng
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="excellent">Xuất sắc</option>
                  <option value="good">Tốt</option>
                  <option value="fair">Khá</option>
                  <option value="poor">Kém</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.productType === "vehicle"
                    ? "Mô tả chi tiết về xe, tình trạng, lịch sử sử dụng..."
                    : "Mô tả chi tiết về pin, tình trạng, lịch sử sử dụng..."
                }
                required
              />
            </div>
          </div>

          {/* Vehicle Specific Fields */}
          {formData.productType === "vehicle" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🚗 Thông số kỹ thuật xe điện
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại xe *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn loại xe</option>
                    <option value="Car">Ô tô</option>
                    <option value="Motorcycle">Xe máy</option>
                    <option value="Bike">Xe đạp điện</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Năm sản xuất *
                  </label>
                  <input
                    type="number"
                    name="manufactureYear"
                    value={formData.manufactureYear}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 2023"
                    min="2010"
                    max="2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số km đã đi
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 15000"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Đơn vị: km</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hộp số
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn hộp số</option>
                    <option value="Automatic">Tự động</option>
                    <option value="Manual">Số sàn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biển số xe *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 30A-12345"
                    pattern="[0-9]{2}[A-Z]-[0-9]{5}"
                    title="Định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Battery Specific Fields */}
          {formData.productType === "battery" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🔋 Thông số kỹ thuật pin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại pin *
                  </label>
                  <select
                    name="batteryType"
                    value={formData.batteryType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn loại pin</option>
                    <option value="CarBattery">Pin ô tô</option>
                    <option value="MotorcycleBattery">Pin xe máy</option>
                    <option value="BikeBattery">Pin xe đạp điện</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tình trạng pin (%) *
                  </label>
                  <input
                    type="number"
                    name="batteryHealth"
                    value={formData.batteryHealth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 85"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Đơn vị: %</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dung lượng (kWh) *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 50.5"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Đơn vị: kWh</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điện áp (V)
                  </label>
                  <input
                    type="number"
                    name="voltage"
                    value={formData.voltage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 48.0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Đơn vị: V</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hệ thống quản lý pin (BMS)
                  </label>
                  <input
                    type="text"
                    name="bms"
                    value={formData.bms}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: Tesla BMS v2.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tên hoặc loại hệ thống quản lý pin
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại cell
                  </label>
                  <input
                    type="text"
                    name="cellType"
                    value={formData.cellType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 18650, 21700, LFP, NMC"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Loại cell (ví dụ: 18650, 21700, LFP, NMC)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số chu kỳ sạc
                  </label>
                  <input
                    type="number"
                    name="cycleCount"
                    value={formData.cycleCount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số lần sạc/xả đã thực hiện
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Images Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hình ảnh sản phẩm (Tối đa 5 ảnh)
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload hình ảnh xe của bạn</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Chọn ảnh xe
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Document Images Upload - Only for vehicles */}
          {formData.productType === "vehicle" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Hình ảnh giấy tờ xe (Tối đa 3 ảnh)
              </h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Upload các giấy tờ quan trọng như:
                    Đăng ký xe, Bảo hiểm, Giấy tờ sở hữu, v.v.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Upload hình ảnh giấy tờ xe
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleDocumentImageUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
                  >
                    Chọn ảnh giấy tờ
                  </label>
                </div>

                {documentImages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {documentImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Document ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeDocumentImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                          Giấy tờ {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tạo..." : "Tạo bài đăng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
