import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { Link } from "react-router-dom";

const UV_AdminDashboard: React.FC = () => {
  // Retrieve the admin's authentication state from global store
  const auth = useSelector((state: RootState) => state.auth_state);
  
  // Local state for metricsData (active orders, new user signups, flagged reviews, system alerts)
  const [metricsData, setMetricsData] = useState<{
    activeOrders: number;
    newUserSignups: number;
    flaggedReviews: number;
    systemAlerts: Array<{ type: string; message: string }>;
  }>({
    activeOrders: 0,
    newUserSignups: 0,
    flaggedReviews: 0,
    systemAlerts: []
  });

  // Local state for user management data (list of users)
  const [userManagementData, setUserManagementData] = useState<{
    users: Array<{ id: string; full_name: string; role: string; status: string }>;
  }>({
    users: []
  });

  // Local state for moderation queue (flagged content)
  const [moderationQueue, setModerationQueue] = useState<{
    items: Array<{ id: string; content: string; flaggedBy: string; created_at: number }>;
  }>({
    items: []
  });

  // Function to fetch aggregated dashboard metrics
  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/admin/metrics", {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Expecting data to have activeOrders, newUserSignups, flaggedReviews, systemAlerts
        setMetricsData(data);
      } else {
        console.error("Failed to fetch admin metrics");
      }
    } catch (error) {
      console.error("Error in fetchDashboardMetrics", error);
    }
  };

  // Function to fetch user management data (list of all users)
  const fetchUserManagementData = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/admin/users", {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Expecting data to have {users: [...]}
        setUserManagementData(data);
      } else {
        console.error("Failed to fetch user management data");
      }
    } catch (error) {
      console.error("Error fetching user management data", error);
    }
  };

  // Function to fetch the moderation queue (flagged items)
  const fetchModerationQueue = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/admin/moderation", {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Expecting data to have {items: [...]}
        setModerationQueue(data);
      } else {
        console.error("Failed to fetch moderation queue");
      }
    } catch (error) {
      console.error("Error fetching moderation queue", error);
    }
  };

  // Function to initiate moderation for a flagged item.
  const handleInitiateModeration = async (itemId: string) => {
    try {
      const response = await fetch(`http://localhost:1337/api/admin/moderation/${itemId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        alert("Moderation details: " + JSON.stringify(data));
        // Optionally remove the moderated item from the queue
        setModerationQueue(prev => ({
          items: prev.items.filter(item => item.id !== itemId)
        }));
      } else {
        alert("Failed to fetch moderation details for item " + itemId);
      }
    } catch (error) {
      console.error("Error in initiating moderation:", error);
      alert("Error initiating moderation.");
    }
  };

  // useEffect hook for initial data fetch and setting up interval for metrics refreshing
  useEffect(() => {
    fetchDashboardMetrics();
    fetchUserManagementData();
    fetchModerationQueue();
    const intervalId = setInterval(() => {
      fetchDashboardMetrics();
    }, 60000); // refresh every 60 seconds
    return () => {
      clearInterval(intervalId);
    };
  }, [auth.token]);

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Active Orders</h2>
            <p className="text-3xl">{metricsData.activeOrders}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-2">New User Signups</h2>
            <p className="text-3xl">{metricsData.newUserSignups}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Flagged Reviews</h2>
            <p className="text-3xl">{metricsData.flaggedReviews}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-2">System Alerts</h2>
            <ul>
              {metricsData.systemAlerts.length > 0 ? (
                metricsData.systemAlerts.map((alert, index) => (
                  <li key={index} className="text-sm">
                    {alert.type}: {alert.message}
                  </li>
                ))
              ) : (
                <li className="text-sm">No alerts</li>
              )}
            </ul>
          </div>
        </div>
        {/* User Management Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">User Management</h2>
          {userManagementData.users.length > 0 ? (
            <table className="min-w-full bg-white shadow rounded">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Full Name</th>
                  <th className="py-2 px-4 border-b">Role</th>
                  <th className="py-2 px-4 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {userManagementData.users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-2 px-4 border-b">{user.id}</td>
                    <td className="py-2 px-4 border-b">{user.full_name}</td>
                    <td className="py-2 px-4 border-b">{user.role}</td>
                    <td className="py-2 px-4 border-b">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No user data available.</p>
          )}
        </div>
        {/* Moderation Queue Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Moderation Queue</h2>
          {moderationQueue.items.length > 0 ? (
            <ul className="list-disc pl-5">
              {moderationQueue.items.map((item) => (
                <li key={item.id} className="mb-2">
                  <p className="text-sm">Content: {item.content}</p>
                  <p className="text-xs text-gray-500">
                    Flagged by: {item.flaggedBy} at{" "}
                    {new Date(item.created_at * 1000).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleInitiateModeration(item.id)}
                    className="mt-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Moderate
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No flagged items.</p>
          )}
        </div>
        {/* Example of a link to user management page (if exists in the app sitemap) */}
        <div className="mt-6">
          <Link to="/profile" className="text-blue-500 hover:underline">
            Manage your profile &rarr;
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_AdminDashboard;