// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../lib/api";
import { toast } from "react-toastify";
import SweetCard from "../components/SweetCard";
import QuantityModal from "../components/QuantityModal";
import SkeletonCard from "../components/SkeletonCard";
import useDebounce from "../hooks/useDebounce";

export default function Dashboard({ user }) {
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => { fetchSweets(); }, []); // load on mount

  async function fetchSweets(params = {}) {
    setLoading(true);
    try {
      const res = await API.get("/sweets/search", { params });
      setSweets(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sweets");
    } finally {
      setLoading(false);
    }
  }

  // refetch when debounced query or filters change
  useEffect(() => {
    const params = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    fetchSweets(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, category, minPrice, maxPrice]);

  const categories = useMemo(() => {
    const set = new Set();
    sweets.forEach((s) => s.category && set.add(s.category));
    return ["All", ...Array.from(set)];
  }, [sweets]);

  const openBuy = (item) => { setSelected(item); setModalOpen(true); };
  const confirmBuy = async (qty) => {
    if (!selected) return;
    if (!user) { toast.info("Please login to purchase"); setModalOpen(false); return; }
    setModalOpen(false);
    setProcessingId(selected._id);
    try {
      const token = localStorage.getItem("token");
      await API.post(`/sweets/${selected._id}/purchase`, { quantity: qty }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      toast.success(`Purchased ${qty} × ${selected.name}`);
      fetchSweets(); // refresh listing
    } catch (err) {
      toast.error(err?.response?.data?.message || "Purchase failed");
    } finally {
      setProcessingId(null);
      setSelected(null);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Hero / top bar */}
      <section className="bg-gradient-to-r from-brand-100 to-white rounded-lg p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Sweetify — Fresh & Tasty</h1>
          <p className="text-gray-600 mt-1">Shop sweets, chocolates and pastries. Fast delivery and fresh stocks.</p>
        </div>
        <div className="w-full md:w-auto flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sweets, e.g. chocolate..."
            className="px-3 py-2 border rounded w-full md:w-80"
            aria-label="Search sweets"
          />
          <button onClick={() => fetchSweets()} className="px-4 py-2 rounded bg-brand-500 text-white">Search</button>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6 flex flex-col md:flex-row gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === "All" ? "" : c)}
              className={
                "px-3 py-1 rounded-full border " + (category === c || (c === "All" && !category) ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-700")
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input type="number" placeholder="min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="px-3 py-2 border rounded w-24" />
          <input type="number" placeholder="max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="px-3 py-2 border rounded w-24" />
          <button onClick={() => { setMinPrice(""); setMaxPrice(""); setCategory(""); setQuery(""); fetchSweets(); }} className="px-3 py-2 border rounded">Reset</button>
        </div>
      </section>

      {/* Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
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

      <QuantityModal open={modalOpen} onClose={() => setModalOpen(false)} onConfirm={confirmBuy} defaultQty={1} />
    </div>
  );
}