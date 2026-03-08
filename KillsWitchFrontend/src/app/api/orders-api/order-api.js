"use client";

import { BASE_URL, API } from "../api";

// Function to get email from profile (cookie-based session)
export const getEmailFromToken = async () => {
  try {
    const profile = await API.auth.getProfile();
    const email = profile?.user?.email || profile?.email || null;    
    return email;
  } catch (err) {
    console.error("Error getting user email:", err);
    return null;
  }
};

// --- User Order APIs ---

// Fetch orders for the logged-in user by email
export const fetchOrdersByEmail = async () => {
  try {
    const email = await getEmailFromToken();
    if (!email) throw new Error("User email not found. Please log in again.");

    const url = `${BASE_URL}/orders/orderByEmail?email=${encodeURIComponent(
      email
    )}`;
    const response = await fetch(url, {
      method: "GET",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Orders API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        email: email,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error('Please log in again to view your orders');
      }
      
      // Handle specific 404 case more gracefully
      if (response.status === 404) {
        return { orders: [], message: 'No orders found' };
      }
      
      // Parse error response if it's JSON
      let errorMessage = errorText;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorText;
      } catch (e) {
        // Not JSON, use text as is
      }
      
      throw new Error(errorMessage || "Failed to fetch order details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Request update to shipping details for an order
export const updateOrderShipping = async (
  orderId,
  shippingAddress,
  shippingPhone
) => {
  try {
    const email = await getEmailFromToken();
    if (!email) throw new Error("User email not found. Please log in again.");

    const url = `${BASE_URL}/admin-requests`;

    const requestData = {
      order_id: orderId,
      user_email: email,
      updatedshippingAddress: shippingAddress,
      updatedshippingPhone: shippingPhone,
    };


    const response = await fetch(url, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update order");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// --- Admin Order APIs ---

// Fetch all orders (admin)
export const fetchAllOrders = async () => {
  try {
    const response = await fetch(`${BASE_URL}/orders/orders`, {
      method: "GET",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch orders");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw error;
  }
};

// Delete an order (admin)
export const deleteOrder = async (orderId) => {
  try {
    const response = await fetch(`${BASE_URL}/orders/orders/${orderId}`, {
      method: "DELETE",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to delete order");

    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

// Update an order (admin)
export const updateOrder = async (orderData) => {
  try {
    const response = await fetch(`${BASE_URL}/orders/update`, {
      method: "PUT",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) throw new Error("Failed to update order");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// --- Admin Notifications ---

// Fetch pending admin requests/notifications
export const fetchNotifications = async () => {
  try {
    const response = await fetch(`${BASE_URL}/admin-requests`, {
      method: "GET",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch notifications");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Update admin request status (approve/deny)
export const updateNotificationStatus = async (
  adminRequestId,
  orderId,
  isApproved
) => {
  try {
    const requestBody = {
      admin_req_id: adminRequestId,
      order_id: orderId,
      isApproved: isApproved,
    };

    const response = await fetch(`${BASE_URL}/admin-requests/updateStatus`, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error("Failed to update notification status");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating notification status:", error);
    throw error;
  }
};
