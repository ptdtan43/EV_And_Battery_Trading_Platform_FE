# 🔧 Khắc phục lỗi localStorage Quota Exceeded

## ❌ Triệu chứng

Khi đăng nhập, bạn thấy lỗi trong console:

```
Failed to execute 'setItem' on 'Storage': Setting the value of 'evtb_auth' exceeded the quota.
```

Hoặc không thể đăng nhập được mặc dù thông tin đăng nhập đúng.

## 🔍 Nguyên nhân

LocalStorage của browser có giới hạn kích thước (thường là 5-10MB). Khi dữ liệu lưu trữ vượt quá giới hạn này, browser sẽ từ chối lưu thêm dữ liệu mới.

**Nguyên nhân phổ biến:**
1. **Seller Name Cache quá lớn** - Cache tên người bán được lưu cho mỗi seller, có thể tích tụ theo thời gian
2. **Dữ liệu authentication cũ** - Token và user data được lưu nhiều lần
3. **Dữ liệu rác** - Dữ liệu từ các session cũ không được xóa

## ✅ Giải pháp nhanh

### Cách 1: Sử dụng Tool (Khuyến nghị)

1. Mở file `clear_localstorage.html` trong browser
2. Nhấn nút **"🗑️ Chỉ xóa Seller Cache"** (an toàn, không mất dữ liệu đăng nhập)
3. Hoặc nhấn **"💣 Xóa toàn bộ localStorage"** (xóa hết, cần đăng nhập lại)

### Cách 2: Qua Console Browser (Nhanh nhất)

1. Mở DevTools (F12)
2. Vào tab **Console**
3. Chạy lệnh:

```javascript
// Chỉ xóa seller cache (khuyến nghị)
localStorage.removeItem('sellerNameCache');
location.reload();

// HOẶC xóa toàn bộ (cần đăng nhập lại)
localStorage.clear();
location.reload();
```

### Cách 3: Qua Browser Settings

**Chrome/Edge:**
1. Mở DevTools (F12)
2. Tab **Application** → **Storage** → **Local Storage**
3. Chọn `http://localhost:5173` (hoặc domain của bạn)
4. Xóa key `sellerNameCache` hoặc click "Clear All"

**Firefox:**
1. Mở DevTools (F12)
2. Tab **Storage** → **Local Storage**
3. Xóa các key không cần thiết

## 🛠️ Fix đã triển khai

Đã tối ưu hóa code để ngăn lỗi này:

### 1. Giới hạn kích thước Seller Cache
```javascript
// src/pages/HomePage.jsx
// ✅ Chỉ lưu tối đa 50 sellers
if (entries.length > 50) {
  const trimmedCache = Object.fromEntries(entries.slice(-50));
}
```

### 2. Tự động cleanup khi quota exceeded
```javascript
catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Tự động xóa cache và tiếp tục
    localStorage.removeItem('sellerNameCache');
    setSellerCache({});
  }
}
```

### 3. Xử lý lỗi khi load cache
```javascript
// Nếu cache bị corrupt, tự động xóa
try {
  const parsedCache = JSON.parse(cached);
} catch (error) {
  localStorage.removeItem('sellerNameCache');
  return {};
}
```

## 📊 Kiểm tra kích thước localStorage

Chạy trong Console:

```javascript
function checkLocalStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += new Blob([localStorage.getItem(key)]).size;
    }
  }
  const mb = (total / (1024 * 1024)).toFixed(2);
  console.log(`📦 Total localStorage: ${mb} MB`);
  
  // Chi tiết từng key
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const size = new Blob([localStorage.getItem(key)]).size;
      const kb = (size / 1024).toFixed(2);
      console.log(`  - ${key}: ${kb} KB`);
    }
  }
}

checkLocalStorageSize();
```

## 🚨 Phòng tránh trong tương lai

### 1. Định kỳ xóa cache
Chạy lệnh này khi cảm thấy app chậm:
```javascript
localStorage.removeItem('sellerNameCache');
```

### 2. Kiểm tra kích thước localStorage
Thường xuyên kiểm tra bằng tool hoặc console.

### 3. Không lưu dữ liệu lớn
- Tránh lưu images/binary data vào localStorage
- Chỉ lưu text/JSON nhỏ gọn
- Sử dụng sessionStorage cho dữ liệu tạm thời

### 4. Implement TTL (Time To Live)
```javascript
// Ví dụ: Tự động xóa cache sau 7 ngày
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const cacheData = {
  data: sellerCache,
  timestamp: Date.now()
};

// Khi load, kiểm tra expiry
const cached = JSON.parse(localStorage.getItem('sellerNameCache'));
if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
  // Cache đã hết hạn, xóa đi
  localStorage.removeItem('sellerNameCache');
}
```

## 📝 Best Practices

1. **Luôn wrap localStorage trong try-catch**
   ```javascript
   try {
     localStorage.setItem(key, value);
   } catch (error) {
     if (error.name === 'QuotaExceededError') {
       // Handle quota exceeded
     }
   }
   ```

2. **Giới hạn kích thước data trước khi lưu**
   ```javascript
   if (JSON.stringify(data).length > MAX_SIZE) {
     // Trim or compress data
   }
   ```

3. **Sử dụng compression cho data lớn**
   ```javascript
   import pako from 'pako';
   const compressed = pako.deflate(JSON.stringify(data));
   ```

4. **Consider IndexedDB cho data lớn**
   - localStorage: ~5-10MB
   - IndexedDB: ~50MB+ (depending on browser)

## 🔗 Resources

- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Storage Quota](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

## ❓ FAQ

**Q: Xóa localStorage có mất dữ liệu không?**
A: Có, bạn sẽ bị đăng xuất và mất cache. Nhưng bạn chỉ cần đăng nhập lại là được.

**Q: Tại sao không dùng sessionStorage?**
A: sessionStorage bị xóa khi đóng tab. localStorage giữ lại khi reload/reopen.

**Q: Có cách nào tăng giới hạn localStorage không?**
A: Không. Đây là giới hạn của browser, không thể thay đổi. Dùng IndexedDB nếu cần lưu nhiều data hơn.

**Q: Lỗi này có ảnh hưởng đến người dùng khác không?**
A: Không. localStorage là local, mỗi browser/user có localStorage riêng.

