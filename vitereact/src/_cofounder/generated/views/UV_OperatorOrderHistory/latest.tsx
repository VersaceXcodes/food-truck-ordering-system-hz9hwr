import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: number;
  order_summary: object;
}

interface OrderHistoryList {
  orders: Order[];
}

interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

const UV_OperatorOrderHistory: React.FC = () => {
  const authState = useSelector((state: RootState) => state.auth_state);
  const [orderHistoryList, setOrderHistoryList] = useState<OrderHistoryList>({ orders: [] });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchOrderHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:1337/api/orders", {
        params: {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
        },
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
      // For operators, response.data.orders is the list of historical orders.
      // Here, for pagination totalItems we simply count the items returned.
      const orders: Order[] = response.data.orders;
      setOrderHistoryList({ orders });
      setPagination(prev => ({ ...prev, totalItems: orders.length }));
    } catch (err: any) {
      console.error("Error fetching order history:", err);
      setError("Failed to fetch order history. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.itemsPerPage]);

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Link to="/operator/dashboard" className="text-blue-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-4">Operator Order History</h1>
        <p className="mb-4 text-gray-700">
          Review historical orders processed by your food truck. Use the pagination controls below to
          navigate through orders.
        </p>
        {isLoading ? (
          <div className="text-center text-blue-500">Loading orders...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            {orderHistoryList.orders.length === 0 ? (
              <div className="text-center text-gray-500">No historical orders found.</div>
            ) : (
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Order ID</th>
                    <th className="py-2 px-4 border-b">Date</th>
                    <th className="py-2 px-4 border-b">Total</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistoryList.orders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-2 px-4 border-b">{order.id}</td>
                      <td className="py-2 px-4 border-b">
                        {new Date(order.created_at * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 border-b">${order.total.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b capitalize">{order.status}</td>
                      <td className="py-2 px-4 border-b break-all">
                        {JSON.stringify(order.order_summary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
            }
            disabled={pagination.currentPage <= 1 || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-700">Page {pagination.currentPage}</span>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
            }
            disabled={
              orderHistoryList.orders.length < pagination.itemsPerPage || isLoading
            }
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default UV_OperatorOrderHistory;