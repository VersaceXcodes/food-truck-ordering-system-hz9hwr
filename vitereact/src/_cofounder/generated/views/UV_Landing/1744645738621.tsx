import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { Link, useNavigate } from "react-router-dom";

const UV_Landing: React.FC = () => {
  // Access global auth_state to check if the user is already authenticated.
  const auth = useSelector((state: RootState) => state.auth_state);
  const navigate = useNavigate();

  // On page load, if authenticated, redirect to the home/discovery page.
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/home");
    }
  }, [auth.isAuthenticated, navigate]);

  // Static hero content data holding title, subtitle, background image, and CTA button definitions.
  const heroContent = {
    title: "Welcome to FoodTruck Express",
    subtitle: "Discover the best street food in your city.",
    backgroundImageUrl: "https://picsum.photos/1920/1080",
    ctaButtons: [
      { label: "Sign Up", link: "/signup", style: "primary" },
      { label: "Login", link: "/login", style: "secondary" }
    ]
  };

  // Render all view content in one big fragment.
  return (
    <>
      <div
        className="relative w-full h-screen"
        style={{
          backgroundImage: `url(${heroContent.backgroundImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {heroContent.title}
          </h1>
          <p className="text-lg md:text-2xl text-white mb-8">
            {heroContent.subtitle}
          </p>
          <div className="flex space-x-4">
            {heroContent.ctaButtons.map((button, index) => (
              <Link
                key={index}
                to={button.link}
                className={`px-6 py-3 rounded-md font-medium ${
                  button.style === "primary"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {button.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Landing;