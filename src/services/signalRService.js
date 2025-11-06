// SignalR Service for Real-time Chat
import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10; // Tăng số lần reconnect
    this.healthCheckInterval = null;
    this.connectionStateListeners = new Set();
  }

  /**
   * Initialize SignalR connection
   */
  async connect() {
    if (this.connection && this.isConnected) {
      console.log("📡 SignalR already connected");
      return this.connection;
    }

    try {
      const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:5044";

      console.log("🔗 Building SignalR connection to:", `${baseURL}/chatHub`);

      // Backend đã fix CORS với AllowCredentials, dùng accessTokenFactory
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseURL}/chatHub`, {
          accessTokenFactory: () => {
            // ✅ FIX: Token được lưu trong evtb_auth, KHÔNG PHẢI 'token'
            try {
              const authData = localStorage.getItem("evtb_auth");
              if (!authData) {
                console.warn("⚠️ accessTokenFactory: No auth data in localStorage");
                return "";
              }

              const parsed = JSON.parse(authData);
              const currentToken = parsed?.token;

              if (!currentToken) {
                console.warn("⚠️ accessTokenFactory: No token in evtb_auth");
                return "";
              }

              console.log("🎫 Providing token to SignalR (length):", currentToken.length);
              return currentToken;
            } catch (error) {
              console.error("❌ Error getting token from evtb_auth:", error);
              return "";
            }
          },
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              console.log("❌ Max reconnect attempts reached");
              return null; // Stop reconnecting
            }
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 60s
            const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
            console.log(`⏳ Reconnect attempt ${retryContext.previousRetryCount + 1}/${this.maxReconnectAttempts} in ${delay}ms`);
            this.notifyListeners("reconnecting", {
              attempt: retryContext.previousRetryCount + 1,
              maxAttempts: this.maxReconnectAttempts,
              delay
            });
            return delay;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Start connection
      console.log("🚀 Starting SignalR connection...");
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("✅ SignalR connected successfully!");
      console.log("📊 Connection ID:", this.connection.connectionId);
      console.log("📊 Connection State:", this.getState());

      // Start health check
      this.startHealthCheck();

      return this.connection;
    } catch (error) {
      console.error("❌ SignalR connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Setup SignalR event handlers
   */
  setupEventHandlers() {
    if (!this.connection) return;

    // Connection closed
    this.connection.onclose((error) => {
      this.isConnected = false;
      console.log("🔴 SignalR connection closed", error);
      this.notifyListeners("connectionClosed", { error });
    });

    // Reconnecting
    this.connection.onreconnecting((error) => {
      this.isConnected = false;
      console.log("🔄 SignalR reconnecting...", error);
      this.reconnectAttempts++;
      this.notifyListeners("reconnecting", { attempt: this.reconnectAttempts, error });
    });

    // Reconnected
    this.connection.onreconnected((connectionId) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("✅ SignalR reconnected", connectionId);
      this.notifyListeners("reconnected", { connectionId });
      // Restart health check
      this.startHealthCheck();
    });

    // Receive message
    this.connection.on("ReceiveMessage", (message) => {
      console.log("📨 ====== SIGNALR SERVICE: NEW MESSAGE ======");
      console.log("📨 Message from backend:", message);
      console.log("📨 Notifying listeners for event: ReceiveMessage");
      // ✅ FIX: Use same case as backend sends
      this.notifyListeners("ReceiveMessage", message);
      console.log("📨 ====== END SIGNALR SERVICE MESSAGE ======");
    });

    // User joined chat
    this.connection.on("UserJoined", (info) => {
      console.log("👋 User joined:", info);
      this.notifyListeners("userJoined", info);
    });

    // User left chat
    this.connection.on("UserLeft", (info) => {
      console.log("👋 User left:", info);
      this.notifyListeners("userLeft", info);
    });
  }

  /**
   * Join a chat room
   * @param {string|number} chatId - Chat ID to join
   */
  async joinChat(chatId) {
    if (!this.connection || !this.isConnected) {
      console.warn("⚠️ Cannot join chat: Not connected");
      console.log("Connection state:", this.getState());
      return false;
    }

    try {
      console.log(`🚪 Attempting to join chat: ${chatId}`);
      await this.connection.invoke("JoinChat", chatId.toString());
      console.log(`✅ Successfully joined chat: ${chatId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error joining chat ${chatId}:`, error);
      console.error("Error details:", error.message, error.stack);
      return false;
    }
  }

  /**
   * Leave a chat room
   * @param {string|number} chatId - Chat ID to leave
   */
  async leaveChat(chatId) {
    if (!this.connection || !this.isConnected) {
      console.warn("⚠️ Cannot leave chat: Not connected");
      return false;
    }

    try {
      await this.connection.invoke("LeaveChat", chatId.toString());
      console.log(`✅ Left chat: ${chatId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error leaving chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    console.log(`🔔 Notifying listeners for event: ${event}`);
    console.log(`🔔 Number of listeners: ${callbacks ? callbacks.size : 0}`);
    if (callbacks) {
      console.log(`🔔 Calling ${callbacks.size} callback(s)...`);
      callbacks.forEach(callback => {
        try {
          callback(data);
          console.log("✅ Callback executed successfully");
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for event: ${event}`);
    }
  }

  /**
   * Start health check ping to ensure connection is alive
   */
  startHealthCheck() {
    // Clear existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Ping every 30 seconds to check connection
    this.healthCheckInterval = setInterval(async () => {
      if (this.connection && this.isConnected) {
        try {
          // Try to invoke a simple method to check connection
          // If connection is dead, this will throw
          const state = this.getState();
          if (state !== "Connected") {
            console.warn("⚠️ Health check: Connection state is", state);
            this.isConnected = false;
            this.notifyListeners("connectionLost", { state });
          }
        } catch (error) {
          console.error("❌ Health check failed:", error);
          this.isConnected = false;
          this.notifyListeners("connectionLost", { error });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health check
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Disconnect from SignalR
   */
  async disconnect() {
    if (this.connection) {
      try {
        // Stop health check
        this.stopHealthCheck();

        await this.connection.stop();
        this.isConnected = false;
        this.listeners.clear();
        console.log("🔴 SignalR disconnected");
      } catch (error) {
        console.error("❌ Error disconnecting:", error);
      }
    }
  }

  /**
   * Get connection state
   */
  getState() {
    if (!this.connection) {
      return "Disconnected";
    }
    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return "Connected";
      case signalR.HubConnectionState.Connecting:
        return "Connecting";
      case signalR.HubConnectionState.Reconnecting:
        return "Reconnecting";
      case signalR.HubConnectionState.Disconnected:
        return "Disconnected";
      case signalR.HubConnectionState.Disconnecting:
        return "Disconnecting";
      default:
        return "Unknown";
    }
  }

  /**
   * Check if connected
   */
  get connected() {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
const signalRService = new SignalRService();

export default signalRService;

