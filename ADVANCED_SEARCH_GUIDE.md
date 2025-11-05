# Hướng dẫn sử dụng Bộ lọc tìm kiếm nâng cao

## Tổng quan

Tính năng **Bộ lọc tìm kiếm nâng cao** được thiết kế dựa trên **các field trong CreateListing form**. Bộ lọc này đảm bảo tính nhất quán - chỉ có thể tìm kiếm theo những thông số mà người dùng có thể nhập khi tạo tin đăng.

## Các tính năng chính

### 1. Loại sản phẩm & Tình trạng
**Loại sản phẩm:**
- **Tất cả**: Hiển thị cả xe điện và pin
- **🚗 Xe điện**: Chỉ hiển thị xe điện (vehicle)
- **🔋 Pin**: Chỉ hiển thị pin (battery)

**Tình trạng:** (Từ CreateListing)
- **Xuất sắc** (excellent)
- **Tốt** (good)
- **Khá** (fair)
- **Cần sửa chữa** (poor)

### 2. Khoảng giá
- **Bộ lọc nhanh**:
  - < 300 triệu
  - 300 - 500 triệu
  - 500 - 800 triệu
  - > 800 triệu
- **Khoảng giá tùy chỉnh**: Nhập giá tối thiểu và giá tối đa

### 3. Thông số xe điện (Từ CreateListing)
Các field khớp 100% với form CreateListing:
- **Hãng xe** (brand): VinFast, Tesla, BYD, Hyundai, Kia, BMW, Audi, Mercedes, Nissan, Honda
- **Mẫu xe** (model): Nhập tên mẫu xe (VD: VF e34, Model 3)
- **Năm sản xuất** (year/manufactureYear): Từ năm ... đến năm ...
- **Loại xe** (vehicleType): Car, Motorcycle, Truck, Bus, Other
- **Số km đã đi** (mileage): Lọc theo quãng đường tối đa
- **Màu sắc** (color): Nhập tự do (VD: Đỏ, Trắng, Đen...)
- **Loại nhiên liệu** (fuelType): Electric, Hybrid, Gasoline, Diesel

### 4. Thông số pin (Từ CreateListing)
Các field khớp 100% với form CreateListing:
- **Loại pin** (batteryType): Lithium-ion, LiFePO4, NMC, LTO, Solid-state, Khác
- **Độ khỏe pin** (batteryHealth): Từ ... % đến ... %
- **Dung lượng** (capacity): Từ ... Ah đến ... Ah
- **Điện áp** (voltage): Nhập điện áp (VD: 48, 72, 96)
- **BMS** (bms): Nhập loại BMS (VD: Smart BMS, Basic BMS)
- **Loại cell** (cellType): 18650, 21700, Prismatic, Pouch, Khác
- **Số chu kỳ** (cycleCount): Từ ... đến ... chu kỳ

## Cách sử dụng

### 1. Mở bộ lọc
- Trên trang chủ, nhìn vào thanh tìm kiếm
- Nhấn vào nút **Filter** (biểu tượng phễu) bên cạnh nút "Tìm kiếm"

### 2. Chọn tiêu chí lọc
- Mở rộng các mục bằng cách nhấn vào tiêu đề
- Chọn/nhập các tiêu chí mong muốn
- Có thể kết hợp nhiều tiêu chí cùng lúc

### 3. Áp dụng bộ lọc
- Nhấn nút **"Áp dụng bộ lọc"** ở cuối form
- Hệ thống sẽ tìm kiếm và hiển thị kết quả phù hợp
- Số lượng bộ lọc đang hoạt động sẽ hiển thị trên nút Filter

### 4. Đặt lại bộ lọc
- Nhấn nút **"Đặt lại"** để xóa tất cả bộ lọc
- Hoặc nhấn nút **"Xem tất cả sản phẩm"** để quay lại danh sách ban đầu

## Cấu trúc kỹ thuật

### Files liên quan

1. **`src/components/common/AdvancedSearchFilter.jsx`**
   - Component UI cho bộ lọc nâng cao
   - Quản lý state của các bộ lọc
   - Giao diện collapsible cho từng nhóm bộ lọc

2. **`src/lib/advancedSearchApi.js`**
   - API function để gọi backend search endpoint
   - Fallback client-side filtering nếu backend không hỗ trợ
   - Xử lý các filter parameters

3. **`src/pages/HomePage.jsx`**
   - Tích hợp `AdvancedSearchFilter` component
   - Quản lý state `showAdvancedFilter` và `activeFilters`
   - Handler `handleAdvancedFilter` để xử lý kết quả

4. **`src/pages/CreateListing.jsx`** (Nguồn gốc)
   - Tất cả filter fields đều khớp với CreateListing form
   - Đảm bảo tính nhất quán: search theo đúng field có thể nhập

### API Endpoint (Backend)

Nếu backend hỗ trợ, endpoint sẽ là:
```
GET /api/Product/search/advanced?productType=Vehicle&minPrice=100000000&maxPrice=500000000&brand=Tesla...
```

Nếu backend chưa hỗ trợ, hệ thống sẽ tự động fallback sang client-side filtering.

## Lưu ý

1. **Performance**: 
   - Client-side filtering có thể chậm nếu có quá nhiều sản phẩm
   - Nên implement backend endpoint `/api/Product/search/advanced` để tối ưu

2. **Validation**:
   - Giá tối thiểu không được lớn hơn giá tối đa
   - Năm sản xuất không được vượt quá năm hiện tại
   - Độ khỏe pin phải từ 0-100%

3. **UX**:
   - Số lượng bộ lọc đang hoạt động hiển thị trên nút Filter
   - Bộ lọc tự động đóng sau khi áp dụng
   - Có thể kết hợp với tìm kiếm thông thường

## Tương lai

- [ ] Thêm bộ lọc theo vị trí/khu vực
- [ ] Lưu bộ lọc yêu thích
- [ ] Bộ lọc theo đánh giá/rating
- [ ] Export kết quả tìm kiếm
- [ ] Tìm kiếm theo khoảng cách (GPS)

## Troubleshooting

### Bộ lọc không hoạt động
1. Kiểm tra console browser để xem lỗi
2. Đảm bảo backend đang chạy
3. Kiểm tra network tab xem API có được gọi không

### Kết quả không chính xác
1. Kiểm tra các tiêu chí đã nhập có đúng không
2. Thử đặt lại bộ lọc và áp dụng lại
3. Kiểm tra dữ liệu sản phẩm trong database có đầy đủ không

### Performance chậm
1. Giảm số lượng tiêu chí lọc
2. Sử dụng bộ lọc nhanh thay vì nhập giá tùy chỉnh
3. Yêu cầu developer implement backend endpoint

