# Mapping giữa CreateListing và Advanced Search Filter

## Mục đích
Document này đảm bảo rằng **Advanced Search Filter** chỉ cho phép tìm kiếm theo những field mà người dùng có thể nhập trong **CreateListing form**.

---

## ✅ Fields mapping (100% khớp)

### 1. Thông tin chung

| CreateListing Field | Search Filter Field | Type | Notes |
|---------------------|---------------------|------|-------|
| `productType` | `productType` | Select | vehicle / battery |
| `condition` | `condition` | Select | excellent / good / fair / poor |
| `price` | `minPrice`, `maxPrice` | Range | Khoảng giá |

### 2. Thông số xe điện (Vehicle)

| CreateListing Field | Search Filter Field | Type | Notes |
|---------------------|---------------------|------|-------|
| `brand` | `brand` | Select | Hãng xe |
| `model` | `model` | Text input | Mẫu xe |
| `year` / `manufactureYear` | `minYear`, `maxYear` | Range | Năm sản xuất |
| `vehicleType` | `vehicleType` | Select | Car/Motorcycle/Truck/Bus/Other |
| `mileage` | `maxMileage` | Number | Số km đã đi (tối đa) |
| `color` | `color` | Text input | Màu sắc (nhập tự do) |
| `fuelType` | `fuelType` | Select | Electric/Hybrid/Gasoline/Diesel |

### 3. Thông số pin (Battery)

| CreateListing Field | Search Filter Field | Type | Notes |
|---------------------|---------------------|------|-------|
| `batteryType` | `batteryType` | Select | Loại pin |
| `batteryHealth` | `minBatteryHealth`, `maxBatteryHealth` | Range | Độ khỏe pin (%) |
| `capacity` | `minCapacity`, `maxCapacity` | Range | Dung lượng (Ah) |
| `voltage` | `voltage` | Number | Điện áp (V) |
| `bms` | `bms` | Text input | BMS |
| `cellType` | `cellType` | Select | Loại cell |
| `cycleCount` | `minCycleCount`, `maxCycleCount` | Range | Số chu kỳ |

---

## ❌ Fields KHÔNG có trong CreateListing (Đã xóa)

Những field sau đã bị xóa khỏi Advanced Search vì không có trong CreateListing:

- ~~`verificationStatus`~~ - Không phải field người dùng nhập
- ~~`transmission`~~ - Không có trong CreateListing
- ~~`seatCount`~~ - Không có trong CreateListing
- ~~`maxManufactureYear`~~ - Duplicate với `year`
- ~~`minManufactureYear`~~ - Duplicate với `year`

---

## 🔄 Quy tắc đồng bộ

### Khi thêm field mới vào CreateListing:
1. Thêm field vào `CreateListing.jsx`
2. Thêm field tương ứng vào `AdvancedSearchFilter.jsx`
3. Cập nhật logic filter trong `advancedSearchApi.js`
4. Cập nhật mapping table này

### Khi xóa field khỏi CreateListing:
1. Xóa field khỏi `CreateListing.jsx`
2. Xóa field tương ứng khỏi `AdvancedSearchFilter.jsx`
3. Xóa logic filter trong `advancedSearchApi.js`
4. Cập nhật mapping table này

---

## 📋 Validation Rules

### Vehicle fields
- `year` / `minYear` / `maxYear`: 2000 - năm hiện tại
- `mileage` / `maxMileage`: >= 0
- `color`: Text input (không giới hạn)

### Battery fields
- `batteryHealth`: 0-100%
- `capacity`: > 0 (Ah)
- `voltage`: > 0 (V)
- `cycleCount`: >= 0

### Price
- `minPrice`, `maxPrice`: >= 0
- `minPrice` <= `maxPrice`

---

## 🎯 Filter Types

### Select Dropdown
- `productType`
- `condition`
- `brand`
- `vehicleType`
- `fuelType`
- `batteryType`
- `cellType`

### Text Input (Free text)
- `model`
- `color`
- `bms`

### Number Input
- `voltage`

### Range Inputs (Min/Max)
- Price: `minPrice` - `maxPrice`
- Year: `minYear` - `maxYear`
- Mileage: `0` - `maxMileage`
- Battery Health: `minBatteryHealth` - `maxBatteryHealth`
- Capacity: `minCapacity` - `maxCapacity`
- Cycle Count: `minCycleCount` - `maxCycleCount`

---

## ✅ Checked by
- **Date**: October 27, 2025
- **Version**: v2.0 (Synced with CreateListing)
- **Status**: ✅ 100% Matched

---

## 📝 Notes

1. **Tất cả filter fields đều khớp 1-1 với CreateListing**
2. **Không có field "thừa"** - Chỉ search được những gì có thể nhập
3. **Consistency** - User experience nhất quán
4. **Maintainability** - Dễ maintain khi CreateListing thay đổi

