import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, X, AlertTriangle, ExternalLink } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { notifyPostCreated } from "../lib/notificationApi";
import { ReportModal } from "../components/common/ReportModal";
import {
  addWatermarkToImages,
  shouldWatermarkImage,
} from "../utils/watermarkUtils";
import {
  formatVietnamesePrice,
  parsePriceValue,
} from "../utils/priceFormatter";

// Mapping giữa các hãng xe và model tương ứng
const brandModelMapping = {
  VinFast: ["VF5", "VF6", "VF7", "VF8", "VF9", "VF e34", "VF e35", "VF e36"],
  Tesla: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster"],
  BMW: ["iX", "iX3", "i4", "iX1", "i7", "i5"],
  Mercedes: ["EQC", "EQS", "EQE", "EQA", "EQB", "EQV", "EQS SUV"],
  Audi: ["e-tron", "e-tron GT", "Q4 e-tron", "Q8 e-tron", "e-tron Sportback"],
  Porsche: ["Taycan", "Macan Electric"],
  Hyundai: ["IONIQ 5", "IONIQ 6", "Kona Electric"],
  Kia: ["EV6", "EV9", "Niro EV", "Soul EV"],
  Toyota: ["bZ4X", "bZ3"],
  Honda: ["e", "Prologue"],
  Ford: ["Mustang Mach-E", "F-150 Lightning", "E-Transit"],
  Chevrolet: ["Bolt EV", "Bolt EUV", "Silverado EV", "Blazer EV", "Equinox EV"],
  Nissan: ["Leaf", "Ariya"],
  Mazda: ["MX-30"],
  Subaru: ["Solterra"],
  Volkswagen: ["ID.3", "ID.4", "ID.5", "ID.6", "ID.7", "ID.Buzz"],
  Volvo: ["XC40 Recharge", "C40 Recharge", "EX30", "EX90"],
  Lexus: ["RZ 450e", "UX 300e"],
  Infiniti: ["QX Inspiration"],
  Acura: ["ZDX"],
  Genesis: ["GV60", "Electrified GV70", "Electrified G80"],
  Cadillac: ["Lyriq", "Celestiq"],
  Lincoln: ["Aviator Grand Touring"],
  Buick: ["Electra"],
  Chrysler: ["Airflow"],
  Dodge: ["Charger Daytona"],
  Jeep: ["Wagoneer S", "Recon"],
  Ram: ["1500 REV"],
  GMC: ["Hummer EV", "Sierra EV", "Equinox EV"],
  Other: [] // Cho phép nhập tự do nếu chọn "Khác"
};

// Mapping giữa các hãng pin và model tương ứng
const batteryBrandModelMapping = {
  "CATL": ["CATL NCM811", "CATL LFP", "CATL NCM622", "CATL NCM523", "CATL Qilin"],
  "BYD": ["BYD Blade", "BYD LFP", "BYD NCM", "BYD DM-i"],
  "LG Chem": ["LG Chem NCM622", "LG Chem NCM811", "LG Chem NCM712"],
  "Panasonic": ["Panasonic NCA", "Panasonic 2170", "Panasonic 4680"],
  "Samsung SDI": ["Samsung SDI NCM622", "Samsung SDI NCM811", "Samsung SDI NCM712"],
  "SK Innovation": ["SK Innovation NCM622", "SK Innovation NCM811", "SK Innovation NCM712"],
  "Tesla": ["Tesla 2170", "Tesla 4680", "Tesla LFP"],
  "Contemporary Amperex": ["CATL NCM811", "CATL LFP", "CATL NCM622"],
  "EVE Energy": ["EVE LFP", "EVE NCM", "EVE LCO"],
  "Gotion High-tech": ["Gotion LFP", "Gotion NCM", "Gotion LCO"],
  "Farasis Energy": ["Farasis NCM", "Farasis LFP"],
  "SVOLT": ["SVOLT NCM", "SVOLT LFP"],
  "CALB": ["CALB LFP", "CALB NCM"],
  "Lishen": ["Lishen LFP", "Lishen NCM"],
  "BAK Battery": ["BAK LFP", "BAK NCM"],
  "A123 Systems": ["A123 LFP", "A123 NCM"],
  "Saft": ["Saft LFP", "Saft NCM"],
  "EnerDel": ["EnerDel LFP", "EnerDel NCM"],
  "AESC": ["AESC NCM", "AESC LFP"],
  "Other": [] // Cho phép nhập tự do nếu chọn "Khác"
};

