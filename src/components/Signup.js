import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate device name: no special characters
    const deviceNameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!deviceName || !deviceNameRegex.test(deviceName)) {
      setError("Device name cannot be empty or contain special characters.");
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, deviceName }),
      });

      const data = await response.json();
      const user = data.user;

      localStorage.setItem("id", user.id);
      localStorage.setItem("device", user.device_name);
      localStorage.setItem("username", user.username);

      if (response.ok) {
        setSuccess("Account created successfully! Redirecting to lockers...");
        setTimeout(() => navigate("/lockers", { state: { user } }), 3000); // Redirect to login after 3 seconds
      } else {
        setError(data.message || "Sign-up failed.");
      }
    } catch (err) {
      setError("An error occurred while signing up.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Create an Account
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Sign up to access your locker system
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white p-3 rounded-lg font-semibold hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            Sign Up
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
        <p className="mt-6 text-gray-400 text-xs">
          © 2024 Locker System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;
