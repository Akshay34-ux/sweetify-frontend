// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../lib/api";
import { toast } from "react-toastify";
import SweetCard from "../components/SweetCard";
import QuantityModal from "../components/QuantityModal";
import SkeletonCard from "../components/SkeletonCard";
import useDebounce from "../hooks/useDebounce";
import useRecommendations from "../hooks/useRecommendations";
import { useCart } from "../context/CartContext";
import { pushView, pushPurchase } from "../lib/localSignals";
import { triggerLoginFocus } from "../lib/globalSignals";

export default function Dashboard({ user }) {
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // personalization
  const { items: cartItems } = useCart();
  const recs = useRecommendations({ cartItems, limit: 6 });

  // Track if user is actively searching or filtering
  const searchActive = Boolean(debouncedQuery || category || minPrice || maxPrice);

  // 🧁 Load all sweets initially
  useEffect(() => {
    fetchSweets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🍫 Fetch sweets
  async function fetchSweets(params = {}) {
    setLoading(true);
    try {
      const res = await API.get("/sweets/search", { params });
      setSweets(res.data || []);
    } catch (err) {
      console.error("❌ Fetch sweets error:", err?.response?.data || err?.message);
      if (!err?.response) toast.error("Failed to load sweets");
    } finally {
      setLoading(false);
    }
  }

  // 🎯 Auto-refetch when filters/search change (after debounce)
  useEffect(() => {
    // If filters/search are active, fetch filtered results
    if (searchActive) {
      const params = {};
      if (debouncedQuery) params.q = debouncedQuery;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      fetchSweets(params);
      return;
    }

    // If no search/filters active (user cleared filters) — make sure to show all sweets
    fetchSweets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, category, minPrice, maxPrice]);

  // unique categories for filter buttons
  const categories = useMemo(() => {
    const set = new Set();
    sweets.forEach((s) => s.category && set.add(s.category));
    return ["All", ...Array.from(set)];
  }, [sweets]);

  const openBuy = (item) => {
    try {
      if (item) pushView(item);
    } catch {}
    setSelected(item);
    setModalOpen(true);
  };

  const confirmBuy = async (qty) => {
    if (!selected) return;
    if (!user) {
      toast.info("Please login to continue");
      triggerLoginFocus(); // 🔥 make navbar highlight login
      window.scrollTo({ top: 0, behavior: "smooth" }); // 👆 Scroll up for mobile
      setModalOpen(false);
      return;
    }

    setModalOpen(false);
    setProcessingId(selected._id);

    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/sweets/${selected._id}/purchase`,
        { quantity: qty },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      toast.dismiss();
      toast.success(`Purchased ${qty} × ${selected.name}`);

      try {
        pushPurchase(selected, qty);
      } catch {}

      await fetchSweets();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Purchase failed";
      toast.dismiss();
      toast.error(message);
    } finally {
      setProcessingId(null);
      setSelected(null);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    fetchSweets(); // show all sweets again
  };

  return (
    <div className="container mx-auto px-4">
      {/* Hero */}
      <section className="bg-gradient-to-r from-pink-50 to-white rounded-lg p-6 mb-6">
        <div className="text-center md:text-left mb-4">
          <h1 className="text-3xl font-bold text-pink-600">Sweetify — Fresh & Tasty</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Shop sweets, chocolates and pastries. Fast delivery and fresh stocks.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sweets, e.g. chocolate..."
            className="px-4 py-2 border rounded-md w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <button
            onClick={() => fetchSweets({ q: query, category, minPrice, maxPrice })}
            className="px-5 py-2 rounded-md bg-pink-500 text-white hover:bg-pink-600 transition"
          >
            Search
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6 flex flex-col md:flex-row gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => {
            const active = c === "All" ? category === "" : category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c === "All" ? "" : c)}
                className={`px-3 py-1 rounded-full border transition-all ${
                  active ? "bg-pink-400 text-white border-pink-400 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-pink-50"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input
            type="number"
            placeholder="min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-3 py-2 border rounded w-24"
          />
          <input
            type="number"
            placeholder="max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-3 py-2 border rounded w-24"
          />
          <button onClick={resetFilters} className="px-3 py-2 border rounded text-sm hover:bg-pink-50">
            Reset
          </button>
        </div>
      </section>

      {/* Sweets Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sweets.length === 0 ? (
          <div className="text-gray-600 text-center py-10">No sweets found for your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sweets.map((s) => (
              <SweetCard key={s._id} item={s} onOpenQuantity={openBuy} isProcessing={processingId === s._id} />
            ))}
          </div>
        )}
      </section>

      {/* Recommended */}
      {!searchActive && recs && recs.length > 0 && (
        <section className="mb-6 mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Recommended for you</h2>
            <button onClick={() => fetchSweets()} className="text-sm text-gray-600 hover:text-gray-800">Refresh</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recs.map((r) => (
              <SweetCard key={r._id} item={r} onOpenQuantity={openBuy} isProcessing={processingId === r._id} />
            ))}
          </div>
        </section>
      )}

      {/* Quantity Modal */}
      <QuantityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onConfirm={confirmBuy}
        max={typeof selected?.stock === "number" ? selected.stock : 9999}
        defaultQty={1}
      />

      {/* Footer */}
      <footer className="mt-10 border-t pt-6 pb-4 text-center text-gray-600 text-sm bg-gradient-to-r from-white to-pink-50 rounded-t-xl">
        <p className="font-medium text-pink-600">Sweetify 🍬 — Spreading Happiness, One Sweet at a Time</p>
        <div className="mt-2 flex flex-col sm:flex-row justify-center gap-3 text-gray-500 text-xs">
          <span>© {new Date().getFullYear()} Sweetify. All rights reserved.</span>
          <span>•</span>
          <a href="/about" className="hover:underline">About</a>
          <span>•</span>
          <a href="/contact" className="hover:underline">Contact</a>
          <span>•</span>
          <a href="/privacy" className="hover:underline">Privacy</a>
        </div>
      </footer>
    </div>
  );
}