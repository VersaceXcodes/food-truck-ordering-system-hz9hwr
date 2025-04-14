import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, set_current_order } from "@/store/main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  customizations: string;
  subtotal: number;
}

interface OrderDetails {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  estimatedTime: string;
}

const UV_OrderConfirmation: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth_state);
  const orderDetails: OrderDetails | null = useSelector(
    (state: RootState) => state.orders_state.currentOrder
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Function to fetch the order details from the backend if not available in global state
  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:1337/api/orders", {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
      // Assuming the latest order (first order in the list) is the one we want.
      if (response.data.orders && response.data.orders.length > 0) {
        const latestOrder = response.data.orders[0];
        dispatch(set_current_order(latestOrder));
      }
    } catch (error) {
      console.error("Failed to fetch order details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no order details exist and the user is authenticated then fetch from backend.
    if (authState.isAuthenticated && !orderDetails) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, orderDetails]);

  // Function to navigate to the Order Tracking view when user clicks the button.
  const navigateToOrderTracking = () => {
    navigate("/order-tracking");
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-6">Order Confirmation</h1>
        {loading && (
          <p className="text-center text-lg text-gray-700">Loading order details...</p>
        )}
        {!loading && !orderDetails && (
          <div className="text-center">
            <p className="text-lg text-red-500 mb-4">No order details found.</p>
            <Link to="/home" className="text-blue-500 hover:underline">
              Return to Home
            </Link>
          </div>
        )}
        {!loading && orderDetails && (
          <div className="bg-white shadow rounded p-6">
            <p className="text-lg mb-2">
              Thank you for your order, <span className="font-semibold">{authState.full_name}</span>!
            </p>
            <div className="mb-4">
              <span className="font-semibold">Order ID:</span>
              <span className="ml-2 text-gray-800">{orderDetails.id}</span>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Payment Method:</span>
              <span className="ml-2 capitalize text-gray-800">{orderDetails.paymentMethod}</span>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Estimated Pickup/Delivery Time:</span>
              <span className="ml-2 text-gray-800">
                {orderDetails.estimatedTime ? orderDetails.estimatedTime : "N/A"}
              </span>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Items Purchased:</h2>
              <ul className="list-disc ml-5">
                {orderDetails.items.map((item, index) => (
                  <li key={index} className="mb-1 text-gray-700">
                    <span className="font-medium">Item:</span> {item.menu_item_id},{" "}
                    <span className="font-medium">Quantity:</span> {item.quantity},{" "}
                    <span className="font-medium">Customizations:</span> {item.customizations || "None"},{" "}
                    <span className="font-medium">Subtotal:</span> ${item.subtotal.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Total Amount:</span>
              <span className="ml-2 text-gray-800">${orderDetails.total.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={navigateToOrderTracking}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Track Order
              </button>
            </div>
            <div className="mt-4 text-center">
              <Link to="/home" className="text-blue-500 hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_OrderConfirmation;