import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const UV_SignUp: React.FC = () => {
  // Initialize formData state with default fields
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: ""
  });

  // Initialize formErrors state with empty error messages
  const [formErrors, setFormErrors] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: ""
  });

  // Flag for ongoing submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Additional state to show server side error messages
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  // Function to validate all form fields and update error messages
  const validateSignUpForm = (): boolean => {
    const errors = { full_name: "", email: "", password: "", phone: "" };
    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required.";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Invalid email format.";
      }
    }
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\d{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Phone number must be at least 10 digits.";
      }
    }
    setFormErrors(errors);
    return Object.values(errors).every((error) => error === "");
  };

  // Handle input changes and perform inline field validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Perform inline validation for the specific field
    switch (name) {
      case "full_name":
        setFormErrors((prev) => ({ ...prev, full_name: value.trim() ? "" : "Full name is required." }));
        break;
      case "email":
        {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          setFormErrors((prev) => ({
            ...prev,
            email: value.trim() ? (emailRegex.test(value) ? "" : "Invalid email format.") : "Email is required."
          }));
        }
        break;
      case "password":
        setFormErrors((prev) => ({
          ...prev,
          password: value ? (value.length >= 8 ? "" : "Password must be at least 8 characters.") : "Password is required."
        }));
        break;
      case "phone":
        if (value.trim()) {
          const phoneRegex = /^\d{10,}$/;
          setFormErrors((prev) => ({ ...prev, phone: phoneRegex.test(value) ? "" : "Phone number must be at least 10 digits." }));
        } else {
          setFormErrors((prev) => ({ ...prev, phone: "" }));
        }
        break;
      default:
        break;
    }
  };

  // Handle form submission, validate then call backend API endpoint
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    if (!validateSignUpForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Prepare payload including default role value "customer"
      const payload = { ...formData, role: "customer" };
      const response = await axios.post("http://localhost:1337/api/auth/register", payload);
      if (response.data.success) {
        alert("Registration successful. Please log in.");
        navigate("/login");
      } else {
        setServerError("Registration failed. Please try again.");
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 border border-gray-200 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
        {serverError && <div className="mb-4 text-red-600 text-center">{serverError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 p-2 rounded"
              placeholder="Enter your full name"
            />
            {formErrors.full_name && <p className="text-red-500 text-sm">{formErrors.full_name}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 p-2 rounded"
              placeholder="Enter your email"
            />
            {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 p-2 rounded"
              placeholder="Enter your password"
            />
            {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone (Optional)</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 p-2 rounded"
              placeholder="Enter your phone number"
            />
            {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
          </div>
          <div className="mb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Sign Up"}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-gray-700">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default UV_SignUp;