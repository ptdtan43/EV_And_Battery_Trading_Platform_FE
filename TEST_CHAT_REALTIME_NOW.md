# 🧪 Test Chat Real-time - Làm ngay bây giờ

## ✅ Code đã fix

SignalR service đã được sửa để không reject connection khi chưa có token.

---

## 🎯 Test Real-time (2 phút)

### Bước 1: Restart Frontend (QUAN TRỌNG!)

**Vì code đã thay đổi, cần restart:**

```bash
# Trong terminal đang chạy npm run dev
Ctrl + C

# Chờ server stop, rồi chạy lại:
npm run dev
```

**Đợi thấy:**
```
➜  Local:   http://localhost:5173/
```

---

### Bước 2: Hard Refresh Browser

```
Ctrl + Shift + R
```

Hoặc:
```
Ctrl + F5
```

Để xóa cache cũ.

---

### Bước 3: Test với 2 Users

#### Browser 1 (Normal):
1. Navigate: `http://localhost:5173`
2. Login **User A** (Giang - opgoodvsbad@gmail.com)
3. Navigate: `http://localhost:5173/chats`
4. Mở Console (F12)

**Console phải hiển thị:**
```javascript
🔗 Building SignalR connection to: http://localhost:5044/chatHub
🚀 Starting SignalR connection...
🎫 Providing token to SignalR (length): 501
✅ SignalR connected successfully!
📊 Connection ID: abc123...
📊 Connection State: Connected
🚪 Attempting to join chat: 1
✅ Successfully joined chat: 1
```

**Header phải hiển thị:**
- 🟢 **Real-time** ← PHẢI THẤY CÁI NÀY!

#### Browser 2 (Incognito):
1. Navigate: `http://localhost:5173`
2. Login **User B** (user khác)
3. Navigate to product của User A
4. Click "Chat với người bán"
5. Gửi message: "Xin chào!"

#### Quay lại Browser 1:

**✅ PHẢI THẤY:**
- Message "Xin chào!" xuất hiện **NGAY LẬP TỨC** (< 1 giây)
- **KHÔNG CẦN REFRESH**
- Console hiển thị:
```javascript
📨 Received message via SignalR: {
  messageId: ...,
  content: "Xin chào!",
  senderId: ...,
  chatId: 1
}
```

---

## ❌ Nếu vẫn không work

### Check 1: Console Errors

**Tìm các errors này:**

```javascript
// ❌ BAD - Token issue
⚠️ accessTokenFactory: No token in localStorage

// ❌ BAD - CORS issue
Access to XMLHttpRequest blocked by CORS policy

// ❌ BAD - Connection fail
Failed to complete negotiation with the server

// ✅ GOOD - Should see this
🎫 Providing token to SignalR (length): 501
✅ SignalR connected successfully!
```

### Check 2: Backend Running?

Mở: `http://localhost:5044`

Phải thấy Swagger UI.

### Check 3: Token exists?

```javascript
// Paste trong console
console.log('Token:', localStorage.getItem('token'));
```

Phải thấy string dài ~500 ký tự.

**Nếu null:**
- Logout và login lại
- Clear localStorage và login lại

### Check 4: Port đúng?

Frontend phải chạy port **5173** (không phải 5174).

```
Local:   http://localhost:5173/  ← PHẢI 5173
```

Nếu không phải 5173:
- Stop dev server
- Kill process trên port 5173
- Restart: `npm run dev`

### Check 5: Network Tab

1. DevTools → Network → WS tab
2. Phải thấy: `chatHub?id=...`
3. Status: **101 Switching Protocols**
4. Frames tab có messages

**Nếu không thấy WebSocket:**
→ SignalR chưa connect

---

## 📊 Expected Behavior

| Action | User A sees | User B sees | Time |
|--------|-------------|-------------|------|
| B gửi "Hello" | "Hello" xuất hiện | "Hello" trong chat | < 1s |
| A reply "Hi" | "Hi" trong chat | "Hi" xuất hiện | < 1s |
| B gửi nhiều messages | Tất cả xuất hiện real-time | Trong chat | < 1s |

---

## 🎬 Video Evidence

Record màn hình để verify:
1. Header có 🟢 "Real-time"
2. Console có "✅ SignalR connected"
3. Message xuất hiện ngay (không refresh)
4. Console log "📨 Received message via SignalR"

---

## 💡 Debug Tips

### Tip 1: Disable Browser Extensions

Chrome extensions có thể block WebSocket. Test trong Incognito mode.

### Tip 2: Clear Everything

```javascript
// Paste trong console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Rồi login lại.

### Tip 3: Check Backend Logs

Terminal backend sẽ hiển thị:
```
info: Microsoft.AspNetCore.SignalR.HubConnectionContext[1]
      Connection "abc123" connected to SignalR hub.
```

### Tip 4: Manual Test

```javascript
// Paste trong console sau khi login
await signalRService.connect();
console.log('Connected:', signalRService.connected);
console.log('State:', signalRService.getState());
```

Phải thấy:
```
Connected: true
State: "Connected"
```

---

## ✅ Success Checklist

- [ ] Frontend chạy port 5173
- [ ] Backend chạy port 5044
- [ ] Login thành công
- [ ] Console: "✅ SignalR connected successfully!"
- [ ] Header: 🟢 "Real-time"
- [ ] Network tab có WebSocket
- [ ] Không có CORS errors
- [ ] Send message → Nhận ngay lập tức
- [ ] Console: "📨 Received message via SignalR"
- [ ] **KHÔNG CẦN REFRESH!**

---

**Nếu tất cả checklist đều ✅ → Real-time chat đã hoạt động! 🎉**

**Nếu vẫn fail → Share console logs đầy đủ để debug tiếp!**

