# 🐛 Debug Real-time Issue - Phải refresh mới thấy tin nhắn

## ⚠️ Vấn đề phát hiện

**Port mismatch!**
- Frontend đang chạy: `http://localhost:5174/`
- Backend CORS cho phép: `http://localhost:5173`

→ SignalR bị block bởi CORS!

## ✅ Fix ngay

### Option 1: Đổi port frontend về 5173

**File: `vite.config.js`**

Thêm config:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173  // ← Force port 5173
  }
})
```

Sau đó restart dev server.

### Option 2: Thêm port 5174 vào backend CORS

**File Backend: `BE.API/Program.cs` (dòng 184-187)**

Thêm port 5174:
```csharp
.WithOrigins(
    "http://localhost:5173",
    "http://localhost:5174",  // ← THÊM PORT NÀY
    "https://evtrading-frontend.vercel.app"
)
```

Sau đó restart backend.

---

## 🧪 Cách kiểm tra

### 1. Check Console Errors

Mở DevTools Console, tìm error:
```
❌ Access to XMLHttpRequest blocked by CORS policy
❌ WebSocket connection failed
```

### 2. Check SignalR Connection

Console sẽ hiển thị:
```javascript
// ❌ FAIL
❌ SignalR connection error: Error: Failed to complete negotiation...

// ✅ SUCCESS  
✅ SignalR connected successfully!
📊 Connection ID: abc123...
```

### 3. Check Network Tab

1. DevTools → Network → WS (WebSocket)
2. Tìm `chatHub`
3. **Nếu không có** → SignalR không connect được
4. **Nếu có + Status 101** → SignalR connected

---

## 📋 Complete Checklist

- [ ] Frontend port: 5173 hoặc backend CORS có port 5174
- [ ] Backend đang chạy
- [ ] Console: "✅ SignalR connected successfully!"
- [ ] Network tab có WebSocket connection
- [ ] Header hiển thị 🟢 "Real-time"

