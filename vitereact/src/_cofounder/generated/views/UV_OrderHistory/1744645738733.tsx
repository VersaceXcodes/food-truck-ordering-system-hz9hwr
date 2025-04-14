import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, set_order_history, clear_cart, add_cart_item, set_cart_total } from "@/store/main";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const UV_OrderHistory: React.FC = () => {
  // Get token from global auth state and global order history
  const { token } = useSelector((state: RootState) => state.auth_state);
  const dispatch = useDispatch();
  
  // Local state variables for orders list, selected order, loading and error message
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  // Retrieve pagination parameters from URL; default values if not provided
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get("page") || "1";
  const limitParam = searchParams.get("limit") || "10";
  const navigate = useNavigate();

  // Function to fetch order history from the backend API
  const fetchOrderHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:1337/api/orders?page=${pageParam}&limit=${limitParam}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }
      const data = await response.json();
      setOrdersList(data.orders);
      dispatch(set_order_history(data.orders));
    } catch (err: any) {
      setError(err.message || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  // useEffect to call fetchOrderHistory on mount and when page or limit changes
  useEffect(() => {
    fetchOrderHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, limitParam]);

  // When an order row is clicked, show detailed information by updating selectedOrder state
  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
  };

  // Initiate reorder: clear current cart, load order items into the cart and navigate to checkout page
  const initiateReorder = (order: any) => {
    dispatch(clear_cart());
    if (order.order_items && Array.isArray(order.order_items)) {
      order.order_items.forEach((item: any) => {
        dispatch(add_cart_item({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          customizations: item.customizations
        }));
      });
    }
    dispatch(set_cart_total(order.total_amount || 0));
    navigate("/checkout");
  };

  // Format UNIX timestamp into a human-readable date string
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        {loading && <p>Loading orders...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && ordersList.length === 0 && (
          <p>No orders found.</p>
        )}
        {!loading && !error && ordersList.length > 0 && (
          <div>
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Order ID</th>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Total</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{order.id}</td>
                    <td className="py-2 px-4 border-b">{formatDate(order.created_at)}</td>
                    <td className="py-2 px-4 border-b">${order.total_amount?.toFixed(2) || "0.00"}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={
                        order.order_status === "completed" ? "text-green-500" :
                        order.order_status === "cancelled" ? "text-red-500" : "text-yellow-500"
                      }>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 mr-2 rounded"
                        onClick={() => viewOrderDetails(order)}
                      >
                        View Details
                      </button>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                        onClick={() => initiateReorder(order)}
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => {
                  const currentPage = parseInt(pageParam);
                  if (currentPage > 1) {
                    const newPage = (currentPage - 1).toString();
                    setSearchParams({ page: newPage, limit: limitParam });
                  }
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded disabled:opacity-50"
                disabled={parseInt(pageParam) <= 1}
              >
                Previous
              </button>
              <span>Page {pageParam}</span>
              <button
                onClick={() => {
                  const newPage = (parseInt(pageParam) + 1).toString();
                  setSearchParams({ page: newPage, limit: limitParam });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}
        {selectedOrder && (
          <div className="mt-8 p-4 border rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Order Details</h2>
            <p><strong>Order ID:</strong> {selectedOrder.id}</p>
            <p><strong>Date:</strong> {formatDate(selectedOrder.created_at)}</p>
            <p><strong>Total:</strong> ${selectedOrder.total_amount?.toFixed(2) || "0.00"}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={
                selectedOrder.order_status === "completed" ? "text-green-500" :
                selectedOrder.order_status === "cancelled" ? "text-red-500" : "text-yellow-500"
              }>
                {selectedOrder.order_status}
              </span>
            </p>
            <h3 className="mt-4 font-semibold">Items:</h3>
            <ul>
              {selectedOrder.order_items && selectedOrder.order_items.map((item: any) => (
                <li key={item.id} className="border p-2 my-2">
                  <p><strong>Item ID:</strong> {item.menu_item_id}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Customizations:</strong> {item.customizations}</p>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedOrder(null)}
              className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded mt-4"
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_OrderHistory;