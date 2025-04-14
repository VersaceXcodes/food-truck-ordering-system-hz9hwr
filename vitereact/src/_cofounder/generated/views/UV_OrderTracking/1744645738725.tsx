import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import { RootState, update_tracking } from "@/store/main";

const UV_OrderTracking: React.FC = () => {
  const dispatch = useDispatch();
  // Global state variables
  const currentOrder = useSelector((state: RootState) => state.orders_state.currentOrder);
  const tracking = useSelector((state: RootState) => state.orders_state.tracking);
  const notifications = useSelector((state: RootState) => state.notifications_state.notifications);
  const token = useSelector((state: RootState) => state.auth_state.token);

  // Local state for refresh indicator and timeline accumulation.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTimeline, setLocalTimeline] = useState<Array<{ stage: string, timestamp: number }>>([]);

  // Function to refresh tracking data manually or periodically.
  const refreshTrackingData = async () => {
    if (!currentOrder || !token) return;
    setIsRefreshing(true);
    try {
      // Call the backend orders endpoint to get up-to-date orders for the customer.
      const response = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend returns an array of orders (for customer role).
      const orders = response.data.orders;
      // Find the active order matching the current order id.
      const updatedOrder = orders.find((order: any) => order.id === currentOrder.id);
      if (updatedOrder) {
        // Dispatch update_tracking action with new order status
        dispatch(update_tracking({
          order_id: updatedOrder.id,
          new_status: updatedOrder.order_status,
          changed_at: updatedOrder.updated_at
        }));
      }
    } catch (error) {
      console.error("Error refreshing tracking data:", error);
    }
    setIsRefreshing(false);
  };

  // When the component mounts and when currentOrder changes, trigger initial refresh and setup periodic refresh.
  useEffect(() => {
    if (currentOrder) {
      // Set initial timeline if empty.
      setLocalTimeline(prev => {
        if (prev.length === 0) {
          // Use order created_at if available or current timestamp.
          const initialTime = currentOrder.created_at ? currentOrder.created_at : Math.floor(Date.now() / 1000);
          return [{ stage: currentOrder.status, timestamp: initialTime }];
        }
        return prev;
      });
      // Refresh immediately.
      refreshTrackingData();
      // Set up periodic refresh every 30 seconds.
      const intervalId = setInterval(() => {
        refreshTrackingData();
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [currentOrder, token]);

  // When new tracking info is received in global state (via websocket or refresh), update the local timeline.
  useEffect(() => {
    if (tracking && tracking.new_status) {
      setLocalTimeline(prev => {
        if (prev.length === 0 || prev[prev.length - 1].stage !== tracking.new_status) {
          return [...prev, { stage: tracking.new_status, timestamp: tracking.changed_at }];
        }
        return prev;
      });
    }
  }, [tracking]);

  return (
    <>
      <div className="container mx-auto p-4">
        { !currentOrder ? (
          <div className="text-center">
            <p className="text-xl">No active order to track.</p>
            <Link to="/home" className="text-blue-500 hover:underline">
              Go to Food Trucks
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold mb-4">Order Tracking</h1>
            <div className="mb-4">
              <p><span className="font-semibold">Order ID:</span> {currentOrder.id}</p>
              <p><span className="font-semibold">Current Status:</span> {currentOrder.status}</p>
              <button
                onClick={refreshTrackingData}
                disabled={isRefreshing}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                { isRefreshing ? "Refreshing..." : "Refresh Tracking" }
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Progress Timeline</h2>
              <ul className="space-y-2">
                { localTimeline.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center mr-2">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.stage}</p>
                      <p className="text-sm text-gray-600">{new Date(item.timestamp * 1000).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Notifications</h2>
              { notifications.filter((notif: any) => notif.message.includes(currentOrder.id)).length === 0 ? (
                <p>No new notifications.</p>
              ) : (
                <ul className="space-y-2">
                  { notifications.filter((notif: any) => notif.message.includes(currentOrder.id)).map((notif: any) => (
                    <li key={notif.id} className="p-2 bg-gray-100 rounded">
                      <p>{notif.message}</p>
                      <p className="text-xs text-gray-500">{new Date(notif.created_at * 1000).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_OrderTracking;