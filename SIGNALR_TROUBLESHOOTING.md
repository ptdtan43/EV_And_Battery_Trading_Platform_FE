# 🔧 SignalR Troubleshooting Guide

## ❌ Vấn đề: Phải refresh mới thấy tin nhắn mới

### Nguyên nhân chính:

**Backend CORS configuration không tương thích với SignalR**

```csharp
// ❌ SAI - Không hoạt động với SignalR
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
```

**Vấn đề:** `AllowAnyOrigin()` không thể dùng cùng với `AllowCredentials()` mà SignalR yêu cầu.

---

## ✅ Giải pháp đã áp dụng (Frontend Only)

### 1. **Pass Token qua Query String**
Thay vì dùng Authorization header (cần credentials), pass token qua URL:

```javascript
const hubUrl = `${baseURL}/chatHub?access_token=${token}`;
```

### 2. **Fallback Polling Mechanism**
Nếu SignalR không kết nối được, tự động poll messages mỗi 3 giây:

```javascript
// Auto polling nếu SignalR fail
setInterval(() => {
  if (!isConnected && selectedChatId) {
    loadChatMessages(selectedChatId);
  }
}, 3000);
```

### 3. **Flexible Transport**
Cho phép SignalR thử tất cả transport types:
- WebSockets (fastest)
- ServerSentEvents (fallback 1)
- LongPolling (fallback 2)

```javascript
transport: signalR.HttpTransportType.WebSockets | 
           signalR.HttpTransportType.ServerSentEvents | 
           signalR.HttpTransportType.LongPolling
```

---

## 🧪 Cách test

### Test 1: Check Console Logs
Mở DevTools Console, bạn sẽ thấy:

**Nếu SignalR hoạt động:**
```
🔗 Building SignalR connection to: http://localhost:5044/chatHub
🔑 Token exists: true
🚀 Starting SignalR connection...
✅ SignalR connected successfully!
📊 Connection ID: abc123
✅ Successfully joined chat: 123
```

**Nếu SignalR fail (sử dụng polling):**
```
❌ SignalR connection error: Error: ...
⚠️ Thông báo: Real-time chat không khả dụng, sử dụng chế độ polling
📡 Polling for new messages (SignalR not connected)
```

### Test 2: Network Tab
Kiểm tra Network tab:

**SignalR success:**
- `ws://localhost:5044/chatHub?access_token=...` (WebSocket)
- Status: 101 Switching Protocols

**Polling fallback:**
- `GET /api/Message/chat/{chatId}` mỗi 3 giây

### Test 3: Real-time Messaging
1. Mở 2 browser windows
2. Login 2 users khác nhau
3. User A gửi message → User B sẽ:
   - **SignalR ON**: Nhận ngay lập tức (< 100ms)
   - **Polling ON**: Nhận trong vòng 3 giây

---

## 📊 Status Indicator

Header sẽ hiển thị:

| Icon | Status | Ý nghĩa |
|------|--------|---------|
| 🟢 Real-time | SignalR connected | Real-time hoạt động tốt |
| 🔴 Offline | Polling mode | Dùng polling, messages delay 3s |
| ⏳ Đang kết nối... | Connecting | Đang thử kết nối SignalR |

---

## 🔧 Nếu muốn fix triệt để (Cần sửa Backend)

### Option A: Fix CORS (Recommended)

```csharp
// ✅ ĐÚNG - Cho phép specific origins với credentials
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.WithOrigins("http://localhost:5173", "http://localhost:3000")
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials())); // Required for SignalR
```

### Option B: Configure Hub để accept query string token

```csharp
// In ChatHub or Program.cs
builder.Services.AddSignalR();

// Configure JWT from query string
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                
                if (!string.IsNullOrEmpty(accessToken) && 
                    path.StartsWithSegments("/chatHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });
```

### Option C: Anonymous Hub (Không khuyến khích)

```csharp
[AllowAnonymous]
public class ChatHub : Hub
{
    // ... methods
}
```

---

## 🎯 Kết luận

**Hiện tại:**
- ✅ Chat vẫn hoạt động bình thường
- ✅ Messages được gửi/nhận thành công
- ⚠️ Có thể có delay 3 giây nếu SignalR không connect được

**Để có trải nghiệm tốt nhất:**
- 🔧 Sửa backend CORS configuration
- ✅ SignalR sẽ hoạt động real-time
- ⚡ Messages instant (< 100ms)

---

## 📞 Debug Commands

```javascript
// Check SignalR state
console.log("SignalR State:", signalRService.getState());
console.log("Is Connected:", signalRService.connected);

// Manual test
await signalRService.connect();
await signalRService.joinChat(123);

// Check listeners
console.log("Active listeners:", signalRService.listeners);
```

---

**✨ Với fallback polling, chat vẫn hoạt động tốt dù SignalR có vấn đề!**


