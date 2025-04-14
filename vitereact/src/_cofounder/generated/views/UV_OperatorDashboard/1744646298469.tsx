import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

const UV_OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, user_id } = useSelector((state: RootState) => state.auth_state);
  const notifications = useSelector((state: RootState) => state.notifications_state.notifications);

  // Local state for dashboard data and last updated timestamp
  const [dashboardData, setDashboardData] = useState<{
    activeOrders: Array<{ id: string; customerName: string; status: string; items: Array<any> }>;
    menuStatus: Array<{ menu_item_id: string; title: string; is_sold_out: boolean }>;
    performanceMetrics: { totalOrders: number; completedOrders: number; pendingOrders: number };
  }>({
    activeOrders: [],
    menuStatus: [],
    performanceMetrics: { totalOrders: 0, completedOrders: 0, pendingOrders: 0 },
  });
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Function to fetch dashboard data from backend endpoints.
  async function fetchDashboardData() {
    try {
      // Fetch orders for the operator from GET /api/orders
      const ordersResponse = await axios.get("http://localhost:1337/api/orders", {
        headers: { Authorization: "Bearer " + token },
      });
      const orders = ordersResponse.data.orders;
      // Filter orders to get active ones (not completed and not cancelled)
      const activeOrders = orders
        .filter((order: any) => order.order_status !== "completed" && order.order_status !== "cancelled")
        .map((order: any) => ({
          id: order.id,
          customerName: order.customer_id, // using customer_id as placeholder for customer name
          status: order.order_status,
          items: order.order_items,
        }));
      // Compute performance metrics
      const totalOrders = orders.length;
      const completedOrders = orders.filter((order: any) => order.order_status === "completed").length;
      const pendingOrders = orders.filter((order: any) => order.order_status === "pending").length;

      // Fetch menu items for the operator's truck.
      // For demonstration, we assume the operator's food truck id is "truck_" plus the operator's user_id.
      const truckId = "truck_" + user_id;
      const menuResponse = await axios.get("http://localhost:1337/api/menu-items", {
        params: { food_truck_id: truckId },
      });
      const menuItems = menuResponse.data.menu_items;
      const menuStatus = menuItems.map((item: any) => ({
        menu_item_id: item.id,
        title: item.title,
        is_sold_out: item.is_sold_out === "true",
      }));

      // Update state with the computed dashboard data and timestamp
      setDashboardData({
        activeOrders,
        menuStatus,
        performanceMetrics: { totalOrders, completedOrders, pendingOrders },
      });
      setLastUpdated(Date.now());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  // On mount, fetch dashboard data and set an interval for periodic refresh.
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 120000); // every 2 minutes
    return () => clearInterval(interval);
  }, [token, user_id]);

  // Handle click on an active order card to view order detail.
  const handleOrderDetail = (order: { id: string }) => {
    navigate(`/operator/orders?orderId=${order.id}`);
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Operator Dashboard</h1>
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Never"}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Orders Section */}
          <div className="bg-white shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Active Orders</h2>
            {dashboardData.activeOrders.length === 0 ? (
              <p>No active orders</p>
            ) : (
              <ul>
                {dashboardData.activeOrders.map((order) => (
                  <li
                    key={order.id}
                    className="border rounded p-2 mb-2 cursor-pointer"
                    onClick={() => handleOrderDetail(order)}
                  >
                    <p className="font-medium">Order ID: {order.id}</p>
                    <p>Customer: {order.customerName}</p>
                    <p>Status: {order.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Menu Status Section */}
          <div className="bg-white shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Menu Status</h2>
            {dashboardData.menuStatus.length === 0 ? (
              <p>No menu items found</p>
            ) : (
              <ul>
                {dashboardData.menuStatus.map((item) => (
                  <li key={item.menu_item_id} className="border rounded p-2 mb-2">
                    <p>
                      {item.title} - {item.is_sold_out ? "Sold Out" : "Available"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Performance Metrics Section */}
          <div className="bg-white shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Performance Metrics</h2>
            <p>Total Orders: {dashboardData.performanceMetrics.totalOrders}</p>
            <p>Completed Orders: {dashboardData.performanceMetrics.completedOrders}</p>
            <p>Pending Orders: {dashboardData.performanceMetrics.pendingOrders}</p>
          </div>
          {/* Notifications Section */}
          <div className="bg-white shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Notifications</h2>
            {notifications && notifications.length > 0 ? (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id} className="border rounded p-2 mb-2">
                    <p>{n.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(n.created_at * 1000).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notifications</p>
            )}
          </div>
        </div>
        {/* Quick Access Buttons */}
        <div className="mt-6 flex space-x-4">
          <Link
            to="/operator/menu"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Manage Menu
          </Link>
          <Link
            to="/operator/orders"
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Manage Orders
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_OperatorDashboard;