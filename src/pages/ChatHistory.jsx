import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiRequest } from "../lib/api";
import signalRService from "../services/signalRService";
import { validateAndShowWarning } from "../utils/messageValidator";
import { 
  ArrowLeft, 
  MessageCircle,
  User
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const ChatHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selected chat
  const selectedChatId = searchParams.get('chat');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // SignalR connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const inputRef = useRef(null);
  const currentChatIdRef = useRef(null);

  // Initialize SignalR connection on mount
  useEffect(() => {
    let timeoutId = null;
    
    if (user) {
      // Đợi token được lưu vào localStorage (max 5 lần check, mỗi lần 200ms)
      let attempts = 0;
      const maxAttempts = 5;
      
      const checkTokenAndInit = () => {
        // ✅ FIX: Check token from evtb_auth
        try {
          const authData = localStorage.getItem('evtb_auth');
          const token = authData ? JSON.parse(authData)?.token : null;
          attempts++;
          
          console.log(`🔍 Attempt ${attempts}/${maxAttempts} - Checking token:`, token ? `Present (${token.length} chars)` : "Missing");
          
          if (token) {
            console.log("✅ Token found! Initializing SignalR...");
            initializeSignalR();
          } else if (attempts < maxAttempts) {
            console.log(`⏳ Token not ready, will retry in 200ms...`);
            timeoutId = setTimeout(checkTokenAndInit, 200);
          } else {
            console.warn("❌ Max attempts reached. Cannot init SignalR: No token found");
            setConnectionError("Không có token");
          }
        } catch (error) {
          console.error("❌ Error checking token:", error);
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(checkTokenAndInit, 200);
          } else {
            setConnectionError("Lỗi khi kiểm tra token");
          }
        }
      };
      
      // Start checking after 100ms
      timeoutId = setTimeout(checkTokenAndInit, 100);

      // ✅ FIX: Loại bỏ polling - SignalR đã hoạt động real-time
      // Polling gây reload liên tục, không cần thiết nữa
      // pollingInterval = setInterval(() => {
      //   if (!isConnected && selectedChatId) {
      //     console.log("📡 Polling for new messages (SignalR not connected)");
      //     loadChatMessages(selectedChatId);
      //   }
      // }, 3000);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (currentChatIdRef.current) {
          signalRService.leaveChat(currentChatIdRef.current);
        }
        signalRService.disconnect();
      };
    }
  }, [user]);

  // Load chats on mount
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Load messages when chat selected
  useEffect(() => {
    if (selectedChatId) {
      loadChatMessages(selectedChatId);
    } else {
      // Leave chat when deselecting
      if (currentChatIdRef.current) {
        signalRService.leaveChat(currentChatIdRef.current);
        currentChatIdRef.current = null;
      }
      setSelectedChat(null);
      setMessages([]);
    }
  }, [selectedChatId]);

  // Join/Leave SignalR chat rooms when connection status or selected chat changes
  useEffect(() => {
    const handleChatSwitch = async () => {
      if (!isConnected) {
        console.log("⚠️ SignalR not connected, cannot join chat");
        return;
      }

      // Leave previous chat
      if (currentChatIdRef.current && currentChatIdRef.current !== selectedChatId) {
        console.log(`🚪 Leaving previous chat: ${currentChatIdRef.current}`);
        await signalRService.leaveChat(currentChatIdRef.current);
      }
      
      // Join new chat
      if (selectedChatId) {
        console.log(`🚪 Joining new chat: ${selectedChatId}`);
        const success = await signalRService.joinChat(selectedChatId);
        if (success) {
          currentChatIdRef.current = selectedChatId;
          console.log(`✅ Successfully set currentChatIdRef to: ${selectedChatId}`);
        }
      } else if (currentChatIdRef.current) {
        // No chat selected, leave current
        await signalRService.leaveChat(currentChatIdRef.current);
        currentChatIdRef.current = null;
      }
    };
    
    handleChatSwitch();
  }, [isConnected, selectedChatId]);

  // ====================
  // SIGNALR SETUP
  // ====================

  const initializeSignalR = async () => {
    try {
      console.log("🔌 Initializing SignalR connection...");
      await signalRService.connect();
      setIsConnected(true);
      setConnectionError(null);
      
      console.log("✅ SignalR ready, setting up listeners...");

      // Setup event listeners
      // ✅ FIX: Backend sends "ReceiveMessage" (PascalCase), not "receiveMessage"!
      const unsubscribeMessage = signalRService.on("ReceiveMessage", handleReceiveMessage);
      const unsubscribeReconnected = signalRService.on("reconnected", () => {
        console.log("✅ Reconnected to SignalR");
        setIsConnected(true);
        setConnectionError(null);
        // Rejoin current chat if any
        if (currentChatIdRef.current) {
          signalRService.joinChat(currentChatIdRef.current);
        }
      });
      const unsubscribeReconnecting = signalRService.on("reconnecting", () => {
        console.log("🔄 Reconnecting to SignalR...");
        setIsConnected(false);
        setConnectionError("Đang kết nối lại...");
      });
      const unsubscribeConnectionClosed = signalRService.on("connectionClosed", (data) => {
        console.log("🔴 SignalR connection closed", data);
        setIsConnected(false);
        setConnectionError("Mất kết nối - Sử dụng chế độ polling");
      });
      const unsubscribeConnectionLost = signalRService.on("connectionLost", (data) => {
        console.log("⚠️ SignalR connection lost", data);
        setIsConnected(false);
        setConnectionError("Mất kết nối - Đang thử kết nối lại...");
      });

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribeMessage();
        unsubscribeReconnected();
        unsubscribeReconnecting();
        unsubscribeConnectionClosed();
        unsubscribeConnectionLost();
      };
    } catch (error) {
      console.error("❌ Failed to connect to SignalR:", error);
      console.error("Error details:", error.message);
      setIsConnected(false);
      setConnectionError("Sử dụng chế độ polling");
      
      // Don't throw - fallback to polling
      showToast({
        title: "⚠️ Thông báo",
        description: "Real-time chat không khả dụng, sử dụng chế độ polling",
        type: "warning"
      });
    }
  };

  const handleReceiveMessage = (message) => {
    console.log("📨 ====== RECEIVED MESSAGE VIA SIGNALR ======");
    console.log("📨 Message data:", message);
    console.log("📨 Message chatId:", message.chatId);
    console.log("📨 Current selectedChatId:", selectedChatId);
    console.log("📨 Are they equal?", message.chatId === parseInt(selectedChatId));
    
    // Only add message if it's for the current chat
    if (message.chatId === parseInt(selectedChatId)) {
      console.log("✅ Message is for current chat, adding to messages...");
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        const exists = prev.some(m => m.messageId === message.messageId);
        if (exists) {
          console.log("⚠️ Message already exists, skipping");
          return prev;
        }
        
        console.log("✅ Adding new message to state");
        return [...prev, message];
      });

      // Mark as read if not from current user
      const currentUserId = user?.id || user?.userId;
      if (message.senderId !== currentUserId) {
        try {
          apiRequest(`/api/Message/${message.messageId}/read`, {
            method: "PUT"
          });
        } catch (err) {
          console.error("Error marking message as read:", err);
        }
      }
    } else {
      console.log("⚠️ Message is NOT for current chat, ignoring");
    }

    // ✅ FIX: Chỉ update local chat list thay vì reload
    // Update lastMessage cho chat trong list
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.chatId === message.chatId 
          ? { ...chat, lastMessage: message.content, lastMessageTime: message.sentAt }
          : chat
      )
    );
    
    console.log("📨 ====== END RECEIVED MESSAGE ======");
  };

  // ====================
  // API CALLS
  // ====================

  const loadChats = async () => {
    try {
      setLoading(true);
      console.log("📱 GET /api/Chat - Loading all chats");
      
      const response = await apiRequest("/api/Chat");
      console.log("📱 Chats loaded:", response);
      
      if (response && Array.isArray(response)) {
        setChats(response);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error("❌ Error loading chats:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      setLoadingMessages(true);
      console.log(`💬 Loading chat ${chatId}`);
      console.log(`💬 Setting selectedChatId to: ${chatId}`);
      
      // ✅ FIX: Update URL to set selectedChatId
      setSearchParams({ chat: chatId });
      
      // Get chat details
      const chatResponse = await apiRequest(`/api/Chat/${chatId}`);
      console.log("💬 Chat details:", chatResponse);
      
      if (chatResponse) {
        const currentUserId = user?.id || user?.userId;
        const partner = chatResponse.user1Id == currentUserId 
          ? chatResponse.user2 
          : chatResponse.user1;
        
        setSelectedChat({
          chatId: chatResponse.chatId,
          partner: {
            id: partner?.userId,
            name: partner?.fullName || "Người dùng",
            avatar: partner?.avatar,
            phone: partner?.phone,
            email: partner?.email
          }
        });
      }
      
      // Get messages
      const messagesResponse = await apiRequest(`/api/Message/chat/${chatId}`);
      console.log("💬 Messages:", messagesResponse);
      
      if (messagesResponse && Array.isArray(messagesResponse)) {
        setMessages(messagesResponse);
        
        // Mark as read
        try {
          await apiRequest(`/api/Message/chat/${chatId}/read-all`, {
            method: "PUT"
          });
        } catch (err) {
          console.error("Error marking as read:", err);
        }
      } else {
        setMessages([]);
      }
      
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      showToast({
        title: "Lỗi",
        description: "Không thể tải tin nhắn",
        type: "error"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChatId) return;

    // Validate message trước khi gửi
    if (!validateAndShowWarning(newMessage, showToast)) {
      return; // Dừng lại nếu tin nhắn không hợp lệ
    }

    setSending(true);
    try {
      const messageData = {
        chatId: parseInt(selectedChatId),
        senderId: user?.id || user?.userId,
        content: newMessage.trim()
      };

      console.log("📤 Sending message:", messageData);

      const response = await apiRequest("/api/Message", {
        method: "POST",
        body: messageData
      });

      console.log("✅ Message sent:", response);

      if (response) {
        // Note: Message will be added via SignalR "ReceiveMessage" event
        // But add it locally immediately for better UX
        setMessages(prev => {
          const exists = prev.some(m => m.messageId === response.messageId);
          if (exists) return prev;
          return [...prev, response];
        });
        setNewMessage("");
        
        // ✅ FIX: Update local chat list instead of reloading
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.chatId === parseInt(selectedChatId) 
              ? { ...chat, lastMessage: response.content, lastMessageTime: response.sentAt }
              : chat
          )
        );
        
        // Focus input
        inputRef.current?.focus();
      }
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
      showToast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        type: "error"
      });
    } finally {
      setSending(false);
    }
  };

  // ====================
  // HELPERS
  // ====================

  const selectChat = (chatId) => {
    setSearchParams({ chat: chatId });
  };

  const getChatPartner = (chat) => {
    const currentUserId = user?.id || user?.userId;
    return chat.user1Id == currentUserId ? chat.user2 : chat.user1;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return format(date, "HH:mm", { locale: vi });
    } else if (diffHours < 168) {
      return format(date, "EEEE", { locale: vi });
    } else {
      return format(date, "dd/MM/yyyy", { locale: vi });
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    }
  };

  const filteredChats = chats.filter(chat => {
    const partner = getChatPartner(chat);
    const partnerName = partner?.fullName || "";
    const lastMessage = chat.lastMessage?.content || "";
    
    return partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ====================
  // RENDER
  // ====================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Tin nhắn</h1>
            </div>
            
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Đã kết nối</span>
                </div>
              ) : connectionError ? (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>{connectionError}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Đang kết nối...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-80px)]">
          {/* LEFT: Chat List */}
          <div className={`w-full md:w-96 bg-white border-r ${selectedChatId ? 'hidden md:block' : 'block'}`}>
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="overflow-y-auto h-full">
              {filteredChats.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "Không tìm thấy" : "Chưa có tin nhắn"}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const partner = getChatPartner(chat);
                  const isSelected = chat.chatId == selectedChatId;
                  
                  return (
                    <button
                      key={chat.chatId}
                      onClick={() => selectChat(chat.chatId)}
                      className={`w-full flex items-center p-4 hover:bg-gray-50 border-b ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        {partner?.avatar ? (
                          <img src={partner.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-medium truncate ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                            {partner?.fullName || "Người dùng"}
                          </p>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTime(chat.lastMessage?.createdDate)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Chat Window */}
          <div className={`flex-1 flex flex-col bg-white ${selectedChatId ? 'block' : 'hidden md:flex'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSearchParams({})}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {selectedChat.partner.avatar ? (
                        <img src={selectedChat.partner.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    <div>
                      <h2 className="font-semibold">{selectedChat.partner.name}</h2>
                    </div>
                  </div>

                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Chưa có tin nhắn</p>
                      <p className="text-sm text-gray-400 mt-1">Hãy gửi tin nhắn đầu tiên!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === (user?.id || user?.userId);
                        return (
                          <div key={msg.messageId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 shadow-sm'
                              }`}
                            >
                              <p className="text-sm break-words">{msg.content}</p>
                              <div className="flex items-center justify-end mt-1">
                                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {formatMessageTime(msg.createdDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  <div className="flex space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Gửi</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p className="text-gray-500">
                    Chọn từ danh sách bên trái để bắt đầu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
