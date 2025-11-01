// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import API from "../lib/api";
import AddSweetForm from "../components/AddSweetForm";
import AdminTable from "../components/AdminTable";
import EditSweetModal from "../components/EditSweetModal";
import RestockModal from "../components/RestockModal";
import { toast } from "react-toastify";

export default function AdminPanel() {
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI modals state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [activeSweet, setActiveSweet] = useState(null);

  // stats
  const [stats, setStats] = useState({ total: 0, outOfStock: 0, lowStock: 0 });

  async function fetchSweets() {
    setLoading(true);
    try {
      const res = await API.get("/sweets");
      setSweets(res.data || []);
      computeStats(res.data || []);
    } catch (err) {
      console.error("Fetch sweets (admin) failed", err);
      toast.error("Failed to load sweets");
    } finally {
      setLoading(false);
    }
  }

  function computeStats(list) {
    const total = list.length;
    let outOfStock = 0;
    let lowStock = 0;
    list.forEach((s) => {
      const st = typeof s.stock === "number" ? s.stock : null;
      if (st !== null) {
        if (st === 0) outOfStock++;
        if (st > 0 && st <= 5) lowStock++;
      }
    });
    setStats({ total, outOfStock, lowStock });
  }

  useEffect(() => {
    fetchSweets();
  }, []);

  // callbacks used by table buttons
  const onEdit = (sweet) => {
    setActiveSweet(sweet);
    setEditOpen(true);
  };

  const onRestock = (sweet) => {
    setActiveSweet(sweet);
    setRestockOpen(true);
  };

  const onDelete = async (sweet) => {
    if (!window.confirm(`Delete "${sweet.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/sweets/${sweet._id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      toast.success("Deleted");
      await fetchSweets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const onAdded = async (newSweet) => {
    setAddOpen(false);
    toast.success("Sweet added");
    await fetchSweets();
  };

  const onUpdated = async (updated) => {
    setEditOpen(false);
    setActiveSweet(null);
    toast.success("Updated");
    await fetchSweets();
  };

  const onRestocked = async (updated) => {
    setRestockOpen(false);
    setActiveSweet(null);
    toast.success("Restocked");
    await fetchSweets();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Manage sweets, stock, and inventory.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md shadow">
            + Add Sweet
          </button>
          <button onClick={fetchSweets} className="px-4 py-2 bg-white border rounded-md">
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex flex-col">
          <span className="text-sm text-gray-500">Total Sweets</span>
          <span className="text-2xl font-semibold mt-2">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex flex-col">
          <span className="text-sm text-gray-500">Out of stock</span>
          <span className="text-2xl font-semibold mt-2 text-red-600">{stats.outOfStock}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex flex-col">
          <span className="text-sm text-gray-500">Low stock (&le;5)</span>
          <span className="text-2xl font-semibold mt-2 text-yellow-600">{stats.lowStock}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <AdminTable
          sweets={sweets}
          loading={loading}
          onEdit={onEdit}
          onRestock={onRestock}
          onDelete={onDelete}
        />
      </div>

      {/* Modals */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-5 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Sweet</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-600">Close</button>
            </div>
            <AddSweetForm onAdded={onAdded} onCancel={() => setAddOpen(false)} />
          </div>
        </div>
      )}

      {editOpen && activeSweet && (
        <EditSweetModal sweet={activeSweet} onClose={() => setEditOpen(false)} onSaved={onUpdated} />
      )}

      {restockOpen && activeSweet && (
        <RestockModal sweet={activeSweet} onClose={() => setRestockOpen(false)} onSaved={onRestocked} />
      )}
    </div>
  );
}