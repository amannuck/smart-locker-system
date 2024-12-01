// src/App.js
import React from "react";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Lockers from "./components/Lockers";
import LockerInfo from "./components/LockerInfo";
import Logout from "./components/Logout";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/lockers" element={<Lockers />} />
        <Route path="/locker/:lockerId" element={<LockerInfo />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
};

export default App;
