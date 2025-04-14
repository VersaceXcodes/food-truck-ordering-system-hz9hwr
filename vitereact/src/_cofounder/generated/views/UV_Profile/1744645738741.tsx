import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, set_auth } from "@/store/main";

const UV_Profile: React.FC = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth_state);
  
  // Local state for profile data, active tab and validation errors
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    addresses: [] as Array<{
      id: string;
      address: string;
      city: string;
      state: string;
      zip_code: string;
      is_default: boolean;
    }>
  });
  const [activeTab, setActiveTab] = useState("details");
  const [formValidationErrors, setFormValidationErrors] = useState<{ [key: string]: string }>({});
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [updateMessage, setUpdateMessage] = useState("");

  // Fetch user profile from backend
  const fetchProfileData = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/users/profile", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authState.token
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }
      const data = await response.json();
      setProfileData(data.user);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  // Fetch order history (for customers)
  const fetchOrderHistory = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/orders", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authState.token
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }
      const data = await response.json();
      setOrdersHistory(data.orders);
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
  };

  // useEffect to fetch profile (and order history if customer) on mount
  useEffect(() => {
    fetchProfileData();
    if (authState.role === "customer") {
      fetchOrderHistory();
    }
  }, []);

  // Generic change handler for text fields in profileData
  const handleChange = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  // Handle change in an address field at index idx
  const handleAddressChange = (idx: number, field: string, value: any) => {
    const updatedAddresses = profileData.addresses.map((addr, index) => {
      if (index === idx) {
        return { ...addr, [field]: value };
      }
      return addr;
    });
    setProfileData({ ...profileData, addresses: updatedAddresses });
  };

  // Add a new blank address object
  const addAddress = () => {
    const newAddress = { id: "", address: "", city: "", state: "", zip_code: "", is_default: false };
    setProfileData({ ...profileData, addresses: [...profileData.addresses, newAddress] });
  };

  // Remove an address at index idx
  const removeAddress = (idx: number) => {
    const updatedAddresses = profileData.addresses.filter((_, index) => index !== idx);
    setProfileData({ ...profileData, addresses: updatedAddresses });
  };

  // Update profile function that validates and then sends a PUT request
  const handleUpdateProfile = async () => {
    const errors: { [key: string]: string } = {};
    if (!profileData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }
    setFormValidationErrors({});
    try {
      const response = await fetch("http://localhost:1337/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authState.token
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          phone: profileData.phone,
          addresses: profileData.addresses.map(addr => ({
            id: addr.id,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code,
            is_default: addr.is_default ? "true" : "false"
          }))
        })
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      const data = await response.json();
      setProfileData(data.updated_user);
      setUpdateMessage("Profile updated successfully.");
      // Update global auth state if full name has changed
      if (authState.full_name !== data.updated_user.full_name) {
        dispatch(set_auth({
          user_id: authState.user_id,
          full_name: data.updated_user.full_name,
          email: authState.email,
          role: authState.role,
          token: authState.token,
          isAuthenticated: authState.isAuthenticated
        }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateMessage("Error updating profile.");
    }
  };

  // Change active tab handler; if switching to 'order_history', reload orders
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "order_history" && authState.role === "customer") {
      fetchOrderHistory();
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">User Profile</h1>
        <div className="mb-4">
          <button 
            onClick={() => handleTabChange("details")} 
            className={`px-4 py-2 mr-2 ${activeTab === "details" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Details
          </button>
          {authState.role === "customer" && (
            <>
              <button 
                onClick={() => handleTabChange("order_history")} 
                className={`px-4 py-2 mr-2 ${activeTab === "order_history" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Order History
              </button>
              <button 
                onClick={() => handleTabChange("reviews")} 
                className={`px-4 py-2 ${activeTab === "reviews" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Reviews
              </button>
            </>
          )}
          {authState.role === "operator" && (
            <button 
              onClick={() => handleTabChange("business")} 
              className={`px-4 py-2 ${activeTab === "business" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Business Data
            </button>
          )}
        </div>
        {activeTab === "details" && (
          <div>
            <div className="mb-4">
              <label className="block font-semibold">Full Name:</label>
              <input 
                type="text" 
                value={profileData.full_name} 
                onChange={(e) => handleChange("full_name", e.target.value)} 
                className="w-full border p-2"
              />
              {formValidationErrors.full_name && <p className="text-red-500">{formValidationErrors.full_name}</p>}
            </div>
            <div className="mb-4">
              <label className="block font-semibold">Email:</label>
              <input 
                type="email" 
                value={profileData.email} 
                disabled 
                className="w-full border p-2 bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold">Phone:</label>
              <input 
                type="text" 
                value={profileData.phone} 
                onChange={(e) => handleChange("phone", e.target.value)} 
                className="w-full border p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2">Addresses:</label>
              {profileData.addresses && profileData.addresses.map((addr, idx) => (
                <div key={idx} className="border p-2 mb-2">
                  <div className="mb-2">
                    <label className="block">Address:</label>
                    <input 
                      type="text" 
                      value={addr.address} 
                      onChange={(e) => handleAddressChange(idx, "address", e.target.value)} 
                      className="w-full border p-2" 
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block">City:</label>
                    <input 
                      type="text" 
                      value={addr.city} 
                      onChange={(e) => handleAddressChange(idx, "city", e.target.value)} 
                      className="w-full border p-2" 
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block">State:</label>
                    <input 
                      type="text" 
                      value={addr.state} 
                      onChange={(e) => handleAddressChange(idx, "state", e.target.value)} 
                      className="w-full border p-2" 
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block">Zip Code:</label>
                    <input 
                      type="text" 
                      value={addr.zip_code} 
                      onChange={(e) => handleAddressChange(idx, "zip_code", e.target.value)} 
                      className="w-full border p-2" 
                    />
                  </div>
                  <div className="mb-2 flex items-center">
                    <input 
                      type="checkbox" 
                      checked={addr.is_default} 
                      onChange={(e) => handleAddressChange(idx, "is_default", e.target.checked)} 
                      className="mr-2" 
                    />
                    <label>Default Address</label>
                  </div>
                  <button 
                    onClick={() => removeAddress(idx)} 
                    className="bg-red-500 text-white px-2 py-1"
                  >
                    Remove Address
                  </button>
                </div>
              ))}
              <button 
                onClick={addAddress} 
                className="bg-green-500 text-white px-4 py-2"
              >
                Add Address
              </button>
            </div>
            <button 
              onClick={handleUpdateProfile} 
              className="bg-blue-600 text-white px-4 py-2"
            >
              Save Profile
            </button>
            {updateMessage && <p className="mt-2">{updateMessage}</p>}
          </div>
        )}
        {activeTab === "order_history" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Order History</h2>
            {ordersHistory && ordersHistory.length > 0 ? (
              <div>
                {ordersHistory.map((order, idx) => (
                  <div key={idx} className="border p-4 mb-2">
                    <p><span className="font-semibold">Order ID:</span> {order.id}</p>
                    <p><span className="font-semibold">Status:</span> {order.order_status}</p>
                    <p><span className="font-semibold">Total Amount:</span> ${order.total_amount}</p>
                    <Link to="/order-confirmation" className="text-blue-500 underline">View Details</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>No orders found.</p>
            )}
          </div>
        )}
        {activeTab === "reviews" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            <p>No reviews available.</p>
          </div>
        )}
        {activeTab === "business" && authState.role === "operator" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Business Data</h2>
            <p>Business related profile data can be managed here.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_Profile;