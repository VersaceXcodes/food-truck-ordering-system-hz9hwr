import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const GV_Footer: React.FC = () => {
  // Local state to indicate whether additional footer links/details are expanded
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Toggle function to change expanded state, triggered on button click
  const toggleFooterExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  // Attach a window resize listener to collapse the expanded view on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  // Get the current year for copyright notice
  const currentYear = new Date().getFullYear();
  
  return (
    <>
      <footer className="w-full bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
          {/* Primary informational links */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Link to="/about" className="hover:underline">
              About
            </Link>
            <Link to="/contact" className="hover:underline">
              Contact
            </Link>
            <Link to="/terms" className="hover:underline">
              Terms &amp; Conditions
            </Link>
            <Link to="/faq" className="hover:underline">
              FAQ
            </Link>
            {/* Conditionally render additional links if expanded */}
            {isExpanded && (
              <>
                <Link to="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
                <Link to="/sitemap" className="hover:underline">
                  Sitemap
                </Link>
              </>
            )}
          </div>
          
          {/* Social media links */}
          <div className="flex gap-4 mt-4 md:mt-0">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Facebook
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Twitter
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>
        
        {/* Toggle Button for mobile/responsive view */}
        <div className="max-w-7xl mx-auto mt-4">
          <button
            onClick={toggleFooterExpansion}
            className="px-2 py-1 text-sm text-blue-300 hover:text-blue-400 underline focus:outline-none"
          >
            {isExpanded ? "Collapse Footer" : "Expand Footer"}
          </button>
        </div>
        
        {/* Copyright and legal notice */}
        <div className="max-w-7xl mx-auto mt-4 border-t border-gray-700 pt-2 text-center text-xs">
          <p>&copy; {currentYear} FoodTruck Express. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;