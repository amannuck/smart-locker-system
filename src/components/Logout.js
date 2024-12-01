import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear localStorage
    localStorage.setItem("id", "");
    localStorage.setItem("device", "");
    localStorage.setItem("username", "");
    // Redirect to login
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:text-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
