import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

const UV_OperatorOrderManagement: React.FC = () => {
  const authState = useSelector((state: RootState) => state.auth_state);
  // Local state variables as per the datamap
  const [ordersList, setOrdersList] = useState<Array<any>>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState<boolean>(false);

  // Function to fetch the list of active orders for the operator
  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        }
      });
      const data = await response.json();
      if (data.orders) {
        setOrdersList(data.orders);
      } else {
        console.error("No orders data received", data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // useEffect to call fetchOrders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Helper function to determine available status update options based on current status
  const getAvailableStatusUpdates = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case "pending":
        return ["accepted", "preparing", "ready", "completed"];
      case "accepted":
        return ["preparing", "ready", "completed"];
      case "preparing":
        return ["ready", "completed"];
      case "ready":
        return ["completed"];
      default:
        return [];
    }
  };

  // Function to update the status of an order by calling PATCH /api/orders/{id}/status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setStatusUpdateInProgress(true);
      const response = await fetch(`http://localhost:1337/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({ order_status: newStatus })
      });
      const resData = await response.json();
      if (resData.success) {
        // Update the particular order in ordersList
        setOrdersList((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? resData.order : order
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(resData.order);
        }
      } else {
        console.error("Failed to update order status:", resData);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setStatusUpdateInProgress(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Operator Order Management</h1>
        <div className="mb-4">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4"
            onClick={fetchOrders}
          >
            Refresh Orders
          </button>
          <Link to="/operator/orders/history" className="text-blue-600 hover:underline">
            View Order History
          </Link>
        </div>
        {ordersList.length === 0 ? (
          <div className="text-gray-600">No active orders available at this time.</div>
        ) : (
          ordersList.map((order) => (
            <div key={order.id} className="border rounded p-4 mb-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-xl font-semibold">Order ID: {order.id}</h2>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(order.created_at * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  Status: <span className="capitalize">{order.order_status || order.status}</span>
                </div>
              </div>
              <div className="mb-2">
                <h3 className="font-medium">Customer Details:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs">
                  {JSON.stringify(order.customerDetails, null, 2)}
                </pre>
              </div>
              <div className="mb-2">
                <h3 className="font-medium">Ordered Items:</h3>
                {order.items && order.items.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {order.items.map((item: any, index: number) => (
                      <li key={index} className="text-sm">
                        Item ID: {item.menu_item_id} | Quantity: {item.quantity} | Customizations: {item.customizations}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No items found.</p>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-1">Update Order Status:</h3>
                {getAvailableStatusUpdates(order.order_status || order.status).length === 0 ? (
                  <p className="text-sm text-gray-500">No status updates available.</p>
                ) : (
                  <div className="flex space-x-2">
                    {getAvailableStatusUpdates(order.order_status || order.status).map((statusOption) => (
                      <button
                        key={statusOption}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        disabled={statusUpdateInProgress}
                        onClick={() => updateOrderStatus(order.id, statusOption)}
                      >
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default UV_OperatorOrderManagement;