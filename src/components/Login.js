import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css"; // Import the CSS file

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      const user = data.user;

      localStorage.setItem("id", user.id);
      localStorage.setItem("device", user.device_name);
      localStorage.setItem("username", user.username);

      if (response.ok) {
        if (data.reservedLockerId) {
          navigate(`/locker/${data.reservedLockerId}`, {
            state: { user },
          });
        } else {
          navigate("/lockers", { state: { user } });
        }
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      setError("An error occurred while trying to log in.");
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-description">
          Sign in to access your locker system
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            />
          </div>
          <div>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
        <p className="login-footer mt-4 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-500 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