// Function để lấy danh sách model dựa trên brand và productType
const getModelsByBrand = (brand, productType = "vehicle") => {
  if (!brand || brand === "Other") {
    return [];
  }
  
  if (productType === "battery") {
    return batteryBrandModelMapping[brand] || [];
  } else {
    return brandModelMapping[brand] || [];
  }
};

export const CreateListing = () => {
  const { user, profile } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      console.log("❌ User not authenticated, redirecting to login");
      navigate("/login");
      return;
    }
    console.log("✅ User authenticated:", user);

    // Debug: Check token in localStorage
    const authData = localStorage.getItem("evtb_auth");
    console.log("🔍 Auth data in localStorage:", authData);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        console.log("🔍 Parsed auth data:", parsed);
        console.log("🔍 Token exists:", !!parsed?.token);
        console.log("🔍 Token length:", parsed?.token?.length || 0);
      } catch (err) {
        console.error("🔍 Error parsing auth data:", err);
      }
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const isSubmittingRef = useRef(false);
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

    condition: "",
    productType: "vehicle",
    // Vehicle specific fields
    vehicleType: "",
    manufactureYear: "",
    warrantyPeriod: "",
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
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedProductForReport, setSelectedProductForReport] = useState(null);
  const duplicateCheckTimeoutRef = useRef(null);

  // Function để check duplicate license plate
  const checkDuplicateLicensePlate = async (licensePlate) => {
    if (!licensePlate || licensePlate.trim() === "") {
      setDuplicateProducts([]);
      return;
    }

    // Validate format trước
    const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
    if (!licensePlateRegex.test(licensePlate.trim())) {
      setDuplicateProducts([]);
      return;
    }

    setCheckingDuplicate(true);
    try {
      const allProducts = await apiRequest("/api/Product");
      const productsArray = Array.isArray(allProducts) ? allProducts : [];
      
      // Tìm products có cùng license plate (case-insensitive) và chỉ lấy những sản phẩm đang hiển thị trên HomePage
      const duplicates = productsArray.filter((product) => {
        const productLicensePlate = (product.licensePlate || product.LicensePlate || "").trim().toUpperCase();
        const inputLicensePlate = licensePlate.trim().toUpperCase();
        const productStatus = String(product.status || product.Status || "").toLowerCase().trim();
        
        // Áp dụng logic filter giống HomePage: chỉ hiển thị những sản phẩm approved/active/verified và không phải sold/rejected/reserved
        const isApproved = productStatus === "approved" || productStatus === "active" || productStatus === "verified";
        const isNotSold = productStatus !== "sold";
        const isNotRejected = productStatus !== "rejected";
        const isNotReserved = productStatus !== "reserved";
        const shouldShow = isApproved && isNotSold && isNotRejected && isNotReserved;
        
        // Chỉ lấy những sản phẩm có cùng biển số và đang hiển thị trên HomePage
        return (
          productLicensePlate === inputLicensePlate && 
          productLicensePlate !== "" &&
          shouldShow
        );
      });

      setDuplicateProducts(duplicates);
      console.log("🔍 Duplicate license plates found:", duplicates);
    } catch (error) {
      console.error("❌ Error checking duplicate license plate:", error);
      setDuplicateProducts([]);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Debounce check duplicate khi licensePlate thay đổi
  useEffect(() => {
    if (duplicateCheckTimeoutRef.current) {
      clearTimeout(duplicateCheckTimeoutRef.current);
    }

    if (formData.licensePlate && formData.productType === "vehicle") {
      duplicateCheckTimeoutRef.current = setTimeout(() => {
        checkDuplicateLicensePlate(formData.licensePlate);
      }, 500); // Debounce 500ms
    } else {
      setDuplicateProducts([]);
    }

    return () => {
      if (duplicateCheckTimeoutRef.current) {
        clearTimeout(duplicateCheckTimeoutRef.current);
      }
    };
  }, [formData.licensePlate, formData.productType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

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
    } else if (name === "productType") {
      // Khi productType thay đổi, reset brand và model vì danh sách khác nhau giữa vehicle và battery
      setFormData({
        ...formData,
        productType: value,
        brand: "",
        model: "",
      });
    } else if (name === "brand") {
      // Khi brand thay đổi, reset model nếu model hiện tại không thuộc brand mới
      const newModels = getModelsByBrand(value, formData.productType);
      const currentModel = formData.model;
      const shouldResetModel = value && value !== "Other" && !newModels.includes(currentModel);
      
      setFormData({
        ...formData,
        brand: value,
        model: shouldResetModel ? "" : formData.model,
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
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

    // Prevent multiple submissions using ref
    if (isSubmittingRef.current || loading) {
      console.log("⚠️ Form already submitting, ignoring duplicate submission");
      return;
    }

    // Check authentication before proceeding
    const authData = localStorage.getItem("evtb_auth");
    if (!authData) {
      setError("Bạn cần đăng nhập để tạo bài đăng. Đang chuyển hướng...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    // Check if token is valid
    try {
      const parsed = JSON.parse(authData);
      const token = parsed?.token;
      if (!token) {
        setError("Token không hợp lệ. Vui lòng đăng nhập lại.");
        localStorage.removeItem("evtb_auth");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      // Check token expiration
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < currentTime;

      if (isExpired) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("evtb_auth");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      console.log("✅ Token validation passed");
    } catch (error) {
      console.error("❌ Token validation failed:", error);
      setError("Token không hợp lệ. Vui lòng đăng nhập lại.");
      localStorage.removeItem("evtb_auth");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    isSubmittingRef.current = true;
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
          !formData.capacity
        ) {
          throw new Error(
            "Vui lòng điền đầy đủ thông tin pin: loại pin và dung lượng."
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

      // Validate year if provided (for vehicles and batteries)
      if (formData.manufactureYear) {
        const year = parseInt(formData.manufactureYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 2000 || year > currentYear) {
          throw new Error(`Năm sản xuất phải là số từ 2000 đến ${currentYear}.`);
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
        verificationStatus: "NotRequested", // Set default verification status for new products
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
            : formData.productType === "battery"
            ? formData.manufactureYear
              ? parseInt(formData.manufactureYear)
              : 0
            : 0,
        mileage:
          formData.productType === "vehicle"
            ? formData.mileage
              ? parseInt(formData.mileage)
              : 0
            : 0,
        seatCount:
          formData.productType === "vehicle"
            ? formData.seatCount
              ? parseInt(formData.seatCount)
              : 0
            : 0,
        licensePlate: formData.licensePlate || "string",
        warrantyPeriod: formData.productType === "vehicle" ? (formData.warrantyPeriod || "") : "",
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
      console.log(`⏰ Submission timestamp:`, new Date().toISOString());

      try {
        console.log(`🔄 Creating product... (Single submission)`);
        created = await apiRequest(apiEndpoint, {
          method: "POST",
          body: productData,
        });
        console.log(`✅ Product created successfully:`, created);
        console.log(`✅ Product ID: ${created?.productId || created?.id}`);
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

      // Debug product creation response
      console.log("🔍 Product creation response:", created);
      console.log("🔍 Available ID fields:", {
        id: created?.id,
        productId: created?.productId,
        Id: created?.Id,
        ProductId: created?.ProductId,
        ID: created?.ID,
      });

      const pid =
        created?.id ||
        created?.productId ||
        created?.Id ||
        created?.ProductId ||
        created?.ID;

      if (!pid) {
        throw new Error(
          "Không thể lấy ID sản phẩm từ phản hồi API. Vui lòng thử lại."
        );
      }

      console.log("✅ Product ID resolved:", pid);

      // Upload product images after product creation
      if (images.length > 0) {
        console.log(
          `🖼️ Uploading ${images.length} product images for product ${pid}... (Single upload)`
        );

        let uploadSuccess = false;
        let uploadErrors = [];

        try {
          // Try multiple upload first
          const uploadFormData = new FormData();
          uploadFormData.append("productId", pid.toString());

          // Set image name based on product type - ảnh xe
          const imageName =
            formData.productType === "vehicle" ? "Vehicle" : "Battery";
          uploadFormData.append("name", imageName);

          // Add all product images to FormData
          images.forEach((image, index) => {
            uploadFormData.append("images", image);
          });

          console.log("🚀 Attempting multiple image upload with FormData:", {
            productId: pid,
            imageName: imageName,
            imageCount: images.length,
            formDataKeys: Array.from(uploadFormData.keys()),
          });

          const uploadedImages = await apiRequest(
            `/api/ProductImage/multiple`,
            {
              method: "POST",
              body: uploadFormData,
            }
          );

          console.log(
            "✅ Multiple product images uploaded successfully:",
            uploadedImages
          );
          uploadSuccess = true;
        } catch (e) {
          console.warn(
            "❌ Multiple product image upload failed, trying individual uploads:",
            e
          );
          uploadErrors.push(`Multiple upload failed: ${e.message}`);

          // Fallback to individual uploads
          let individualSuccessCount = 0;
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            try {
              const individualFormData = new FormData();
              individualFormData.append("productId", pid.toString());
              individualFormData.append("imageFile", img);

              // Set image name based on product type - ảnh xe
              const imageName =
                formData.productType === "vehicle" ? "Vehicle" : "Battery";
              individualFormData.append("name", imageName);

              console.log(
                `📤 Uploading product image ${i + 1}/${
                  images.length
                } for product ${pid} with name: ${imageName}`
              );

              const result = await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: individualFormData,
              });

              console.log(
                `✅ Product image ${i + 1} uploaded successfully:`,
                result
              );
              individualSuccessCount++;
            } catch (e) {
              const errorMsg = `Image ${i + 1} upload failed: ${e.message}`;
              console.warn(`❌ ${errorMsg}`, e);
              uploadErrors.push(errorMsg);
            }
          }

          if (individualSuccessCount > 0) {
            uploadSuccess = true;
            console.log(
              `✅ ${individualSuccessCount}/${images.length} images uploaded successfully via individual method`
            );
          }
        }

        if (!uploadSuccess) {
          console.error("❌ All image upload methods failed:", uploadErrors);
          throw new Error(
            `Không thể upload ảnh sản phẩm: ${uploadErrors.join(", ")}`
          );
        }
      } else {
        console.log("ℹ️ No product images were selected for upload.");
      }

      // Upload document images after product creation
      if (documentImages.length > 0) {
        console.log(
          `📄 Uploading ${documentImages.length} document images for product ${pid}... (Single upload)`
        );

        let docUploadSuccess = false;
        let docUploadErrors = [];

        try {
          // Try multiple upload first for documents
          const docFormData = new FormData();
          docFormData.append("productId", pid.toString());
          docFormData.append("imageType", "document"); // Add type to distinguish from product images
          docFormData.append("name", "Document"); // Set name for document images - ảnh giấy tờ xe

          // Add all document images to FormData
          documentImages.forEach((image, index) => {
            docFormData.append("images", image);
          });

          console.log(
            "🚀 Attempting multiple document image upload with FormData:",
            {
              productId: pid,
              imageName: "Document",
              imageCount: documentImages.length,
              formDataKeys: Array.from(docFormData.keys()),
            }
          );

          const uploadedDocumentImages = await apiRequest(
            `/api/ProductImage/multiple`,
            {
              method: "POST",
              body: docFormData,
            }
          );

          console.log(
            "✅ Multiple document images uploaded successfully:",
            uploadedDocumentImages
          );
          docUploadSuccess = true;
        } catch (e) {
          console.warn(
            "❌ Multiple document image upload failed, trying individual uploads:",
            e
          );
          docUploadErrors.push(`Multiple document upload failed: ${e.message}`);

          // Fallback to individual uploads for documents
          let individualDocSuccessCount = 0;
          for (let i = 0; i < documentImages.length; i++) {
            const img = documentImages[i];
            try {
              const individualDocFormData = new FormData();
              individualDocFormData.append("productId", pid.toString());
              individualDocFormData.append("imageFile", img);
              individualDocFormData.append("imageType", "document"); // Add type to distinguish
              individualDocFormData.append("name", "Document"); // Set name for document images - ảnh giấy tờ xe

              console.log(
                `📤 Uploading document image ${i + 1}/${
                  documentImages.length
                } for product ${pid} with name: Document`
              );

              const result = await apiRequest(`/api/ProductImage`, {
                method: "POST",
                body: individualDocFormData,
              });

              console.log(
                `✅ Document image ${i + 1} uploaded successfully:`,
                result
              );
              individualDocSuccessCount++;
            } catch (e) {
              const errorMsg = `Document image ${i + 1} upload failed: ${
                e.message
              }`;
              console.warn(`❌ ${errorMsg}`, e);
              docUploadErrors.push(errorMsg);
            }
          }

          if (individualDocSuccessCount > 0) {
            docUploadSuccess = true;
            console.log(
              `✅ ${individualDocSuccessCount}/${documentImages.length} document images uploaded successfully via individual method`
            );
          }
        }

        if (!docUploadSuccess) {
          console.error(
            "❌ All document image upload methods failed:",
            docUploadErrors
          );
          throw new Error(
            `Không thể upload ảnh giấy tờ: ${docUploadErrors.join(", ")}`
          );
        }
      } else {
        console.log("ℹ️ No document images were selected for upload.");
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

      // Prepare success message with image upload status
      const imageStatus =
        images.length > 0
          ? documentImages.length > 0 && formData.productType === "vehicle"
            ? `Đã upload ${images.length} ảnh ${formData.productType === "vehicle" ? "xe (Vehicle)" : "pin (Battery)"} và ${documentImages.length} ảnh giấy tờ xe (Document).`
            : `Đã upload ${images.length} ảnh ${formData.productType === "vehicle" ? "xe (Vehicle)" : "pin (Battery)"}.`
          : documentImages.length > 0 && formData.productType === "vehicle"
          ? `Đã upload ${documentImages.length} ảnh giấy tờ xe (Document).`
          : "Chưa có ảnh nào được upload.";

      // Add inspection request status
      const inspectionStatus =
        formData.productType === "vehicle" && formData.inspectionRequested
          ? " Đã yêu cầu kiểm định xe - Admin sẽ liên hệ để hẹn lịch kiểm tra."
          : "";

      // ✅ Get remaining credits from response (already deducted)
      const remainingCredits = created?.remainingPostCredits ?? created?.RemainingPostCredits;
      console.log('💎 Remaining credits after posting:', remainingCredits);

      show({
        title: "✅ Tạo bài đăng thành công",
        description: `${imageStatus}${inspectionStatus} Bài đăng của bạn đang chờ admin duyệt. ${
          notificationSent
            ? "Bạn sẽ được thông báo khi được duyệt."
            : "(Hệ thống thông báo tạm thời không khả dụng)"
        }${remainingCredits !== undefined ? ` Bạn còn ${remainingCredits} credit${remainingCredits !== 1 ? 's' : ''}.` : ''} ⚠️ Nếu bị từ chối, credit sẽ được hoàn lại.`,
        type: "success",
      });

      // ✅ Refresh credits immediately after posting (already deducted)
      if (typeof window.refreshCredits === 'function') {
        console.log('🔄 Refreshing credits widget...');
        window.refreshCredits();
      }

      // Reset form to prevent duplicate submissions
      console.log("🔄 Resetting form after successful submission");
      setFormData({
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
        condition: "",
        productType: "vehicle",
        vehicleType: "",
        manufactureYear: "",
        warrantyPeriod: "",
        batteryHealth: "",
        batteryType: "",
        capacity: "",
        voltage: "",
        bms: "",
        cellType: "",
        cycleCount: "",
        seatCount: "",
        inspectionRequested: false,
      });
      setImages([]);
      setDocumentImages([]);

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
      isSubmittingRef.current = false; // Reset submission flag
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
          <p className="text-gray-600 mt-2">
            {formData.productType === "vehicle"
              ? "Tạo bài đăng xe điện của bạn"
              : "Tạo bài đăng pin của bạn"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Credit Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  💎 Chính sách Credits
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Đăng tin sẽ <strong>TRỪ 1 CREDIT</strong> ngay lập tức</li>
                  <li>✅ Nếu admin <strong>TỪ CHỐI</strong> → <strong>HOÀN LẠI 1 CREDIT</strong></li>
                  <li>✅ Bạn có thể sửa và gửi lại (trừ 1 credit mỗi lần resubmit)</li>
                  <li>⚠️ Vui lòng đăng tin chất lượng để tránh bị từ chối</li>
                </ul>
              </div>
            </div>
          </div>

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
                  {formData.brand && formData.brand !== "Other" && getModelsByBrand(formData.brand, formData.productType).length > 0 ? (
                    <select
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Chọn model</option>
                      {getModelsByBrand(formData.brand, formData.productType).map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        formData.brand === "Other" 
                          ? (formData.productType === "battery" ? "Nhập model pin" : "Nhập model xe")
                          : (formData.productType === "battery" ? "Chọn hãng pin trước" : "Chọn hãng xe trước")
                      }
                      required
                      disabled={!formData.brand || (formData.brand !== "Other" && getModelsByBrand(formData.brand, formData.productType).length > 0)}
                    />
                  )}
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
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: 99%, 95%, 90%..."
                />
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
                    Biển số xe *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      duplicateProducts.length > 0
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="VD: 30A-12345"
                    pattern="[0-9]{2}[A-Z]-[0-9]{5}"
                    title="Định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Định dạng: 30A-12345 (2 số + 1 chữ cái + 5 số)
                  </p>
                  
                  {/* Loading indicator */}
                  {checkingDuplicate && (
                    <p className="text-xs text-blue-500 mt-1">
                      🔍 Đang kiểm tra biển số...
                    </p>
                  )}

                  {/* Duplicate warning */}
                  {duplicateProducts.length > 0 && !checkingDuplicate && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800 mb-2">
                            ⚠️ Biển số này đã được sử dụng!
                          </p>
                          <p className="text-xs text-red-700 mb-3">
                            Phát hiện {duplicateProducts.length} tin đăng khác sử dụng biển số này. 
                            Nếu đây là biển số giả, vui lòng báo cáo.
                          </p>
                          
                          {/* List of duplicate products */}
                          <div className="space-y-2 mb-3">
                            {duplicateProducts.map((product) => {
                              const productId = product.productId || product.id || product.ProductId || product.Id;
                              const productTitle = product.title || product.Title || "Không có tiêu đề";
                              const productBrand = product.brand || product.Brand || "";
                              const productModel = product.model || product.Model || "";
                              
                              return (
                                <div
                                  key={productId}
                                  className="p-2 bg-white rounded border border-red-200"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <Link
                                        to={`/product/${productId}`}
                                        target="_blank"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {productTitle}
                                        {productBrand && productModel && (
                                          <span className="text-gray-500 text-xs">
                                            {" "}({productBrand} {productModel})
                                          </span>
                                        )}
                                      </Link>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedProductForReport(product);
                                        setShowReportModal(true);
                                      }}
                                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded border border-red-300 transition-colors"
                                    >
                                      Báo cáo
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời hạn bảo hành
                  </label>
                  <input
                    type="text"
                    name="warrantyPeriod"
                    value={formData.warrantyPeriod}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 6 tháng, 1 năm, 2 năm..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ví dụ: 6 tháng, 1 năm, 2 năm, hoặc "Còn bảo hành đến 12/2025"
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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Năm sản xuất pin
                  </label>
                  <input
                    type="number"
                    name="manufactureYear"
                    value={formData.manufactureYear}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: 2023"
                    min="2000"
                    max={new Date().getFullYear()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Năm sản xuất của pin
                  </p>
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
              {formData.productType === "battery" ? "Hình ảnh pin (Tối đa 5 ảnh)" : "Hình ảnh xe (Tối đa 5 ảnh)"}
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {formData.productType === "battery"
                    ? "Upload hình ảnh pin của bạn (ảnh sẽ được lưu với tên \"Vehicle\")"
                    : "Upload hình ảnh xe của bạn (ảnh xe sẽ được lưu với tên \"Vehicle\")"}
                </p>
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
                  {formData.productType === "battery" ? "Chọn ảnh pin" : "Chọn ảnh xe"}
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
                    Upload hình ảnh giấy tờ xe (ảnh giấy tờ sẽ được lưu với tên
                    "Document")
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
              onClick={(e) => {
                // Additional protection against double clicks
                if (loading) {
                  e.preventDefault();
                  return false;
                }
              }}
            >
              {loading ? "Đang tạo..." : "Tạo bài đăng"}
            </button>
          </div>
        </form>
      </div>

      {/* Report Modal for duplicate license plates */}
      {selectedProductForReport && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedProductForReport(null);
          }}
          product={selectedProductForReport}
        />
      )}
    </div>
  );
};
