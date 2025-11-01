// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import { setAuthToken } from "./lib/api";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token) {
      setAuthToken(token);
      setUser(userStr ? JSON.parse(userStr) : null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* navbar handles top UI and user actions */}
      <Navbar user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />

          {/* Admin-only */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel user={user} />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}