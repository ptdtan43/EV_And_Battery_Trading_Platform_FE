# ✅ Chat API Migration Complete - SignalR Real-time Integration

## 📋 Tổng quan

Đã hoàn tất việc **cập nhật toàn bộ chức năng chat** từ API cũ sang API mới với **SignalR real-time messaging**.

---

## 🔄 Thay đổi API

### API Cũ (Đã loại bỏ)
```
/api/Chat/history/{userId}
/api/Chat/messages/{conversationId}
/api/Chat/send
/api/Chat/conversation
```

### API Mới (Đang sử dụng)

#### 1. Chat Controller - Quản lý phòng chat
```
GET    /api/Chat                      - Lấy tất cả chats của user
GET    /api/Chat/{id}                 - Lấy chi tiết chat
POST   /api/Chat                      - Tạo chat mới
POST   /api/Chat/start-chat/{userId}  - Bắt đầu chat với user (tự động tạo nếu chưa có)
DELETE /api/Chat/{id}                 - Xóa chat
```

#### 2. Message Controller - Quản lý tin nhắn
```
GET    /api/Message                      - Lấy tất cả messages của user
GET    /api/Message/{id}                 - Lấy message theo ID
GET    /api/Message/chat/{chatId}        - Lấy messages của chat
GET    /api/Message/unread               - Lấy messages chưa đọc
GET    /api/Message/unread-count         - Lấy số lượng messages chưa đọc
POST   /api/Message                      - Gửi message mới
PUT    /api/Message/{id}/read            - Đánh dấu message đã đọc
PUT    /api/Message/chat/{chatId}/read-all - Đánh dấu tất cả messages đã đọc
DELETE /api/Message/{id}                - Xóa message
```

#### 3. SignalR Hub - Real-time messaging
```
Hub URL: /chatHub

Methods:
- JoinChat(chatId)   - Join vào chat room
- LeaveChat(chatId)  - Rời khỏi chat room

Events:
- ReceiveMessage     - Nhận message mới real-time
- UserJoined         - User join chat
- UserLeft           - User rời chat
```

---

## 📁 Các file đã cập nhật

### 1. ✅ SignalR Service (MỚI)
**File:** `src/services/signalRService.js`

Service quản lý kết nối SignalR với các tính năng:
- ✅ Tự động kết nối/ngắt kết nối
- ✅ Auto reconnect với exponential backoff
- ✅ Event listener system
- ✅ Join/Leave chat rooms
- ✅ Connection state management

**API:**
```javascript
import signalRService from './services/signalRService';

// Connect
await signalRService.connect();

// Join chat
await signalRService.joinChat(chatId);

// Listen for messages
const unsubscribe = signalRService.on('receiveMessage', (message) => {
  console.log('New message:', message);
});

// Leave chat
await signalRService.leaveChat(chatId);

// Disconnect
await signalRService.disconnect();
```

### 2. ✅ ChatHistory Component
**File:** `src/pages/ChatHistory.jsx`

Đã tích hợp SignalR:
- ✅ Tự động kết nối SignalR khi mount
- ✅ Auto join/leave chat rooms khi chuyển chat
- ✅ Nhận message real-time
- ✅ Hiển thị trạng thái kết nối (Connected/Offline/Reconnecting)
- ✅ Auto mark as read khi nhận message
- ✅ Cleanup khi unmount

**Giao diện mới:**
```
Header: [Tin nhắn] [🟢 Real-time]
        [Tin nhắn] [🔴 Offline]
        [Tin nhắn] [⏳ Đang kết nối...]
```

### 3. ✅ ChatModal Component
**File:** `src/components/common/ChatModal.jsx`

Đã cập nhật sử dụng API mới:
- ✅ `POST /api/Chat/start-chat/{sellerId}` - Tạo/lấy chat
- ✅ `POST /api/Message` - Gửi tin nhắn đầu tiên
- ✅ Auto redirect đến `/chats?chat={chatId}`

### 4. ✅ ChatBell Component
**File:** `src/components/common/ChatBell.jsx`

Đã cập nhật:
- ✅ `GET /api/Message/unread-count` - Lấy số tin nhắn chưa đọc
- ✅ Auto refresh mỗi 30 giây
- ✅ Badge hiển thị số lượng

### 5. ✅ Chat Service
**File:** `src/services/chatService.js`

Service wrapper đã sẵn sàng với API mới:
- ✅ `getChatHistory()` → `/api/Chat`
- ✅ `getChatMessages(chatId)` → `/api/Message/chat/{chatId}`
- ✅ `sendMessage(chatId, senderId, content)` → `/api/Message`
- ✅ `startChatWith(otherUserId)` → `/api/Chat/start-chat/{otherUserId}`
- ✅ `markChatAsRead(chatId)` → `/api/Message/chat/{chatId}/read-all`
- ✅ `getUnreadCount()` → `/api/Message/unread-count`

### 6. ✅ API Service
**File:** `src/services/apiService.js`

Đã có đầy đủ methods cho Chat & Message APIs (không cần thay đổi).

### 7. ✅ Services Index
**File:** `src/services/index.js`

