import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { set_auth } from "@/store/main";
import { useNavigate, Link } from "react-router-dom";

const UV_Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local state for login form fields, errors, and loading flag.
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validate form fields on change.
  const validateLoginForm = (fieldName: string, value: any) => {
    let error = "";
    if (fieldName === "email") {
      if (!value) {
        error = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        error = "Invalid email address";
      }
    }
    if (fieldName === "password") {
      if (!value) {
        error = "Password is required";
      }
    }
    // Update form errors in state.
    setFormErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
    return error;
  };

  // Handle any changes to input fields.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setLoginFormData((prevData) => ({
      ...prevData,
      [name]: fieldValue,
    }));
    validateLoginForm(name, fieldValue);
  };

  // Submit login form and process the backend API call.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields.
    const emailError = validateLoginForm("email", loginFormData.email);
    const passwordError = validateLoginForm("password", loginFormData.password);
    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:1337/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginFormData.email,
          password: loginFormData.password,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // data.user and data.token expected in response.
        dispatch(
          set_auth({
            user_id: data.user.id,
            full_name: data.user.full_name,
            email: data.user.email,
            role: data.user.role,
            token: data.token,
            isAuthenticated: true,
          })
        );
        // Redirect based on user role.
        if (data.user.role === "customer") {
          navigate("/home");
        } else if (data.user.role === "operator") {
          navigate("/operator/dashboard");
        } else if (data.user.role === "admin") {
          navigate("/admin/dashboard");
        }
      } else {
        const errorResponse = await response.json();
        setFormErrors({
          email: errorResponse.message || "Invalid email or password",
          password: errorResponse.message || "Invalid email or password",
        });
      }
    } catch (error) {
      setFormErrors({
        email: "Network error. Please try again.",
        password: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={loginFormData.email}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your email"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs italic mt-2">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={loginFormData.password}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your password"
              />
              {formErrors.password && (
                <p className="text-red-500 text-xs italic mt-2">
                  {formErrors.password}
                </p>
              )}
            </div>
            <div className="mb-4 flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                name="rememberMe"
                checked={loginFormData.rememberMe}
                onChange={handleInputChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
              <Link
                to="/forgot-password"
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_Login;