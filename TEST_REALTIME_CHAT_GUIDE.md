# 🧪 Test Real-time Chat - Hướng dẫn chi tiết

## 🎯 Chuẩn bị

### Yêu cầu:
- ✅ Backend đang chạy: `http://localhost:5044`
- ✅ Frontend đang chạy: `http://localhost:5173`
- ✅ 2 browser windows (hoặc 1 normal + 1 incognito)
- ✅ 2 tài khoản user khác nhau

---

## 📋 Test Case 1: Basic Real-time Messaging

### Bước 1: Setup User A

1. Mở **Browser Window 1** (Chrome normal)
2. Navigate to: `http://localhost:5173`
3. Login với **User A** (user có sản phẩm)
4. Navigate to: `http://localhost:5173/chats`
5. Mở **DevTools** (F12) → Tab **Console**

**Console sẽ hiển thị:**
```
🔌 Initializing SignalR connection...
🔗 Building SignalR connection to: http://localhost:5044/chatHub
🔑 Token exists: true
🎫 Providing token to SignalR: Yes
🚀 Starting SignalR connection...
✅ SignalR connected successfully!
📊 Connection ID: Wxyz123...
```

### Bước 2: Setup User B

1. Mở **Browser Window 2** (Chrome incognito)
2. Navigate to: `http://localhost:5173`
3. Login với **User B** (user khác)
4. Navigate to sản phẩm của User A
5. Click button **"Chat với người bán"**
6. Nhập tin nhắn: "Hello, còn hàng không?"
7. Click **"Gửi tin nhắn"**

**Kết quả mong đợi:**
- ✅ Modal đóng lại
- ✅ Redirect đến `/chats?chat={chatId}`
- ✅ Tin nhắn hiển thị trong chat window

### Bước 3: Kiểm tra Real-time

**Quay lại Browser Window 1 (User A):**

**Kết quả mong đợi:**
- ✅ Chat mới xuất hiện trong danh sách (KHÔNG CẦN REFRESH)
- ✅ Console hiển thị:
```
📨 Received message via SignalR: {
  messageId: 123,
  chatId: 5,
  senderId: 2,
  content: "Hello, còn hàng không?",
  createdDate: "2025-01-29T..."
}
```

### Bước 4: Reply

**User A gửi reply:**
1. Click vào chat mới
2. Nhập: "Còn hàng bạn ơi!"
3. Click "Gửi"

**Quay lại Browser Window 2 (User B):**

**Kết quả mong đợi:**
- ✅ Message xuất hiện NGAY LẬP TỨC (< 1 giây)
- ✅ Không cần refresh
- ✅ Console hiển thị "Received message via SignalR"

---

## 📋 Test Case 2: Multiple Messages

### Tiếp tục từ Test Case 1:

**User B gửi nhiều messages liên tiếp:**
1. "Còn bao nhiêu chiếc?"
2. "Giá có thương lượng không?"
3. "Tôi muốn xem trực tiếp được không?"

**Kết quả mong đợi:**
- ✅ User A nhận được TẤT CẢ messages ngay lập tức
- ✅ Messages hiển thị đúng thứ tự
- ✅ Không bị mất message nào
- ✅ Auto scroll to bottom

---

## 📋 Test Case 3: Connection Status

### Test reconnection:

1. User A đang ở trang `/chats`
2. Tắt backend (Ctrl+C trong terminal backend)
3. Quan sát header:
   - ✅ Icon đổi từ 🟢 "Real-time" → 🔴 "Offline"
   - ✅ Console: "🔴 SignalR connection closed"

4. Bật lại backend (`dotnet run`)
5. Đợi 2-10 giây
6. Quan sát:
   - ✅ Icon đổi từ 🔴 "Offline" → 🟢 "Real-time"
   - ✅ Console: "✅ Reconnected to SignalR"
   - ✅ Auto rejoin chat room

---

## 📋 Test Case 4: Polling Fallback

### Test khi SignalR fail:

1. Nếu SignalR không connect được (thấy 🔴 "Offline")
2. User B gửi message
3. Quan sát User A:
   - ✅ Message vẫn hiển thị sau 3 giây (polling)
   - ✅ Console: "📡 Polling for new messages (SignalR not connected)"
   - ✅ Chat vẫn hoạt động bình thường

