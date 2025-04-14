import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UV_ForgotPassword: React.FC = () => {
  // Define local state variables according to the specification
  const [emailInput, setEmailInput] = useState<{ email: string }>({ email: "" });
  const [recoveryStatus, setRecoveryStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper: Validate email format using regex
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Triggered on input change to update emailInput state
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput({ email: e.target.value });
    // Optionally, you might clear previous messages on change
    setRecoveryStatus("");
  };

  // Triggered on form submission to submit password recovery request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(emailInput.email)) {
      setRecoveryStatus("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      // POST request to backend endpoint for password recovery
      // In a production app, this endpoint would actually process the request.
      await axios.post("http://localhost:1337/api/auth/forgot-password", {
        email: emailInput.email,
      });
      // On success, provide a success message
      setRecoveryStatus(
        "Success! If the email is registered, you will receive instructions to reset your password."
      );
    } catch (error: any) {
      // On error, display an error message
      setRecoveryStatus(
        "Error: The email is not recognized or a server error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8 px-4">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
          <p className="text-gray-600 mb-6 text-center">
            Enter your registered email address to receive password reset instructions.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailInput.email}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                placeholder="Enter your email"
                required
              />
            </div>
            {recoveryStatus && (
              <div
                className={`mb-4 text-sm ${
                  recoveryStatus.startsWith("Success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {recoveryStatus}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-500 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ForgotPassword;