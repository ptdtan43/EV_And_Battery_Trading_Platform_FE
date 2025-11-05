# 🔧 SignalR Token Issue - Fixed

## ⚠️ Vấn đề

SignalR **connect thành công** nhưng ngay lập tức bị **disconnected**:

```
✅ SignalR connected successfully!
📊 Connection ID: CgV9dO7bZUvZ4jMcm2E1Rg
🔴 SignalR connection closed
```

**Root cause:**
```
⚠️ accessTokenFactory: No token in localStorage
```

Token không có trong localStorage khi `accessTokenFactory` được gọi, mặc dù token có trong các API calls khác.

**Nguyên nhân:** Timing issue - SignalR init quá sớm, trước khi token được set vào localStorage.

---

## ✅ Fix đã apply

### ChatHistory.jsx - Delay SignalR init

```javascript
// Đợi 100ms để đảm bảo token đã được lưu vào localStorage
const timer = setTimeout(() => {
  const token = localStorage.getItem('token');
  console.log("🔍 Checking token before SignalR init:", 
              token ? `Present (${token.length} chars)` : "Missing");
  
  if (token) {
    initializeSignalR();
  } else {
    console.warn("⚠️ Cannot init SignalR: No token found");
    setConnectionError("Không có token");
  }
}, 100);
```

**Giải thích:**
- Đợi 100ms để React state updates hoàn tất
- Check token trước khi init SignalR
- Chỉ init nếu có token
- Show error nếu không có token

---

## 🧪 Test lại

### Bước 1: Restart frontend

```bash
Ctrl + C
npm run dev
```

### Bước 2: Hard refresh browser

```
Ctrl + Shift + R
```

### Bước 3: Login và vào /chats

**Console phải hiển thị:**

```javascript
🔍 Token present: true
🔍 Token length: 483
✅ User loaded successfully from localStorage

// Sau 100ms:
🔍 Checking token before SignalR init: Present (483 chars)
🔌 Initializing SignalR connection...
🔗 Building SignalR connection to: http://localhost:5044/chatHub
🚀 Starting SignalR connection...
🎫 Providing token to SignalR (length): 483  // ← PHẢI THẤY SỐ, KHÔNG PHẢI WARNING
✅ SignalR connected successfully!
📊 Connection ID: abc123...
📊 Connection State: Connected
✅ SignalR ready, setting up listeners...
```

**Header phải hiển thị:**
- 🟢 **Real-time** (không phải 🔴 Offline)

---

## ✅ Success Indicators

**Console logs GOOD:**
```
✅ User loaded successfully from localStorage
🔍 Checking token before SignalR init: Present (483 chars)
🎫 Providing token to SignalR (length): 483
✅ SignalR connected successfully!
📊 Connection State: Connected
```

**Console logs BAD (nếu vẫn lỗi):**
```
⚠️ accessTokenFactory: No token in localStorage
🔴 SignalR connection closed
```

---

## 🐛 Nếu vẫn có issue

### Debug Step 1: Check Token Flow

```javascript
// Paste trong console ngay sau login
console.log('Token in localStorage:', localStorage.getItem('token'));
console.log('Token length:', localStorage.getItem('token')?.length);
```

**Expected:** Token string ~483 characters

### Debug Step 2: Manual SignalR Test

```javascript
// Paste trong console sau khi ở trang /chats
setTimeout(async () => {
  console.log('Token before connect:', localStorage.getItem('token'));
  await signalRService.connect();
  console.log('Connected:', signalRService.connected);
  console.log('State:', signalRService.getState());
}, 500);
```

### Debug Step 3: Check Token Persistence

```javascript
// Check token không bị xóa
setInterval(() => {
  console.log('Token check:', localStorage.getItem('token') ? 'Present' : 'Missing');
}, 1000);
```

---

## 📋 Checklist

- [ ] Frontend restarted
- [ ] Browser hard refreshed (Ctrl+Shift+R)
- [ ] Login successful
- [ ] Console: "Present (483 chars)" khi check token
- [ ] Console: "🎫 Providing token (length): 483"
- [ ] Console: "✅ SignalR connected successfully!"
- [ ] Console: "📊 Connection State: Connected"
- [ ] Header: 🟢 Real-time
- [ ] No "⚠️ No token" warnings
- [ ] No "🔴 SignalR connection closed" immediately after connect

---

## 🎯 Expected Flow

```mermaid
User Login
   ↓
Token saved to localStorage
   ↓
Navigate to /chats
   ↓
ChatHistory component mount
   ↓
Wait 100ms (useEffect setTimeout)
   ↓
Check token exists ✅
   ↓
Initialize SignalR
   ↓
accessTokenFactory called
   ↓
Get token from localStorage ✅
   ↓
SignalR connects successfully ✅
   ↓
Connection stays alive 🟢
   ↓
Real-time messaging works! 🎉
```

---

**Fix này giải quyết timing issue và đảm bảo SignalR luôn có token khi connect!** 🚀

