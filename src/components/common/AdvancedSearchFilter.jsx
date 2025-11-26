import { useState } from "react";
import { X, Filter, Car, Battery, Tag, DollarSign, Hash } from "lucide-react";

export const AdvancedSearchFilter = ({ initialFilters = {}, onFilterChange, onClose }) => {
  const [activeTab, setActiveTab] = useState("vehicle"); // vehicle, battery
  const [filters, setFilters] = useState({
    productType: initialFilters.productType || "",
    minPrice: initialFilters.minPrice || "",
    maxPrice: initialFilters.maxPrice || "",
    condition: initialFilters.condition || "",
    brand: initialFilters.brand || "",
    model: initialFilters.model || "",
    licensePlate: initialFilters.licensePlate || "",
    year: initialFilters.year || "",
    vehicleType: initialFilters.vehicleType || "",
    maxMileage: initialFilters.maxMileage || "",
    fuelType: initialFilters.fuelType || "",
    batteryBrand: initialFilters.batteryBrand || "",
    batteryType: initialFilters.batteryType || "",
    minBatteryHealth: initialFilters.minBatteryHealth || "",
    maxBatteryHealth: initialFilters.maxBatteryHealth || "",
    minCapacity: initialFilters.minCapacity || "",
    maxCapacity: initialFilters.maxCapacity || "",
    voltage: initialFilters.voltage || "",
    minCycleCount: initialFilters.minCycleCount || "",
    maxCycleCount: initialFilters.maxCycleCount || "",
  });

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    const activeFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        activeFilters[key] = value;
      }
    });
    onFilterChange(activeFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      productType: "",
      minPrice: "",
      maxPrice: "",
      condition: "",
      brand: "",
      model: "",
      licensePlate: "",
      year: "",
      vehicleType: "",
      maxMileage: "",
      fuelType: "",
      batteryType: "",
      minBatteryHealth: "",
      maxBatteryHealth: "",
      minCapacity: "",
      maxCapacity: "",
      voltage: "",
      bms: "",
      cellType: "",
      minCycleCount: "",
      maxCycleCount: "",
    });
  };

  const popularBrands = ["VinFast", "Tesla", "BYD", "Hyundai", "Kia", "BMW", "Audi", "Mercedes"];
  const vehicleTypes = ["Car", "Motorcycle", "Truck", "Bus"];
  const fuelTypes = ["Electric", "Hybrid", "Gasoline", "Diesel"];
  const batteryBrands = [
    "CATL",
    "BYD", 
    "LG Chem",
    "Panasonic",
    "Samsung SDI",
    "SK Innovation",
    "Tesla",
    "Contemporary Amperex",
    "EVE Energy",
    "Gotion High-tech",
    "Farasis Energy",
    "SVOLT",
    "CALB",
    "Lishen",
    "BAK Battery",
    "A123 Systems",
    "Saft",
    "EnerDel",
    "AESC"
  ];
  const batteryTypes = ["Lithium-ion", "LiFePO4", "NMC", "LTO", "Solid-state"];

  // Quick prices for vehicles
  const vehicleQuickPrices = [
    { label: "< 300tr", max: 300000000 },
    { label: "300-500tr", min: 300000000, max: 500000000 },
    { label: "500-800tr", min: 500000000, max: 800000000 },
    { label: "> 800tr", min: 800000000 },
  ];

  // Quick prices for batteries
  const batteryQuickPrices = [
    { label: "< 10tr", max: 10000000 },
    { label: "10-30tr", min: 10000000, max: 30000000 },
    { label: "30-60tr", min: 30000000, max: 60000000 },
    { label: "60-100tr", min: 60000000, max: 100000000 },
    { label: "> 100tr", min: 100000000 },
  ];

  // Select appropriate quick prices based on active tab
  const quickPrices = activeTab === "battery" ? batteryQuickPrices : vehicleQuickPrices;

  const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl border border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur">
              <Filter className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Bộ lọc tìm kiếm</h3>
              {activeFilterCount > 0 && (
                <p className="text-blue-100 text-sm">
                  {activeFilterCount} bộ lọc đang áp dụng
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-1">
          <button
            onClick={() => {
              setActiveTab("vehicle");
              handleInputChange("productType", "vehicle");
            }}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === "vehicle"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Car className="h-4 w-4" />
              <span>Xe điện</span>
            </div>
            {activeTab === "vehicle" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("battery");
              handleInputChange("productType", "battery");
            }}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === "battery"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Battery className="h-4 w-4" />
              <span>Pin</span>
            </div>
            {activeTab === "battery" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {/* Common Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h4 className="font-bold text-gray-900">Khoảng giá</h4>
          </div>
          
          {/* Quick Price Buttons */}
          <div className={`grid gap-2 mb-3 ${activeTab === "battery" ? "grid-cols-5" : "grid-cols-4"}`}>
            {quickPrices.map((price, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleInputChange("minPrice", price.min || "");
                  handleInputChange("maxPrice", price.max || "");
                }}
                className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 hover:shadow-md transition-all border border-blue-200"
              >
                {price.label}
              </button>
            ))}
          </div>

          {/* Custom Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleInputChange("minPrice", e.target.value)}
              placeholder="Giá tối thiểu"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleInputChange("maxPrice", e.target.value)}
              placeholder="Giá tối đa"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
            />
          </div>
        </div>

        {/* Vehicle Filters */}
        {activeTab === "vehicle" && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <Car className="h-5 w-5 text-blue-600 mr-2" />
              Thông số xe điện
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hãng xe
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">Tất cả</option>
                  {popularBrands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dòng xe
                </label>
                <input
                  type="text"
                  value={filters.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder="VF e34, Model 3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              {/* License Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Biển số xe
                </label>
                <input
                  type="text"
                  value={filters.licensePlate}
                  onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                  placeholder="30A-12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại xe
                </label>
                <select
                  value={filters.vehicleType}
                  onChange={(e) => handleInputChange("vehicleType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">Tất cả</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
            

              {/* Manufacturing Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm sản xuất
                </label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  placeholder="2020"
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Km tối đa
                </label>
                <input
                  type="number"
                  value={filters.maxMileage}
                  onChange={(e) => handleInputChange("maxMileage", e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Battery Filters */}
        {activeTab === "battery" && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <Battery className="h-5 w-5 text-blue-600 mr-2" />
              Thông số pin
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Battery Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hãng pin
                </label>
                <select
                  value={filters.batteryBrand}
                  onChange={(e) => handleInputChange("batteryBrand", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">Chọn hãng pin</option>
                  {batteryBrands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Battery Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại pin
                </label>
                <select
                  value={filters.batteryType}
                  onChange={(e) => handleInputChange("batteryType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">Tất cả</option>
                  {batteryTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Battery Health Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sức khỏe pin tối thiểu (%)
                </label>
                <input
                  type="number"
                  value={filters.minBatteryHealth}
                  onChange={(e) => handleInputChange("minBatteryHealth", e.target.value)}
                  placeholder="80"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sức khỏe pin tối đa (%)
                </label>
                <input
                  type="number"
                  value={filters.maxBatteryHealth}
                  onChange={(e) => handleInputChange("maxBatteryHealth", e.target.value)}
                  placeholder="100"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              {/* Capacity Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dung lượng tối thiểu (kWh)
                </label>
                <input
                  type="number"
                  value={filters.minCapacity}
                  onChange={(e) => handleInputChange("minCapacity", e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dung lượng tối đa (kWh)
                </label>
                <input
                  type="number"
                  value={filters.maxCapacity}
                  onChange={(e) => handleInputChange("maxCapacity", e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              {/* Voltage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điện áp (V)
                </label>
                <input
                  type="text"
                  value={filters.voltage}
                  onChange={(e) => handleInputChange("voltage", e.target.value)}
                  placeholder="48, 72, 96..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              {/* Cycle Count Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số chu kỳ tối thiểu
                </label>
                <input
                  type="number"
                  value={filters.minCycleCount}
                  onChange={(e) => handleInputChange("minCycleCount", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số chu kỳ tối đa
                </label>
                <input
                  type="number"
                  value={filters.maxCycleCount}
                  onChange={(e) => handleInputChange("maxCycleCount", e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between sticky bottom-0">
        <button
          onClick={handleResetFilters}
          className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all border border-gray-300"
        >
          Đặt lại
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
        >
          Áp dụng {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>
    </div>
  );
};