Đã thêm export:
```javascript
export { default as signalRService } from './signalRService';
```

### 8. ✅ API Manager (Cleanup)
**File:** `src/api/apiManager.js`

Đã xóa bỏ `chatAPI` cũ và thêm ghi chú:
```javascript
// Note: Old chat endpoints have been removed.
// Please use chatService from services/chatService.js
```

### 9. ✅ Config API (Cleanup)
**File:** `src/config/api.js`

Đã xóa bỏ endpoint cũ trong `CHAT` object.

---

## 🚀 Cách sử dụng

### 1. Gửi tin nhắn với người bán (từ ProductDetail)
```javascript
// ChatModal tự động xử lý
<ChatModal 
  isOpen={showChatModal}
  onClose={() => setShowChatModal(false)}
  seller={product.seller}
  product={product}
/>
```

### 2. Chat real-time
```javascript
// Navigate to chat page
navigate('/chats?chat={chatId}');

// ChatHistory component tự động:
// 1. Connect SignalR
// 2. Join chat room
// 3. Listen for messages
// 4. Auto update UI
```

### 3. Check unread messages
```javascript
// ChatBell tự động hiển thị badge
<ChatBell /> // Shows unread count
```

---

## 🔧 Cấu hình Backend

### 1. SignalR Hub Endpoint
```
URL: http://localhost:5044/chatHub
Transport: WebSockets, ServerSentEvents, LongPolling
Authentication: Bearer Token
```

### 2. CORS (nếu cần)
Backend phải cho phép CORS cho SignalR:
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:5173")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials(); // Important for SignalR
    });
});
```

### 3. SignalR Configuration
```csharp
app.MapHub<ChatHub>("/chatHub");
```

---

## 🎯 Tính năng Real-time

### Khi gửi message:
1. ✅ User A gửi message → `POST /api/Message`
2. ✅ Backend lưu message vào DB
3. ✅ Backend gửi SignalR event `ReceiveMessage` đến tất cả users trong chat
4. ✅ User B nhận message real-time và hiển thị ngay lập tức

### Auto reconnect:
- ✅ Mất kết nối → Tự động retry với exponential backoff
- ✅ Reconnect thành công → Auto rejoin chat room hiện tại
- ✅ Max 5 attempts: 0s, 2s, 10s, 30s, 60s

### Connection states:
- 🟢 **Connected**: Real-time hoạt động bình thường
- 🔴 **Offline**: Mất kết nối, messages vẫn gửi được qua HTTP
- ⏳ **Reconnecting**: Đang thử kết nối lại

---

## 📊 Kiểm tra hoạt động

### 1. Test Chat Flow
```bash
# Terminal 1: Chạy backend
cd backend
dotnet run

# Terminal 2: Chạy frontend
npm run dev

# Browser 1: Login user A → Navigate to /chats
# Browser 2: Login user B → Navigate to product → Click "Chat với người bán"
# Browser 2: Send message → Browser 1 sẽ nhận real-time
```

### 2. Console logs
Mở DevTools console để xem:
```
🔌 Initializing SignalR connection...
✅ SignalR connected successfully
✅ Joined chat: 123
📨 Received message via SignalR: {messageId: 456, content: "Hello", ...}
```

### 3. Network tab
Kiểm tra:
- WebSocket connection: `ws://localhost:5044/chatHub`
- HTTP requests:
  - `GET /api/Chat`
  - `GET /api/Message/chat/{chatId}`
  - `POST /api/Message`

---

## ⚠️ Lưu ý quan trọng

1. **Token Authentication**: SignalR sử dụng JWT token từ localStorage
2. **Auto cleanup**: Component tự động disconnect khi unmount
3. **Duplicate prevention**: Messages được check trùng lặp trước khi add
4. **Fallback**: Nếu SignalR fail, messages vẫn gửi được qua HTTP API
5. **Mark as read**: Tự động đánh dấu đã đọc khi nhận message từ người khác

---

## 🐛 Troubleshooting

### SignalR không kết nối được?
1. Check backend có chạy không: `http://localhost:5044`
2. Check CORS configuration
3. Check JWT token có hợp lệ không
4. Check console logs

### Messages không real-time?
1. Check SignalR connection status (header icon)
2. Check có join chat room không
3. Check console logs cho events
4. Thử refresh page

### Unread count không update?
1. Check API `/api/Message/unread-count`
2. Check authentication
3. ChatBell refresh mỗi 30s, có thể reload page

---

## ✨ Tính năng nâng cao có thể thêm

- [ ] Typing indicator (đang nhập...)
- [ ] Online/Offline status
- [ ] Message reactions
- [ ] File upload trong chat
- [ ] Voice messages
- [ ] Search messages
- [ ] Pin messages
- [ ] Delete messages
- [ ] Edit messages
- [ ] Message notifications với sound

---

## 📞 Hỗ trợ

Nếu có vấn đề, check:
1. Backend logs
2. Frontend console logs  
3. Network tab (WebSocket & HTTP requests)
4. SignalR connection state

---

**🎉 Migration hoàn tất! Chat với SignalR đã sẵn sàng sử dụng!**

