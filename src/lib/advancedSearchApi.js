import { apiRequest } from "./api";

/**
 * Advanced search for products with multiple filter criteria
 * @param {Object} filters - Filter object with various search criteria
 * @returns {Promise<Array>} - Array of products matching the filters
 */
export const advancedSearchProducts = async (filters) => {
    try {
        console.log("[Advanced Search] Starting with filters:", filters);

        // Build query string from filters
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
                queryParams.append(key, value);
            }
        });

        const queryString = queryParams.toString();
        console.log("[Advanced Search] Query string:", queryString);

        // Try to use the backend search endpoint if available
        try {
            const endpoint = `/api/Product/search/advanced?${queryString}`;
            console.log("[Advanced Search] Calling API:", endpoint);

            const results = await apiRequest(endpoint);
            const productsArray = Array.isArray(results) ? results : results?.items || [];

            console.log(`[Advanced Search] Backend returned ${productsArray.length} products`);
            return productsArray;
        } catch (apiError) {
            console.warn("[Advanced Search] Backend endpoint not available, using client-side filtering:", apiError.message);

            // Fallback to client-side filtering
            return await clientSideAdvancedSearch(filters);
        }
    } catch (error) {
        console.error("[Advanced Search] Error:", error);
        throw error;
    }
};

/**
 * Client-side advanced search fallback
 * Filters products locally if backend doesn't support advanced search
 */
const clientSideAdvancedSearch = async (filters) => {
    try {
        console.log("[Client-side Search] Fetching all products...");

        // Get all products from backend
        const allProductsData = await apiRequest("/api/Product");
        const allProducts = Array.isArray(allProductsData)
            ? allProductsData
            : allProductsData?.items || [];

        console.log(`[Client-side Search] Total products: ${allProducts.length}`);

        // Filter products based on criteria
        const filteredProducts = allProducts.filter(product => {
            // Only show approved and available products
            const status = String(product.status || product.Status || "").toLowerCase();
            if (status !== "approved" && status !== "active" && status !== "verified") {
                return false;
            }
            if (status === "sold" || status === "reserved" || status === "rejected") {
                return false;
            }

            // Filter by product type
            if (filters.productType) {
                const productType = String(product.productType || "").toLowerCase();
                if (productType !== filters.productType.toLowerCase()) {
                    return false;
                }
            }

            // Filter by condition
            if (filters.condition) {
                const productCondition = String(product.condition || "").toLowerCase();
                if (productCondition !== filters.condition.toLowerCase()) {
                    return false;
                }
            }

            // Filter by price range
            if (filters.minPrice && product.price < parseInt(filters.minPrice)) {
                return false;
            }
            if (filters.maxPrice && product.price > parseInt(filters.maxPrice)) {
                return false;
            }

            // Vehicle-specific filters
            if (filters.brand) {
                const productBrand = String(product.brand || "").toLowerCase();
                if (!productBrand.includes(filters.brand.toLowerCase())) {
                    return false;
                }
            }

            if (filters.model) {
                const productModel = String(product.model || "").toLowerCase();
                if (!productModel.includes(filters.model.toLowerCase())) {
                    return false;
                }
            }

            // Filter by license plate
            if (filters.licensePlate) {
                const productLicensePlate = String(product.licensePlate || product.license_plate || "").toLowerCase();
                if (!productLicensePlate.includes(filters.licensePlate.toLowerCase())) {
                    return false;
                }
            }

            if (filters.year && product.year !== parseInt(filters.year)) {
                return false;
            }

            if (filters.vehicleType) {
                const productVehicleType = String(product.vehicleType || "").toLowerCase();
                if (productVehicleType !== filters.vehicleType.toLowerCase()) {
                    return false;
                }
            }

            if (filters.maxMileage && product.mileage > parseInt(filters.maxMileage)) {
                return false;
            }

            if (filters.fuelType) {
                const productFuelType = String(product.fuelType || "").toLowerCase();
                if (productFuelType !== filters.fuelType.toLowerCase()) {
                    return false;
                }
            }

            // Battery-specific filters
            if (filters.batteryBrand) {
                const productBatteryBrand = String(product.batteryBrand || product.brand || "").toLowerCase();
                if (!productBatteryBrand.includes(filters.batteryBrand.toLowerCase())) {
                    return false;
                }
            }

            if (filters.batteryType) {
                const productBatteryType = String(product.batteryType || "").toLowerCase();
                if (!productBatteryType.includes(filters.batteryType.toLowerCase())) {
                    return false;
                }
            }

            if (filters.minBatteryHealth && product.batteryHealth < parseInt(filters.minBatteryHealth)) {
                return false;
            }

            if (filters.maxBatteryHealth && product.batteryHealth > parseInt(filters.maxBatteryHealth)) {
                return false;
            }

            if (filters.minCapacity && product.capacity < parseInt(filters.minCapacity)) {
                return false;
            }

            if (filters.maxCapacity && product.capacity > parseInt(filters.maxCapacity)) {
                return false;
            }

            if (filters.voltage && product.voltage !== parseInt(filters.voltage)) {
                return false;
            }

            if (filters.minCycleCount && product.cycleCount < parseInt(filters.minCycleCount)) {
                return false;
            }

            if (filters.maxCycleCount && product.cycleCount > parseInt(filters.maxCycleCount)) {
                return false;
            }

            return true;
        });

        console.log(`[Client-side Search] Filtered to ${filteredProducts.length} products`);
        return filteredProducts;
    } catch (error) {
        console.error("[Client-side Search] Error:", error);
        throw new Error("Không thể tìm kiếm sản phẩm. Vui lòng thử lại sau.");
    }
};

