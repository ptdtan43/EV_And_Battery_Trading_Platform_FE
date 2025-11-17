// Order API helper
import { apiRequest } from "./api";

export async function createOrder(orderData, token) {
  console.log("[Order] Creating order:", orderData);
  
  try {
    const response = await apiRequest("/api/Order", {
      method: "POST",
      body: orderData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("[Order] Order created:", response);
    return response;
  } catch (error) {
    console.error("[Order] Create order error:", error);
    throw error;
  }
}

export async function getOrder(orderId, token) {
  console.log("[Order] Getting order:", orderId);
  
  try {
    const response = await apiRequest(`/api/Order/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("[Order] Order retrieved:", response);
    return response;
  } catch (error) {
    console.error("[Order] Get order error:", error);
    throw error;
  }
}

export async function getUserOrders(token) {
  console.log("[Order] Getting user orders");
  
  try {
    const response = await apiRequest("/api/Order", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("[Order] User orders retrieved:", response);
    return response;
  } catch (error) {
    console.error("[Order] Get user orders error:", error);
    throw error;
  }
}
