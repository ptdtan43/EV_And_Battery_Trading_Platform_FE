# 🔧 SignalR CORS Fix - Hướng dẫn sửa lỗi Real-time Chat

## ⚠️ Vấn đề

SignalR real-time chat không kết nối được do lỗi CORS:
```
Access to fetch at 'http://localhost:5044/chatHub/negotiate?negotiateVersion=1' 
from origin 'http://localhost:5174' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Đã sửa trong Backend

### File: `backend/Program.cs`

1. **Sửa CORS policy application:**
```csharp
// ✅ FIX: Use specific policy name for SignalR compatibility
app.UseCors("AllowFrontend");
```

2. **Disable HTTPS redirection trong development:**
```csharp
// ✅ FIX: Only use HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
```

3. **Enable detailed errors cho SignalR:**
```csharp
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // Enable detailed errors for debugging
});
```

## 🔄 Cách áp dụng fix

### Bước 1: Restart Backend

**QUAN TRỌNG:** Backend PHẢI được restart để áp dụng thay đổi CORS!

```bash
# Dừng backend hiện tại (Ctrl+C)
# Sau đó chạy lại:
cd backend
dotnet run
```

### Bước 2: Kiểm tra Backend đang chạy

Đảm bảo backend đang chạy trên `http://localhost:5044` (không phải HTTPS)

### Bước 3: Test CORS

Mở browser console và chạy:
```javascript
fetch('http://localhost:5044/chatHub/negotiate?negotiateVersion=1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Kết quả mong muốn:** Không có lỗi CORS, nhận được response từ server.

### Bước 4: Test SignalR Connection

Trong browser console:
```javascript
import signalRService from './src/services/signalRService.js';
await signalRService.connect();
```

**Kết quả mong muốn:** `✅ SignalR connected successfully!`

## 🐛 Troubleshooting

### Nếu vẫn bị lỗi CORS:

1. **Kiểm tra backend đã restart chưa:**
   - Backend PHẢI được restart sau khi sửa CORS
   - Kiểm tra console log của backend có thấy request đến `/chatHub/negotiate` không

2. **Kiểm tra port:**
   - Frontend: `http://localhost:5174`
   - Backend: `http://localhost:5044`
   - Đảm bảo cả hai đều dùng HTTP (không phải HTTPS)

3. **Kiểm tra CORS policy:**
   - Mở `backend/Program.cs`
   - Đảm bảo `http://localhost:5174` có trong `WithOrigins()`
   - Đảm bảo có `.AllowCredentials()`

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) hoặc `Cmd+Shift+R` (Mac)
   - Hoặc clear cache và reload

### Nếu vẫn không kết nối được:

1. **Kiểm tra JWT token:**
   - Mở DevTools > Application > Local Storage
   - Kiểm tra `evtb_auth` có token không
   - Token phải hợp lệ và chưa hết hạn

2. **Kiểm tra backend logs:**
   - Xem console của backend có log gì không
   - Có thấy request đến `/chatHub/negotiate` không
   - Có lỗi authentication không

3. **Test với curl:**
```bash
curl -X POST http://localhost:5044/chatHub/negotiate?negotiateVersion=1 \
  -H "Origin: http://localhost:5174" \
  -H "Content-Type: application/json" \
  -v
```

**Kết quả mong muốn:** Thấy header `Access-Control-Allow-Origin: http://localhost:5174`

## ✅ Kết quả mong đợi

Sau khi fix:
- ✅ SignalR kết nối thành công
- ✅ Không còn lỗi CORS
- ✅ Real-time chat hoạt động (tin nhắn hiển thị ngay lập tức)
- ✅ Không cần refresh để thấy tin nhắn mới

## 📝 Lưu ý

1. **Backend PHẢI restart** sau khi sửa CORS
2. **Cả frontend và backend** phải dùng HTTP trong development
3. **Token phải hợp lệ** để SignalR có thể authenticate
4. **Polling mode** sẽ tự động fallback nếu SignalR không kết nối được