---

## 📋 Test Case 5: Multiple Chats

### Test với nhiều conversations:

1. User A có nhiều chats với users khác nhau
2. Mở trang `/chats`
3. Chọn chat với User B
4. User B gửi message
   - ✅ Message hiển thị ngay
5. User C gửi message (chat khác)
   - ✅ Danh sách chat update
   - ✅ Unread count tăng lên

---

## 📋 Test Case 6: Read Receipts

### Test mark as read:

1. User A nhận message mới từ User B
2. Message của User B hiển thị ✓ (một tick)
3. User A mở chat đó
4. Quan sát User B's message:
   - ✅ Tick đổi từ ✓ → ✓✓ (hai tick)
   - ✅ Hoặc màu thay đổi

---

## 📋 Test Case 7: Unread Count

### Test chat bell:

1. User A ở bất kỳ trang nào (không phải `/chats`)
2. User B gửi message mới
3. Quan sát bell icon trong header:
   - ✅ Badge hiển thị số lượng unread (ví dụ: "1")
   - ✅ Click vào bell → navigate to `/chats`

---

## 🐛 Debug Checklist

### Nếu Real-time không hoạt động:

#### Check 1: Backend Running
```bash
curl http://localhost:5044/swagger/index.html
```
- ✅ Nên thấy Swagger UI
- ❌ Nếu không → chạy backend

#### Check 2: Token Valid
```javascript
// Paste vào console
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Exists' : 'Missing');

// Decode JWT
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Is expired:', Date.now() > payload.exp * 1000);
}
```

#### Check 3: SignalR Connection
```javascript
// Paste vào console
console.log('SignalR State:', signalRService.getState());
console.log('Is Connected:', signalRService.connected);
console.log('Connection:', signalRService.connection);
```

#### Check 4: Network Tab
1. Mở DevTools → Network tab
2. Filter: **WS** (WebSocket)
3. Tìm: `chatHub?id=...`
4. ✅ Status: 101 Switching Protocols
5. ✅ Messages tab hiển thị traffic

#### Check 5: Backend Logs
Terminal backend sẽ hiển thị:
```
info: Microsoft.AspNetCore.SignalR[1]
      Connection "abc123" connected to SignalR hub.
```

---

## 📊 Expected Results Summary

| Action | Expected Result | Time |
|--------|----------------|------|
| Send message | Receiver sees it | < 100ms |
| Backend restart | Auto reconnect | 2-10s |
| SignalR fail | Fallback to polling | 3s delay |
| Multiple messages | All delivered in order | < 100ms each |
| Read message | Tick changes ✓ → ✓✓ | Instant |
| New chat | Appears in list | < 100ms |

---

## ✅ Success Criteria

Chat real-time được coi là **hoạt động tốt** nếu:

- ✅ Messages được gửi/nhận ngay lập tức (< 1s)
- ✅ Header hiển thị 🟢 "Real-time"
- ✅ Console không có errors
- ✅ Network tab có WebSocket connection
- ✅ Auto reconnect sau khi mất kết nối
- ✅ Fallback polling hoạt động nếu SignalR fail
- ✅ Unread count cập nhật đúng
- ✅ Read receipts hoạt động

---

## 🎬 Video Test Flow

### Chuẩn bị recording:
1. Screen record cả 2 browser windows
2. Hiển thị console logs
3. Demo full flow từ đầu đến cuối

### Flow:
1. Login 2 users
2. User B start chat với User A
3. User A nhận được ngay (không refresh)
4. Chat qua lại vài messages
5. Show console logs
6. Show connection status
7. (Optional) Test reconnection

---

## 📞 Support

**Nếu gặp vấn đề:**

1. Check `SIGNALR_TROUBLESHOOTING.md`
2. Check `CHAT_API_MIGRATION_COMPLETE.md`
3. Check console logs chi tiết
4. Check backend logs
5. Share screenshot/logs để debug

---

**🎉 Happy Testing! Real-time chat should work smoothly!**

