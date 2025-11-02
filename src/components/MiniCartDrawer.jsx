// src/components/MiniCartDrawer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import API from "../lib/api";
import { toast } from "react-toastify";

function Currency({ v }) {
  return <>₹{Number(v || 0).toLocaleString("en-IN")}</>;
}

/**
 * MiniCartDrawer
 * - manages drawer `open` locally
 * - reads cart data from useCart()
 * - improves accessibility: moves focus into drawer when opened, returns focus to trigger when closed,
 *   closes on Escape, uses an inline placeholder image (no external network).
 */
export default function MiniCartDrawer() {
  // local UI state for drawer open/close
  const [open, setOpen] = useState(false);

  // cart API from context
  const {
    items = [],
    removeItem = () => {},
    updateQuantity = () => {},
    subtotal = 0,
    clearCart = () => {},
    totalItems = 0,
  } = useCart();

  const [loadingIds, setLoadingIds] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);

  // refs for focus management
  const triggerRef = useRef(null);
  const drawerRef = useRef(null);

  // inline SVG placeholder (avoids external network dependency)
  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='112'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='12'>No image</text></svg>`
    );

  const toggle = () => setOpen((s) => !s);

  // move focus into drawer when opening, return to trigger when closing
  useEffect(() => {
    if (open) {
      // small delay to ensure element is rendered
      setTimeout(() => {
        // focus the close button if available, else the drawer container
        const closeBtn = drawerRef.current?.querySelector("button[aria-label='Close cart']");
        if (closeBtn) closeBtn.focus();
        else drawerRef.current?.focus();
      }, 50);

      // add escape key handler
      const onKey = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    } else {
      // return focus to trigger button
      setTimeout(() => triggerRef.current?.focus?.(), 50);
    }
  }, [open]);

  const doCheckout = async () => {
    if (!items.length) {
      toast.info("Cart is empty");
      return;
    }
    setCheckingOut(true);
    const token = localStorage.getItem("token");
    const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const successes = [];
    const failures = [];

    // Attempt purchase for each item sequentially
    for (const it of items) {
      const id = it._id || it.id;
      setLoadingIds((s) => [...s, id]);
      try {
        await API.post(`/sweets/${id}/purchase`, { quantity: it.quantity || 1 }, headers);
        successes.push(it);
      } catch (err) {
        const msg = err?.response?.data?.message || "Purchase failed";
        failures.push({ item: it, message: msg });
      } finally {
        setLoadingIds((s) => s.filter((x) => x !== id));
      }
    }

    // Remove successful items from cart (local context)
    if (successes.length) {
      successes.forEach((s) => {
        const id = s._id || s.id;
        removeItem(id);
      });
      toast.success(`Purchased ${successes.length} item(s)`);
    }

    if (failures.length) {
      failures.forEach((f) => toast.error(`${f.item?.name || "Item"}: ${f.message}`));
      toast.info("Some items failed to purchase. Check messages above.");
    }

    setCheckingOut(false);
    if (!failures.length) {
      // close drawer when everything succeeded
      setOpen(false);
    }
  };

  return (
    <>
      {/* floating cart button */}
      <div className="fixed right-4 bottom-4 z-40">
        <button
          ref={triggerRef}
          onClick={toggle}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500 text-white shadow-lg"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mini-cart-drawer"
          aria-label="Open cart"
          title="Open cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21a1 1 0 11-2 0 1 1 0 012 0zm-8 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          <CartBadge totalItems={totalItems} />
        </button>
      </div>

      {/* drawer container */}
      <div
        className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        // do not set aria-hidden on the wrapper—drawer itself is role=dialog/aria-modal
      >
        {/* backdrop */}
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />

        {/* panel */}
        <aside
          id="mini-cart-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Your cart"
          tabIndex={-1}
          className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-xl transform transition-transform ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b">
            <h3 className="text-lg font-semibold">Your Cart</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                <Currency v={subtotal} />
              </div>
              <button
                aria-label="Close cart"
                onClick={() => setOpen(false)}
                className="px-2 py-1 text-gray-600 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4 h-[calc(100%-130px)] overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-gray-500">Your cart is empty. Add sweets to get started.</div>
            ) : (
              items.map((it) => {
                const id = it._id || it.id;
                const processing = loadingIds.includes(id);
                return (
                  <div key={id || Math.random()} className="flex items-center gap-3 border-b py-3">
                    <img
                      src={it.image || placeholder}
                      alt={it.name}
                      className="w-16 h-12 object-cover rounded"
                      onError={(e) => (e.currentTarget.src = placeholder)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.category}</div>
                        </div>
                        <div className="text-sm font-semibold">₹{it.price}</div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(id, Math.max(1, (it.quantity || 1) - 1))}
                          className="px-2 py-1 border rounded"
                          aria-label={`Decrease quantity for ${it.name}`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={it.quantity || 1}
                          onChange={(e) => updateQuantity(id, Number(e.target.value || 1))}
                          className="w-14 text-center px-2 py-1 border rounded"
                          min="1"
                          aria-label={`Quantity for ${it.name}`}
                        />
                        <button
                          onClick={() => updateQuantity(id, (it.quantity || 1) + 1)}
                          className="px-2 py-1 border rounded"
                          aria-label={`Increase quantity for ${it.name}`}
                        >
                          +
                        </button>

                        <button onClick={() => removeItem(id)} className="ml-auto text-sm text-red-600" aria-label={`Remove ${it.name}`}>
                          Remove
                        </button>
                      </div>

                      {processing && <div className="text-xs text-gray-500 mt-1">Processing...</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="text-lg font-semibold">
                <Currency v={subtotal} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearCart();
                  toast.info("Cart cleared");
                }}
                className="w-full px-4 py-2 rounded border"
              >
                Clear
              </button>
              <button
                onClick={doCheckout}
                disabled={checkingOut}
                className={`w-full px-4 py-2 rounded text-white ${checkingOut ? "bg-gray-400" : "bg-brand-500 hover:bg-brand-600"}`}
              >
                {checkingOut ? "Processing..." : "Checkout"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* small badge component that reads total from prop (or fallback from context) */
function CartBadge({ totalItems }) {
  return (
    <div className="relative">
      <span className="sr-only">Cart</span>
      <div className="text-sm">Cart</div>
      {totalItems > 0 && (
        <div className="absolute -top-2 -right-3 bg-red-600 text-white text-xs rounded-full px-1.5">
          {totalItems}
        </div>
      )}
    </div>
  );
}