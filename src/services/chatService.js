// Chat Service - Matches backend API exactly
import apiService from './apiService';

class ChatService {
  // Get all chats for current user
  async getChatHistory() {
    try {
      return await apiService.getChatHistory();
    } catch (error) {
      console.error('Failed to get chat history:', error);
      throw error;
    }
  }

  // Get specific chat by ID
  async getChatById(chatId) {
    try {
      return await apiService.getChatById(chatId);
    } catch (error) {
      console.error(`Failed to get chat ${chatId}:`, error);
      throw error;
    }
  }

  // Get messages for a chat
  async getChatMessages(chatId) {
    try {
      return await apiService.getChatMessages(chatId);
    } catch (error) {
      console.error(`Failed to get messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  // Send message
  async sendMessage(chatId, senderId, content) {
    try {
      return await apiService.sendMessage(chatId, senderId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Start chat with another user
  async startChatWith(otherUserId) {
    try {
      return await apiService.startChatWith(otherUserId);
    } catch (error) {
      console.error(`Failed to start chat with user ${otherUserId}:`, error);
      throw error;
    }
  }

  // Create chat manually
  async createChat(user1Id, user2Id) {
    try {
      return await apiService.createChat(user1Id, user2Id);
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  }

  // Start conversation with seller and send initial message
  async startConversationWithSeller(sellerId, initialMessage) {
    try {
      // Start chat with seller
      const chat = await this.startChatWith(sellerId);

      if (!chat || !chat.chatId) {
        throw new Error('Failed to create chat');
      }

      // Get current user ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = user.id || user.userId;

      if (!currentUserId) {
        throw new Error('User not logged in');
      }

      // Send initial message
      if (initialMessage) {
        await this.sendMessage(chat.chatId, currentUserId, initialMessage);
      }

      return chat;
    } catch (error) {
      console.error('Failed to start conversation with seller:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      return await apiService.getUnreadMessageCount();
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  // Get unread messages
  async getUnreadMessages() {
    try {
      return await apiService.getUnreadMessages();
    } catch (error) {
      console.error('Failed to get unread messages:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      return await apiService.markMessageAsRead(messageId);
    } catch (error) {
      console.error(`Failed to mark message ${messageId} as read:`, error);
      throw error;
    }
  }

  // Mark all messages in chat as read
  async markChatAsRead(chatId) {
    try {
      return await apiService.markChatMessagesAsRead(chatId);
    } catch (error) {
      console.error(`Failed to mark chat ${chatId} as read:`, error);
      throw error;
    }
  }

  // Delete chat
  async deleteChat(chatId) {
    try {
      return await apiService.deleteChat(chatId);
    } catch (error) {
      console.error(`Failed to delete chat ${chatId}:`, error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      return await apiService.deleteMessage(messageId);
    } catch (error) {
      console.error(`Failed to delete message ${messageId}:`, error);
      throw error;
    }
  }
}

export default new ChatService();
