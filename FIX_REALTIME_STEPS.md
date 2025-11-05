# 🔧 Fix Real-time Chat - Các bước thực hiện

## ⚠️ Vấn đề

**Frontend chạy port 5174 nhưng backend CORS chỉ allow port 5173**

→ SignalR bị CORS block → Phải refresh mới thấy tin nhắn

---

## ✅ Solution: Fix frontend port về 5173

### Bước 1: Stop dev server hiện tại

```bash
# Trong terminal đang chạy npm run dev
Ctrl + C
```

### Bước 2: Kiểm tra file vite.config.js

**File đã được cập nhật:**
```javascript
server: {
  port: 5173, // ← Đã thêm dòng này
  proxy: { ... }
}
```

### Bước 3: Restart dev server

```bash
npm run dev
```

**Kết quả mong đợi:**
```
VITE v5.4.8  ready in 1589 ms
➜  Local:   http://localhost:5173/   ← PORT 5173
```

### Bước 4: Test SignalR

1. Mở browser: `http://localhost:5173`
2. Login
3. Navigate to `/chats`
4. Mở Console (F12)

**Console sẽ hiển thị:**
```
🔌 Initializing SignalR connection...
🔗 Building SignalR connection to: http://localhost:5044/chatHub
🔑 Token exists: true
🎫 Providing token to SignalR: Yes
🚀 Starting SignalR connection...
✅ SignalR connected successfully!
📊 Connection ID: abc123...
📊 Connection State: Connected
```

**Header sẽ hiển thị:**
- 🟢 **Real-time** (thành công)
- 🔴 **Offline** (thất bại)

---

## 🧪 Test Real-time

### Quick Test:

1. **Browser 1 (Normal):**
   - Login User A
   - Go to `/chats`
   - Mở Console

2. **Browser 2 (Incognito):**
   - Login User B
   - Vào product của User A
   - Click "Chat với người bán"
   - Send message: "Hello!"

3. **Back to Browser 1:**
   - ✅ Message xuất hiện **NGAY LẬP TỨC**
   - ✅ Console: `📨 Received message via SignalR: {...}`
   - ✅ **KHÔNG CẦN REFRESH**

---

## 🐛 Nếu vẫn chưa work

### Debug Step 1: Check Console Errors

Tìm các errors:
```javascript
// ❌ CORS error
Access to XMLHttpRequest at 'http://localhost:5044/chatHub/negotiate' 
from origin 'http://localhost:5173' has been blocked by CORS policy

// ❌ WebSocket error
WebSocket connection to 'ws://localhost:5044/chatHub' failed

// ❌ Authentication error
Error: Failed to complete negotiation with the server: Unauthorized
```

### Debug Step 2: Check Backend CORS

**Backend file: `BE.API/Program.cs` (line ~184)**

Phải có:
```csharp
.WithOrigins(
    "http://localhost:5173",  // ✅ Must have this
    "https://evtrading-frontend.vercel.app"
)
.AllowCredentials()  // ✅ Must have this
```

### Debug Step 3: Check Token

```javascript
// Paste trong console
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expired?', Date.now() > payload.exp * 1000);
}
```

### Debug Step 4: Manual SignalR Test

```javascript
// Paste trong console
await signalRService.connect();
console.log('State:', signalRService.getState());
console.log('Connected:', signalRService.connected);
```

### Debug Step 5: Check Backend Running

```bash
curl http://localhost:5044/swagger/index.html
```

Hoặc mở browser: `http://localhost:5044`

---

## 📋 Complete Test Checklist

**Trước khi test:**
- [ ] Backend đang chạy (http://localhost:5044)
- [ ] Frontend đang chạy port 5173 (http://localhost:5173)
- [ ] User đã login
- [ ] Token valid (check localStorage)

**Khi test:**
- [ ] Console hiển thị "✅ SignalR connected successfully!"
- [ ] Header hiển thị 🟢 "Real-time"
- [ ] Network tab có WebSocket connection (WS tab)
- [ ] Không có CORS errors

**After test:**
- [ ] Send message → Nhận ngay lập tức
- [ ] Console hiển thị "📨 Received message via SignalR"
- [ ] Không cần refresh
- [ ] Multiple messages work
- [ ] Read receipts update

---

## 🎯 Expected vs Actual

### ❌ BEFORE (Không hoạt động):

```
User B gửi: "Hello!"
→ User A: (không thấy gì)
→ User A refresh: "Hello!" xuất hiện
→ Console: 🔴 Offline hoặc CORS error
```

### ✅ AFTER (Hoạt động):

```
User B gửi: "Hello!"
→ User A: "Hello!" xuất hiện NGAY LẬP TỨC (< 1s)
→ Console: 📨 Received message via SignalR
→ Header: 🟢 Real-time
```

---

## 💡 Tips

1. **Hard refresh:** Ctrl+Shift+R nếu cache cũ
2. **Clear console:** Để dễ thấy logs mới
3. **Check both browsers:** Cả 2 phải thấy "✅ SignalR connected"
4. **Backend logs:** Terminal backend sẽ show SignalR connections

---

## 📞 Quick Commands

```bash
# Restart backend
cd "D:\Project hoc hanh\SWP\Du an SWP\EV_and_battery_trading_platform_BE\BE.API"
dotnet run

# Restart frontend
cd "D:\Project hoc hanh\SWP\Du an SWP\SWP391_Topic2_Frontend_ver2"
npm run dev

# Check port
netstat -ano | findstr :5173
netstat -ano | findstr :5044
```

---

**Sau khi fix port về 5173, real-time sẽ hoạt động!** 🚀

