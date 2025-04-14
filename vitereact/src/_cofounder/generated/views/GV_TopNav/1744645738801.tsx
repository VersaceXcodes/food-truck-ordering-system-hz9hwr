import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, clear_auth } from "@/store/main";

const GV_TopNav: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth_state = useSelector((state: RootState) => state.auth_state);
  const notifications_state = useSelector((state: RootState) => state.notifications_state);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Toggle the account dropdown menu
  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  // Handle logout: clear auth and navigate to landing page
  const handleLogout = () => {
    dispatch(clear_auth());
    navigate("/");
  };

  // Compute count of unread notifications
  const notificationCount = notifications_state.notifications.filter(n => !n.is_read).length;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo on the left */}
            <div className="flex-shrink-0">
              <Link
                to={auth_state.isAuthenticated ? "/home" : "/"}
                className="text-2xl font-bold text-blue-600"
              >
                FoodTruck Express
              </Link>
            </div>

            {/* Navigation Links (center) */}
            <div className="hidden md:flex space-x-4">
              {auth_state.isAuthenticated ? (
                <>
                  {auth_state.role === "customer" && (
                    <>
                      <Link
                        to="/home"
                        className="text-gray-700 hover:text-blue-500 px-3 py-2"
                      >
                        Home
                      </Link>
                      <Link
                        to="/order-tracking"
                        className="text-gray-700 hover:text-blue-500 px-3 py-2"
                      >
                        Order Tracking
                      </Link>
                      <Link
                        to="/order-history"
                        className="text-gray-700 hover:text-blue-500 px-3 py-2"
                      >
                        Order History
                      </Link>
                      <Link
                        to="/profile"
                        className="text-gray-700 hover:text-blue-500 px-3 py-2"
                      >
                        Profile
                      </Link>
                    </>
                  )}
                  {auth_state.role === "operator" && (
                    <>
                      <Link
                        to="/operator/dashboard"
                        className="text-gray-700 hover:text-blue-500 px-3 py-2"
                      >
                        Dashboard
                      </Link>
                    </>
                  )}
                  {auth_state.role === "admin" && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="text-gray-700 hover:text-blue-500 px-3 py-2"
                      >
                        Dashboard
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-500 px-3 py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-gray-700 hover:text-blue-500 px-3 py-2"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Right Side: Notification Icon and User Account Icon */}
            <div className="flex items-center space-x-4">
              {auth_state.isAuthenticated && (
                <>
                  {/* Notification Icon */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        // Open notifications panel action
                        // Implementation can be extended if a detailed panel is added
                        console.log("Open notifications panel");
                      }}
                      className="text-gray-700 hover:text-blue-500 focus:outline-none"
                    >
                      🔔
                    </button>
                    {notificationCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {notificationCount}
                      </span>
                    )}
                  </div>

                  {/* User Account Icon and Dropdown */}
                  <div className="relative">
                    <button
                      onClick={toggleDropdown}
                      className="flex items-center text-gray-700 hover:text-blue-500 focus:outline-none"
                    >
                      <span className="mr-2">👤</span>
                      <span>{auth_state.full_name}</span>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer div to account for the fixed nav bar height */}
      <div className="pt-16"></div>
    </>
  );
};

export default GV_TopNav;