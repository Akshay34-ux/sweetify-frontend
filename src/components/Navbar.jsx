// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Navbar({ user, onLogout }) {
  const { totalItems, setOpen } = useCart();

  return (
    <header className="bg-white shadow sticky top-0 z-30">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-brand-600">Sweetify</Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          {!user && <Link to="/login" className="text-brand-600 hover:underline">Login</Link>}
          {!user && <Link to="/register" className="text-brand-600 hover:underline">Register</Link>}
          {user && (
            <>
              <span className="text-gray-600">Hi, {user.username}</span>
              {user.role === "admin" && (
                <Link to="/admin" className="text-red-600 hover:underline">Admin</Link>
              )}
              <button onClick={onLogout} className="text-gray-500 hover:text-red-500">Logout</button>
            </>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-100"
            title="View Cart"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1">
                {totalItems}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;